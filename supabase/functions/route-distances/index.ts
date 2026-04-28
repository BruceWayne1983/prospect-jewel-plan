// Real road distances + durations from Google Maps Distance Matrix API.
// Caches results in route_distance_cache (per origin/destination/hour-of-day, 7-day TTL).
//
// Request:
//   {
//     origins:      Array<{ id: string; lat: number; lng: number }>,
//     destinations: Array<{ id: string; lat: number; lng: number }>,
//     departureTime?: 'now' | string  // ISO8601 — only used when traffic-aware durations are wanted
//   }
//
// Response:
//   {
//     matrix: Array<{
//       originId: string,
//       results: Array<{
//         destinationId: string,
//         distance_km: number,
//         duration_minutes: number,
//         duration_in_traffic_minutes: number | null
//       }>
//     }>,
//     source: 'google' | 'cache' | 'mixed',
//     missing: number  // pairs with no result (e.g. routing failed)
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Point = { id: string; lat: number; lng: number };
type CellResult = {
  destinationId: string;
  distance_km: number;
  duration_minutes: number;
  duration_in_traffic_minutes: number | null;
};
type RowResult = { originId: string; results: CellResult[] };

const GMAPS_URL = "https://maps.googleapis.com/maps/api/distancematrix/json";

// Google Distance Matrix limits: max 25 origins or 25 destinations per request,
// and max 100 elements (origins × destinations) per request.
const MAX_ELEMENTS_PER_REQUEST = 100;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidPoint(p: unknown): p is Point {
  return (
    !!p && typeof p === "object" &&
    typeof (p as Point).id === "string" &&
    typeof (p as Point).lat === "number" && Number.isFinite((p as Point).lat) &&
    typeof (p as Point).lng === "number" && Number.isFinite((p as Point).lng)
  );
}

function hourOfDay(departureTime: string | undefined): number {
  if (!departureTime || departureTime === "now") return new Date().getUTCHours();
  const d = new Date(departureTime);
  return Number.isNaN(d.getTime()) ? new Date().getUTCHours() : d.getUTCHours();
}

