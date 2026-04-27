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

// Deterministic fit score — verified facts only. NO AI narrative inputs.
function calculateFitScore(factors: any) {
  const ratingScore = factors.rating > 0 ? Math.round((Math.min(factors.rating, 5) / 5) * 30) : 0;
  const rc = factors.review_count || 0;
  const reviewScore = rc >= 200 ? 20 : rc >= 50 ? 15 : rc >= 10 ? 10 : rc > 0 ? 5 : 0;
  const websiteScore = factors.has_website ? 15 : 0;
  const contactScore = factors.has_contact ? 15 : 0;
  const indepScore = factors.is_independent ? 10 : 0;
  const PRIMARY = new Set(["jeweller", "premium_accessories"]);
  const STRONG = new Set(["gift_shop", "lifestyle_store", "concept_store", "department_store", "garden_centre_gift_hall", "heritage_tourist_gift", "multi_brand_retailer"]);
  const catScore = PRIMARY.has(factors.category) ? 10 : STRONG.has(factors.category) ? 7 : 4;
  const total = Math.min(100, Math.max(0, ratingScore + reviewScore + websiteScore + contactScore + indepScore + catScore));
  return {
    total,
    rating: { score: ratingScore, max: 30, value: factors.rating || 0 },
    reviews: { score: reviewScore, max: 20, value: rc },
    website: { score: websiteScore, max: 15, value: !!factors.has_website },
    contact: { score: contactScore, max: 15, value: !!factors.has_contact },
    independence: { score: indepScore, max: 10, value: !!factors.is_independent },
    category: { score: catScore, max: 10, value: factors.category },
  };
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

    const { data: existingRetailers } = await supabase.from("retailers").select("id, name, town");
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name, town");
    const existingNames = [
      ...(existingRetailers || []).map((r: any) => r.name),
      ...(existingProspects || []).map((p: any) => p.name),
    ];

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
      notFitContext = `\n\nIMPORTANT — LEARNED "NOT FIT" PATTERNS:\nTop reasons: ${topReasons}\nExamples:\n${examples.join("\n")}\n\nAvoid suggesting stores that match these patterns.`;
    }

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
            description: `Find ${targetCount} independent retailers that stock ${brand} or similar brands.`,
            parameters: {
              type: "object",
              properties: {
                similar_brands: {
                  type: "array",
                  items: { type: "string" },
                  description: `List of 5-10 brands similar to "${brand}"`,
                },
                prospects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Real shop name — only if you can name a verifiable independent retailer" },
                      town: { type: "string", description: "Real town in the South West" },
                      county: { type: "string", enum: SOUTH_WEST_COUNTIES },
                      category: { type: "string", enum: CATEGORIES },
                      is_independent: { type: "boolean", description: "Whether independent (not a chain). Only true when clearly evidenced." },
                      brands_stocked: { type: "array", items: { type: "string" }, description: "Brands this store likely stocks" },
                    },
                    required: ["name", "town", "county", "category", "is_independent", "brands_stocked"],
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
            content: `You are a UK retail market analyst specialising in jewellery, gift, and accessories brands in the South West of England and South Wales. Identify stores that stock "${brand}" or similar brands that would be good candidates for Nomination Italy.

CRITICAL EXCLUSION RULES:
- Do NOT include toy stores, children's shops, chain stores, or online-only stores.
- ONLY independent physical retail stores.

GARDEN CENTRE RULE: Include garden centres with substantial gift halls as "garden_centre_gift_hall".

VERIFIED-DATA-ONLY RULES:
- Do NOT generate phone, email, address, website, rating, review counts, or fit narrative.
- Do NOT estimate quality or price positioning.
- Only output facts you can defend (name, town, county, category, brands stocked, independence).${notFitContext}`,
          },
          {
            role: "user",
            content: `Find ${targetCount} independent retailers that stock "${brand}" or similar brands. ${countyInstruction}${excludeClause}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await aiResponse.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
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

    const lowerExisting = new Set(existingNames.map(n => n.toLowerCase()));
    const unique: any[] = [];
    const branchFlags: Map<number, { related_account_id: string; related_name: string; related_town: string }> = new Map();

    prospects.forEach((p: any) => {
      const pLower = p.name.toLowerCase();
      const pTown = (p.town || '').toLowerCase();
      const pNorm = pLower.replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();

      const isDupInBatch = unique.some(u => u.name.toLowerCase() === pLower && (u.town || '').toLowerCase() === pTown);
      if (isDupInBatch) return;

      let blocked = false;
      let matchedRetailer: any = null;

      for (const r of (existingRetailers || [])) {
        const rNorm = r.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
        const nameMatch = pLower === r.name.toLowerCase() || (pNorm.length > 3 && rNorm.length > 3 && (pNorm.includes(rNorm) || rNorm.includes(pNorm)));
        if (nameMatch) {
          if ((r.town || '').toLowerCase() === pTown) { blocked = true; break; }
          else { matchedRetailer = r; }
        }
      }
      if (blocked) return;

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
        rating: 0,
        review_count: 0,
        has_website: false,
        has_contact: false,
        is_independent: p.is_independent !== false,
        category: p.category,
      };
      const breakdown = calculateFitScore(factors);
      const branch = branchFlags.get(idx);

      return {
        user_id: userId,
        name: p.name,
        town: p.town,
        county: p.county,
        category: p.category,
        rating: 0,
        review_count: 0,
        predicted_fit_score: breakdown.total,
        website: null,
        address: null,
        phone: null,
        email: null,
        discovery_source: `Brand: ${brand}`,
        verification_status: "unverified",
        status: "new",
        raw_data: {
          fit_score_factors: factors,
          fit_score_breakdown: breakdown,
          brands_stocked: p.brands_stocked || [],
          ...(branch ? { related_account_id: branch.related_account_id, related_account_name: branch.related_name, related_account_town: branch.related_town, is_potential_branch: true } : {}),
        },
      };
    });

    if (toInsert.length === 0) {
      return new Response(JSON.stringify({
        success: true, prospects: [], similarBrands,
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
      success: true, prospects: inserted || [], similarBrands, searchBrand: brand,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
