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
    const competitors = retailer.competitor_brands || [];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "generate_pitch",
            description: "Generate a personalised pitch for a retailer",
            parameters: {
              type: "object",
              properties: {
                pitchOpening: { type: "string", description: "A natural 2-3 sentence opening tailored to this store" },
                valueProposition: { type: "string", description: "Why Nomination is perfect for THIS specific store" },
                competitorPositioning: { type: "string", description: "How Nomination complements or differentiates from their current brands" },
                recommendedProducts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      range: { type: "string", description: "Product range name" },
                      reason: { type: "string", description: "Why this range suits this retailer" },
                    },
                    required: ["range", "reason"],
                    additionalProperties: false,
                  },
                  description: "3 product ranges to recommend",
                },
                closingHook: { type: "string", description: "A compelling closing statement or question to seal interest" },
                talkingPoints: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 quick talking points as bullet prompts",
                },
              },
              required: ["pitchOpening", "valueProposition", "competitorPositioning", "recommendedProducts", "closingHook", "talkingPoints"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_pitch" } },
        messages: [
          {
            role: "system",
            content: "You are an expert sales pitch writer for Nomination Italy (premium Italian charm jewellery). Create highly personalised pitches that feel natural and reference specific details about each store. Nomination's key ranges include: Composable Classic (charm bracelets), Composable Gold, Extension (stackable bracelets), Bella (fashion jewellery), Gioie (gift-ready pendants), and seasonal collections.",
          },
          {
            role: "user",
            content: `Create a personalised pitch for this retailer:

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Positioning: ${retailer.store_positioning || "unknown"}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Fit Score: ${retailer.fit_score}/100

${(ai as any).summary ? `AI Summary: ${(ai as any).summary}` : ""}
${(ai as any).customerDemographic ? `Customer: ${(ai as any).customerDemographic}` : ""}
${(ai as any).likelyBuyingMotivation ? `Buying Motivation: ${(ai as any).likelyBuyingMotivation}` : ""}
${Array.isArray(competitors) && competitors.length ? `Current Brands: ${competitors.map((c: any) => `${c.name} (${c.priceTier})`).join(", ")}` : "No competitor brand data"}

Personalise the pitch to reference their specific store type, location, customer base, and existing brand mix.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await aiResponse.text();
      return new Response(JSON.stringify({ error: "AI pitch generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const pitch = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ success: true, pitch }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
