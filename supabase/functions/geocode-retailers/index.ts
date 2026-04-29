import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Fallback approximate coordinates for South West / Wales towns when Google can't resolve.
const TOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  "abercynon": { lat: 51.6445, lng: -3.3272 }, "aberdare": { lat: 51.7150, lng: -3.4430 },
  "abergavenny": { lat: 51.8240, lng: -3.0170 }, "ammanford": { lat: 51.7960, lng: -3.9880 },
  "appledore": { lat: 51.0530, lng: -4.1940 }, "blackwood": { lat: 51.6690, lng: -3.1940 },
  "bourton-on-the-water": { lat: 51.8860, lng: -1.7560 }, "bridgend": { lat: 51.5040, lng: -3.5760 },
  "brynmawr": { lat: 51.7960, lng: -3.1840 }, "bude": { lat: 50.8300, lng: -4.5430 },
  "caerphilly": { lat: 51.5780, lng: -3.2180 }, "cardiff": { lat: 51.4816, lng: -3.1791 },
  "cardigan": { lat: 52.0830, lng: -4.6590 }, "carmarthen": { lat: 51.8580, lng: -4.3120 },
  "cheltenham": { lat: 51.8994, lng: -2.0783 }, "cirencester": { lat: 51.7180, lng: -1.9710 },
  "gorseinon": { lat: 51.6710, lng: -4.0410 }, "haverfordwest": { lat: 51.8020, lng: -4.9690 },
  "llandeilo": { lat: 51.8840, lng: -3.9850 }, "llanelli": { lat: 51.6840, lng: -4.1630 },
  "merthyr tydfil": { lat: 51.7490, lng: -3.3780 }, "neath": { lat: 51.6630, lng: -3.8040 },
  "plymouth": { lat: 50.3755, lng: -4.1427 }, "pontyclun": { lat: 51.5230, lng: -3.3880 },
  "pontypridd": { lat: 51.6020, lng: -3.3428 }, "port talbot": { lat: 51.5910, lng: -3.7980 },
  "porthcawl": { lat: 51.4790, lng: -3.6980 }, "rhymney": { lat: 51.7580, lng: -3.2870 },
  "salisbury": { lat: 51.0693, lng: -1.7957 }, "saundersfoot": { lat: 51.7130, lng: -4.7070 },
  "st ives": { lat: 50.2110, lng: -5.4810 }, "stroud": { lat: 51.7460, lng: -2.2140 },
  "swansea": { lat: 51.6214, lng: -3.9436 }, "swindon": { lat: 51.5558, lng: -1.7797 },
  "tenby": { lat: 51.6730, lng: -4.7040 }, "tetbury": { lat: 51.6400, lng: -2.1610 },
  "tiverton": { lat: 50.9030, lng: -3.4900 }, "tredegar": { lat: 51.7720, lng: -3.2450 },
  "truro": { lat: 50.2632, lng: -5.0510 }, "welshpool": { lat: 52.6590, lng: -3.1460 },
  "wincanton": { lat: 51.0560, lng: -2.4110 }, "ystrad mynach": { lat: 51.6410, lng: -3.2400 },
  "ystradgynlais": { lat: 51.7790, lng: -3.7710 }, "bath": { lat: 51.3811, lng: -2.3590 },
  "bristol": { lat: 51.4545, lng: -2.5879 }, "exeter": { lat: 50.7184, lng: -3.5339 },
  "taunton": { lat: 51.0190, lng: -3.1000 }, "barnstaple": { lat: 51.0800, lng: -4.0600 },
  "torquay": { lat: 50.4619, lng: -3.5253 }, "gloucester": { lat: 51.8642, lng: -2.2382 },
  "newport": { lat: 51.5842, lng: -2.9977 }, "cwmbran": { lat: 51.6538, lng: -3.0240 },
  "barry": { lat: 51.3985, lng: -3.2837 }, "penarth": { lat: 51.4350, lng: -3.1730 },
  "cowbridge": { lat: 51.4610, lng: -3.4470 }, "llandaff": { lat: 51.4960, lng: -3.2180 },
  "monmouth": { lat: 51.8120, lng: -2.7160 }, "chepstow": { lat: 51.6420, lng: -2.6730 },
  "ross-on-wye": { lat: 51.9140, lng: -2.5830 }, "hereford": { lat: 52.0565, lng: -2.7160 },
  "brecon": { lat: 51.9450, lng: -3.3980 }, "builth wells": { lat: 52.1500, lng: -3.4050 },
  "newtown": { lat: 52.5120, lng: -3.3130 }, "aberystwyth": { lat: 52.4153, lng: -4.0829 },
  "penzance": { lat: 50.1185, lng: -5.5371 }, "falmouth": { lat: 50.1540, lng: -5.0710 },
  "newquay": { lat: 50.4120, lng: -5.0757 }, "bodmin": { lat: 50.4710, lng: -4.7200 },
  "launceston": { lat: 50.6360, lng: -4.3600 }, "tavistock": { lat: 50.5500, lng: -4.1440 },
  "totnes": { lat: 50.4320, lng: -3.6870 }, "dartmouth": { lat: 50.3512, lng: -3.5780 },
  "sidmouth": { lat: 50.6820, lng: -3.2390 }, "dorchester": { lat: 50.7154, lng: -2.4377 },
  "yeovil": { lat: 50.9452, lng: -2.6330 }, "frome": { lat: 51.2289, lng: -2.3211 },
  "glastonbury": { lat: 51.1488, lng: -2.7141 }, "wells": { lat: 51.2094, lng: -2.6488 },
  "minehead": { lat: 51.2040, lng: -3.4740 }, "burnham-on-sea": { lat: 51.2380, lng: -2.9940 },
  "bridgwater": { lat: 51.1280, lng: -3.0040 }, "chippenham": { lat: 51.4614, lng: -2.1160 },
  "devizes": { lat: 51.3530, lng: -1.9947 }, "marlborough": { lat: 51.4210, lng: -1.7290 },
  "warminster": { lat: 51.2050, lng: -2.1780 }, "trowbridge": { lat: 51.3200, lng: -2.2080 },
};

