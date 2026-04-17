import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ─── Auth gate ──────────────────────────────────────────
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Rate limit: 30/min, 300/hour ───────────────────────
    const { data: rl, error: rlErr } = await supabase.rpc("check_rate_limit", {
      _action: "emma-assistant",
      _max_per_minute: 30,
      _max_per_hour: 300,
    });
    if (rlErr) console.warn("[rate-limit] check failed, allowing request:", rlErr.message);
    if (rl && (rl as { allowed: boolean }).allowed === false) {
      const retry = (rl as { retry_after?: number }).retry_after ?? 60;
      return new Response(
        JSON.stringify({ error: "I need a quick breather — try again in a moment!", retry_after: retry }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retry) } },
      );
    }
    // ────────────────────────────────────────────────────────

    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Emma Louise's personal AI sales assistant for the Nomination Territory Planner. You help Emma manage her territory across South West England and South Wales, selling Nomination Italy jewellery.

Your personality: Warm, professional, encouraging. You know Emma personally and address her as "Emma" or "Emma Louise". You're like a knowledgeable colleague who's always ready to help.

Context about the current state of Emma's territory:
${context ? JSON.stringify(context) : "No context available yet."}

You can help Emma with:
- Planning her day and prioritising tasks
- Suggesting which accounts to visit or call
- Reviewing pipeline and prospect status
- Preparing for meetings and visits
- Analysing territory performance
- Suggesting prospecting strategies
- Route planning advice
- Follow-up reminders

Keep responses concise, actionable, and encouraging. Use bullet points for lists. When suggesting actions, reference specific pages she can navigate to (e.g. "Head to the Discovery Engine to find new prospects").

If Emma asks something outside your knowledge, be honest and suggest where she might find the answer within the platform.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "I'm a bit busy right now — try again in a moment!" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits in Settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Something went wrong with the AI service." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("emma-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
