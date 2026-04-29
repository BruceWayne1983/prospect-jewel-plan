import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "GOOGLE_MAPS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action || "autocomplete";

    if (action === "autocomplete") {
      const input = String(body?.input || "").trim();
      if (input.length < 2) {
        return new Response(JSON.stringify({ predictions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const params = new URLSearchParams({
        input,
        key: GOOGLE_MAPS_API_KEY,
        components: "country:gb",
        types: "establishment",
      });
      if (body?.sessionToken) params.set("sessiontoken", String(body.sessionToken));
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Places autocomplete error:", data.status, data.error_message);
        return new Response(JSON.stringify({ error: data.error_message || data.status }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const predictions = (data.predictions || []).map((p: any) => ({
        place_id: p.place_id,
        description: p.description,
        main_text: p.structured_formatting?.main_text || p.description,
        secondary_text: p.structured_formatting?.secondary_text || "",
      }));
      return new Response(JSON.stringify({ predictions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      const placeId = String(body?.placeId || "").trim();
      if (!placeId) {
        return new Response(JSON.stringify({ error: "placeId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const params = new URLSearchParams({
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: "name,formatted_address,geometry,address_components,types,website,formatted_phone_number",
      });
      if (body?.sessionToken) params.set("sessiontoken", String(body.sessionToken));
      const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status !== "OK") {
        console.error("Places details error:", data.status, data.error_message);
        return new Response(JSON.stringify({ error: data.error_message || data.status }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = data.result || {};
      const components = r.address_components || [];
      const find = (type: string) => components.find((c: any) => c.types?.includes(type))?.long_name || "";
      const town = find("postal_town") || find("locality") || find("administrative_area_level_2");
      const county = find("administrative_area_level_2") || find("administrative_area_level_1");
      return new Response(JSON.stringify({
        place: {
          name: r.name,
          address: r.formatted_address,
          town,
          county,
          lat: r.geometry?.location?.lat,
          lng: r.geometry?.location?.lng,
          website: r.website || "",
          phone: r.formatted_phone_number || "",
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("places-autocomplete error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
