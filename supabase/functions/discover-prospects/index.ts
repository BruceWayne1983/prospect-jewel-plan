import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOUTH_WEST_COUNTIES = [
  "Somerset",
  "Devon",
  "Cornwall",
  "Dorset",
  "Wiltshire",
  "Gloucestershire",
  "Avon",
];

const CATEGORIES = [
  "jeweller",
  "gift_shop",
  "fashion_boutique",
  "lifestyle_store",
  "premium_accessories",
  "concept_store",
];

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
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const { county, category, count } = await req.json().catch(() => ({}));

    const targetCounty =
      county ||
      SOUTH_WEST_COUNTIES[
        Math.floor(Math.random() * SOUTH_WEST_COUNTIES.length)
      ];
    const targetCategory =
      category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const targetCount = Math.min(count || 5, 10);

    // Use Lovable AI to generate realistic prospect data
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          tools: [
            {
              type: "function",
              function: {
                name: "generate_prospects",
                description: `Generate ${targetCount} realistic UK independent retail prospects for Nomination Italy (premium Italian charm jewellery) in ${targetCounty}.`,
                parameters: {
                  type: "object",
                  properties: {
                    prospects: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                            description: "Realistic shop name",
                          },
                          town: {
                            type: "string",
                            description: `Town in ${targetCounty}`,
                          },
                          category: {
                            type: "string",
                            enum: CATEGORIES,
                          },
                          rating: {
                            type: "number",
                            description: "Google rating 3.5-5.0",
                          },
                          review_count: {
                            type: "integer",
                            description: "Number of reviews 10-500",
                          },
                          estimated_store_quality: {
                            type: "integer",
                            description: "Quality score 40-95",
                          },
                          predicted_fit_score: {
                            type: "integer",
                            description:
                              "How well this retailer fits Nomination 50-95",
                          },
                          ai_reason: {
                            type: "string",
                            description:
                              "2-sentence explanation of why this is a good prospect for Nomination charm jewellery",
                          },
                          estimated_price_positioning: {
                            type: "string",
                            enum: ["premium", "mid_market", "budget"],
                          },
                        },
                        required: [
                          "name",
                          "town",
                          "category",
                          "rating",
                          "review_count",
                          "estimated_store_quality",
                          "predicted_fit_score",
                          "ai_reason",
                          "estimated_price_positioning",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["prospects"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_prospects" },
          },
          messages: [
            {
              role: "system",
              content:
                "You are a UK retail market analyst specialising in independent jewellers, gift shops, and boutiques in the South West of England. Generate realistic prospect data for Nomination Italy, a premium Italian charm jewellery brand looking for independent stockists.",
            },
            {
              role: "user",
              content: `Generate ${targetCount} realistic independent retail prospects in ${targetCounty} that would be good candidates for stocking Nomination charm jewellery. Focus on ${targetCategory.replace("_", " ")} stores. Use real town names from ${targetCounty}. Each prospect should have a unique, realistic shop name.`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded, please try again later.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits exhausted. Please add credits in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("AI gateway error:", status, body);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const generated = JSON.parse(toolCall.function.arguments);
    const prospects = generated.prospects || [];

    // Insert into database
    const toInsert = prospects.map(
      (p: {
        name: string;
        town: string;
        category: string;
        rating: number;
        review_count: number;
        estimated_store_quality: number;
        predicted_fit_score: number;
        ai_reason: string;
        estimated_price_positioning: string;
      }) => ({
        user_id: userId,
        name: p.name,
        town: p.town,
        county: targetCounty,
        category: p.category,
        rating: p.rating,
        review_count: p.review_count,
        estimated_store_quality: p.estimated_store_quality,
        predicted_fit_score: p.predicted_fit_score,
        ai_reason: p.ai_reason,
        estimated_price_positioning: p.estimated_price_positioning,
        discovery_source: "AI Scanner",
        status: "new",
      })
    );

    const { data: inserted, error: insertError } = await supabase
      .from("discovered_prospects")
      .insert(toInsert)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save prospects" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, prospects: inserted }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
