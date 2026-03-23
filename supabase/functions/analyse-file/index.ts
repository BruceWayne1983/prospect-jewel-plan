import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { fileId } = await req.json();
    if (!fileId) {
      return new Response(JSON.stringify({ error: "fileId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch file metadata
    const { data: file, error: fileErr } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileErr || !file) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file content
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("data-hub")
      .download(file.file_path);

    if (downloadErr || !fileData) {
      return new Response(JSON.stringify({ error: "Could not download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let contentPreview = "";
    const isText = file.file_type?.startsWith("text/") ||
      file.file_name.endsWith(".csv") ||
      file.file_name.endsWith(".json") ||
      file.file_name.endsWith(".txt") ||
      file.file_name.endsWith(".md");

    if (isText) {
      const text = await fileData.text();
      contentPreview = text.substring(0, 8000);
    } else {
      contentPreview = `[Binary file: ${file.file_name}, ${file.file_size} bytes, type: ${file.file_type}]`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryContext: Record<string, string> = {
      sales_data: "This is sales data. Look for trends, top performers, seasonal patterns, and actionable insights.",
      historical_data: "This is historical data. Compare periods, identify growth/decline trends, and highlight changes.",
      current_accounts: "These are current account details. Summarise key accounts, territories, and performance.",
      performance: "This is performance data. Identify KPIs, targets vs actuals, and areas for improvement.",
      promotions: "This relates to promotions. Summarise campaigns, effectiveness, and recommendations.",
      brand_guidelines: "These are brand guidelines. Summarise key brand rules, dos/don'ts, and important standards.",
      other: "Analyse this file and provide useful insights.",
    };

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a sales analyst for Nomination Italy (premium Italian charm jewellery). Analyse uploaded files and provide concise, actionable summaries. Format with bullet points and clear sections. Keep under 500 words.",
          },
          {
            role: "user",
            content: `Analyse this file:\n\nFile: ${file.file_name}\nCategory: ${file.category}\nContext: ${categoryContext[file.category] || categoryContext.other}\n\nContent:\n${contentPreview}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      await aiResponse.text();
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "No analysis generated.";

    // Save summary to file record
    await supabase
      .from("uploaded_files")
      .update({ ai_summary: summary })
      .eq("id", fileId);

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
