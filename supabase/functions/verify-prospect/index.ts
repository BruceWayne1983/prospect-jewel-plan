import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { prospect_id, name, town, county, category } = await req.json();

    if (!name || !town) {
      return new Response(JSON.stringify({ error: "name and town are required" }), {
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
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Search for the business using Firecrawl
    const searchQuery = `${name} ${town} ${county || ""} UK ${category ? category.replace("_", " ") : ""}`.trim();
    console.log("Firecrawl search:", searchQuery);

    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/search", {
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

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error("Firecrawl error:", firecrawlData);
      if (firecrawlResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Firecrawl credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Search failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchResults = firecrawlData.data || [];
    console.log(`Found ${searchResults.length} search results`);

    // Step 2: Use Gemini to analyse results
    const resultsContext = searchResults.slice(0, 5).map((r: any, i: number) => {
      const snippet = (r.markdown || r.description || "").substring(0, 800);
      return `Result ${i + 1}:\nURL: ${r.url || "unknown"}\nTitle: ${r.title || "unknown"}\n${snippet}`;
    }).join("\n\n---\n\n");

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
            name: "verify_business",
            description: "Determine whether a business exists based on search results",
            parameters: {
              type: "object",
              properties: {
                exists: { type: "boolean", description: "Does this business appear to be a real, currently operating business?" },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "Confidence level in the assessment" },
                reasoning: { type: "string", description: "Brief explanation of the verification conclusion" },
                website: { type: "string", description: "The store's own website URL if found, empty string if not" },
                phone: { type: "string", description: "Phone number if found, empty string if not" },
                address: { type: "string", description: "Full address if found, empty string if not" },
                email: { type: "string", description: "Email if found, empty string if not" },
                data_sources: { type: "array", items: { type: "string" }, description: "URLs that confirmed the business exists" },
              },
              required: ["exists", "confidence", "reasoning", "website", "phone", "address", "email", "data_sources"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "verify_business" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail business verification analyst. Your job is to determine whether a specific retail store actually exists as a real, currently operating business based on web search results.

CRITICAL RULES:
- A business EXISTS if you can find its own website, Google Maps listing, social media profiles, review sites (TripAdvisor, Yell, Google Reviews), or mentions in local business directories.
- A business DOES NOT EXIST if the search results show no evidence of the business, or only show AI-generated content, or the name/location doesn't match.
- Be strict: if the evidence is ambiguous, set confidence to "low".
- Extract REAL contact details only — do not guess or fabricate.
- Phone numbers should be in UK format.
- Only include data_sources URLs that actually reference this specific business.`,
          },
          {
            role: "user",
            content: `Verify whether this business exists:

Business Name: ${name}
Town: ${town}
County: ${county || "Unknown"}
Category: ${(category || "retail").replace("_", " ")}

Search Results:
${resultsContext || "No search results found."}

Analyse these results and determine if "${name}" in ${town} is a real, operating business. Extract any verified contact details.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      await aiResponse.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI verification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let verification: any = {};

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        verification = JSON.parse(toolCall.function.arguments);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(JSON.stringify({ error: "Failed to parse verification result" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStatus = verification.exists ? "web_verified" : "verified_fake";

    // Step 3: Update prospect in database
    if (prospect_id) {
      const updateData: any = {
        verification_status: newStatus,
        verification_data: {
          verified_at: new Date().toISOString(),
          confidence: verification.confidence,
          reasoning: verification.reasoning,
          data_sources: verification.data_sources || [],
          search_results_count: searchResults.length,
        },
      };

      // Populate contact details if found and currently empty
      if (verification.website) updateData.website = verification.website;
      if (verification.phone) updateData.phone = verification.phone;
      if (verification.address) updateData.address = verification.address;
      if (verification.email) updateData.email = verification.email;

      const { error: updateError } = await supabase
        .from("discovered_prospects")
        .update(updateData)
        .eq("id", prospect_id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
      }
    }

    return new Response(JSON.stringify({
      exists: verification.exists,
      confidence: verification.confidence,
      reasoning: verification.reasoning,
      verification_status: newStatus,
      website: verification.website || null,
      phone: verification.phone || null,
      address: verification.address || null,
      email: verification.email || null,
      data_sources: verification.data_sources || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("verify-prospect error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Verification failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
