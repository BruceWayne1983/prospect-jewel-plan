import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Step 1: Firecrawl search for the specific store
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

    // Compile scraped content
    const scrapedContent = results.map((r: any, i: number) =>
      `[${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}\nContent: ${(r.markdown || "").substring(0, 2000)}`
    ).join("\n\n---\n\n");

    // Step 2: AI to extract verified data about this specific store
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
            description: "Extract verified data about a specific retail store from web search results",
            parameters: {
              type: "object",
              properties: {
                found: { type: "boolean", description: "Whether the specific store was found in the search results" },
                name: { type: "string", description: "Confirmed store name" },
                town: { type: "string", description: "Town or city where the store is located" },
                county: { type: "string", description: "County (e.g. Somerset, Devon)" },
                category: { type: "string", enum: CATEGORIES },
                address: { type: "string", description: "Full address with postcode — ONLY if found in scraped content. Empty string if not found." },
                phone: { type: "string", description: "Phone number — ONLY if found in scraped content. Empty string if not found." },
                email: { type: "string", description: "Email address — ONLY if found in scraped content. Empty string if not found." },
                website: { type: "string", description: "Website URL — ONLY if found in scraped content. Must be the store's own website, not a directory listing. Empty string if not found." },
                instagram: { type: "string", description: "Instagram handle — ONLY if found in scraped content. Empty string if not found." },
                facebook: { type: "string", description: "Facebook page — ONLY if found in scraped content. Empty string if not found." },
                tiktok: { type: "string", description: "TikTok handle — ONLY if found in scraped content. Empty string if not found." },
                twitter: { type: "string", description: "Twitter/X handle — ONLY if found in scraped content. Empty string if not found." },
                rating: { type: "number", description: "Google rating if found, otherwise 0" },
                review_count: { type: "integer", description: "Review count if found, otherwise 0" },
                estimated_store_quality: { type: "integer", description: "Quality estimate 40-95 based on what was found" },
                predicted_fit_score: { type: "integer", description: "How well this retailer fits Nomination Italy 30-95" },
                estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                ai_reason: { type: "string", description: "3-4 sentence analysis of this store based on what was actually found online. Include what sources confirmed the data." },
                data_sources: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of URLs/sources where data was found",
                },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "How confident you are this is the right store with accurate data" },
              },
              required: ["found", "name", "town", "county", "category", "address", "phone", "email", "website", "instagram", "facebook", "tiktok", "twitter", "rating", "review_count", "estimated_store_quality", "predicted_fit_score", "estimated_price_positioning", "ai_reason", "data_sources", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_store_data" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail intelligence researcher. You have been given REAL web search results about a specific store. Your job is to extract ONLY verified, real data that actually appears in the scraped content.

CRITICAL RULES:
1. ONLY include contact details (phone, email, website, address, social handles) that you can see in the scraped content. Do NOT guess or fabricate ANY data.
2. For website: Only include the store's OWN website domain (e.g. www.storename.co.uk), NOT directory listings, TripAdvisor, Yell, Google Maps, or review sites.
3. For social media: Only include handles/URLs that appear in the scraped content. Do NOT guess handles based on the store name.
4. If the store is NOT found in the results, set found=false and explain in ai_reason.
5. Set confidence based on how much real data you found: high = multiple sources confirm, medium = some data found, low = sparse or uncertain.
6. In ai_reason, cite which sources confirmed the data.
7. For predicted_fit_score: Apply a -15 to -25 penalty if no social media is found. A modern retailer needs social media to be a strong Nomination prospect.`,
          },
          {
            role: "user",
            content: `I'm searching for a specific store called "${searchName}"${town ? ` in or near ${town}` : ' in the UK'}. Extract all VERIFIED data about this store from the search results below. Only include data you can actually see in the content — do not guess or fabricate anything.\n\n${scrapedContent || "No search results found."}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
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
        success: true,
        found: false,
        message: `Could not find "${searchName}" in web results. ${result.ai_reason || ''}`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if already exists
    const { data: existingRetailers } = await supabase.from("retailers").select("name").ilike("name", `%${result.name}%`);
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name").ilike("name", `%${result.name}%`);

    if ((existingRetailers?.length || 0) > 0) {
      return new Response(JSON.stringify({
        success: true,
        found: true,
        alreadyExists: true,
        existsAs: "retailer",
        message: `"${result.name}" already exists as a current account`,
        store: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if ((existingProspects?.length || 0) > 0) {
      return new Response(JSON.stringify({
        success: true,
        found: true,
        alreadyExists: true,
        existsAs: "prospect",
        message: `"${result.name}" already exists as a discovered prospect`,
        store: result,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert as new prospect
    const toInsert = {
      user_id: user.id,
      name: result.name,
      town: result.town,
      county: result.county || "Unknown",
      category: result.category,
      rating: result.rating || null,
      review_count: result.review_count || null,
      estimated_store_quality: result.estimated_store_quality,
      predicted_fit_score: result.predicted_fit_score,
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
      status: "new",
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
      success: true,
      found: true,
      store: result,
      prospect: inserted,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
