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
            description: "Extract verified data about a specific retail store from web search results with scoring factors",
            parameters: {
              type: "object",
              properties: {
                found: { type: "boolean", description: "Whether the specific store was found" },
                name: { type: "string", description: "Confirmed store name" },
                town: { type: "string", description: "Town or city" },
                county: { type: "string", description: "County" },
                category: { type: "string", enum: CATEGORIES },
                address: { type: "string", description: "Full address — ONLY if found. Empty if not." },
                phone: { type: "string", description: "Phone — ONLY if found. Empty if not." },
                email: { type: "string", description: "Email — ONLY if found. Empty if not." },
                website: { type: "string", description: "Own website URL — ONLY if found. Empty if not." },
                instagram: { type: "string", description: "Instagram — ONLY if found. Empty if not." },
                facebook: { type: "string", description: "Facebook — ONLY if found. Empty if not." },
                tiktok: { type: "string", description: "TikTok — ONLY if found. Empty if not." },
                twitter: { type: "string", description: "Twitter — ONLY if found. Empty if not." },
                rating: { type: "number", description: "Google rating if found, 0 if not" },
                review_count: { type: "integer", description: "Review count if found, 0 if not" },
                estimated_store_quality: { type: "integer", description: "Quality estimate 40-95" },
                category_alignment: { type: "string", enum: ["perfect", "strong", "moderate", "weak"], description: "Category fit for Nomination" },
                town_appeal: { type: "string", enum: ["prime", "good", "average", "poor"], description: "Town retail appeal" },
                has_social_media: { type: "boolean", description: "true ONLY if social media found in scraped content" },
                is_independent: { type: "boolean", description: "Whether independent" },
                has_website: { type: "boolean", description: "true ONLY if own website found" },
                estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                ai_reason: { type: "string", description: "3-4 sentence analysis citing sources" },
                data_sources: { type: "array", items: { type: "string" }, description: "URLs where data was found" },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
              },
              required: ["found", "name", "town", "county", "category", "address", "phone", "email", "website", "instagram", "facebook", "tiktok", "twitter", "rating", "review_count", "estimated_store_quality", "category_alignment", "town_appeal", "has_social_media", "is_independent", "has_website", "estimated_price_positioning", "ai_reason", "data_sources", "confidence"],
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
1. ONLY include contact details that appear in the scraped content. Do NOT guess.
2. For website: Only the store's OWN website, not directories.
3. For social media: Only handles/URLs that appear in the content.
4. If store NOT found, set found=false.

SCORING FACTORS — Return RAW FACTOR VALUES:
- category_alignment: "perfect" for jewellers/premium accessories, "strong" for gift shops/lifestyle, "moderate" for fashion/concept/bridal, "weak" for other
- town_appeal: "prime" for major retail destinations, "good" for strong market towns, "average" for smaller towns, "poor" for rural
- has_social_media: true ONLY if social media found in scraped content
- has_website: true ONLY if own website found in scraped content

STORE TYPE FILTERING: ONLY accept jewellers, gift shops, fashion boutiques, lifestyle stores, premium accessories, concept stores, dept stores, garden centre gift halls, wedding/bridal, heritage/tourist gifts, multi-brand retailers.${category ? `\n- Expected type: "${category.replace("_", " ")}" — verify this matches.` : ""}`,
          },
          {
            role: "user",
            content: `Search for "${searchName}"${town ? ` in or near ${town}` : ' in the UK'}.${category ? ` Expected type: ${category.replace("_", " ")}.` : ''} Extract VERIFIED data only.\n\n${scrapedContent || "No search results found."}`,
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
        message: `Could not find "${searchName}" in web results. ${result.ai_reason || ''}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check existing
    const { data: existingRetailers } = await supabase.from("retailers").select("name").ilike("name", `%${result.name}%`);
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name").ilike("name", `%${result.name}%`);

    if ((existingRetailers?.length || 0) > 0) {
      return new Response(JSON.stringify({
        success: true, found: true, alreadyExists: true, existsAs: "retailer",
        message: `"${result.name}" already exists as a current account`, store: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if ((existingProspects?.length || 0) > 0) {
      return new Response(JSON.stringify({
        success: true, found: true, alreadyExists: true, existsAs: "prospect",
        message: `"${result.name}" already exists as a discovered prospect`, store: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Calculate deterministic fit score
    const factors = {
      estimated_store_quality: result.estimated_store_quality || 50,
      category_alignment: result.category_alignment || 'moderate',
      town_appeal: result.town_appeal || 'average',
      has_social_media: result.has_social_media || !!(result.instagram || result.facebook || result.tiktok || result.twitter),
      is_independent: result.is_independent !== false,
      estimated_rating: result.rating || 0,
      has_website: result.has_website || !!(result.website),
      price_positioning: result.estimated_price_positioning || 'mid_market',
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
      estimated_store_quality: result.estimated_store_quality,
      predicted_fit_score: breakdown.total,
      ai_reason: result.ai_reason,
      estimated_price_positioning: result.estimated_price_positioning,
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
      raw_data: { fit_score_factors: factors, fit_score_breakdown: breakdown, data_sources: result.data_sources, confidence: result.confidence },
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
