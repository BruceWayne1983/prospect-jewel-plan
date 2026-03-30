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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { retailerId, storeName, town, county } = await req.json();
    if (!storeName) {
      return new Response(JSON.stringify({ error: "storeName is required" }), {
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

    const location = [town, county].filter(Boolean).join(", ");
    const searchQuery = `site:linkedin.com "${storeName}" ${location} owner OR manager OR director OR buyer jewellery OR retail`;

    console.log("LinkedIn search:", searchQuery);

    // Use Firecrawl to search LinkedIn profiles
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
      return new Response(JSON.stringify({ error: "LinkedIn search failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const searchData = await searchResponse.json();
    const results = searchData.data || [];
    console.log(`Firecrawl returned ${results.length} LinkedIn results`);

    // Also search without site:linkedin.com for company director info
    const generalQuery = `"${storeName}" ${location} owner director manager`;
    const generalResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: generalQuery,
        limit: 5,
        lang: "en",
        country: "gb",
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    let generalResults: any[] = [];
    if (generalResponse.ok) {
      const generalData = await generalResponse.json();
      generalResults = generalData.data || [];
    }

    // Compile all results for AI extraction
    const allContent = [
      ...results.map((r: any, i: number) =>
        `[LinkedIn ${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}`
      ),
      ...generalResults.map((r: any, i: number) =>
        `[Web ${i + 1}] URL: ${r.url}\nTitle: ${r.title || "N/A"}\nDescription: ${r.description || "N/A"}\nContent: ${(r.markdown || "").substring(0, 1000)}`
      ),
    ].join("\n\n---\n\n");

    // Use AI to extract contact information
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
            name: "extract_contacts",
            description: "Extract verified contact person details from search results",
            parameters: {
              type: "object",
              properties: {
                contacts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Full name of the person" },
                      role: { type: "string", description: "Their role (Owner, Director, Manager, Buyer, etc.)" },
                      linkedin_url: { type: "string", description: "LinkedIn profile URL if found. Empty string if not." },
                      source: { type: "string", description: "Where this info was found (e.g. 'LinkedIn', 'Companies House', 'Store website')" },
                      confidence: { type: "string", enum: ["high", "medium", "low"], description: "How confident this person is actually associated with this store" },
                    },
                    required: ["name", "role", "linkedin_url", "source", "confidence"],
                    additionalProperties: false,
                  },
                },
                summary: { type: "string", description: "Brief summary of what was found" },
              },
              required: ["contacts", "summary"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_contacts" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail contact researcher. Given search results (LinkedIn and general web), extract real people associated with a specific store. ONLY include people you can verify from the search results — do NOT invent names. 

RULES:
1. Only include contacts whose name actually appears in the search results
2. Only include contacts clearly associated with this specific store (not similarly named stores)
3. Set confidence: high = LinkedIn profile clearly shows this store, medium = mentioned in relation to store, low = might be the right person
4. If no contacts found, return empty array and explain in summary`,
          },
          {
            role: "user",
            content: `Find real people (owners, directors, managers, buyers) associated with "${storeName}" in ${location}.\n\nSearch results:\n${allContent || "No results found."}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI error:", aiResponse.status);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ success: true, contacts: [], summary: "AI could not extract data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // If retailerId provided and contacts found, update the outreach data
    if (retailerId && result.contacts?.length > 0) {
      const bestContact = result.contacts.sort((a: any, b: any) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.confidence as keyof typeof order] ?? 2) - (order[b.confidence as keyof typeof order] ?? 2);
      })[0];

      // Fetch current outreach data
      const { data: retailer } = await supabase.from("retailers").select("outreach").eq("id", retailerId).single();
      const currentOutreach = (retailer?.outreach ?? {}) as Record<string, any>;

      await supabase.from("retailers").update({
        outreach: {
          ...currentOutreach,
          contactName: bestContact.name,
          contactRole: bestContact.role,
          contactLinkedIn: bestContact.linkedin_url || undefined,
          contactSource: bestContact.source,
          contactVerified: true,
        },
      }).eq("id", retailerId);
    }

    return new Response(JSON.stringify({
      success: true,
      contacts: result.contacts || [],
      summary: result.summary,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
