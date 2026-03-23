import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CH_BASE = "https://api.company-information.service.gov.uk";

const creditAssessmentTool = {
  type: "function" as const,
  function: {
    name: "assess_business_with_credit",
    description: "Provide a business health and credit assessment based on available data",
    parameters: {
      type: "object",
      properties: {
        companyStatus: { type: "string", description: "Likely company status" },
        businessHealthScore: { type: "integer", description: "0-100 health score" },
        riskLevel: { type: "string", enum: ["low", "medium", "high"] },
        riskFactors: { type: "array", items: { type: "string" } },
        positiveIndicators: { type: "array", items: { type: "string" } },
        estimatedYearsTrading: { type: "string" },
        recommendation: { type: "string" },
        note: { type: "string" },
        creditProfile: {
          type: "object",
          properties: {
            creditScore: { type: "integer", description: "Estimated credit score 0-100" },
            creditRating: { type: "string", enum: ["excellent", "good", "fair", "poor", "very_poor"], description: "Overall credit rating" },
            paymentRiskLevel: { type: "string", enum: ["very_low", "low", "moderate", "high", "very_high"] },
            estimatedTurnover: { type: "string", description: "Estimated annual turnover range e.g. £100k-£250k" },
            estimatedEmployees: { type: "string", description: "Estimated number of employees e.g. 2-5" },
            ccjsOrDefaults: { type: "string", description: "Likelihood of CCJs or defaults: none_likely, possible, likely" },
            lateFilingHistory: { type: "string", description: "Late filing pattern: none, occasional, frequent" },
            creditLimit: { type: "string", description: "Suggested maximum credit limit e.g. £500-£1,000" },
            creditFactors: { type: "array", items: { type: "string" }, description: "Key factors affecting credit assessment" },
            tradePaymentTrend: { type: "string", enum: ["improving", "stable", "declining", "unknown"] },
          },
          required: ["creditScore", "creditRating", "paymentRiskLevel", "estimatedTurnover", "estimatedEmployees", "ccjsOrDefaults", "lateFilingHistory", "creditLimit", "creditFactors", "tradePaymentTrend"],
        },
      },
      required: ["companyStatus", "businessHealthScore", "riskLevel", "riskFactors", "positiveIndicators", "estimatedYearsTrading", "recommendation", "note", "creditProfile"],
      additionalProperties: false,
    },
  },
};

