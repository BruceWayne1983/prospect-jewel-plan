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

    const { retailerId, accountType } = await req.json();
    if (!retailerId) return new Response(JSON.stringify({ error: "retailerId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: retailer, error: fetchErr } = await supabase.from("retailers").select("*").eq("id", retailerId).single();
    if (fetchErr || !retailer) return new Response(JSON.stringify({ error: "Retailer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ai = retailer.ai_intelligence || {};
    const competitors = retailer.competitor_brands || [];
    const isCurrentAccount = accountType === "current_account";

    // Build billing context for current accounts
    let billingContext = "";
    if (isCurrentAccount) {
      const parts = [];
      if (retailer.billing_2024_full_year) parts.push(`2024 Full Year: £${Number(retailer.billing_2024_full_year).toLocaleString()}`);
      if (retailer.billing_2025_full_year) parts.push(`2025 Full Year: £${Number(retailer.billing_2025_full_year).toLocaleString()}`);
      if (retailer.billing_2026_ytd) parts.push(`2026 YTD: £${Number(retailer.billing_2026_ytd).toLocaleString()}`);
      if (parts.length) billingContext = `\nBilling History: ${parts.join(" | ")}`;
    }

    const systemPrompt = isCurrentAccount
      ? "You are an expert account growth strategist for Nomination Italy (premium Italian charm jewellery). This is an EXISTING STOCKIST who already carries Nomination. Create a pitch focused on GROWING their business with you — expanding their range, increasing order values, upgrading displays, and introducing new collections. Do NOT pitch as if they're new to the brand. Reference their history and focus on deepening the partnership. Nomination's key ranges include: Composable Classic (charm bracelets), Composable Gold, Extension (stackable bracelets), Bella (fashion jewellery), Gioie (gift-ready pendants), and seasonal collections."
      : "You are an expert sales pitch writer for Nomination Italy (premium Italian charm jewellery). This is a PROSPECT who does NOT yet stock Nomination. Create a highly personalised NEW BUSINESS PITCH that feels natural and references specific details about their store. Focus on why they should start stocking Nomination and the commercial opportunity. Nomination's key ranges include: Composable Classic (charm bracelets), Composable Gold, Extension (stackable bracelets), Bella (fashion jewellery), Gioie (gift-ready pendants), and seasonal collections.";

    const pitchOpeningDesc = isCurrentAccount
      ? "A warm 2-3 sentence opening that acknowledges their existing Nomination partnership"
      : "A natural 2-3 sentence opening tailored to this store";

    const valueDesc = isCurrentAccount
      ? "The growth opportunity — why expanding their Nomination range will drive more revenue"
      : "Why Nomination is perfect for THIS specific store";

    const competitorDesc = isCurrentAccount
      ? "How Nomination fits alongside their other brands and where there's room to grow share"
      : "How Nomination complements or differentiates from their current brands";

    const productsDesc = isCurrentAccount
      ? "3 product ranges they should add or increase, based on what's likely working and gaps in their current selection"
      : "3 product ranges to recommend";

    const closingDesc = isCurrentAccount
      ? "A compelling next-step proposal (e.g. display upgrade, new range trial, seasonal pre-order)"
      : "A compelling closing statement or question to seal interest";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "generate_pitch",
            description: isCurrentAccount ? "Generate an account growth pitch for an existing stockist" : "Generate a personalised pitch for a prospect",
            parameters: {
              type: "object",
              properties: {
                pitchOpening: { type: "string", description: pitchOpeningDesc },
                valueProposition: { type: "string", description: valueDesc },
                competitorPositioning: { type: "string", description: competitorDesc },
                recommendedProducts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      range: { type: "string", description: "Product range name" },
                      reason: { type: "string", description: isCurrentAccount ? "Why they should expand into this range" : "Why this range suits this retailer" },
                    },
                    required: ["range", "reason"],
                    additionalProperties: false,
                  },
                  description: productsDesc,
                },
                closingHook: { type: "string", description: closingDesc },
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
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Create a personalised ${isCurrentAccount ? 'account growth' : 'new business'} pitch for this ${isCurrentAccount ? 'existing stockist' : 'prospect'}:

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Positioning: ${retailer.store_positioning || "unknown"}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Fit Score: ${retailer.fit_score}/100
Pipeline Stage: ${retailer.pipeline_stage}
${billingContext}
${(ai as any).summary ? `AI Summary: ${(ai as any).summary}` : ""}
${(ai as any).customerDemographic ? `Customer: ${(ai as any).customerDemographic}` : ""}
${(ai as any).likelyBuyingMotivation ? `Buying Motivation: ${(ai as any).likelyBuyingMotivation}` : ""}
${Array.isArray(competitors) && competitors.length ? `Current Brands: ${competitors.map((c: any) => `${c.name} (${c.priceTier})`).join(", ")}` : "No competitor brand data"}
${retailer.risk_flags?.length ? `Risk Flags: ${retailer.risk_flags.join(", ")}` : ""}

Personalise the pitch to reference their specific store type, location, customer base, and ${isCurrentAccount ? 'existing relationship with Nomination' : 'existing brand mix'}.`,
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
