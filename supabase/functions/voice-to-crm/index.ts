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

    const { retailerId, transcript } = await req.json();
    if (!retailerId || !transcript) return new Response(JSON.stringify({ error: "retailerId and transcript required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: retailer, error: fetchErr } = await supabase.from("retailers").select("*").eq("id", retailerId).single();
    if (fetchErr || !retailer) return new Response(JSON.stringify({ error: "Retailer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        tools: [{
          type: "function",
          function: {
            name: "extract_visit_data",
            description: "Extract structured CRM data from a sales rep's spoken visit notes",
            parameters: {
              type: "object",
              properties: {
                outcome: { type: "string", enum: ["positive", "neutral", "negative", "follow_up_needed", "order_placed"], description: "Overall visit outcome" },
                summaryNote: { type: "string", description: "Clean, professional 2-3 sentence summary of the visit" },
                brandsDiscussed: { type: "array", items: { type: "string" }, description: "Any brands mentioned" },
                objectionsRaised: { type: "array", items: { type: "string" }, description: "Objections or concerns raised" },
                productsOfInterest: { type: "array", items: { type: "string" }, description: "Nomination products they showed interest in" },
                nextAction: { type: "string", description: "Recommended next action" },
                followUpDate: { type: "string", description: "Suggested follow-up date, e.g. '2026-04-01' or 'next week'" },
                contactName: { type: "string", description: "Name of person spoken to, if mentioned" },
                contactRole: { type: "string", description: "Role of person spoken to, if mentioned" },
                meetingScheduled: { type: "boolean", description: "Whether a follow-up meeting was agreed" },
                pipelineStageRecommendation: { type: "string", enum: ["contacted", "follow_up_needed", "meeting_booked", "under_review", "approved", "rejected"] },
              },
              required: ["outcome", "summaryNote", "brandsDiscussed", "objectionsRaised", "productsOfInterest", "nextAction", "followUpDate", "meetingScheduled", "pipelineStageRecommendation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_visit_data" } },
        messages: [
          {
            role: "system",
            content: "You are a CRM data extraction assistant for Nomination Italy sales reps. Extract structured data from casual, spoken visit notes. Clean up the language, identify key facts, and suggest appropriate CRM updates. Be practical and accurate.",
          },
          {
            role: "user",
            content: `Extract CRM data from this voice note transcript about a visit to ${retailer.name} (${retailer.category} in ${retailer.town}, ${retailer.county}):

"${transcript}"

Current pipeline stage: ${retailer.pipeline_stage}
Extract all relevant data and recommend the appropriate pipeline stage.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await aiResponse.text();
      return new Response(JSON.stringify({ error: "AI extraction failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return structured data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const extracted = JSON.parse(toolCall.function.arguments);

    // Update retailer activity and pipeline
    const existingActivity = (retailer.activity || {}) as Record<string, any>;
    const existingNotes = Array.isArray(existingActivity.conversationNotes) ? existingActivity.conversationNotes : [];
    const existingOutreach = (retailer.outreach || {}) as Record<string, any>;

    const updatedActivity = {
      ...existingActivity,
      lastContactDate: new Date().toISOString().split("T")[0],
      firstContactDate: existingActivity.firstContactDate || new Date().toISOString().split("T")[0],
      followUpNumber: (existingActivity.followUpNumber || 0) + 1,
      meetingScheduled: extracted.meetingScheduled,
      outcomeStatus: extracted.outcome,
      suggestedNextStep: extracted.nextAction,
      nextActionDate: extracted.followUpDate,
      conversationNotes: [...existingNotes, `[${new Date().toISOString().split("T")[0]}] ${extracted.summaryNote}`],
    };

    const updatedOutreach = {
      ...existingOutreach,
      ...(extracted.contactName ? { contactName: extracted.contactName } : {}),
      ...(extracted.contactRole ? { contactRole: extracted.contactRole } : {}),
    };

    const { error: updateErr } = await supabase
      .from("retailers")
      .update({
        activity: updatedActivity,
        outreach: updatedOutreach,
        pipeline_stage: extracted.pipelineStageRecommendation,
      })
      .eq("id", retailerId);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to update CRM" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, extracted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