const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");

async function googleGeocode(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=uk&components=country:GB&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;
    const loc = data.results[0].geometry?.location;
    if (typeof loc?.lat === "number" && typeof loc?.lng === "number") {
      return { lat: loc.lat, lng: loc.lng };
    }
  } catch (err) {
    console.error("Google geocode error:", err);
  }
  return null;
}

function fallbackTownCoords(town: string): { lat: number; lng: number } | null {
  const key = (town || "").toLowerCase().trim();
  return TOWN_COORDS[key] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional body: { target?: 'retailers' | 'prospects' | 'both', limit?: number }
    let target: "retailers" | "prospects" | "both" = "both";
    let limit = 200;
    try {
      if (req.method === "POST") {
        const body = await req.json().catch(() => ({}));
        if (body?.target && ["retailers", "prospects", "both"].includes(body.target)) target = body.target;
        if (typeof body?.limit === "number" && body.limit > 0) limit = Math.min(body.limit, 500);
      }
    } catch { /* ignore */ }

    const result = {
      retailers: { total: 0, updated: 0, google: 0, fallback: 0, notFound: [] as string[] },
      prospects: { total: 0, updated: 0, google: 0, fallback: 0, notFound: [] as string[] },
      googleEnabled: !!GOOGLE_MAPS_API_KEY,
    };

    const processRetailers = target === "retailers" || target === "both";
    const processProspects = target === "prospects" || target === "both";

    if (processRetailers) {
      const { data: rows, error } = await supabase
        .from("retailers")
        .select("id, name, town, county, postcode, address")
        .or("lat.is.null,lng.is.null")
        .limit(limit);
      if (error) throw error;
      result.retailers.total = (rows || []).length;

      for (const r of rows || []) {
        const queryParts = [r.name, r.address, r.town, r.county, r.postcode, "UK"].filter(Boolean);
        const query = queryParts.join(", ");
        let coords = await googleGeocode(query);
        let viaGoogle = !!coords;
        if (!coords) coords = fallbackTownCoords(r.town);
        if (coords) {
          // Tiny jitter prevents identical pin stacking when falling back to town centre
          const jLat = viaGoogle ? 0 : (Math.random() - 0.5) * 0.005;
          const jLng = viaGoogle ? 0 : (Math.random() - 0.5) * 0.005;
          const { error: updErr } = await supabase
            .from("retailers")
            .update({ lat: coords.lat + jLat, lng: coords.lng + jLng })
            .eq("id", r.id)
            .eq("user_id", user.id);
          if (!updErr) {
            result.retailers.updated++;
            if (viaGoogle) result.retailers.google++; else result.retailers.fallback++;
          }
        } else {
          result.retailers.notFound.push(`${r.name} (${r.town})`);
        }
      }
    }

    if (processProspects) {
      const { data: rows, error } = await supabase
        .from("discovered_prospects")
        .select("id, name, town, county, address")
        .or("lat.is.null,lng.is.null")
        .limit(limit);
      if (error) throw error;
      result.prospects.total = (rows || []).length;

      for (const p of rows || []) {
        const queryParts = [p.name, p.address, p.town, p.county, "UK"].filter(Boolean);
        const query = queryParts.join(", ");
        let coords = await googleGeocode(query);
        let viaGoogle = !!coords;
        if (!coords) coords = fallbackTownCoords(p.town);
        if (coords) {
          const jLat = viaGoogle ? 0 : (Math.random() - 0.5) * 0.005;
          const jLng = viaGoogle ? 0 : (Math.random() - 0.5) * 0.005;
          const { error: updErr } = await supabase
            .from("discovered_prospects")
            .update({ lat: coords.lat + jLat, lng: coords.lng + jLng })
            .eq("id", p.id)
            .eq("user_id", user.id);
          if (!updErr) {
            result.prospects.updated++;
            if (viaGoogle) result.prospects.google++; else result.prospects.fallback++;
          }
        } else {
          result.prospects.notFound.push(`${p.name} (${p.town})`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
