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

    const { retailerId } = await req.json();
    if (!retailerId) return new Response(JSON.stringify({ error: "retailerId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: retailer, error: fetchErr } = await supabase.from("retailers").select("*").eq("id", retailerId).single();
    if (fetchErr || !retailer) return new Response(JSON.stringify({ error: "Retailer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ai = retailer.ai_intelligence || {};
    const outreach = retailer.outreach || {};
    const activity = retailer.activity || {};
    const competitors = retailer.competitor_brands || [];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "generate_briefing",
            description: "Generate a concise pre-visit briefing for a sales rep visiting a retailer",
            parameters: {
              type: "object",
              properties: {
                bullets: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      icon: { type: "string", enum: ["store", "customer", "product", "risk", "action"] },
                      title: { type: "string", description: "Bold headline, 3-5 words" },
                      detail: { type: "string", description: "1-2 sentence detail" },
                    },
                    required: ["icon", "title", "detail"],
                    additionalProperties: false,
                  },
                  description: "Exactly 5 key briefing points",
                },
                openingLine: { type: "string", description: "A natural, warm opening line to start the visit conversation" },
                keyObjection: { type: "string", description: "The most likely objection and how to handle it" },
                productToLead: { type: "string", description: "Which Nomination product/range to lead with and why" },
              },
              required: ["bullets", "openingLine", "keyObjection", "productToLead"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_briefing" } },
        messages: [
          {
            role: "system",
            content: "You are a sales coach for Nomination Italy (premium Italian charm jewellery). Generate a concise, actionable pre-visit briefing that a sales rep can read in 60 seconds before walking into the store. Be specific, practical, and commercially focused.",
          },
          {
            role: "user",
            content: `Generate a pre-visit briefing for this retailer:

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Positioning: ${retailer.store_positioning || "unknown"}
Independent: ${retailer.is_independent ? "Yes" : "No"}
Fit Score: ${retailer.fit_score}/100
Priority: ${retailer.priority_score}/100

${(ai as any).summary ? `AI Summary: ${(ai as any).summary}` : ""}
${(ai as any).whyAttractive ? `Why Attractive: ${(ai as any).whyAttractive}` : ""}
${(ai as any).customerDemographic ? `Customer: ${(ai as any).customerDemographic}` : ""}
${(ai as any).risksOrConcerns ? `Risks: ${(ai as any).risksOrConcerns}` : ""}
${(outreach as any).bestOutreachAngle ? `Best Angle: ${(outreach as any).bestOutreachAngle}` : ""}
${(outreach as any).productAngle ? `Product Angle: ${(outreach as any).productAngle}` : ""}
${(activity as any).conversationNotes?.length ? `Previous Notes: ${(activity as any).conversationNotes.join("; ")}` : "No previous contact"}
${Array.isArray(competitors) && competitors.length ? `Competitor Brands: ${competitors.map((c: any) => c.name).join(", ")}` : ""}
${retailer.risk_flags?.length ? `Risk Flags: ${retailer.risk_flags.join(", ")}` : ""}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const body = await aiResponse.text();
      console.error("AI error:", status, body);
      return new Response(JSON.stringify({ error: "AI briefing generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const briefing = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ success: true, briefing }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
