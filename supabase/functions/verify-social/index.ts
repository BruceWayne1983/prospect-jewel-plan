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
            name: "find_social_and_online_data",
            description: "Find and verify social media accounts, follower counts, website traffic estimates, store imagery URLs, and Google review insights for a UK independent retailer.",
            parameters: {
              type: "object",
              properties: {
                instagram: { type: "string", description: "Instagram handle (e.g. @shopname) or empty string if not found" },
                facebook: { type: "string", description: "Facebook page URL or page name, or empty string" },
                tiktok: { type: "string", description: "TikTok handle (e.g. @shopname) or empty string" },
                twitter: { type: "string", description: "Twitter/X handle (e.g. @shopname) or empty string" },
                linkedin: { type: "string", description: "LinkedIn company page URL or empty string" },
                follower_counts: {
                  type: "object",
                  description: "Estimated follower/like counts for each platform",
                  properties: {
                    instagram: { type: "number", description: "Estimated Instagram followers, 0 if unknown" },
                    facebook: { type: "number", description: "Estimated Facebook page likes, 0 if unknown" },
                    tiktok: { type: "number", description: "Estimated TikTok followers, 0 if unknown" },
                    twitter: { type: "number", description: "Estimated Twitter/X followers, 0 if unknown" },
                    linkedin: { type: "number", description: "Estimated LinkedIn followers, 0 if unknown" },
                  },
                  required: ["instagram", "facebook", "tiktok", "twitter", "linkedin"],
                  additionalProperties: false,
                },
                estimated_monthly_traffic: { type: "number", description: "Estimated monthly website visitors (rough estimate based on domain authority and type). 0 if no website or unknown." },
                store_images: {
                  type: "array",
                  items: { type: "string" },
                  description: "Up to 6 publicly available image URLs of the store (exterior, interior, products) from Google Maps, social media, or their website. Empty array if none found.",
                },
                google_review_summary: { type: "string", description: "2-3 sentence summary of what Google/online reviewers say about this shop. Empty string if no reviews found." },
                google_review_highlights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      text: { type: "string", description: "Short excerpt or paraphrased highlight from a review" },
                      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                    },
                    required: ["text", "sentiment"],
                    additionalProperties: false,
                  },
                  description: "Up to 5 key review highlights/themes",
                },
                confidence: { type: "string", enum: ["high", "medium", "low"], description: "How confident you are in the overall findings" },
                notes: { type: "string", description: "Brief explanation of verification reasoning" },
              },
              required: ["instagram", "facebook", "tiktok", "twitter", "linkedin", "follower_counts", "estimated_monthly_traffic", "store_images", "google_review_summary", "google_review_highlights", "confidence", "notes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "find_social_and_online_data" } },
        messages: [
          {
            role: "system",
            content: `You are a UK retail intelligence researcher. Given a shop name, location, and optional website, find their social media accounts with follower estimates, estimate website traffic, find store images (interior/exterior/product photos from Google Maps, social media, or their website), and summarise their online reviews.

For follower counts: Estimate based on typical UK independent retailer sizes in that area. Small shops typically have 500-5000 Instagram followers. Be realistic.
For website traffic: Estimate monthly unique visitors. Small indie retailers typically get 500-5000/month. 0 if no website.
For store images: Find real publicly accessible image URLs from Google Maps photos, their Instagram posts, or their website. Prioritise exterior shots, interior/display shots, and product shots. Only include URLs you believe are real and accessible.
For reviews: Summarise the general sentiment from Google Business reviews. Note recurring themes (service quality, product range, atmosphere, etc).`,
          },
          {
            role: "user",
            content: `Research this UK retail shop: "${name}" in ${town}, ${county}, UK.${website ? ` Website: ${website}` : ''}\n\nFind:\n1. Social media accounts (Instagram, Facebook, TikTok, Twitter/X, LinkedIn)\n2. Estimated follower counts for each platform\n3. Estimated monthly website traffic\n4. Up to 6 store images (exterior, interior, products) - use real public URLs\n5. Google/online review summary and key highlights\n\nBe realistic and accurate. Many small UK shops only have Instagram and Facebook.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds at Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI verification failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const result = JSON.parse(toolCall.function.arguments);

    // Update the record with found data
    const updates: Record<string, any> = { social_verified: true };
    if (result.instagram) updates.instagram = result.instagram;
    if (result.facebook) updates.facebook = result.facebook;
    if (result.tiktok) updates.tiktok = result.tiktok;
    if (result.twitter) updates.twitter = result.twitter;
    if (result.linkedin) updates.linkedin = result.linkedin;
    if (result.follower_counts) updates.follower_counts = result.follower_counts;
    if (result.estimated_monthly_traffic) updates.estimated_monthly_traffic = result.estimated_monthly_traffic;
    if (result.store_images?.length) updates.store_images = result.store_images;
    if (result.google_review_summary) updates.google_review_summary = result.google_review_summary;
    if (result.google_review_highlights?.length) updates.google_review_highlights = result.google_review_highlights;

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