async function buildAIAssessment(retailer: any, companyData?: any) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("No API keys configured");

  const companyContext = companyData
    ? `Companies House Data:
Company: ${companyData.title} (#${companyData.company_number})
Status: ${companyData.company_status}
Founded: ${companyData.date_of_creation || "unknown"}
Address: ${companyData.address_snippet || "unknown"}
Active Directors: ${companyData.activeDirectorCount ?? "unknown"}
Single Director: ${companyData.singleDirector ? "Yes" : "No"}
Latest Filing: ${companyData.latestFilingDate || "unknown"}
Filing Age (months): ${companyData.filingAgeMonths ?? "unknown"}`
    : `No Companies House data available. This may be a sole trader or unregistered business.`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      tools: [creditAssessmentTool],
      tool_choice: { type: "function", function: { name: "assess_business_with_credit" } },
      messages: [
        {
          role: "system",
          content: `You are a UK business credit analyst. Assess the business health AND credit worthiness of a retail business. 
Be realistic about credit risks. Consider:
- Company age and stability for credit scoring
- Filing compliance as indicator of financial discipline
- Single director = key person risk for credit
- Rating/reviews as proxy for business health
- Independent retailers typically have lower turnover ranges
- Suggest conservative credit limits for new wholesale relationships
- Consider the store positioning (premium vs budget) for turnover estimates
${companyData ? "Use the real Companies House data for accurate assessment." : "Provide AI-estimated assessment based on available signals."}`,
        },
        {
          role: "user",
          content: `Assess this retailer's business health AND credit worthiness:
Name: ${retailer.name}
Town: ${retailer.town}, ${retailer.county}
Category: ${retailer.category}
Rating: ${retailer.rating}/5 (${retailer.review_count} reviews)
Independent: ${retailer.is_independent ? "Yes" : "No"}
Positioning: ${retailer.store_positioning || "unknown"}
${retailer.website ? `Website: ${retailer.website}` : "No website"}
Commercial Health Score: ${retailer.commercial_health_score}/100

${companyContext}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    if (status === 429) throw { status: 429, message: "Rate limit exceeded" };
    if (status === 402) throw { status: 402, message: "AI credits exhausted" };
    throw { status: 500, message: "Assessment failed" };
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw { status: 500, message: "AI did not return data" };

  return JSON.parse(toolCall.function.arguments);
}

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
      // AI-only assessment with credit profile
      try {
        const assessment = await buildAIAssessment(retailer);
        assessment.source = "ai_estimated";
        return new Response(JSON.stringify({ success: true, assessment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || "Assessment failed" }), { status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Real Companies House lookup
    const searchName = companyName || retailer.name;
    const authString = btoa(`${CH_API_KEY}:`);

    const searchRes = await fetch(`${CH_BASE}/search/companies?q=${encodeURIComponent(searchName)}&items_per_page=3`, {
      headers: { Authorization: `Basic ${authString}` },
    });

    if (!searchRes.ok) {
      console.error("CH search error:", searchRes.status, await searchRes.text());
      return new Response(JSON.stringify({ error: "Companies House search failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const searchData = await searchRes.json();
    const companies = searchData.items || [];

    if (companies.length === 0) {
      // No CH match - do AI-only with credit
      try {
        const assessment = await buildAIAssessment(retailer);
        assessment.source = "ai_estimated";
        assessment.note = "No matching company found on Companies House. This may be a sole trader or unregistered business. " + (assessment.note || "");
        return new Response(JSON.stringify({ success: true, assessment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const company = companies[0];
    const companyNumber = company.company_number;

    // Fetch officers & filings in parallel
    const [officersRes, filingsRes] = await Promise.all([
      fetch(`${CH_BASE}/company/${companyNumber}/officers`, { headers: { Authorization: `Basic ${authString}` } }).catch(() => null),
      fetch(`${CH_BASE}/company/${companyNumber}/filing-history?items_per_page=5`, { headers: { Authorization: `Basic ${authString}` } }).catch(() => null),
    ]);

    const officers = officersRes?.ok ? (await officersRes.json()).items || [] : [];
    const filings = filingsRes?.ok ? (await filingsRes.json()).items || [] : [];

    const activeDirectors = officers.filter((o: any) => o.officer_role === "director" && !o.resigned_on);
    const latestFilingDate = filings.length > 0 ? filings[0].date : null;
    const filingAgeMonths = latestFilingDate ? Math.floor((Date.now() - new Date(latestFilingDate).getTime()) / (30 * 24 * 60 * 60 * 1000)) : null;

    // Build AI assessment with real CH data for credit scoring
    try {
      const assessment = await buildAIAssessment(retailer, {
        ...company,
        activeDirectorCount: activeDirectors.length,
        singleDirector: activeDirectors.length === 1,
        latestFilingDate,
        filingAgeMonths,
      });

      assessment.source = "companies_house";
      assessment.companyName = company.title;
      assessment.companyNumber = companyNumber;
      assessment.companyStatus = company.company_status;
      assessment.dateOfCreation = company.date_of_creation;
      assessment.registeredAddress = company.address_snippet;
      assessment.directors = activeDirectors.map((d: any) => ({
        name: d.name,
        role: d.officer_role,
        appointedOn: d.appointed_on,
        ...(d.date_of_birth ? { approximateAge: new Date().getFullYear() - d.date_of_birth.year } : {}),
      }));
      assessment.recentFilings = filings.slice(0, 3).map((f: any) => ({
        description: f.description,
        date: f.date,
        type: f.type,
      }));

      return new Response(JSON.stringify({ success: true, assessment }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: err.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
