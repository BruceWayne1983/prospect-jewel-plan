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

    const body = await req.json();

    // Support direct billing data upload
    if (body.billing_data && Array.isArray(body.billing_data)) {
      return await handleBillingImport(supabase, user.id, body.billing_data);
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

    // Also fetch any files with sales_data, historical_data, performance, billing categories
    const { data: extraFiles } = await supabase
      .from("uploaded_files")
      .select("file_name, ai_summary, parsed_data, category")
      .eq("user_id", user.id)
      .in("category", ["sales_data", "historical_data", "performance", "billing"]);

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

    // 4. Call AI to extract structured retailer data including billing
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
            description: "Extract current/established retailer accounts from uploaded sales data, reports, and account files for Nomination Italy jewellery. Include any billing/revenue data found.",
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
                      category: { type: "string", enum: ["jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store", "department_store", "garden_centre_gift_hall", "wedding_bridal", "heritage_tourist_gift", "multi_brand_retailer"] },
                      store_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                      phone: { type: "string", description: "Phone number if found" },
                      email: { type: "string", description: "Email if found" },
                      website: { type: "string", description: "Website if found" },
                      address: { type: "string", description: "Address if found" },
                      postcode: { type: "string", description: "Postcode if found" },
                      instagram: { type: "string", description: "Instagram handle if found" },
                      ai_notes: { type: "string", description: "Any relevant notes about this account from the data" },
                      billing_2024: { type: "number", description: "2024 full year billing/revenue if found" },
                      billing_2025: { type: "number", description: "2025 full year billing/revenue if found" },
                      billing_2026_ytd: { type: "number", description: "2026 year-to-date billing if found" },
                      monthly_billing: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            month: { type: "string", description: "YYYY-MM format" },
                            amount: { type: "number" },
                          },
                          required: ["month", "amount"],
                          additionalProperties: false,
                        },
                        description: "Monthly billing breakdown if available",
                      },
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
            content: `You are a data extraction specialist for Nomination Italy, a premium Italian charm jewellery brand sold through independent UK retailers. Extract ALL retailer/stockist accounts from the provided data. These are CURRENT established accounts that already stock Nomination. Include every detail you can find: name, town, county, category, contact details, billing/revenue data, and any performance notes. If county is not explicitly stated, infer it from the town. Default category to "jeweller" if unclear. IMPORTANT: Extract all billing/revenue/sales figures — look for annual totals, YTD figures, monthly breakdowns, order values, etc.`,
          },
          {
            role: "user",
            content: `Extract all current/established retailer accounts AND their billing/revenue data from the following uploaded data files:\n\n${fileContexts.join("\n\n---\n\n")}`,
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

    // 5. Insert new accounts or update billing for existing ones
    let created = 0;
    let skipped = 0;
    let billingUpdated = 0;
    const createdIds: string[] = [];

    for (const acct of accounts) {
      const key = `${acct.name.toLowerCase().trim()}|${acct.town.toLowerCase().trim()}`;

      // Build billing_history object
      const billingHistory: Record<string, unknown> = {};
      if (acct.monthly_billing?.length) {
        billingHistory.monthly = acct.monthly_billing;
      }
      const annualTotals: Record<string, number> = {};
      if (acct.billing_2024) annualTotals["2024"] = acct.billing_2024;
      if (acct.billing_2025) annualTotals["2025"] = acct.billing_2025;
      if (Object.keys(annualTotals).length) billingHistory.annual_totals = annualTotals;
      if (acct.billing_2026_ytd) billingHistory.ytd_2026 = acct.billing_2026_ytd;

      // Calculate YTD change
      if (acct.billing_2026_ytd && acct.billing_2025) {
        const currentMonth = new Date().getMonth() + 1;
        const priorYearProrated = (acct.billing_2025 / 12) * currentMonth;
        if (priorYearProrated > 0) {
          billingHistory.ytd_change_pct = Math.round(((acct.billing_2026_ytd - priorYearProrated) / priorYearProrated) * 1000) / 10;
        }
      }

      if (existingNames.has(key)) {
        // Update billing data for existing accounts if we have any
        if (Object.keys(billingHistory).length > 0 || acct.billing_2024 || acct.billing_2025 || acct.billing_2026_ytd) {
          const updateFields: Record<string, unknown> = {};
          if (acct.billing_2024) updateFields.billing_2024_full_year = acct.billing_2024;
          if (acct.billing_2025) updateFields.billing_2025_full_year = acct.billing_2025;
          if (acct.billing_2026_ytd) updateFields.billing_2026_ytd = acct.billing_2026_ytd;
          if (Object.keys(billingHistory).length > 0) updateFields.billing_history = billingHistory;
          updateFields.billing_last_updated = new Date().toISOString();

          // Find existing retailer to update
          const { data: existing } = await supabase
            .from("retailers")
            .select("id")
            .eq("user_id", user.id)
            .ilike("name", acct.name.trim())
            .ilike("town", acct.town.trim())
            .limit(1)
            .single();

          if (existing) {
            await supabase.from("retailers").update(updateFields).eq("id", existing.id);
            billingUpdated++;
          }
        }
        skipped++;
        continue;
      }

      const insertData: Record<string, unknown> = {
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
      };

      if (acct.billing_2024) insertData.billing_2024_full_year = acct.billing_2024;
      if (acct.billing_2025) insertData.billing_2025_full_year = acct.billing_2025;
      if (acct.billing_2026_ytd) insertData.billing_2026_ytd = acct.billing_2026_ytd;
      if (Object.keys(billingHistory).length > 0) insertData.billing_history = billingHistory;
      if (acct.billing_2024 || acct.billing_2025 || acct.billing_2026_ytd) {
        insertData.billing_last_updated = new Date().toISOString();
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("retailers")
        .insert(insertData)
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
      billing_updated: billingUpdated,
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

// Handle direct billing data import (CSV/JSON format)
async function handleBillingImport(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  billingData: Array<{
    name: string;
    town?: string;
    billing_2024?: number;
    billing_2025?: number;
    billing_2026_ytd?: number;
    monthly?: Array<{ month: string; amount: number }>;
  }>
) {
  let updated = 0;
  let notFound = 0;
  const errors: string[] = [];

  for (const entry of billingData) {
    // Find matching retailer
    let query = supabase
      .from("retailers")
      .select("id, billing_history, billing_2024_full_year, billing_2025_full_year, billing_2026_ytd")
      .eq("user_id", userId)
      .ilike("name", entry.name.trim());

    if (entry.town) {
      query = query.ilike("town", entry.town.trim());
    }

    const { data: matches } = await query.limit(1);

    if (!matches || matches.length === 0) {
      notFound++;
      errors.push(`Not found: ${entry.name}${entry.town ? ` (${entry.town})` : ""}`);
      continue;
    }

    const retailer = matches[0];
    const existingHistory = (retailer.billing_history as Record<string, unknown>) || {};

    // Merge billing history
    const billingHistory: Record<string, unknown> = { ...existingHistory };
    if (entry.monthly?.length) {
      const existingMonthly = (existingHistory.monthly as Array<{ month: string; amount: number }>) || [];
      const monthMap = new Map(existingMonthly.map(m => [m.month, m.amount]));
      for (const m of entry.monthly) {
        monthMap.set(m.month, m.amount);
      }
      billingHistory.monthly = Array.from(monthMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));
    }

    const annualTotals: Record<string, number> = (existingHistory.annual_totals as Record<string, number>) || {};
    if (entry.billing_2024) annualTotals["2024"] = entry.billing_2024;
    if (entry.billing_2025) annualTotals["2025"] = entry.billing_2025;
    if (Object.keys(annualTotals).length) billingHistory.annual_totals = annualTotals;
    if (entry.billing_2026_ytd) billingHistory.ytd_2026 = entry.billing_2026_ytd;

    // Calculate YTD change
    const ytd2026 = entry.billing_2026_ytd || retailer.billing_2026_ytd;
    const fy2025 = entry.billing_2025 || retailer.billing_2025_full_year;
    if (ytd2026 && fy2025) {
      const currentMonth = new Date().getMonth() + 1;
      const priorProrated = (Number(fy2025) / 12) * currentMonth;
      if (priorProrated > 0) {
        billingHistory.ytd_change_pct = Math.round(((Number(ytd2026) - priorProrated) / priorProrated) * 1000) / 10;
      }
    }

    const updateFields: Record<string, unknown> = {
      billing_history: billingHistory,
      billing_last_updated: new Date().toISOString(),
    };
    if (entry.billing_2024) updateFields.billing_2024_full_year = entry.billing_2024;
    if (entry.billing_2025) updateFields.billing_2025_full_year = entry.billing_2025;
    if (entry.billing_2026_ytd) updateFields.billing_2026_ytd = entry.billing_2026_ytd;

    const { error } = await supabase.from("retailers").update(updateFields).eq("id", retailer.id);
    if (error) {
      errors.push(`Update failed for ${entry.name}: ${error.message}`);
    } else {
      updated++;
    }
  }

  return new Response(JSON.stringify({
    success: true,
    updated,
    not_found: notFound,
    errors: errors.length > 0 ? errors : undefined,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