function chunkPairsForRequest(origins: Point[], destinations: Point[]): Array<{ os: Point[]; ds: Point[] }> {
  // Keep origins×destinations <= MAX_ELEMENTS_PER_REQUEST and <= 25 each.
  const chunks: Array<{ os: Point[]; ds: Point[] }> = [];
  const maxSide = 25;
  for (let oi = 0; oi < origins.length; oi += maxSide) {
    const os = origins.slice(oi, oi + maxSide);
    // Choose destination chunk size so os.length * dsLen <= MAX_ELEMENTS_PER_REQUEST
    const dsLen = Math.max(1, Math.min(maxSide, Math.floor(MAX_ELEMENTS_PER_REQUEST / os.length)));
    for (let di = 0; di < destinations.length; di += dsLen) {
      chunks.push({ os, ds: destinations.slice(di, di + dsLen) });
    }
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ---------- Auth ----------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUserClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabaseUserClient.auth.getUser();
    if (userErr || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // ---------- Rate limit ----------
    // 30 requests / minute, 200 / hour per user — Distance Matrix calls can be expensive.
    try {
      const { data: rate } = await supabaseUserClient.rpc("check_rate_limit", {
        _action: "route-distances",
        _max_per_minute: 30,
        _max_per_hour: 200,
      });
      if (rate && rate.allowed === false) {
        return jsonResponse(
          { error: "Rate limit exceeded", retry_after: rate.retry_after ?? 60 },
          429,
        );
      }
    } catch (_e) {
      // Don't block on rate-limit failures, just continue.
    }

    // ---------- Validate input ----------
    let body: any;
    try { body = await req.json(); }
    catch { return jsonResponse({ error: "Invalid JSON body" }, 400); }

    const origins: Point[] = Array.isArray(body?.origins) ? body.origins.filter(isValidPoint) : [];
    const destinations: Point[] = Array.isArray(body?.destinations) ? body.destinations.filter(isValidPoint) : [];
    const departureTime: string | undefined = typeof body?.departureTime === "string" ? body.departureTime : undefined;

    if (origins.length === 0 || destinations.length === 0) {
      return jsonResponse({ error: "origins and destinations must each contain at least one valid {id,lat,lng}" }, 400);
    }
    if (origins.length > 100 || destinations.length > 100) {
      return jsonResponse({ error: "Too many points (max 100 origins and 100 destinations per request)" }, 400);
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return jsonResponse(
        { error: "Route distances unavailable — connect Google Maps in admin settings" },
        503,
      );
    }

    const hour = hourOfDay(departureTime);
    const wantTraffic = !!departureTime;

    // ---------- Cache lookup (service role) ----------
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Initialise matrix structure
    const rowMap = new Map<string, Map<string, CellResult>>();
    for (const o of origins) rowMap.set(o.id, new Map());

    // Build the full pair list and try cache lookup in one query.
    const originIds = origins.map(o => o.id);
    const destIds = destinations.map(d => d.id);
    let cachedHits = 0;

    try {
      const { data: cached } = await supabaseAdmin
        .from("route_distance_cache")
        .select("origin_id,destination_id,distance_km,duration_minutes,duration_in_traffic_minutes,expires_at")
        .in("origin_id", originIds)
        .in("destination_id", destIds)
        .eq("hour_of_day", hour)
        .gt("expires_at", new Date().toISOString());

      for (const row of cached ?? []) {
        const dst = rowMap.get(row.origin_id);
        if (!dst) continue;
        if (dst.has(row.destination_id)) continue;
        dst.set(row.destination_id, {
          destinationId: row.destination_id,
          distance_km: Number(row.distance_km),
          duration_minutes: Number(row.duration_minutes),
          duration_in_traffic_minutes: row.duration_in_traffic_minutes != null ? Number(row.duration_in_traffic_minutes) : null,
        });
        cachedHits++;
      }
    } catch (e) {
      console.warn("Cache lookup failed, will fetch all from Google:", e);
    }

    // Determine which pairs still need fetching
    const missingOriginsByDest = new Map<string, Set<string>>(); // destId -> origins missing
    const originsById = new Map(origins.map(o => [o.id, o]));
    const destsById = new Map(destinations.map(d => [d.id, d]));

    const missingPairs: Array<{ origin: Point; dest: Point }> = [];
    for (const o of origins) {
      const row = rowMap.get(o.id)!;
      for (const d of destinations) {
        if (!row.has(d.id)) {
          missingPairs.push({ origin: o, dest: d });
        }
      }
    }

    let googleHits = 0;
    let missing = 0;

    if (missingPairs.length > 0) {
      // Group missing pairs into rectangular chunks (origin set × destination set).
      // Simple approach: for each origin, batch its missing destinations into groups of <= MAX_ELEMENTS_PER_REQUEST.
      // Origins-per-request = 1 keeps element count = #destinations, simple and fits well within 100.
      const MAX_DEST_PER_REQ = 25;

      // Group missing pairs by origin id
      const byOrigin = new Map<string, Point[]>();
      for (const { origin, dest } of missingPairs) {
        if (!byOrigin.has(origin.id)) byOrigin.set(origin.id, []);
        byOrigin.get(origin.id)!.push(dest);
      }

      const cacheRowsToInsert: Array<Record<string, any>> = [];

      for (const [originId, dests] of byOrigin.entries()) {
        const origin = originsById.get(originId)!;
        for (let i = 0; i < dests.length; i += MAX_DEST_PER_REQ) {
          const slice = dests.slice(i, i + MAX_DEST_PER_REQ);
          const params = new URLSearchParams({
            origins: `${origin.lat},${origin.lng}`,
            destinations: slice.map(d => `${d.lat},${d.lng}`).join("|"),
            mode: "driving",
            units: "metric",
            key: apiKey,
          });
          if (wantTraffic) {
            const ts = departureTime === "now" ? "now" : Math.floor(new Date(departureTime!).getTime() / 1000).toString();
            params.set("departure_time", ts);
            params.set("traffic_model", "best_guess");
          }

          let data: any;
          try {
            const res = await fetch(`${GMAPS_URL}?${params.toString()}`);
            data = await res.json();
          } catch (e) {
            console.error("Distance Matrix fetch failed:", e);
            continue;
          }

          if (data?.status !== "OK") {
            console.warn("Distance Matrix non-OK status:", data?.status, data?.error_message);
            continue;
          }

          const elements = data?.rows?.[0]?.elements ?? [];
          for (let j = 0; j < slice.length; j++) {
            const dest = slice[j];
            const el = elements[j];
            if (!el || el.status !== "OK") {
              missing++;
              continue;
            }
            const distance_km = (el.distance?.value ?? 0) / 1000;
            const duration_minutes = Math.round((el.duration?.value ?? 0) / 60);
            const duration_in_traffic_minutes = el.duration_in_traffic?.value != null
              ? Math.round(el.duration_in_traffic.value / 60)
              : null;

            const cell: CellResult = {
              destinationId: dest.id,
              distance_km,
              duration_minutes,
              duration_in_traffic_minutes,
            };
            rowMap.get(origin.id)!.set(dest.id, cell);
            googleHits++;

            cacheRowsToInsert.push({
              origin_id: origin.id,
              destination_id: dest.id,
              origin_lat: origin.lat,
              origin_lng: origin.lng,
              destination_lat: dest.lat,
              destination_lng: dest.lng,
              hour_of_day: hour,
              distance_km,
              duration_minutes,
              duration_in_traffic_minutes,
            });
          }
        }
      }

      // Persist new cache rows (best-effort, don't fail the response on insert error)
      if (cacheRowsToInsert.length > 0) {
        try {
          await supabaseAdmin.from("route_distance_cache").insert(cacheRowsToInsert);
        } catch (e) {
          console.warn("Cache insert failed:", e);
        }
      }
    }

    const matrix: RowResult[] = origins.map(o => ({
      originId: o.id,
      results: Array.from(rowMap.get(o.id)!.values()),
    }));

    const source = googleHits === 0 ? "cache" : cachedHits === 0 ? "google" : "mixed";

    return jsonResponse({ matrix, source, missing, cached_hits: cachedHits, google_hits: googleHits });
  } catch (e) {
    console.error("route-distances unhandled error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: msg }, 500);
  }
});
