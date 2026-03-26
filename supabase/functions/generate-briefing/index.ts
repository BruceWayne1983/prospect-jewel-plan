import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VISIT_PURPOSE_PROMPTS: Record<string, string> = {
  range_review: "Focus the briefing on RANGE REVIEW: current stock performance, bestsellers to check, gaps in their display, slow movers to discuss, and merchandising improvements.",
  new_season: "Focus the briefing on NEW SEASON LAUNCH: which new collections to present, how to position them for this store's customer base, display recommendations, and pre-order opportunities.",
  relationship: "Focus the briefing on RELATIONSHIP CHECK-IN: rapport building, gathering feedback on sell-through, understanding their business challenges, and strengthening the partnership.",
  reorder: "Focus the briefing on REORDER & REPLENISH: identify likely low-stock bestsellers, suggest reorder quantities, highlight any promotional support, and discuss upcoming demand drivers.",
  recovery: "Focus the briefing on WIN-BACK / RECOVERY: understanding why orders dropped, relationship repair tactics, identifying issues (display, range, competition), and re-engagement offers.",
  upsell: "Focus the briefing on UPSELL & EXPAND: new product categories they don't carry yet, display upgrade opportunities, co-marketing proposals, and ways to grow their Nomination business.",
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

    const { retailerId, accountType, visitPurpose } = await req.json();
    if (!retailerId) return new Response(JSON.stringify({ error: "retailerId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: retailer, error: fetchErr } = await supabase.from("retailers").select("*").eq("id", retailerId).single();
    if (fetchErr || !retailer) return new Response(JSON.stringify({ error: "Retailer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ai = retailer.ai_intelligence || {};
    const outreach = retailer.outreach || {};
    const activity = retailer.activity || {};
    const competitors = retailer.competitor_brands || [];
    const isCurrentAccount = accountType === "current_account";

    // Build system prompt based on account type
    let systemPrompt: string;
    if (retailer.pipeline_stage === 'retention_risk') {
      systemPrompt = "You are a sales coach for Nomination Italy (premium Italian charm jewellery). This retailer is flagged as RETENTION RISK — an existing stockist showing decline signals. Generate a pre-visit briefing focused on RECOVERY STRATEGY: relationship repair, range review, understanding why orders have dropped, win-back tactics, and re-engagement. Do NOT pitch as if this is a new account.";
    } else if (isCurrentAccount) {
      systemPrompt = `You are a sales coach for Nomination Italy (premium Italian charm jewellery). This is an EXISTING STOCKIST — they already carry Nomination. Generate a pre-visit briefing for an account management visit, NOT a new business pitch. Focus on: deepening the relationship, growing their order value, reviewing range performance, identifying expansion opportunities, and addressing any issues. Reference their billing history and relationship context.${visitPurpose && VISIT_PURPOSE_PROMPTS[visitPurpose] ? ` ${VISIT_PURPOSE_PROMPTS[visitPurpose]}` : ""}`;
    } else {
      systemPrompt = "You are a sales coach for Nomination Italy (premium Italian charm jewellery). This is a PROSPECT — they do NOT yet stock Nomination. Generate a concise, actionable pre-visit briefing that a sales rep can read in 60 seconds before walking into the store for the FIRST TIME. Focus on: making a great first impression, understanding their business, identifying the opportunity, and securing interest. Be specific, practical, and commercially focused.";
    }

    // Build billing context for current accounts
    let billingContext = "";
    if (isCurrentAccount) {
      const parts = [];
      if (retailer.billing_2024_full_year) parts.push(`2024 Full Year: £${Number(retailer.billing_2024_full_year).toLocaleString()}`);
      if (retailer.billing_2025_full_year) parts.push(`2025 Full Year: £${Number(retailer.billing_2025_full_year).toLocaleString()}`);
      if (retailer.billing_2026_ytd) parts.push(`2026 YTD: £${Number(retailer.billing_2026_ytd).toLocaleString()}`);
      if (parts.length) billingContext = `\nBilling History: ${parts.join(" | ")}`;
    }

    // Include visit agenda in tool schema for current accounts
    const toolParams: Record<string, unknown> = {
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
      openingLine: { type: "string", description: isCurrentAccount ? "A warm, familiar opening line acknowledging the existing relationship" : "A natural, warm opening line to start the visit conversation" },
      keyObjection: { type: "string", description: isCurrentAccount ? "The most likely pushback and how to handle it (e.g. 'sales are slow', 'too much stock')" : "The most likely objection and how to handle it" },
      productToLead: { type: "string", description: isCurrentAccount ? "Which new or underperforming Nomination range to focus on and why" : "Which Nomination product/range to lead with and why" },
    };

    const required = ["bullets", "openingLine", "keyObjection", "productToLead"];

    if (isCurrentAccount) {
      toolParams.visitAgenda = {
        type: "array",
        items: { type: "string" },
        description: "4-6 step visit agenda items in order (e.g. 'Check display and stock levels', 'Review bestsellers', 'Present new collection')",
      };
      required.push("visitAgenda");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "generate_briefing",
            description: "Generate a concise pre-visit briefing for a sales rep",
            parameters: {
              type: "object",
              properties: toolParams,
              required,
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_briefing" } },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate a pre-visit briefing for this ${isCurrentAccount ? 'existing account' : 'prospect'}:

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Positioning: ${retailer.store_positioning || "unknown"}
Independent: ${retailer.is_independent ? "Yes" : "No"}
Fit Score: ${retailer.fit_score}/100
Priority: ${retailer.priority_score}/100
Pipeline Stage: ${retailer.pipeline_stage}
${billingContext}
${(ai as any).summary ? `AI Summary: ${(ai as any).summary}` : ""}
${(ai as any).whyAttractive ? `Why Attractive: ${(ai as any).whyAttractive}` : ""}
${(ai as any).customerDemographic ? `Customer: ${(ai as any).customerDemographic}` : ""}
${(ai as any).risksOrConcerns ? `Risks: ${(ai as any).risksOrConcerns}` : ""}
${(outreach as any).bestOutreachAngle ? `Best Angle: ${(outreach as any).bestOutreachAngle}` : ""}
${(outreach as any).productAngle ? `Product Angle: ${(outreach as any).productAngle}` : ""}
${(activity as any).conversationNotes?.length ? `Previous Notes: ${(activity as any).conversationNotes.join("; ")}` : "No previous contact notes"}
${Array.isArray(competitors) && competitors.length ? `Competitor Brands: ${competitors.map((c: any) => c.name).join(", ")}` : ""}
${retailer.risk_flags?.length ? `Risk Flags: ${retailer.risk_flags.join(", ")}` : ""}
${visitPurpose ? `\nVisit Purpose: ${visitPurpose.replace(/_/g, ' ')}` : ""}`,
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
