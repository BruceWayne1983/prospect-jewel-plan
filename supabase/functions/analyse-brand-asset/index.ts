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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { assetId, fileName, category, fileType } = await req.json();

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
            name: "extract_brand_intelligence",
            description: "Extract actionable intelligence from a Nomination Italy brand asset file for use in sales prospecting engines.",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "2-4 sentence summary of what this asset contains and its relevance to the sales team" },
                asset_type: { type: "string", enum: ["catalogue", "lookbook", "price_list", "brand_guidelines", "product_sheet", "marketing_material", "imagery", "presentation", "other"], description: "Classified type of the asset" },
                key_products: {
                  type: "array",
                  items: { type: "object", properties: { name: { type: "string" }, collection: { type: "string" }, price_range: { type: "string" } }, required: ["name"] },
                  description: "Key products or collections mentioned"
                },
                brand_values: { type: "array", items: { type: "string" }, description: "Brand values, positioning themes, or messaging pillars extracted" },
                target_audience: { type: "string", description: "Target audience or customer demographic described" },
                selling_points: { type: "array", items: { type: "string" }, description: "Key selling points or USPs for retailer pitch conversations" },
                price_positioning: { type: "string", description: "Price positioning insight (e.g. 'Accessible luxury, £25-£150 RRP')" },
                seasonal_relevance: { type: "string", description: "Any seasonal or campaign relevance (e.g. 'SS25 collection', 'Christmas gifting')" },
                retailer_pitch_notes: { type: "string", description: "Notes that would help a sales rep pitch this to independent retailers" },
                tags: { type: "array", items: { type: "string" }, description: "3-8 searchable tags for this asset" },
              },
              required: ["summary", "asset_type", "key_products", "brand_values", "selling_points", "tags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_brand_intelligence" } },
        messages: [
          {
            role: "system",
            content: `You are a brand intelligence analyst for Nomination Italy, an Italian jewellery brand known for composable charm bracelets and sterling silver jewellery. Analyse the uploaded brand asset and extract structured intelligence that will be used by the AI sales prospecting and pitching engines. Focus on information useful for selling to UK independent retailers.`,
          },
          {
            role: "user",
            content: `Analyse this brand asset:\n- File: "${fileName}"\n- Category: ${category}\n- File type: ${fileType}\n\nExtract all relevant brand intelligence, product information, selling points, and pitch-relevant data. This will feed into AI engines that generate retailer briefings, pitch personalisation, and follow-up drafts.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const result = JSON.parse(toolCall.function.arguments);

    // Update the brand asset record
    await supabase.from("brand_assets").update({
      ai_summary: result.summary,
      ai_extracted_data: result,
      tags: result.tags || [],
    }).eq("id", assetId);

    return new Response(JSON.stringify({ success: true, analysis: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
