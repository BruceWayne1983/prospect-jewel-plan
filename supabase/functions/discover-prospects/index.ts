import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOUTH_WEST_COUNTIES = [
  "Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Bristol", "Avon",
  "Herefordshire", "Worcestershire",
  "Cardiff", "Swansea", "Newport", "Vale of Glamorgan", "Bridgend", "Neath Port Talbot",
  "Carmarthenshire", "Pembrokeshire", "Monmouthshire", "Rhondda Cynon Taf", "Merthyr Tydfil",
  "Caerphilly", "Blaenau Gwent", "Torfaen", "Powys", "Ceredigion",
];

const CATEGORIES = [
  "jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store",
  "department_store", "garden_centre_gift_hall", "wedding_bridal", "heritage_tourist_gift", "multi_brand_retailer",
];

function calculateFitScore(factors: any) {
  const CAT_SCORES: Record<string, number> = { perfect: 20, strong: 16, moderate: 12, weak: 6 };
  const LOC_SCORES: Record<string, number> = { prime: 15, good: 12, average: 9, poor: 5 };
  const storeQuality = Math.round(((factors.estimated_store_quality || 50) / 95) * 25);
  const catScore = CAT_SCORES[factors.category_alignment] || 10;
  const locScore = LOC_SCORES[factors.town_appeal] || 9;
  let onlineScore = 0;
  if (factors.has_website) onlineScore += 10;
  if (factors.has_social_media) onlineScore += 5;
  let commercialScore;
  if (factors.estimated_rating > 0) {
    commercialScore = Math.round((factors.estimated_rating / 5) * 15);
  } else {
    commercialScore = 8;
  }
  const indepScore = factors.is_independent ? 9 : 3;
  const total = Math.round(Math.min(100, Math.max(0, storeQuality + catScore + locScore + onlineScore + commercialScore + indepScore)));
  return {
    total,
    store_quality: { score: storeQuality, max: 25 },
    category_alignment: { score: catScore, max: 20, value: factors.category_alignment },
    location_appeal: { score: locScore, max: 15, value: factors.town_appeal },
    online_presence: { score: onlineScore, max: 15, website: factors.has_website, social: factors.has_social_media },
    commercial_health: { score: commercialScore, max: 15, rating: factors.estimated_rating },
    independence: { score: indepScore, max: 10, value: factors.is_independent },
  };
}

async function discoverBatch(
  supabase: any,
  userId: string,
  county: string,
  category: string,
  count: number,
  existingNames: string[],
  LOVABLE_API_KEY: string,
  notFitContext: string = "",
  existingRetailers: Array<{ id: string; name: string; town: string }> = [],
  existingProspects: Array<{ name: string; town: string }> = []
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
                      rating: { type: "number", description: "Google rating 3.5-5.0, or 0 if unknown" },
                      review_count: { type: "integer", description: "Number of reviews 10-500, or 0 if unknown" },
                      estimated_store_quality: { type: "integer", description: "Quality score 40-95 based on store type, location, and positioning" },
                      category_alignment: { type: "string", enum: ["perfect", "strong", "moderate", "weak"], description: "How well the store category aligns with Nomination Italy. perfect=jeweller/premium accessories, strong=gift shop/lifestyle, moderate=fashion boutique/concept store, weak=other" },
                      town_appeal: { type: "string", enum: ["prime", "good", "average", "poor"], description: "Town retail appeal. prime=Bath/Exeter/Cardiff city centre, good=Cheltenham/Truro/Wells, average=smaller market towns, poor=rural/low footfall" },
                      has_social_media: { type: "boolean", description: "ONLY set true if you can VERIFY the store has social media. If uncertain, set false." },
                      is_independent: { type: "boolean", description: "Whether this is an independent store (not a chain)" },
                      has_website: { type: "boolean", description: "ONLY set true if you can VERIFY the store has a website. If uncertain, set false." },
                      estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                      ai_reason: { type: "string", description: "2-sentence explanation of why this is a good prospect" },
                      website: { type: "string", description: "Leave EMPTY. Do NOT generate or guess URLs." },
                      address: { type: "string", description: "Leave EMPTY. Do NOT generate or guess addresses." },
                      phone: { type: "string", description: "Leave EMPTY. Do NOT generate or guess phone numbers." },
                      email: { type: "string", description: "Leave EMPTY. Do NOT generate or guess email addresses." },
                    },
                    required: ["name", "town", "category", "rating", "review_count", "estimated_store_quality", "category_alignment", "town_appeal", "has_social_media", "is_independent", "has_website", "estimated_price_positioning", "ai_reason"],
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

CRITICAL: Do NOT include toy stores, children's shops, chain stores (like Debenhams, John Lewis, H&M), or online-only retailers. Only suggest independent physical retail stores in categories: jewellers, gift shops, fashion boutiques, lifestyle stores, premium accessories, concept stores, small independent department stores, wedding & bridal shops, heritage/tourist gift shops, and multi-brand retailers.

GARDEN CENTRE RULE: When evaluating garden centres, check if they have a substantial gift hall or jewellery department. Many garden centres in South West England have gift retail sections turning over £1m+. Include these as "garden_centre_gift_hall" category with a note in ai_reason about "Requires manual verification of gift hall suitability". Exclude garden centres that are purely plants/outdoor/hardware.

