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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { retailerId } = await req.json();
    if (!retailerId) {
      return new Response(JSON.stringify({ error: "retailerId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the retailer
    const { data: retailer, error: fetchErr } = await supabase
      .from("retailers")
      .select("*")
      .eq("id", retailerId)
      .single();

    if (fetchErr || !retailer) {
      return new Response(JSON.stringify({ error: "Retailer not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
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
            name: "analyse_retailer",
            description: "Generate comprehensive AI intelligence for a retailer prospect for Nomination Italy charm jewellery.",
            parameters: {
              type: "object",
              properties: {
                ai_intelligence: {
                  type: "object",
                  properties: {
                    summary: { type: "string", description: "3-4 sentence strategic summary of this retailer as a Nomination stockist" },
                    whyAttractive: { type: "string", description: "Why this retailer is commercially attractive" },
                    whyGoodStockist: { type: "string", description: "Why they'd be a good Nomination stockist" },
                    risksOrConcerns: { type: "string", description: "Any risks or concerns" },
                    likelyBuyingMotivation: { type: "string", description: "What would motivate them to buy" },
                    storePositioningAnalysis: { type: "string", description: "Analysis of their market positioning" },
                    customerDemographic: { type: "string", description: "Their typical customer profile" },
                    townProfile: { type: "string", description: "Brief profile of the town/area" },
                    giftingPotentialAnalysis: { type: "string", description: "Analysis of gifting potential for charm jewellery" },
                    confidenceLevel: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["summary", "whyAttractive", "whyGoodStockist", "risksOrConcerns", "likelyBuyingMotivation", "storePositioningAnalysis", "customerDemographic", "townProfile", "giftingPotentialAnalysis", "confidenceLevel"],
                  additionalProperties: false,
                },
                performance_prediction: {
                  type: "object",
                  properties: {
                    predictedOpeningOrder: { type: "string", description: "e.g. £1,200–£2,500" },
                    predictedAnnualValue: { type: "string", description: "e.g. £8,000–£15,000" },
                    reorderPotential: { type: "string", enum: ["high", "medium", "low"] },
                    productMixSuitability: { type: "integer", description: "0-100 score" },
                    predictionConfidence: { type: "string", enum: ["high", "medium", "low"] },
                  },
                  required: ["predictedOpeningOrder", "predictedAnnualValue", "reorderPotential", "productMixSuitability", "predictionConfidence"],
                  additionalProperties: false,
                },
                outreach: {
                  type: "object",
                  properties: {
                    outreachPriority: { type: "string", enum: ["high", "medium", "low"] },
                    bestOutreachAngle: { type: "string", description: "Best approach angle for first contact" },
                    whyAttractive: { type: "string" },
                    productAngle: { type: "string", description: "Which Nomination products to lead with" },
                    suggestedFirstMessage: { type: "string", description: "A professional 3-4 sentence intro email" },
                    callPrepNotes: { type: "string", description: "Talking points for a phone call" },
                    visitPrepNotes: { type: "string", description: "What to look for during a store visit" },
                    objections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          concern: { type: "string" },
                          response: { type: "string" },
                        },
                        required: ["concern", "response"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["outreachPriority", "bestOutreachAngle", "productAngle", "suggestedFirstMessage", "callPrepNotes", "visitPrepNotes", "objections"],
                  additionalProperties: false,
                },
                qualification: {
                  type: "object",
                  properties: {
                    premiumEnvironment: { type: "boolean" },
                    strongMerchandising: { type: "boolean" },
                    wellPresentedFloor: { type: "boolean" },
                    femaleGiftingAudience: { type: "boolean" },
                    jewelleryBuyingCustomer: { type: "boolean" },
                    strongGiftingTrade: { type: "boolean" },
                    jewelleryPresent: { type: "boolean" },
                    complementaryBrands: { type: "boolean" },
                    pricePositionCompatible: { type: "boolean" },
                    touristPotential: { type: "boolean" },
                    strongRetailTown: { type: "boolean" },
                    highFootfall: { type: "boolean" },
                    aestheticMatch: { type: "boolean" },
                    suitableForDisplay: { type: "boolean" },
                    noConflictingPositioning: { type: "boolean" },
                  },
                  required: ["premiumEnvironment", "strongMerchandising", "wellPresentedFloor", "femaleGiftingAudience", "jewelleryBuyingCustomer", "strongGiftingTrade", "jewelleryPresent", "complementaryBrands", "pricePositionCompatible", "touristPotential", "strongRetailTown", "highFootfall", "aestheticMatch", "suitableForDisplay", "noConflictingPositioning"],
                  additionalProperties: false,
                },
                scores: {
                  type: "object",
                  properties: {
                    fit_score: { type: "integer", description: "Brand fit 0-100" },
                    priority_score: { type: "integer", description: "Overall priority 0-100" },
                    spend_potential_score: { type: "integer", description: "Spend potential 0-100" },
                    commercial_health_score: { type: "integer", description: "Commercial health 0-100" },
                  },
                  required: ["fit_score", "priority_score", "spend_potential_score", "commercial_health_score"],
                  additionalProperties: false,
                },
                risk_flags: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of risk flags, can be empty",
                },
              },
              required: ["ai_intelligence", "performance_prediction", "outreach", "qualification", "scores", "risk_flags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyse_retailer" } },
        messages: [
          {
            role: "system",
            content: `You are a senior UK retail sales strategist for Nomination Italy, a premium Italian charm jewellery brand. You analyse independent retailers to determine their suitability as Nomination stockists. You produce detailed intelligence reports, outreach strategies, performance predictions and qualification assessments. Be specific, commercially focused, and realistic. Base your analysis on the retailer data provided.`,
          },
          {
            role: "user",
            content: `Analyse this retailer as a potential Nomination Italy stockist and generate a comprehensive intelligence report:

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Store Positioning: ${retailer.store_positioning || 'unknown'}
Independent: ${retailer.is_independent ? 'Yes' : 'No'}
${retailer.ai_notes ? `AI Notes from discovery: ${retailer.ai_notes}` : ''}
${retailer.website ? `Website: ${retailer.website}` : ''}
${retailer.address ? `Address: ${retailer.address}` : ''}

Generate a thorough analysis covering intelligence summary, performance predictions, outreach strategy with a suggested first message, qualification assessment, scores, and any risk flags.`,
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
      const body = await aiResponse.text();
      console.error("AI gateway error:", status, body);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
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

    const analysis = JSON.parse(toolCall.function.arguments);

    // Add timestamp to intelligence
    analysis.ai_intelligence.lastAnalysed = new Date().toISOString().split('T')[0];

    // Update the retailer record
    const { error: updateErr } = await supabase
      .from("retailers")
      .update({
        ai_intelligence: analysis.ai_intelligence,
        performance_prediction: analysis.performance_prediction,
        outreach: { ...(retailer.outreach as Record<string, unknown> || {}), ...analysis.outreach },
        qualification: analysis.qualification,
        fit_score: analysis.scores.fit_score,
        priority_score: analysis.scores.priority_score,
        spend_potential_score: analysis.scores.spend_potential_score,
        commercial_health_score: analysis.scores.commercial_health_score,
        risk_flags: analysis.risk_flags,
        qualification_status: 'qualified',
      })
      .eq("id", retailerId);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
