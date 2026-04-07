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

    const { retailerId } = await req.json();
    if (!retailerId) {
      return new Response(JSON.stringify({ error: "retailerId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const isCurrentAccount = retailer.pipeline_stage === "approved" || retailer.pipeline_stage === "retention_risk";

    // Build billing context for current accounts
    let billingContext = "";
    if (isCurrentAccount) {
      const parts = [];
      if (retailer.billing_2024_full_year) parts.push(`2024 Full Year: £${Number(retailer.billing_2024_full_year).toLocaleString()}`);
      if (retailer.billing_2025_full_year) parts.push(`2025 Full Year: £${Number(retailer.billing_2025_full_year).toLocaleString()}`);
      if (retailer.billing_2026_ytd) parts.push(`2026 YTD: £${Number(retailer.billing_2026_ytd).toLocaleString()}`);
      if (parts.length) billingContext = `\nBilling History: ${parts.join(" | ")}`;

      // Add monthly breakdown if available
      const bh = retailer.billing_history as Record<string, unknown> | null;
      if (bh?.monthly && Array.isArray(bh.monthly)) {
        const monthlyStr = (bh.monthly as Array<{month: string; amount: number}>)
          .slice(-6)
          .map(m => `${m.month}: £${m.amount.toLocaleString()}`)
          .join(", ");
        billingContext += `\nRecent Monthly: ${monthlyStr}`;
      }
      if (bh?.ytd_change_pct !== undefined) {
        billingContext += `\nYTD Change vs Prior Year: ${bh.ytd_change_pct}%`;
      }
    }

    // Calculate territory baselines from all approved accounts
    let territoryBaseline = "";
    try {
      const { data: allAccounts } = await supabase
        .from("retailers")
        .select("category, county, town, billing_2025_full_year, billing_2024_full_year, billing_2026_ytd")
        .eq("user_id", (await supabase.auth.getUser()).data.user!.id)
        .in("pipeline_stage", ["approved", "retention_risk"]);

      if (allAccounts && allAccounts.length > 0) {
        // Average by category
        const catAvgs: Record<string, { total: number; count: number }> = {};
        const countyAvgs: Record<string, { total: number; count: number }> = {};

        for (const a of allAccounts) {
          const annualVal = Number(a.billing_2025_full_year || a.billing_2024_full_year || 0);
          if (annualVal > 0) {
            const cat = a.category || "jeweller";
            if (!catAvgs[cat]) catAvgs[cat] = { total: 0, count: 0 };
            catAvgs[cat].total += annualVal;
            catAvgs[cat].count++;

            const county = a.county || "Unknown";
            if (!countyAvgs[county]) countyAvgs[county] = { total: 0, count: 0 };
            countyAvgs[county].total += annualVal;
            countyAvgs[county].count++;
          }
        }

        const catLines = Object.entries(catAvgs).map(([cat, v]) =>
          `${cat.replace(/_/g, " ")}: £${Math.round(v.total / v.count).toLocaleString()} avg annual (${v.count} accounts)`
        ).join("; ");

        const countyLines = Object.entries(countyAvgs).map(([county, v]) =>
          `${county}: £${Math.round(v.total / v.count).toLocaleString()} avg (${v.count} accounts)`
        ).join("; ");

        // Median opening year
        const allAnnuals = allAccounts
          .map(a => Number(a.billing_2024_full_year || 0))
          .filter(v => v > 0)
          .sort((a, b) => a - b);
        const medianOpening = allAnnuals.length > 0
          ? allAnnuals[Math.floor(allAnnuals.length / 2)]
          : 0;

        territoryBaseline = `\n\nTERRITORY PERFORMANCE BASELINES (from actual billing data):
Category averages: ${catLines}
County averages: ${countyLines}
Median first-year performance: £${medianOpening.toLocaleString()}
Total active accounts with billing data: ${allAccounts.filter(a => Number(a.billing_2025_full_year || a.billing_2024_full_year || 0) > 0).length}

Use these baselines to calibrate your revenue predictions. Do NOT guess — anchor predictions to actual territory performance data.`;
      }
    } catch (e) {
      console.error("Failed to calculate territory baseline:", e);
    }

    const systemPrompt = isCurrentAccount
      ? `You are a senior UK retail sales strategist for Nomination Italy, a premium Italian charm jewellery brand. You are analysing an EXISTING STOCKIST — they already carry and sell Nomination products. Your analysis should focus on: account health, growth opportunities, relationship strength, reorder patterns, risk of churn, competitive threats, and strategies to deepen the partnership. Do NOT treat them as a prospect. Be specific about what's working, what could improve, and actionable next steps for the account manager.${territoryBaseline}`
      : `You are a senior UK retail sales strategist for Nomination Italy, a premium Italian charm jewellery brand. You analyse independent retailers to determine their suitability as Nomination stockists. You produce detailed intelligence reports, outreach strategies, performance predictions and qualification assessments. Be specific, commercially focused, and realistic. Base your analysis on the retailer data provided.${territoryBaseline}`;

    const userPrompt = isCurrentAccount
      ? `Analyse this EXISTING Nomination stockist and generate a comprehensive account intelligence report. Focus on account health, growth potential, and relationship management rather than prospecting. IMPORTANT: Also try to find or infer any missing contact details.

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Store Positioning: ${retailer.store_positioning || 'unknown'}
Independent: ${retailer.is_independent ? 'Yes' : 'No'}
Pipeline Stage: ${retailer.pipeline_stage}
${billingContext}
${retailer.phone ? `Phone: ${retailer.phone}` : 'Phone: NOT YET KNOWN — please try to find or infer'}
${retailer.email ? `Email: ${retailer.email}` : 'Email: NOT YET KNOWN — please try to infer from website domain'}
${retailer.ai_notes ? `AI Notes: ${retailer.ai_notes}` : ''}
${retailer.website ? `Website: ${retailer.website}` : 'Website: NOT YET KNOWN'}
${retailer.address ? `Address: ${retailer.address}` : 'Address: NOT YET KNOWN — please try to infer'}
${retailer.postcode ? `Postcode: ${retailer.postcode}` : ''}
${retailer.instagram ? `Instagram: ${retailer.instagram}` : ''}
${retailer.risk_flags?.length ? `Current Risk Flags: ${retailer.risk_flags.join(", ")}` : ''}

Generate a thorough analysis covering: strategic summary (as an existing account), account health assessment, growth predictions, account management strategy with contact details, qualification of their continued suitability, updated scores, and any risk flags.`
      : `Analyse this retailer as a potential Nomination Italy stockist and generate a comprehensive intelligence report. IMPORTANT: Also try to find or infer their contact details (phone, email, address, postcode, Instagram) based on the business name, town, website domain, and retail category.

Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Store Positioning: ${retailer.store_positioning || 'unknown'}
Independent: ${retailer.is_independent ? 'Yes' : 'No'}
${retailer.phone ? `Phone: ${retailer.phone}` : 'Phone: NOT YET KNOWN — please try to find or infer'}
${retailer.email ? `Email: ${retailer.email}` : 'Email: NOT YET KNOWN — please try to infer from website domain'}
${retailer.ai_notes ? `AI Notes from discovery: ${retailer.ai_notes}` : ''}
${retailer.website ? `Website: ${retailer.website}` : 'Website: NOT YET KNOWN'}
${retailer.address ? `Address: ${retailer.address}` : 'Address: NOT YET KNOWN — please try to infer'}
${retailer.postcode ? `Postcode: ${retailer.postcode}` : ''}
${retailer.instagram ? `Instagram: ${retailer.instagram}` : ''}

Generate a thorough analysis covering intelligence summary, performance predictions, outreach strategy with contact details, qualification assessment, scores, and any risk flags. For contact_enrichment, try to provide plausible contact details even if you need to infer them.`;

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
            description: isCurrentAccount
              ? "Generate comprehensive AI intelligence for an existing Nomination stockist."
              : "Generate comprehensive AI intelligence for a retailer prospect for Nomination Italy charm jewellery.",
            parameters: {
              type: "object",
              properties: {
                ai_intelligence: {
                  type: "object",
                  properties: {
                    summary: { type: "string", description: isCurrentAccount ? "3-4 sentence strategic summary of this account's health and potential" : "3-4 sentence strategic summary of this retailer as a Nomination stockist" },
                    whyAttractive: { type: "string", description: isCurrentAccount ? "Why this account is commercially valuable to retain and grow" : "Why this retailer is commercially attractive" },
                    whyGoodStockist: { type: "string", description: isCurrentAccount ? "What makes them a strong Nomination partner" : "Why they'd be a good Nomination stockist" },
                    risksOrConcerns: { type: "string", description: isCurrentAccount ? "Account risks — churn signals, competitive threats, declining orders" : "Any risks or concerns" },
                    likelyBuyingMotivation: { type: "string", description: isCurrentAccount ? "What drives their reorders and how to increase order frequency" : "What would motivate them to buy" },
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
                    predictedOpeningOrder: { type: "string", description: isCurrentAccount ? "Predicted next order value" : "e.g. £1,200–£2,500" },
                    predictedAnnualValue: { type: "string", description: isCurrentAccount ? "Predicted annual value based on trajectory" : "e.g. £8,000–£15,000" },
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
                    bestOutreachAngle: { type: "string", description: isCurrentAccount ? "Best approach for the next account management touchpoint" : "Best approach angle for first contact" },
                    whyAttractive: { type: "string" },
                    productAngle: { type: "string", description: isCurrentAccount ? "Which Nomination products to push next" : "Which Nomination products to lead with" },
                    suggestedFirstMessage: { type: "string", description: isCurrentAccount ? "A professional 3-4 sentence check-in email" : "A professional 3-4 sentence intro email" },
                    callPrepNotes: { type: "string", description: "Talking points for a phone call" },
                    visitPrepNotes: { type: "string", description: isCurrentAccount ? "What to review during an account visit" : "What to look for during a store visit" },
                    contactName: { type: "string", description: "Owner or manager name ONLY if you found it in verifiable web content (e.g. Companies House, their website 'About' page, LinkedIn). Return empty string if not verified — do NOT guess." },
                    contactRole: { type: "string", description: "Role ONLY if verified from web content. Return empty string if not verified." },
                    contactEmail: { type: "string", description: "Email ONLY if found on their website or verified source. Return empty string — do NOT fabricate." },
                    contactPhone: { type: "string", description: "Phone ONLY if found on their website. Return empty string — do NOT fabricate." },
                    bestContactMethod: { type: "string", enum: ["email", "phone", "visit", "instagram"] },
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
                  required: ["outreachPriority", "bestOutreachAngle", "productAngle", "suggestedFirstMessage", "callPrepNotes", "visitPrepNotes", "bestContactMethod", "objections"],
                  additionalProperties: false,
                },
                contact_enrichment: {
                  type: "object",
                  description: "Attempt to find or infer contact details",
                  properties: {
                    phone: { type: "string" },
                    email: { type: "string" },
                    address: { type: "string" },
                    postcode: { type: "string" },
                    instagram: { type: "string" },
                  },
                  required: ["phone", "email", "address", "postcode", "instagram"],
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
              required: ["ai_intelligence", "performance_prediction", "outreach", "contact_enrichment", "qualification", "scores", "risk_flags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyse_retailer" } },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
    analysis.ai_intelligence.lastAnalysed = new Date().toISOString().split('T')[0];

    const contactUpdates: Record<string, string> = {};
    const ce = analysis.contact_enrichment || {};
    if (!retailer.phone && ce.phone) contactUpdates.phone = ce.phone;
    if (!retailer.email && ce.email) contactUpdates.email = ce.email;
    if (!retailer.address && ce.address) contactUpdates.address = ce.address;
    if (!retailer.postcode && ce.postcode) contactUpdates.postcode = ce.postcode;
    if (!retailer.instagram && ce.instagram) contactUpdates.instagram = ce.instagram;

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
        ...contactUpdates,
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