CONTACT DETAILS RULE (CRITICAL): Do NOT generate, guess, or fabricate ANY contact details — no websites, phone numbers, email addresses, or street addresses. Leave ALL contact fields as empty strings.

SCORING FACTORS — Return RAW FACTOR VALUES, NOT a combined score:
- category_alignment: "perfect" for jewellers/premium accessories (core Nomination fit), "strong" for gift shops/lifestyle stores, "moderate" for fashion boutiques/concept stores/bridal, "weak" for other categories
- town_appeal: "prime" for major retail destinations (Bath, Exeter, Cardiff, Bristol city centre, Cheltenham), "good" for strong market towns (Truro, Wells, Taunton, Barnstaple), "average" for smaller towns, "poor" for rural/low footfall areas
- has_social_media: ONLY true if you can verify from your knowledge. Default to false if uncertain.
- has_website: ONLY true if you can verify from your knowledge. Default to false if uncertain.
- is_independent: true for independent stores, false for chains/franchises.${notFitContext}`,
        },
        {
          role: "user",
          content: `Generate ${count} realistic independent retail prospects in ${county} that would be good candidates for stocking Nomination charm jewellery. Focus on ${category.replace("_", " ")} stores. Use real town names from ${county}.${excludeClause}`,
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

  // Filter out exact name+town duplicates but allow same name in different towns (branch detection)
  const lowerExisting = new Set(existingNames.map(n => n.toLowerCase()));
  const unique: any[] = [];
  const branchFlags: Map<number, { related_account_id: string; related_name: string; related_town: string }> = new Map();

  prospects.forEach((p: any, idx: number) => {
    const pLower = p.name.toLowerCase();
    const pTown = (p.town || '').toLowerCase();
    const pNorm = pLower.replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();

    // Check for exact name+town duplicate in prospects already being inserted
    const isDupInBatch = unique.some(u => u.name.toLowerCase() === pLower && (u.town || '').toLowerCase() === pTown);
    if (isDupInBatch) return;

    // Check against existing retailers — allow different town (branch), block same town
    let blocked = false;
    let matchedRetailer: any = null;

    // Check retailer entries (have id + town)
    for (const r of (existingRetailers || [])) {
      const rNorm = r.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
      const nameMatch = pLower === r.name.toLowerCase() || (pNorm.length > 3 && rNorm.length > 3 && (pNorm.includes(rNorm) || rNorm.includes(pNorm)));
      if (nameMatch) {
        if ((r.town || '').toLowerCase() === pTown) { blocked = true; break; }
        else { matchedRetailer = r; }
      }
    }
    if (blocked) return;

    // Check prospect entries (name only — block same name+town)
    for (const ep of (existingProspects || [])) {
      const epNorm = ep.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
      const nameMatch = pLower === ep.name.toLowerCase() || (pNorm.length > 3 && epNorm.length > 3 && (pNorm.includes(epNorm) || epNorm.includes(pNorm)));
      if (nameMatch && (ep.town || '').toLowerCase() === pTown) { blocked = true; break; }
    }
    if (blocked) return;

    if (matchedRetailer) {
      branchFlags.set(unique.length, { related_account_id: matchedRetailer.id, related_name: matchedRetailer.name, related_town: matchedRetailer.town });
    }
    unique.push(p);
  });

  const toInsert = unique.map((p: any, idx: number) => {
    const factors = {
      estimated_store_quality: p.estimated_store_quality || 50,
      category_alignment: p.category_alignment || 'moderate',
      town_appeal: p.town_appeal || 'average',
      has_social_media: p.has_social_media || false,
      is_independent: p.is_independent !== false,
      estimated_rating: p.rating || 0,
      has_website: p.has_website || false,
      price_positioning: p.estimated_price_positioning || 'mid_market',
    };
    const breakdown = calculateFitScore(factors);
    const branch = branchFlags.get(idx);

    return {
      user_id: userId,
      name: p.name,
      town: p.town,
      county,
      category: p.category,
      rating: p.rating,
      review_count: p.review_count,
      estimated_store_quality: p.estimated_store_quality,
      predicted_fit_score: breakdown.total,
      ai_reason: branch
        ? `⚡ Potential branch of existing account "${branch.related_name}" in ${branch.related_town}. ${p.ai_reason}`
        : p.ai_reason,
      estimated_price_positioning: p.estimated_price_positioning,
      website: p.website || null,
      address: p.address || null,
      phone: p.phone || null,
      email: p.email || null,
      discovery_source: "AI Scanner",
      verification_status: "unverified",
      status: "new",
      raw_data: {
        fit_score_factors: factors,
        fit_score_breakdown: breakdown,
        ...(branch ? { related_account_id: branch.related_account_id, related_account_name: branch.related_name, related_account_town: branch.related_town, is_potential_branch: true } : {}),
      },
    };
  });

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

    const { data: existingRetailers } = await supabase.from("retailers").select("id, name, town");
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name, town");
    const retailerEntries = (existingRetailers || []).map((r: any) => ({ id: r.id, name: r.name, town: r.town }));
    const prospectNames = (existingProspects || []).map((p: any) => p.name);
    const existingNames = [...retailerEntries.map((r: any) => r.name), ...prospectNames];

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
