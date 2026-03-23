import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Companies House API is free and public - just needs an API key
const CH_BASE = "https://api.company-information.service.gov.uk";

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

    const { retailerId, companyName } = await req.json();
    if (!retailerId) return new Response(JSON.stringify({ error: "retailerId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: retailer, error: fetchErr } = await supabase.from("retailers").select("*").eq("id", retailerId).single();
    if (fetchErr || !retailer) return new Response(JSON.stringify({ error: "Retailer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const CH_API_KEY = Deno.env.get("COMPANIES_HOUSE_API_KEY");
    if (!CH_API_KEY) {
      // Fallback: use AI to generate a simulated assessment based on available data
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "No API keys configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          tools: [{
            type: "function",
            function: {
              name: "assess_business",
              description: "Provide a business health assessment based on available retailer data",
              parameters: {
                type: "object",
                properties: {
                  companyStatus: { type: "string", description: "Likely company status" },
                  businessHealthScore: { type: "integer", description: "0-100 health score" },
                  riskLevel: { type: "string", enum: ["low", "medium", "high"] },
                  riskFactors: { type: "array", items: { type: "string" }, description: "Identified risk factors" },
                  positiveIndicators: { type: "array", items: { type: "string" }, description: "Positive business indicators" },
                  estimatedYearsTrading: { type: "string", description: "Estimated time in business" },
                  recommendation: { type: "string", description: "Overall recommendation for sales approach" },
                  note: { type: "string", description: "Note that this is AI-estimated, not from Companies House" },
                },
                required: ["companyStatus", "businessHealthScore", "riskLevel", "riskFactors", "positiveIndicators", "estimatedYearsTrading", "recommendation", "note"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "assess_business" } },
          messages: [
            { role: "system", content: "You are a UK business analyst. Assess the health and risk of a retail business based on available data. Be realistic and flag genuine risks." },
            {
              role: "user",
              content: `Assess this retailer's business health:
Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Independent: ${retailer.is_independent ? "Yes" : "No"}
Positioning: ${retailer.store_positioning || "unknown"}
${retailer.website ? `Website: ${retailer.website}` : "No website"}
Commercial Health Score: ${retailer.commercial_health_score}/100

Note: Companies House API key is not configured, so provide an AI-estimated assessment.`,
            },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        await aiResponse.text();
        return new Response(JSON.stringify({ error: "Assessment failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) return new Response(JSON.stringify({ error: "AI did not return data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const assessment = JSON.parse(toolCall.function.arguments);
      assessment.source = "ai_estimated";
      return new Response(JSON.stringify({ success: true, assessment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Real Companies House lookup
    const searchName = companyName || retailer.name;
    const authString = btoa(`${CH_API_KEY}:`);

    const searchRes = await fetch(`${CH_BASE}/search/companies?q=${encodeURIComponent(searchName)}&items_per_page=3`, {
      headers: { Authorization: `Basic ${authString}` },
    });

    if (!searchRes.ok) {
      const body = await searchRes.text();
      console.error("CH search error:", searchRes.status, body);
      return new Response(JSON.stringify({ error: "Companies House search failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const searchData = await searchRes.json();
    const companies = searchData.items || [];

    if (companies.length === 0) {
      return new Response(JSON.stringify({ success: true, assessment: { source: "companies_house", companyStatus: "not_found", note: "No matching company found on Companies House. This may be a sole trader or unregistered business.", riskLevel: "medium", riskFactors: ["Not registered at Companies House"], positiveIndicators: [], businessHealthScore: 50 } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const company = companies[0];
    const companyNumber = company.company_number;

    // Fetch officers
    let officers: any[] = [];
    try {
      const officersRes = await fetch(`${CH_BASE}/company/${companyNumber}/officers`, {
        headers: { Authorization: `Basic ${authString}` },
      });
      if (officersRes.ok) {
        const officersData = await officersRes.json();
        officers = officersData.items || [];
      }
    } catch (e) { console.error("Officers fetch error:", e); }

    // Fetch filing history
    let filings: any[] = [];
    try {
      const filingsRes = await fetch(`${CH_BASE}/company/${companyNumber}/filing-history?items_per_page=5`, {
        headers: { Authorization: `Basic ${authString}` },
      });
      if (filingsRes.ok) {
        const filingsData = await filingsRes.json();
        filings = filingsData.items || [];
      }
    } catch (e) { console.error("Filings fetch error:", e); }

    // Build assessment
    const riskFactors: string[] = [];
    const positiveIndicators: string[] = [];

    if (company.company_status !== "active") riskFactors.push(`Company status: ${company.company_status}`);
    else positiveIndicators.push("Company is active");

    if (company.date_of_creation) {
      const years = Math.floor((Date.now() - new Date(company.date_of_creation).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (years >= 5) positiveIndicators.push(`Established ${years} years`);
      else if (years < 2) riskFactors.push(`Relatively new company (${years} years)`);
    }

    // Check directors for retirement risk
    officers.filter((o: any) => o.officer_role === "director" && !o.resigned_on).forEach((d: any) => {
      if (d.date_of_birth) {
        const age = new Date().getFullYear() - d.date_of_birth.year;
        if (age >= 60) riskFactors.push(`Director ${d.name} is approximately ${age} years old (retirement risk)`);
      }
    });

    const activeDirectors = officers.filter((o: any) => o.officer_role === "director" && !o.resigned_on);
    if (activeDirectors.length === 1) riskFactors.push("Single director (key person risk)");

    if (filings.length > 0) {
      const latestFiling = filings[0];
      const filingDate = new Date(latestFiling.date);
      const monthsAgo = Math.floor((Date.now() - filingDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      if (monthsAgo > 15) riskFactors.push(`Last filing was ${monthsAgo} months ago`);
      else positiveIndicators.push("Recent filing activity");
    }

    const healthScore = Math.max(0, Math.min(100, 70 + positiveIndicators.length * 8 - riskFactors.length * 12));
    const riskLevel = riskFactors.length >= 3 ? "high" : riskFactors.length >= 1 ? "medium" : "low";

    const assessment = {
      source: "companies_house",
      companyName: company.title,
      companyNumber,
      companyStatus: company.company_status,
      dateOfCreation: company.date_of_creation,
      registeredAddress: company.address_snippet,
      directors: activeDirectors.map((d: any) => ({
        name: d.name,
        role: d.officer_role,
        appointedOn: d.appointed_on,
        ...(d.date_of_birth ? { approximateAge: new Date().getFullYear() - d.date_of_birth.year } : {}),
      })),
      recentFilings: filings.slice(0, 3).map((f: any) => ({
        description: f.description,
        date: f.date,
        type: f.type,
      })),
      businessHealthScore: healthScore,
      riskLevel,
      riskFactors,
      positiveIndicators,
    };

    return new Response(JSON.stringify({ success: true, assessment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
