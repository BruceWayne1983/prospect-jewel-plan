import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const REPORT_CONTEXT: Record<string, string> = {
  ord015: `This is an ORD015 Progressive Customer Order Comparison from Nomination Italy.
KEY RULES:
- "Prog Ordered CY" and "Prog Dev PY1 %" are the FAIR like-for-like comparisons (same period YTD)
- "Total Ordered PY1" and "Prog Total Dev PY1 %" compare YTD against FULL prior year — this is MISLEADING and always looks terrible in Q1 (3 months vs 12)
- Budget categories: 1-COMPOSABLE = bracelets/links, 2-FASHION = fashion jewellery, 3-RICAVI ACCESSORI = accessories, .-ALTRO = returns/credits (negative is normal)
- Account names prefixed with xxx/XXX = permanently closed — exclude from active territory analysis
- "Summary" rows are account totals, "Currency Tot" is territory total
- NaN = no orders, not an error
- Strip numeric prefixes from account names (e.g. "246750-MOUNT CYCLE LTD" → "Bumble Tree")
- Known closed: Andrew Berry (Ystrad Mynach), Jill Woods/Silver Lily (Saundersfoot), WM Nicholls Brecon, Trizaro Llandeilo
- Multi-site groups: KooKoo Madame (3 sites), 925 Treats (4 sites), Bumble Tree (2 sites), Allum & Sidaway (2 sites)`,

  fat017: `This is a FAT017 Monthly Customer Billing Comparison from Nomination Italy.
KEY RULES:
- Shows INVOICED/SHIPPED revenue, NOT orders placed — billing LAGS orders by 2-6 weeks
- Lower totals than ORD015 for the same period is EXPECTED (pipeline stock)
- Monthly columns show billing per month, compared against same months in prior years
- NaN/infinity % = new account with no prior year data — flag as "New Account"
- "Riepilogo" = Italian for "summary" — watch for double-counting
- Grand total row where Region = "Total"
- Clean account names: strip codes, LTD, LIMITED. Add town for multi-site accounts.`,

  fat012: `This is a FAT012 Product-Level Billing Breakdown from Nomination Italy.
Shows billing by product category per account. Same billing data as FAT017 but with product detail.
Categories: 1-COMPOSABLE = bracelets, 2-FASHION = fashion jewellery, 3-RICAVI ACCESSORI = accessories
Each account has category rows + a "Total" summary row.`,

  fat013: `This is a FAT013 YTD vs Full Year Comparison from Nomination Italy.
⚠️ THIS REPORT IS ALMOST USELESS for performance tracking. It compares 3 months YTD against 12 months full year.
The percentage changes are mathematically meaningless. Extract CY figures only. NEVER use the % changes.
Tell Emma to use ORD015 or FAT017 instead for real performance tracking.`,

  brioso_summary: `This is a Brioso Summary Workbook from Emma's agency (Brioso/Jude).
Contains multiple sheets: annual totals, monthly billing data, back order summaries.
Back orders show pipeline: Backorder/Allocated/Ready to go statuses.
Account names may differ from Nomination reports (data entry variations).
May include other agents' territories — focus on Emma's accounts.
Seasonal context: Q3 (Jul-Sep) = ~40% of annual sales, September alone = ~26%. Q2 (Apr-Jun) = ~12% = historically quietest.`,
};

