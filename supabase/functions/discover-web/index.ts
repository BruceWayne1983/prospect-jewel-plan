import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store",
];

const SEARCH_QUERIES: Record<string, string[]> = {
  jeweller: ["independent jewellers", "jewellery shop", "jewelry store"],
  gift_shop: ["gift shop", "gift boutique", "homeware gifts"],
  fashion_boutique: ["fashion boutique", "clothing boutique", "designer boutique"],
  lifestyle_store: ["lifestyle store", "lifestyle boutique", "home and lifestyle"],
  premium_accessories: ["accessories shop", "luxury accessories", "handbags and accessories"],
  concept_store: ["concept store", "curated shop", "designer store"],
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

    // Fetch existing names for dedup
    const { data: existingRetailers } = await supabase.from("retailers").select("name");
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name");
    const existingNames = new Set([
      ...(existingRetailers || []).map((r: any) => r.name.toLowerCase()),
      ...(existingProspects || []).map((p: any) => p.name.toLowerCase()),
    ]);

    const targetCategory = category || "jeweller";
    const queries = SEARCH_QUERIES[targetCategory] || SEARCH_QUERIES.jeweller;
    const searchQuery = `${queries[0]} ${county} UK independent`;

    console.log("Firecrawl search:", searchQuery);

    // Use Firecrawl search to find real businesses
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

    // Compile scraped content for AI analysis
    const scrapedContent = results.map((r: any, i: number) => 
      `[${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}\nContent: ${(r.markdown || "").substring(0, 1500)}`
    ).join("\n\n---\n\n");

    // Use AI to extract structured prospect data from scraped results
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
            description: "Extract real retail prospects from scraped web data",
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
                      rating: { type: "number", description: "Rating if found, otherwise estimate 3.5-4.5" },
                      review_count: { type: "integer", description: "Review count if found, otherwise estimate" },
                      estimated_store_quality: { type: "integer", description: "Quality estimate 40-95 based on web presence" },
                      predicted_fit_score: { type: "integer", description: "How well this retailer fits Nomination 50-95" },
                      ai_reason: { type: "string", description: "2-sentence explanation from what was found online" },
                      estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                      website: { type: "string", description: "Website URL if found" },
                      address: { type: "string", description: "Full address including postcode if found" },
                      phone: { type: "string", description: "Phone number if found in the scraped content" },
                      email: { type: "string", description: "Email address if found in the scraped content" },
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
        tool_choice: { type: "function", function: { name: "extract_prospects" } },
        messages: [
          {
            role: "system",
            content: "You are a retail analyst. Extract REAL independent retail businesses from the scraped web data below. Only include actual named businesses — skip directories, aggregator sites, and chains. For Nomination Italy charm jewellery, assess fit based on the store type, positioning, and whether they sell comparable brands. Extract phone numbers, email addresses, full addresses with postcodes, and website URLs whenever they appear in the scraped content.",
          },
          {
            role: "user",
            content: `Extract all real independent retail businesses from these search results for "${targetCategory.replace("_", " ")}" stores in ${county}. Only include genuinely independent shops, not chains or directories. Make sure to capture any contact details (phone, email) and full addresses with postcodes from the scraped content.\n\n${scrapedContent}`,
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
    // Deduplicate — exact and fuzzy matching against current accounts
    const prospects = (extracted.prospects || []).filter((p: any) => {
      const pLower = p.name.toLowerCase();
      if (existingNames.has(pLower)) return false;
      const pNorm = pLower.replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
      for (const existing of Array.from(existingNames)) {
        const eNorm = (existing as string).replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9]/g, "").trim();
        if (pNorm.length > 3 && eNorm.length > 3 && (pNorm.includes(eNorm) || eNorm.includes(pNorm))) return false;
      }
      return true;
    });

    if (prospects.length === 0) {
      return new Response(JSON.stringify({ success: true, prospects: [], message: "All found stores already exist" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toInsert = prospects.map((p: any) => ({
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
      discovery_source: "Web Scanner",
      status: "new",
    }));

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
