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
  LOVABLE_API_KEY: string,
  notFitContext: string = ""
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
            content: `You are a UK retail market analyst specialising in independent jewellers, gift shops, and boutiques in the South West of England and South Wales. Generate realistic prospect data for Nomination Italy, a premium Italian charm jewellery brand. Use real town names. Every shop name must be unique and not duplicate any existing names provided.

CRITICAL: Do NOT include toy stores, children's shops, chain stores, or online-only retailers. Only suggest independent physical retail stores in categories: jewellers, gift shops, fashion boutiques, lifestyle stores, premium accessories, concept stores.${notFitContext}`,
        },
        {
          role: "user",
          content: `Generate ${count} realistic independent retail prospects in ${county} that would be good candidates for stocking Nomination charm jewellery. Focus on ${category.replace("_", " ")} stores. Use real town names from ${county}. Each prospect should have a unique, realistic shop name, a plausible full address with postcode, a plausible phone number, and a plausible contact email.

Do NOT suggest toy stores, children's shops, or chain retailers.${excludeClause}`,
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

  // Filter out any that match existing names (exact or fuzzy)
  const lowerExisting = new Set(existingNames.map(n => n.toLowerCase()));
  const unique = prospects.filter((p: any) => {
    const pLower = p.name.toLowerCase();
    // Exact match
    if (lowerExisting.has(pLower)) return false;
    // Fuzzy: strip parenthetical suffixes and compare
    const pNorm = pLower.replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
    for (const existing of existingNames) {
      const eNorm = existing.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
      // If one name contains the other (handles "Shop" vs "Shop (Town)")
      if (pNorm.length > 3 && eNorm.length > 3 && (pNorm.includes(eNorm) || eNorm.includes(pNorm))) return false;
    }
    return true;
  });

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { county, category, count, fullScan } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing names for deduplication (retailers = current accounts)
    const { data: existingRetailers } = await supabase.from("retailers").select("name, town");
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name");
    const retailerNames = (existingRetailers || []).map((r: any) => r.name);
    const prospectNames = (existingProspects || []).map((p: any) => p.name);
    const existingNames = [...retailerNames, ...prospectNames];

    // Build a normalized list of current account names for fuzzy matching
    const normalizedRetailerNames = retailerNames.map((n: string) => ({
      original: n,
      normalized: n.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim(),
      words: n.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").split(/\s+/).filter((w: string) => w.length > 2),
    }));

    // Fetch disqualification patterns for AI learning
    const { data: disqualPatterns } = await supabase.from("disqualification_patterns").select("*").order("created_at", { ascending: false }).limit(50);
    let notFitContext = "";
    if (disqualPatterns && disqualPatterns.length > 0) {
      const reasonCounts: Record<string, number> = {};
      const examples: string[] = [];
      disqualPatterns.forEach((dp: any) => {
        reasonCounts[dp.reason] = (reasonCounts[dp.reason] || 0) + 1;
        if (examples.length < 10) {
          examples.push(`"${dp.prospect_name}" (${dp.prospect_town}) — ${dp.reason}${dp.reason_detail ? ': ' + dp.reason_detail : ''}`);
        }
      });
      const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).map(([r, c]) => `${r} (${c}x)`).join(", ");
      notFitContext = `\n\nLEARNED "NOT FIT" PATTERNS from previous disqualifications:\nTop reasons: ${topReasons}\nExamples:\n${examples.join("\n")}\n\nAvoid suggesting stores matching these patterns.`;
    }

    let allInserted: any[] = [];

    if (fullScan) {
      const batchSize = 8;
      for (const c of SOUTH_WEST_COUNTIES) {
        for (const cat of CATEGORIES) {
          try {
            const inserted = await discoverBatch(supabase, userId, c, cat, batchSize, [
              ...existingNames,
              ...allInserted.map((p: any) => p.name),
            ], LOVABLE_API_KEY, notFitContext);
            allInserted = allInserted.concat(inserted);
          } catch (err: any) {
            console.error(`Batch error for ${c}/${cat}:`, err.message);
            if (err.message.includes("Rate limit") || err.message.includes("credits")) {
              return new Response(JSON.stringify({
                success: true,
                prospects: allInserted,
                partial: true,
                stoppedAt: `${c}/${cat}`,
                error: err.message,
              }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    } else {
      const targetCounty = county || SOUTH_WEST_COUNTIES[Math.floor(Math.random() * SOUTH_WEST_COUNTIES.length)];
      const targetCategory = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const targetCount = Math.min(count || 15, 20);

      const inserted = await discoverBatch(supabase, userId, targetCounty, targetCategory, targetCount, existingNames, LOVABLE_API_KEY, notFitContext);
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
