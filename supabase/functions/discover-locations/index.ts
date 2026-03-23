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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { county, locationType } = await req.json();

    if (!county) {
      return new Response(JSON.stringify({ error: "County is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const locationTypeLabel = {
      retail_park: "retail parks and outlet villages",
      shopping_centre: "shopping centres and malls",
      high_street: "high footfall high streets and town centres",
      garden_centre: "garden centres with gift and lifestyle retail areas",
    }[locationType || "shopping_centre"] || "retail locations";

    // Step 1: Try Firecrawl search for real data
    let scrapedContext = "";
    if (FIRECRAWL_API_KEY) {
      try {
        const searchQuery = `${locationTypeLabel} in ${county} UK shops stores`;
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 8,
            country: "gb",
            lang: "en",
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          if (searchData.data?.length) {
            scrapedContext = searchData.data
              .map((r: any) => `${r.title || ""}: ${r.description || ""} (${r.url || ""})`)
              .join("\n");
          }
        }
      } catch (e) {
        console.error("Firecrawl search error:", e);
      }
    }

    // Step 2: AI analysis with scraped context
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [{
          type: "function",
          function: {
            name: "discover_retail_locations",
            description: "Discover retail parks, shopping centres, high streets, and garden centres in a UK county with footfall and tenant intelligence.",
            parameters: {
              type: "object",
              properties: {
                locations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Name of the retail location" },
                      location_type: { type: "string", enum: ["retail_park", "shopping_centre", "high_street", "garden_centre"] },
                      town: { type: "string" },
                      address: { type: "string", description: "Full address if known" },
                      postcode: { type: "string", description: "UK postcode if known" },
                      lat: { type: "number", description: "Latitude estimate" },
                      lng: { type: "number", description: "Longitude estimate" },
                      footfall_estimate: { type: "string", description: "E.g. 'Very High (15m+ annual)', 'High (5-15m)', 'Medium (1-5m)', 'Moderate'" },
                      tenant_count: { type: "number", description: "Approximate number of retail units" },
                      key_tenants: { type: "array", items: { type: "string" }, description: "Notable tenants/stores present" },
                      has_jewellery_stores: { type: "boolean", description: "Are there jewellery stores or concessions?" },
                      has_gift_stores: { type: "boolean", description: "Are there gift shops or lifestyle stores?" },
                      has_fashion_boutiques: { type: "boolean", description: "Are there fashion boutiques?" },
                      opportunity_notes: { type: "string", description: "Why this location is relevant for a jewellery brand like Nomination Italy — e.g. affluent demographics, tourist footfall, complementary retail mix" },
                      website: { type: "string", description: "Website URL if known" },
                    },
                    required: ["name", "location_type", "town", "footfall_estimate", "key_tenants", "opportunity_notes"],
                    additionalProperties: false,
                  },
                  description: "List of discovered retail locations",
                },
              },
              required: ["locations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "discover_retail_locations" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail location intelligence expert specialising in the South West England and South Wales territory. Given a county, identify all significant ${locationTypeLabel} that would be relevant for placing or selling an Italian jewellery brand (Nomination Italy — composable charm bracelets and sterling silver, mid-premium price point).

Focus on:
- Locations with high footfall and affluent or gift-buying demographics
- Places that already have jewellers, gift shops, or fashion boutiques
- Tourist destinations and seasonal hot spots
- Any independent retailer opportunities within these locations

Be specific with real place names, real shopping centres, real retail parks. Include approximate coordinates for mapping.`,
          },
          {
            role: "user",
            content: `Discover all significant ${locationTypeLabel} in ${county}, UK.${scrapedContext ? `\n\nHere is real web data to help:\n${scrapedContext}` : ''}\n\nList every relevant location with footfall estimates, key tenants, and opportunity notes for a jewellery brand.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI discovery failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const result = JSON.parse(toolCall.function.arguments);
    const locations = result.locations || [];

    // Insert into database (upsert by name+town)
    let insertedCount = 0;
    for (const loc of locations) {
      const { error } = await supabase.from("retail_locations").upsert({
        user_id: user.id,
        name: loc.name,
        location_type: loc.location_type || locationType || "shopping_centre",
        town: loc.town,
        county,
        address: loc.address || null,
        postcode: loc.postcode || null,
        lat: loc.lat || null,
        lng: loc.lng || null,
        footfall_estimate: loc.footfall_estimate || null,
        tenant_count: loc.tenant_count || null,
        key_tenants: loc.key_tenants || [],
        has_jewellery_stores: loc.has_jewellery_stores || false,
        has_gift_stores: loc.has_gift_stores || false,
        has_fashion_boutiques: loc.has_fashion_boutiques || false,
        opportunity_notes: loc.opportunity_notes || null,
        ai_summary: loc.opportunity_notes || null,
        website: loc.website || null,
        discovery_source: FIRECRAWL_API_KEY ? "AI + Web" : "AI Scanner",
      }, { onConflict: "user_id,name,town" });

      if (!error) insertedCount++;
      else console.error("Insert error:", error);
    }

    return new Response(JSON.stringify({
      success: true,
      count: insertedCount,
      locations,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
