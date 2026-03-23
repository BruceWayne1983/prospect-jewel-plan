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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { retailerId, prospectId, name, town, county, website } = await req.json();

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [{
          type: "function",
          function: {
            name: "find_social_accounts",
            description: "Find and verify social media accounts for a UK independent retailer.",
            parameters: {
              type: "object",
              properties: {
                instagram: { type: "string", description: "Instagram handle (e.g. @shopname) or empty string if not found" },
                facebook: { type: "string", description: "Facebook page URL or page name, or empty string" },
                tiktok: { type: "string", description: "TikTok handle (e.g. @shopname) or empty string" },
                twitter: { type: "string", description: "Twitter/X handle (e.g. @shopname) or empty string" },
                linkedin: { type: "string", description: "LinkedIn company page URL or empty string" },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "How confident you are these are the correct accounts" },
                notes: { type: "string", description: "Brief explanation of verification reasoning" },
              },
              required: ["instagram", "facebook", "tiktok", "twitter", "linkedin", "confidence", "notes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "find_social_accounts" } },
        messages: [
          {
            role: "system",
            content: "You are a UK retail social media researcher. Given a shop name, location, and optional website, determine their most likely social media accounts. Use naming conventions common for UK independent retailers. Only suggest accounts you believe genuinely exist. If unsure, leave the field empty. Instagram is the most common platform for UK independent jewellers and gift shops.",
          },
          {
            role: "user",
            content: `Find social media accounts for: "${name}" in ${town}, ${county}, UK.${website ? ` Their website is: ${website}` : ''} This is a retail shop (likely a jeweller, gift shop, or boutique). Find their Instagram, Facebook, TikTok, Twitter/X, and LinkedIn accounts. Be realistic - many small UK shops only have Instagram and Facebook.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error("AI verification failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const result = JSON.parse(toolCall.function.arguments);

    // Update the record with found social accounts
    const updates: Record<string, any> = { social_verified: true };
    if (result.instagram) updates.instagram = result.instagram;
    if (result.facebook) updates.facebook = result.facebook;
    if (result.tiktok) updates.tiktok = result.tiktok;
    if (result.twitter) updates.twitter = result.twitter;
    if (result.linkedin) updates.linkedin = result.linkedin;

    const table = retailerId ? "retailers" : "discovered_prospects";
    const id = retailerId || prospectId;

    if (id) {
      await supabase.from(table).update(updates).eq("id", id);
    }

    return new Response(JSON.stringify({
      success: true,
      social: result,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
