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
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { retailerId, visitNotes, outcome, format } = await req.json();
    if (!retailerId) return new Response(JSON.stringify({ error: "retailerId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: retailer, error: fetchErr } = await supabase.from("retailers").select("*").eq("id", retailerId).single();
    if (fetchErr || !retailer) return new Response(JSON.stringify({ error: "Retailer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const outreach = retailer.outreach || {};
    const ai = retailer.ai_intelligence || {};

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "generate_followup",
            description: "Generate a follow-up message after a retailer visit or call",
            parameters: {
              type: "object",
              properties: {
                subject: { type: "string", description: "Email subject line" },
                message: { type: "string", description: "The full follow-up message body" },
                whatsappVersion: { type: "string", description: "A shorter, more casual WhatsApp-friendly version" },
                suggestedNextAction: { type: "string", description: "What to do next after sending this" },
                suggestedFollowUpDate: { type: "string", description: "When to follow up, e.g. '3 days', '1 week'" },
              },
              required: ["subject", "message", "whatsappVersion", "suggestedNextAction", "suggestedFollowUpDate"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_followup" } },
        messages: [
          {
            role: "system",
            content: "You are a professional sales copywriter for Nomination Italy (premium Italian charm jewellery). Write warm, personal follow-up messages that reference specific details from the visit. Keep the tone professional but friendly. Sign off as the sales rep, not as the brand.",
          },
          {
            role: "user",
            content: `Generate a follow-up ${format || "email"} for this retailer after a visit/call:

Retailer: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Contact: ${(outreach as any).contactName || "the owner/buyer"}

Visit Notes: ${visitNotes || "General introductory visit"}
Outcome: ${outcome || "Positive interest shown"}

${(ai as any).likelyBuyingMotivation ? `Buying Motivation: ${(ai as any).likelyBuyingMotivation}` : ""}
${(outreach as any).productAngle ? `Product Angle: ${(outreach as any).productAngle}` : ""}

Write both a professional email version and a shorter WhatsApp version. Reference specifics from the visit notes.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await aiResponse.text();
      return new Response(JSON.stringify({ error: "AI follow-up generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const followup = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ success: true, followup }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
