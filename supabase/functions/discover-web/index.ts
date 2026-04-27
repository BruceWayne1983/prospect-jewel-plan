import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store",
  "department_store", "garden_centre_gift_hall", "wedding_bridal", "heritage_tourist_gift", "multi_brand_retailer",
];

const SEARCH_QUERIES: Record<string, string[]> = {
  jeweller: ["independent jewellers", "jewellery shop", "jewelry store"],
  gift_shop: ["gift shop", "gift boutique", "homeware gifts"],
  fashion_boutique: ["fashion boutique", "clothing boutique", "designer boutique"],
  lifestyle_store: ["lifestyle store", "lifestyle boutique", "home and lifestyle"],
  premium_accessories: ["accessories shop", "luxury accessories", "handbags and accessories"],
  concept_store: ["concept store", "curated shop", "designer store"],
  department_store: ["independent department store", "small department store"],
  garden_centre_gift_hall: ["garden centre gift hall", "garden centre jewellery", "garden centre gifts"],
  wedding_bridal: ["bridal shop", "wedding boutique", "bridal wear"],
  heritage_tourist_gift: ["heritage gift shop", "tourist gift shop", "museum shop"],
  multi_brand_retailer: ["multi brand retailer", "multi brand boutique", "brand stockist"],
};

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

    const { county, category } = await req.json().catch(() => ({}));
    if (!county) {
      return new Response(JSON.stringify({ error: "county is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    const existingNames = new Set([
      ...(existingRetailers || []).map((r: any) => r.name.toLowerCase()),
      ...(existingProspects || []).map((p: any) => p.name.toLowerCase()),
    ]);

    const targetCategory = category || "jeweller";
    const queries = SEARCH_QUERIES[targetCategory] || SEARCH_QUERIES.jeweller;
    const searchQuery = `${queries[0]} ${county} UK independent`;

    console.log("Firecrawl search:", searchQuery);

    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 20,
        lang: "en",
        country: "gb",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Firecrawl error:", searchResponse.status, errText);
      if (searchResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Firecrawl credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchData = await searchResponse.json();
    const results = searchData.data || [];
    console.log(`Firecrawl returned ${results.length} results`);

    if (results.length === 0) {
      return new Response(JSON.stringify({ success: true, prospects: [], message: "No results found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapedContent = results.map((r: any, i: number) =>
      `[${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}\nContent: ${(r.markdown || "").substring(0, 1500)}`
    ).join("\n\n---\n\n");

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
            name: "extract_prospects",
            description: "Extract real retail prospects from scraped web data with scoring factors",
            parameters: {
              type: "object",
              properties: {
                prospects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Actual shop/business name" },
                      town: { type: "string", description: "Town or city" },
                      category: { type: "string", enum: CATEGORIES },
                      rating: { type: "number", description: "Rating if found verbatim, 0 if not" },
                      review_count: { type: "integer", description: "Review count if found verbatim, 0 if not" },
                      is_independent: { type: "boolean", description: "Whether independent — only when clearly evidenced" },
                      has_website: { type: "boolean", description: "true ONLY if own website found in scraped content" },
                      website: { type: "string", description: "Website URL — verbatim from content, empty if not found" },
                      address: { type: "string", description: "Full address — verbatim from content, empty if not found" },
                      phone: { type: "string", description: "Phone — verbatim from content, empty if not found" },
                      email: { type: "string", description: "Email — verbatim from content, empty if not found" },
                    },
                    required: ["name", "town", "category", "rating", "review_count", "is_independent", "has_website"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["prospects"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_prospects" } },
        messages: [
          {
            role: "system",
            content: `You are a retail analyst. Extract REAL independent retail businesses from the scraped web data. Only include actual named businesses — skip directories, aggregator sites, and chains.

VERIFIED-DATA-ONLY RULES:
- has_website: true ONLY if the store's own website (not directory listing) found in content
- is_independent: true only for clearly independent stores
- Do NOT generate or guess phone, email, address, website, rating, or review counts. Only include them if they appear verbatim in the scraped content. Empty/zero is the correct answer when unknown.
- Do NOT write any narrative, fit reasons, or summaries.`,
          },
          {
            role: "user",
            content: `Extract all real independent retail businesses from these search results for "${targetCategory.replace("_", " ")}" stores in ${county}. Only include genuinely independent shops.\n\n${scrapedContent}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      await aiResponse.text();
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    const unique: any[] = [];
    const branchFlags: Map<number, { related_account_id: string; related_name: string; related_town: string }> = new Map();

    (extracted.prospects || []).forEach((p: any) => {
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

    const prospects = unique;

    if (prospects.length === 0) {
      return new Response(JSON.stringify({ success: true, prospects: [], message: "All found stores already exist" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toInsert = prospects.map((p: any, idx: number) => {
      const factors = {
        rating: p.rating || 0,
        review_count: p.review_count || 0,
        has_website: !!(p.website),
        has_contact: !!(p.phone || p.email),
        is_independent: p.is_independent !== false,
        category: p.category,
      };
      const breakdown = calculateFitScore(factors);
      const branch = branchFlags.get(idx);

      return {
        user_id: userId,
        name: p.name,
        town: p.town,
        county,
        category: p.category,
        rating: p.rating || 0,
        review_count: p.review_count || 0,
        predicted_fit_score: breakdown.total,
        website: p.website || null,
        address: p.address || null,
        phone: p.phone || null,
        email: p.email || null,
        discovery_source: "Web Scanner",
        verification_status: "web_verified",
        status: "new",
        raw_data: {
          fit_score_factors: factors,
          fit_score_breakdown: breakdown,
          ...(branch ? { related_account_id: branch.related_account_id, related_account_name: branch.related_name, related_account_town: branch.related_town, is_potential_branch: true } : {}),
        },
      };
    });

    const { data: inserted, error: insertError } = await supabase
      .from("discovered_prospects")
      .insert(toInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save prospects" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, prospects: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
