import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOUTH_WEST_COUNTIES = [
  "Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Avon",
];

const CATEGORIES = [
  "jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store",
];

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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { brand, county, count } = await req.json().catch(() => ({}));

    if (!brand || typeof brand !== "string" || brand.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Please provide a brand name (at least 2 characters)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing names for deduplication
    const { data: existingRetailers } = await supabase.from("retailers").select("name");
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name");
    const existingNames = [
      ...(existingRetailers || []).map((r: any) => r.name),
      ...(existingProspects || []).map((p: any) => p.name),
    ];

    const excludeClause = existingNames.length > 0
      ? `\n\nDo NOT include any of these existing stores: ${existingNames.join(", ")}`
      : "";

    const targetCounty = county && county !== "all" ? county : null;
    const countyInstruction = targetCounty
      ? `Focus specifically on ${targetCounty}.`
      : `Search across all South West counties: ${SOUTH_WEST_COUNTIES.join(", ")}.`;
    const targetCount = Math.min(count || 12, 20);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "find_brand_stockists",
            description: `Find ${targetCount} independent retailers in the South West of England that stock ${brand} or similar/complementary brands, and would be good prospects for Nomination Italy.`,
            parameters: {
              type: "object",
              properties: {
                similar_brands: {
                  type: "array",
                  items: { type: "string" },
                  description: `List of 5-10 brands similar to or complementary to "${brand}" in the UK jewellery/gift/accessories market`,
                },
                prospects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Realistic shop name" },
                      town: { type: "string", description: "Real town in the South West" },
                      county: { type: "string", enum: SOUTH_WEST_COUNTIES },
                      category: { type: "string", enum: CATEGORIES },
                      rating: { type: "number", description: "Google rating 3.5-5.0" },
                      review_count: { type: "integer", description: "Number of reviews 10-500" },
                      estimated_store_quality: { type: "integer", description: "Quality score 40-95" },
                      predicted_fit_score: { type: "integer", description: "How well this retailer fits Nomination 50-95" },
                      brands_stocked: { type: "array", items: { type: "string" }, description: `Brands this store likely stocks, including "${brand}" or similar` },
                      ai_reason: { type: "string", description: "2-sentence explanation focusing on the brand connection and why this is a good Nomination prospect" },
                      estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                      website: { type: "string", description: "Plausible website URL or empty string" },
                      address: { type: "string", description: "Realistic full UK street address including postcode" },
                      phone: { type: "string", description: "Plausible UK phone number or empty string" },
                      email: { type: "string", description: "Plausible contact email (e.g. info@shopname.co.uk) or empty string" },
                    },
                    required: ["name", "town", "county", "category", "rating", "review_count", "estimated_store_quality", "predicted_fit_score", "brands_stocked", "ai_reason", "estimated_price_positioning"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["similar_brands", "prospects"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "find_brand_stockists" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail market analyst specialising in jewellery, gift, and accessories brands in the South West of England. You have deep knowledge of which independent retailers stock which brands. Your task is to identify stores that stock "${brand}" or similar/complementary brands that would also be excellent candidates for stocking Nomination Italy charm jewellery.

Brands similar to or complementary to popular UK jewellery/accessory brands include:
- Joma Jewellery → ChloBo, Estella Bartlett, Katie Loxton, Olivia Burton
- Pandora → Thomas Sabo, Chamilia, Links of London
- Swarovski → Coeur de Lion, Trollbeads
- Annie Haak → Lola Rose, Daisy London

Use this knowledge to identify realistic prospects. Every shop name must be unique.`,
          },
          {
            role: "user",
            content: `Find ${targetCount} independent retailers in the South West of England that currently stock "${brand}" or brands with similar appeal (same price tier, same customer demographic, complementary product range). These retailers would be ideal prospects for Nomination Italy charm jewellery.

${countyInstruction}

For each prospect, explain the brand connection — why stocking "${brand}" (or similar) makes them a natural fit for Nomination.${excludeClause}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await aiResponse.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const generated = JSON.parse(toolCall.function.arguments);
    const prospects = generated.prospects || [];
    const similarBrands = generated.similar_brands || [];

    // Deduplicate
    const lowerExisting = new Set(existingNames.map(n => n.toLowerCase()));
    const unique = prospects.filter((p: any) => !lowerExisting.has(p.name.toLowerCase()));

    const toInsert = unique.map((p: any) => ({
      user_id: userId,
      name: p.name,
      town: p.town,
      county: p.county,
      category: p.category,
      rating: p.rating,
      review_count: p.review_count,
      estimated_store_quality: p.estimated_store_quality,
      predicted_fit_score: p.predicted_fit_score,
      ai_reason: `[Stocks: ${(p.brands_stocked || []).join(", ")}] ${p.ai_reason}`,
      estimated_price_positioning: p.estimated_price_positioning,
      website: p.website || null,
      address: p.address || null,
      phone: p.phone || null,
      email: p.email || null,
      discovery_source: `Brand: ${brand}`,
      status: "new",
    }));

    if (toInsert.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        prospects: [],
        similarBrands,
        message: "No new unique prospects found for this brand",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("discovered_prospects")
      .insert(toInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save prospects");
    }

    return new Response(JSON.stringify({
      success: true,
      prospects: inserted || [],
      similarBrands,
      searchBrand: brand,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
