import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function getMimeType(fileName: string, fileType: string | null): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  return fileType || "application/octet-stream";
}

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

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("data-hub")
      .download(file.file_path);

    if (downloadErr || !fileData) {
      return new Response(JSON.stringify({ error: "Could not download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lower = file.file_name.toLowerCase();
    const isText = file.file_type?.startsWith("text/") ||
      lower.endsWith(".csv") || lower.endsWith(".json") ||
      lower.endsWith(".txt") || lower.endsWith(".md");
    const isBinary = lower.endsWith(".pdf") || lower.endsWith(".xlsx") ||
      lower.endsWith(".xls") || lower.endsWith(".docx") ||
      lower.endsWith(".doc") || lower.endsWith(".pptx");

    const categoryContext: Record<string, string> = {
      sales_data: "This is sales data. Look for trends, top performers, seasonal patterns, and actionable insights.",
      historical_data: "This is historical data. Compare periods, identify growth/decline trends, and highlight changes.",
      current_accounts: "These are current account details. Summarise key accounts, territories, and performance.",
      performance: "This is performance data. Identify KPIs, targets vs actuals, and areas for improvement.",
      promotions: "This relates to promotions. Summarise campaigns, effectiveness, and recommendations.",
      brand_guidelines: "These are brand guidelines. Summarise key brand rules, dos/don'ts, and important standards.",
      other: "Analyse this file and provide useful insights.",
    };

    const systemPrompt = "You are a sales analyst for Nomination Italy (premium Italian charm jewellery). Analyse uploaded files and provide concise, actionable summaries. Format with bullet points and clear sections. Keep under 500 words.";
    const contextLine = `File: ${file.file_name}\nCategory: ${file.category}\nContext: ${categoryContext[file.category] || categoryContext.other}`;

    let messages: any[];

    if (isText) {
      const text = await fileData.text();
      const contentPreview = text.substring(0, 8000);
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyse this file:\n\n${contextLine}\n\nContent:\n${contentPreview}` },
      ];
    } else if (isBinary) {
      // Use Gemini multimodal: send file as base64 inline_data
      const buffer = await fileData.arrayBuffer();
      const base64Data = arrayBufferToBase64(buffer);
      const mimeType = getMimeType(file.file_name, file.file_type);

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyse this file:\n\n${contextLine}\n\nThe file is attached. Extract and analyse all data, tables, text, and charts you can find.` },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
              },
            },
          ],
        },
      ];
    } else {
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyse this file:\n\n${contextLine}\n\n[Binary file: ${file.file_name}, ${file.file_size} bytes, type: ${file.file_type}. Unable to extract content from this file type.]` },
      ];
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
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices?.[0]?.message?.content || "No analysis generated.";

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