const SYSTEM_PROMPT = `You are Emma's personal sales analyst for Nomination Italy (premium Italian charm jewellery). You translate dense sales reports into plain English that Emma can understand and act on.

YOUR PERSONALITY:
- Warm, supportive, encouraging — you're Emma's ally, not another source of pressure
- Lead with the REAL story, not the scary headline numbers
- Always explain WHY numbers look the way they do
- Use £ signs, proper formatting, and round numbers for readability

YOUR ANALYSIS MUST INCLUDE:

1. **HERO SUMMARY** (3-4 sentences): What this report ACTUALLY says in plain English. Lead with the real story. If the report compares YTD vs full year, immediately flag this as misleading.

2. **TERRITORY HEADLINE**: Total CY figure and fair like-for-like comparison. Extract the Currency Tot / Grand Total row.

3. **WINNERS** (accounts growing): List accounts where CY > PY1 (same period), with clean names, town, £ value, and growth %.

4. **ACCOUNTS TO WATCH** (declining): Accounts where CY < PY1, excluding closed accounts. Add context where possible.

5. **CLOSED ACCOUNTS**: Any xxx-prefixed accounts. Show their PY1 value and how removing them changes the territory comparison.

6. **CATEGORY BREAKDOWN**: Translate Italian categories and show the mix. Flag unusual ALTRO (returns) levels.

7. **KEY CONTEXT**: Any timing factors, delays, or seasonal patterns that explain the numbers.

ACCOUNT NAME CLEANING:
- Strip numeric prefixes (e.g. "246750-")
- Strip LTD, LIMITED
- Use trading name where available (e.g. "MOUNT CYCLE LTD - BUMBLE TREE" → "Bumble Tree")
- Add town for multi-site accounts
- Flag xxx/XXX prefixed as "CLOSED"
- "229536-BRIOSO AGENCIES" = internal office orders, separate from territory

OUTPUT FORMAT:
Return a structured JSON block at the END wrapped in \`\`\`json ... \`\`\` with:
{
  "territory_total_cy": 0,
  "territory_total_py1": 0,
  "fair_change_pct": 0,
  "accounts_growing": [{"name": "Clean Name", "town": "Town", "cy": 0, "py1": 0, "change_pct": 0}],
  "accounts_declining": [{"name": "Clean Name", "town": "Town", "cy": 0, "py1": 0, "change_pct": 0, "context": "note"}],
  "closed_accounts": [{"name": "Clean Name", "town": "Town", "py1_value": 0}],
  "category_breakdown": [{"category_raw": "1-COMPOSABLE", "category_en": "Composable Bracelets", "cy": 0, "py1": 0}],
  "adjusted_territory_change_pct": 0
}

Before the JSON block, write the plain English summary (the hero summary and all analysis sections).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Rate limit: 10/min, 60/hour ────────────────────────
    const { data: rl, error: rlErr } = await supabase.rpc("check_rate_limit", {
      _action: "analyse-report",
      _max_per_minute: 10,
      _max_per_hour: 60,
    });
    if (rlErr) console.warn("[rate-limit] check failed, allowing request:", rlErr.message);
    if (rl && (rl as { allowed: boolean }).allowed === false) {
      const retry = (rl as { retry_after?: number }).retry_after ?? 60;
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please wait a moment before trying again.", retry_after: retry }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retry) } },
      );
    }

    const { reportId } = await req.json();
    if (!reportId) {
      return new Response(JSON.stringify({ error: "reportId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get report record
    const { data: report, error: reportErr } = await supabase
      .from("sales_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (reportErr || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing
    await supabase.from("sales_reports").update({ status: "processing" }).eq("id", reportId);

    // Download file
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("data-hub")
      .download(report.file_path);

    if (downloadErr || !fileData) {
      await supabase.from("sales_reports").update({ status: "error" }).eq("id", reportId);
      return new Response(JSON.stringify({ error: "Could not download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await supabase.from("sales_reports").update({ status: "error" }).eq("id", reportId);
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lower = report.file_name.toLowerCase();
    const isPdf = lower.endsWith(".pdf");
    const isText = lower.endsWith(".csv") || lower.endsWith(".txt");
    const reportContext = REPORT_CONTEXT[report.report_type] || "Analyse this sales report and provide insights.";

    const contextLine = `Report Type: ${report.report_type}\nFile: ${report.file_name}\n${report.report_date ? `Report Date: ${report.report_date}` : ""}\n${report.period_start ? `Period: ${report.period_start} to ${report.period_end}` : ""}\n\nReport-specific context:\n${reportContext}`;

    let messages: any[];

    if (isPdf) {
      const buffer = await fileData.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyse this sales report:\n\n${contextLine}\n\nExtract all data from the PDF. Pay close attention to the Summary rows and Currency Tot row for territory totals.` },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64Data}` } },
          ],
        },
      ];
    } else if (isText) {
      const text = await fileData.text();
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyse this sales report:\n\n${contextLine}\n\nContent:\n${text.substring(0, 12000)}` },
      ];
    } else {
      // Excel — try text extraction, fall back to metadata
      let extractedText = "";
      try {
        const text = await fileData.text();
        const printable = text.replace(/[^\x20-\x7E\r\n\t]/g, "");
        if (printable.length > 100) extractedText = printable.substring(0, 12000);
      } catch { /* ignore */ }

      if (extractedText.length > 100) {
        messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyse this sales report:\n\n${contextLine}\n\nExtracted text content:\n${extractedText}` },
        ];
      } else {
        messages = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Analyse this sales report based on metadata:\n\n${contextLine}\n\nThis is an Excel file (${lower.split('.').pop()?.toUpperCase()}) that couldn't be directly read as text. File size: ${report.file_size} bytes.\n\nBased on the report type and metadata, provide:\n1. What this report likely contains based on its type\n2. Guidance on what Emma should look for\n3. Suggest exporting as CSV or PDF for full AI analysis\n\nStill provide the structured JSON with any data you can infer.` },
        ];
      }
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      await supabase.from("sales_reports").update({ status: "error" }).eq("id", reportId);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again in a moment" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const fullResponse = aiData.choices?.[0]?.message?.content || "No analysis generated.";

    // Extract structured JSON — surface failures, don't swallow them
    let parsedData: Record<string, any> = {};
    let errorDetail: string | null = null;
    const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      errorDetail = "AI response did not include the expected JSON block. Please retry the analysis.";
    } else {
      try {
        parsedData = JSON.parse(jsonMatch[1]);
      } catch (parseErr: any) {
        errorDetail = `AI returned malformed data (JSON parse error: ${parseErr?.message || "unknown"}). Please retry.`;
        parsedData = {};
      }
    }

    const summary = fullResponse.replace(/```json\s*[\s\S]*?\s*```/, "").trim();

    // Only mark "analysed" if we got at least one meaningful field
    const hasUsefulData =
      parsedData.territory_total_cy != null ||
      (Array.isArray(parsedData.accounts_growing) && parsedData.accounts_growing.length > 0) ||
      (Array.isArray(parsedData.category_breakdown) && parsedData.category_breakdown.length > 0);

    const finalStatus = errorDetail || !hasUsefulData ? "error" : "analysed";
    const finalErrorDetail = errorDetail
      || (!hasUsefulData ? "AI response did not contain any usable territory data. Please retry." : null);

    await supabase.from("sales_reports").update({
      ai_summary: summary,
      parsed_data: parsedData,
      territory_total_cy: parsedData.territory_total_cy || null,
      territory_total_py1: parsedData.territory_total_py1 || null,
      status: finalStatus,
      error_detail: finalErrorDetail,
    }).eq("id", reportId);

    return new Response(JSON.stringify({
      success: finalStatus === "analysed",
      summary,
      parsedData,
      error_detail: finalErrorDetail,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
