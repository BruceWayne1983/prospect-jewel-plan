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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch all Data Hub files tagged as current_accounts
    const { data: files, error: filesErr } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("category", "current_accounts")
      .eq("user_id", user.id);

    if (filesErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch files" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Collect all parsed data and AI summaries as context
    const fileContexts: string[] = [];
    for (const file of (files || [])) {
      if (file.parsed_data && Object.keys(file.parsed_data as Record<string, unknown>).length > 0) {
        fileContexts.push(`File: ${file.file_name}\nParsed Data: ${JSON.stringify(file.parsed_data)}`);
      }
      if (file.ai_summary) {
        fileContexts.push(`File: ${file.file_name}\nAI Summary: ${file.ai_summary}`);
      }
    }

    // Also fetch any files with sales_data, historical_data, performance categories for extra context
    const { data: extraFiles } = await supabase
      .from("uploaded_files")
      .select("file_name, ai_summary, parsed_data, category")
      .eq("user_id", user.id)
      .in("category", ["sales_data", "historical_data", "performance"]);

    for (const file of (extraFiles || [])) {
      if (file.ai_summary) {
        fileContexts.push(`[${file.category}] File: ${file.file_name}\nAI Summary: ${file.ai_summary}`);
      }
      if (file.parsed_data && Object.keys(file.parsed_data as Record<string, unknown>).length > 0) {
        fileContexts.push(`[${file.category}] File: ${file.file_name}\nParsed Data: ${JSON.stringify(file.parsed_data)}`);
      }
    }

    if (fileContexts.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No data found. Please upload files to Data Hub with the 'Current Accounts' category first, then run AI analysis on them." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Also get existing retailers to avoid duplicates
    const { data: existingRetailers } = await supabase
      .from("retailers")
      .select("name, town")
      .eq("user_id", user.id);

    const existingNames = new Set(
      (existingRetailers || []).map(r => `${r.name.toLowerCase().trim()}|${r.town.toLowerCase().trim()}`)
    );

    // 4. Call AI to extract structured retailer data from all file contexts
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            name: "extract_accounts",
            description: "Extract current/established retailer accounts from uploaded sales data, reports, and account files for Nomination Italy jewellery.",
            parameters: {
              type: "object",
              properties: {
                accounts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Retailer/store name" },
                      town: { type: "string", description: "Town or city" },
                      county: { type: "string", description: "UK county" },
                      category: { type: "string", enum: ["jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store"] },
                      store_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                      phone: { type: "string", description: "Phone number if found" },
                      email: { type: "string", description: "Email if found" },
                      website: { type: "string", description: "Website if found" },
                      address: { type: "string", description: "Address if found" },
                      postcode: { type: "string", description: "Postcode if found" },
                      instagram: { type: "string", description: "Instagram handle if found" },
                      ai_notes: { type: "string", description: "Any relevant notes about this account from the data (sales performance, relationship history, etc.)" },
                    },
                    required: ["name", "town", "county", "category"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["accounts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_accounts" } },
        messages: [
          {
            role: "system",
            content: `You are a data extraction specialist for Nomination Italy, a premium Italian charm jewellery brand sold through independent UK retailers. Extract ALL retailer/stockist accounts from the provided data. These are CURRENT established accounts that already stock Nomination. Include every detail you can find: name, town, county, category, contact details, and any performance notes. If county is not explicitly stated, infer it from the town. Default category to "jeweller" if unclear.`,
          },
          {
            role: "user",
            content: `Extract all current/established retailer accounts from the following uploaded data files:\n\n${fileContexts.join("\n\n---\n\n")}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status, await aiResponse.text());
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

    const { accounts } = JSON.parse(toolCall.function.arguments);

    // 5. Insert new accounts, skip duplicates
    let created = 0;
    let skipped = 0;
    const createdIds: string[] = [];

    for (const acct of accounts) {
      const key = `${acct.name.toLowerCase().trim()}|${acct.town.toLowerCase().trim()}`;
      if (existingNames.has(key)) {
        skipped++;
        continue;
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("retailers")
        .insert({
          user_id: user.id,
          name: acct.name,
          town: acct.town,
          county: acct.county,
          category: acct.category || "jeweller",
          store_positioning: acct.store_positioning || "mid_market",
          phone: acct.phone || null,
          email: acct.email || null,
          website: acct.website || null,
          address: acct.address || null,
          postcode: acct.postcode || null,
          instagram: acct.instagram || null,
          ai_notes: acct.ai_notes || null,
          pipeline_stage: "approved",
          qualification_status: "qualified",
          is_independent: true,
        })
        .select("id")
        .single();

      if (!insertErr && inserted) {
        created++;
        createdIds.push(inserted.id);
        existingNames.add(key);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      created,
      skipped,
      total_extracted: accounts.length,
      created_ids: createdIds,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
