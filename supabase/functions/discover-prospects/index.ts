import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOUTH_WEST_COUNTIES = [
  "Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Avon",
  "Cardiff", "Swansea", "Newport", "Vale of Glamorgan", "Bridgend", "Neath Port Talbot", "Carmarthenshire", "Pembrokeshire", "Monmouthshire",
];

const CATEGORIES = [
  "jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store",
];

async function discoverBatch(
  supabase: any,
  userId: string,
  county: string,
  category: string,
  count: number,
  existingNames: string[],
  LOVABLE_API_KEY: string
) {
  const excludeClause = existingNames.length > 0
    ? `\n\nDo NOT include any of these existing stores (already in the system): ${existingNames.join(", ")}`
    : "";

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
          name: "generate_prospects",
          description: `Generate ${count} realistic UK independent retail prospects for Nomination Italy in ${county}.`,
          parameters: {
            type: "object",
            properties: {
              prospects: {
                type: "array",
                items: {
                  type: "object",
                    properties: {
                      name: { type: "string", description: "Realistic shop name" },
                      town: { type: "string", description: `Real town in ${county}` },
                      category: { type: "string", enum: CATEGORIES },
                      rating: { type: "number", description: "Google rating 3.5-5.0" },
                      review_count: { type: "integer", description: "Number of reviews 10-500" },
                      estimated_store_quality: { type: "integer", description: "Quality score 40-95" },
                      predicted_fit_score: { type: "integer", description: "How well this retailer fits Nomination 50-95" },
                      ai_reason: { type: "string", description: "2-sentence explanation of why this is a good prospect" },
                      estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                      website: { type: "string", description: "Plausible website URL or empty string" },
                      address: { type: "string", description: "Realistic full UK street address including postcode" },
                      phone: { type: "string", description: "Plausible UK phone number (e.g. 01onal or 07xxx) or empty string" },
                      email: { type: "string", description: "Plausible contact email (e.g. info@shopname.co.uk) or empty string" },
                    },
                    required: ["name", "town", "category", "rating", "review_count", "estimated_store_quality", "predicted_fit_score", "ai_reason", "estimated_price_positioning"],
                  additionalProperties: false,
                },
              },
            },
            required: ["prospects"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "generate_prospects" } },
      messages: [
        {
          role: "system",
          content: "You are a UK retail market analyst specialising in independent jewellers, gift shops, and boutiques in the South West of England. Generate realistic prospect data for Nomination Italy, a premium Italian charm jewellery brand. Use real town names. Every shop name must be unique and not duplicate any existing names provided.",
        },
        {
          role: "user",
          content: `Generate ${count} realistic independent retail prospects in ${county} that would be good candidates for stocking Nomination charm jewellery. Focus on ${category.replace("_", " ")} stores. Use real town names from ${county}. Each prospect should have a unique, realistic shop name, a plausible full address with postcode, a plausible phone number, and a plausible contact email.${excludeClause}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    await aiResponse.text();
    if (status === 429) throw new Error("Rate limit exceeded");
    if (status === 402) throw new Error("AI credits exhausted");
    throw new Error("AI generation failed");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured data");

  const generated = JSON.parse(toolCall.function.arguments);
  const prospects = generated.prospects || [];

  // Filter out any that snuck through with duplicate names
  const lowerExisting = new Set(existingNames.map(n => n.toLowerCase()));
  const unique = prospects.filter((p: any) => !lowerExisting.has(p.name.toLowerCase()));

  const toInsert = unique.map((p: any) => ({
    user_id: userId,
    name: p.name,
    town: p.town,
    county,
    category: p.category,
    rating: p.rating,
    review_count: p.review_count,
    estimated_store_quality: p.estimated_store_quality,
    predicted_fit_score: p.predicted_fit_score,
    ai_reason: p.ai_reason,
    estimated_price_positioning: p.estimated_price_positioning,
    website: p.website || null,
    address: p.address || null,
    phone: p.phone || null,
    email: p.email || null,
    discovery_source: "AI Scanner",
    status: "new",
  }));

  if (toInsert.length === 0) return [];

  const { data: inserted, error: insertError } = await supabase
    .from("discovered_prospects")
    .insert(toInsert)
    .select();

  if (insertError) {
    console.error("Insert error:", insertError);
    throw new Error("Failed to save prospects");
  }

  return inserted || [];
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { county, category, count, fullScan } = await req.json().catch(() => ({}));

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

    let allInserted: any[] = [];

    if (fullScan) {
      // Full territory scan: all counties × all categories, 8 prospects each
      const batchSize = 8;
      for (const c of SOUTH_WEST_COUNTIES) {
        for (const cat of CATEGORIES) {
          try {
            const inserted = await discoverBatch(supabase, userId, c, cat, batchSize, [
              ...existingNames,
              ...allInserted.map((p: any) => p.name),
            ], LOVABLE_API_KEY);
            allInserted = allInserted.concat(inserted);
          } catch (err: any) {
            console.error(`Batch error for ${c}/${cat}:`, err.message);
            if (err.message.includes("Rate limit") || err.message.includes("credits")) {
              // Stop on rate limit or credits exhausted
              return new Response(JSON.stringify({
                success: true,
                prospects: allInserted,
                partial: true,
                stoppedAt: `${c}/${cat}`,
                error: err.message,
              }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
          // Small delay between batches to avoid rate limits
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    } else {
      // Single scan
      const targetCounty = county || SOUTH_WEST_COUNTIES[Math.floor(Math.random() * SOUTH_WEST_COUNTIES.length)];
      const targetCategory = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const targetCount = Math.min(count || 15, 20);

      const inserted = await discoverBatch(supabase, userId, targetCounty, targetCategory, targetCount, existingNames, LOVABLE_API_KEY);
      allInserted = inserted;
    }

    return new Response(JSON.stringify({ success: true, prospects: allInserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
