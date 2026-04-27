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

    const { storeName, town, category } = await req.json();
    if (!storeName || storeName.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Store name is required (at least 2 characters)" }), {
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

    const searchName = storeName.trim();
    const locationHint = town ? ` ${town}` : "";
    const categoryHint = category ? ` ${category.replace("_", " ")}` : "";
    const searchQuery = `"${searchName}"${locationHint} UK${categoryHint} shop store`;

    console.log("Manual search:", searchQuery);

    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 10,
        lang: "en",
        country: "gb",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      console.error("Firecrawl error:", searchResponse.status, errText);
      if (searchResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Search credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchData = await searchResponse.json();
    const results = searchData.data || [];
    console.log(`Firecrawl returned ${results.length} results for "${searchName}"`);

    const scrapedContent = results.map((r: any, i: number) =>
      `[${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}\nContent: ${(r.markdown || "").substring(0, 2000)}`
    ).join("\n\n---\n\n");

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
            name: "extract_store_data",
            description: "Extract verified data about a specific retail store from web search results — verbatim only, no guessing.",
            parameters: {
              type: "object",
              properties: {
                found: { type: "boolean", description: "Whether the specific store was found in the scraped content" },
                name: { type: "string", description: "Confirmed store name verbatim from content" },
                town: { type: "string", description: "Town or city verbatim from content" },
                county: { type: "string", description: "County verbatim from content" },
                category: { type: "string", enum: CATEGORIES },
                address: { type: "string", description: "Full address — verbatim from content. Empty if not found." },
                phone: { type: "string", description: "Phone — verbatim from content. Empty if not found." },
                email: { type: "string", description: "Email — verbatim from content. Empty if not found." },
                website: { type: "string", description: "Own website URL — verbatim. Empty if not found." },
                instagram: { type: "string", description: "Instagram — verbatim. Empty if not found." },
                facebook: { type: "string", description: "Facebook — verbatim. Empty if not found." },
                tiktok: { type: "string", description: "TikTok — verbatim. Empty if not found." },
                twitter: { type: "string", description: "Twitter — verbatim. Empty if not found." },
                rating: { type: "number", description: "Google rating verbatim from content, 0 if not found" },
                review_count: { type: "integer", description: "Review count verbatim from content, 0 if not found" },
                is_independent: { type: "boolean", description: "Whether independent — only true when clearly evidenced" },
                has_website: { type: "boolean", description: "true ONLY if own website found" },
                data_sources: { type: "array", items: { type: "string" }, description: "URLs where data was found" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
              },
              required: ["found", "name", "town", "county", "category", "address", "phone", "email", "website", "instagram", "facebook", "tiktok", "twitter", "rating", "review_count", "is_independent", "has_website", "data_sources", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_store_data" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail intelligence researcher for Nomination Italy. Extract ONLY verified data from the scraped content.

CRITICAL RULES:
1. Every field must come VERBATIM from the scraped content. Do NOT guess, infer, or estimate ANY value.
2. For website: Only the store's OWN website, not directories.
3. For social media: Only handles/URLs that appear in the content.
4. If store NOT found, set found=false.
5. Do NOT write narrative, summaries, fit reasons, or quality estimates.

STORE TYPE FILTERING: ONLY accept jewellers, gift shops, fashion boutiques, lifestyle stores, premium accessories, concept stores, dept stores, garden centre gift halls, wedding/bridal, heritage/tourist gifts, multi-brand retailers.${category ? `\n- Expected type: "${category.replace("_", " ")}" — verify this matches.` : ""}`,
          },
          {
            role: "user",
            content: `Search for "${searchName}"${town ? ` in or near ${town}` : ' in the UK'}.${category ? ` Expected type: ${category.replace("_", " ")}.` : ''} Extract VERIFIED data only — verbatim from sources.\n\n${scrapedContent || "No search results found."}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
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

    const result = JSON.parse(toolCall.function.arguments);

    if (!result.found) {
      return new Response(JSON.stringify({
        success: true, found: false,
        message: `Could not find "${searchName}" in web results.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check existing — allow different town (branch detection)
    const { data: existingRetailers } = await supabase.from("retailers").select("id, name, town").ilike("name", `%${result.name}%`);
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name, town").ilike("name", `%${result.name}%`);

    const resultTown = (result.town || '').toLowerCase();
    const sameTownRetailer = (existingRetailers || []).find((r: any) => (r.town || '').toLowerCase() === resultTown);
    const differentTownRetailer = (existingRetailers || []).find((r: any) => (r.town || '').toLowerCase() !== resultTown);

    if (sameTownRetailer) {
      return new Response(JSON.stringify({
        success: true, found: true, alreadyExists: true, existsAs: "retailer",
        message: `"${result.name}" already exists as a current account in ${sameTownRetailer.town}`, store: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sameTownProspect = (existingProspects || []).find((p: any) => (p.town || '').toLowerCase() === resultTown);
    if (sameTownProspect) {
      return new Response(JSON.stringify({
        success: true, found: true, alreadyExists: true, existsAs: "prospect",
        message: `"${result.name}" already exists as a discovered prospect`, store: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If name matches a retailer in a different town, flag as potential branch
    const branchOf = differentTownRetailer || null;

    // Deterministic fit score from verified facts only
    const factors = {
      rating: result.rating || 0,
      review_count: result.review_count || 0,
      has_website: !!(result.website),
      has_contact: !!(result.phone || result.email),
      is_independent: result.is_independent !== false,
      category: result.category,
    };
    const breakdown = calculateFitScore(factors);

    const toInsert = {
      user_id: user.id,
      name: result.name,
      town: result.town,
      county: result.county || "Unknown",
      category: result.category,
      rating: result.rating || null,
      review_count: result.review_count || null,
      predicted_fit_score: breakdown.total,
      website: result.website || null,
      address: result.address || null,
      phone: result.phone || null,
      email: result.email || null,
      instagram: result.instagram || null,
      facebook: result.facebook || null,
      tiktok: result.tiktok || null,
      twitter: result.twitter || null,
      social_verified: !!(result.instagram || result.facebook || result.tiktok || result.twitter),
      discovery_source: "Manual Search",
      verification_status: "web_verified",
      status: "new",
      raw_data: {
        fit_score_factors: factors,
        fit_score_breakdown: breakdown,
        data_sources: result.data_sources,
        confidence: result.confidence,
        ...(branchOf ? { related_account_id: branchOf.id, related_account_name: branchOf.name, related_account_town: branchOf.town, is_potential_branch: true } : {}),
      },
    };

    const { data: inserted, error: insertError } = await supabase
      .from("discovered_prospects")
      .insert(toInsert)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save prospect" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true, found: true, store: result, prospect: inserted,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
