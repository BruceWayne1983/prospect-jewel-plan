import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOUTH_WEST_COUNTIES = [
  "Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Bristol", "Avon",
  "Herefordshire", "Worcestershire",
  "Cardiff", "Swansea", "Newport", "Vale of Glamorgan", "Bridgend", "Neath Port Talbot",
  "Carmarthenshire", "Pembrokeshire", "Monmouthshire", "Rhondda Cynon Taf", "Merthyr Tydfil",
  "Caerphilly", "Blaenau Gwent", "Torfaen", "Powys", "Ceredigion",
];

const CATEGORIES = [
  "jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store",
  "department_store", "garden_centre_gift_hall", "wedding_bridal", "heritage_tourist_gift", "multi_brand_retailer",
];

const CATEGORY_QUERIES: Record<string, string> = {
  jeweller: "independent jeweller jewellery shop",
  gift_shop: "independent gift shop",
  fashion_boutique: "independent fashion boutique womenswear",
  lifestyle_store: "independent lifestyle store homeware gifts",
  premium_accessories: "premium accessories shop handbags scarves",
  concept_store: "independent concept store",
  department_store: "independent department store",
  garden_centre_gift_hall: "garden centre with gift hall",
  wedding_bridal: "bridal boutique wedding shop",
  heritage_tourist_gift: "heritage gift shop tourist gift",
  multi_brand_retailer: "multi-brand retailer boutique",
};

function calculateFitScore(factors: any) {
  const CAT_SCORES: Record<string, number> = { perfect: 20, strong: 16, moderate: 12, weak: 6 };
  const LOC_SCORES: Record<string, number> = { prime: 15, good: 12, average: 9, poor: 5 };
  const storeQuality = Math.round(((factors.estimated_store_quality || 50) / 95) * 25);
  const catScore = CAT_SCORES[factors.category_alignment] || 10;
  const locScore = LOC_SCORES[factors.town_appeal] || 9;
  let onlineScore = 0;
  if (factors.has_website) onlineScore += 10;
  if (factors.has_social_media) onlineScore += 5;
  let commercialScore;
  if (factors.estimated_rating > 0) {
    commercialScore = Math.round((factors.estimated_rating / 5) * 15);
  } else {
    commercialScore = 8;
  }
  const indepScore = factors.is_independent ? 9 : 3;
  const total = Math.round(Math.min(100, Math.max(0, storeQuality + catScore + locScore + onlineScore + commercialScore + indepScore)));
  return {
    total,
    store_quality: { score: storeQuality, max: 25 },
    category_alignment: { score: catScore, max: 20, value: factors.category_alignment },
    location_appeal: { score: locScore, max: 15, value: factors.town_appeal },
    online_presence: { score: onlineScore, max: 15, website: factors.has_website, social: factors.has_social_media },
    commercial_health: { score: commercialScore, max: 15, rating: factors.estimated_rating },
    independence: { score: indepScore, max: 10, value: factors.is_independent },
  };
}

// ----- Firecrawl-backed real-business discovery -----
async function firecrawlSearchBusinesses(
  county: string,
  category: string,
  FIRECRAWL_API_KEY: string,
): Promise<Array<{ name: string; url?: string; town?: string; description?: string }>> {
  const queryBase = CATEGORY_QUERIES[category] || category.replace(/_/g, " ");
  const query = `${queryBase} in ${county} UK independent shop`;

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, limit: 15, country: "gb", lang: "en" }),
    });

    if (!res.ok) {
      console.error(`Firecrawl search failed [${res.status}] for ${county}/${category}`);
      return [];
    }

    const data = await res.json();
    const results = data?.data?.web || data?.data || data?.web || [];
    if (!Array.isArray(results)) return [];

    return results.map((r: any) => {
      const url = r.url || r.link;
      let host = "";
      try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}
      // Extract a sensible business name: prefer page title minus filler
      const rawTitle = (r.title || r.name || host || "").toString();
      const cleanTitle = rawTitle
        .split(/\s*[\|\-–—·•]\s*/)[0]
        .replace(/\s*\(.*?\)\s*/g, " ")
        .trim();
      return {
        name: cleanTitle || host,
        url,
        description: (r.description || r.snippet || "").toString(),
      };
    }).filter((x: any) => x.name && x.name.length > 2 && x.url);
  } catch (err) {
    console.error("Firecrawl search error:", err);
    return [];
  }
}

const DIRECTORY_BLOCKLIST = [
  "google.", "facebook.com", "instagram.com", "tripadvisor.", "yelp.", "yell.com",
  "thomsonlocal.", "scoot.co.uk", "wikipedia.org", "reddit.com", "tiktok.com",
  "youtube.com", "linkedin.com", "twitter.com", "x.com", "pinterest.",
  "bing.com", "duckduckgo.", "amazon.", "ebay.", "etsy.", "notonthehighstreet.",
  "gumtree.", "rightmove.", "zoopla.", "checkatrade.", "trustpilot.",
  "yp.com", "192.com", "thomsondirectories.", "cylex-uk.", "freeindex.",
  "chamberofcommerce.", "ukbusiness.", "businessmagnet.", "bdaily.",
];

const GENERIC_NAMES = new Set([
  "home", "welcome", "contact", "contact us", "about", "about us", "shop",
  "store", "products", "services", "blog", "news", "search", "results",
  "page not found", "404", "untitled", "index", "menu",
]);

function isDirectoryUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (DIRECTORY_BLOCKLIST.some(b => lower.includes(b))) return true;
  // Reject obvious search-result pages
  if (/[?&]q=|\/search\b|\/find\b|\/results\b/.test(lower)) return true;
  return false;
}

function isValidShopUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) return false;
    const host = u.hostname.replace(/^www\./, "");
    // Must have a TLD
    if (!host.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

function isGenericName(name: string): boolean {
  const n = (name || "").trim().toLowerCase();
  if (n.length < 3) return true;
  return GENERIC_NAMES.has(n);
}

// Normalise for fuzzy current-account matching (mirrors src/utils/accountNames.ts)
function normaliseName(name: string): string {
  if (!name) return "";
  let n = name.toLowerCase();
  n = n.replace(/^\d+\s*-\s*/, "");
  const lastComma = n.lastIndexOf(",");
  if (lastComma !== -1) n = n.slice(0, lastComma);
  n = n.replace(/\([^)]*\)/g, " ");
  n = n.replace(/&/g, " and ");
  n = n.replace(/\b(ltd|limited|co\.?|plc)\b\.?/g, " ");
  n = n.replace(/[^a-z0-9\s]/g, " ");
  n = n.replace(/\b(jewellers?|jewelry|jewellery|the|shop|store|boutique|gallery|gift|gifts)\b/g, " ");
  n = n.replace(/\s+/g, " ").trim();
  return n;
}

function normTown(t: string): string {
  return (t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rootDomain(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

interface RetailerLite { id: string; name: string; town: string; website?: string | null }

function matchExistingRetailer(
  name: string,
  town: string,
  website: string | null,
  retailers: RetailerLite[],
): RetailerLite | null {
  const nName = normaliseName(name);
  const nTown = normTown(town);
  const nDomain = rootDomain(website);
  if (nDomain) {
    const byDomain = retailers.find(r => rootDomain(r.website) === nDomain);
    if (byDomain) return byDomain;
  }
  if (!nName) return null;
  const exact = retailers.find(r => normaliseName(r.name) === nName && normTown(r.town) === nTown && nTown !== "");
  if (exact) return exact;
  const loose = retailers.find(r => normaliseName(r.name) === nName && (!r.town || !nTown));
  if (loose) return loose;
  return null;
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal })
      .catch(() => null);
    if (!res || res.status >= 400 || res.status === 405) {
      // Some hosts reject HEAD — try GET
      res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal })
        .catch(() => null);
    }
    clearTimeout(timer);
    if (!res) return false;
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}


async function classifyAndScoreWithAI(
  businesses: Array<{ name: string; url?: string; description?: string }>,
  county: string,
  category: string,
  LOVABLE_API_KEY: string,
  notFitContext: string,
): Promise<any[]> {
  if (businesses.length === 0) return [];

  const businessList = businesses.map((b, i) =>
    `${i + 1}. ${b.name} — ${b.url || "no url"} — ${(b.description || "").slice(0, 200)}`
  ).join("\n");

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
          name: "classify_prospects",
          description: `Classify, score and enrich the supplied REAL businesses for Nomination Italy fit in ${county}.`,
          parameters: {
            type: "object",
            properties: {
              prospects: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "integer", description: "1-based index from the list provided" },
                    keep: { type: "boolean", description: "Keep this business as a prospect (false to skip — eg directory page, online-only, chain, irrelevant)" },
                    name: { type: "string", description: "Cleaned business name. Do NOT invent — use the supplied name." },
                    town: { type: "string", description: `Real town in ${county} where the shop is based — leave empty if you cannot determine from the description/url` },
                    category: { type: "string", enum: CATEGORIES },
                    rating: { type: "number", description: "0 if unknown — do NOT guess" },
                    review_count: { type: "integer", description: "0 if unknown — do NOT guess" },
                    estimated_store_quality: { type: "integer", description: "Quality score 40-95 based on description signals" },
                    category_alignment: { type: "string", enum: ["perfect", "strong", "moderate", "weak"] },
                    town_appeal: { type: "string", enum: ["prime", "good", "average", "poor"] },
                    has_social_media: { type: "boolean" },
                    is_independent: { type: "boolean" },
                    has_website: { type: "boolean", description: "True if a real shop website URL was supplied" },
                    estimated_price_positioning: { type: "string", enum: ["premium", "mid_market", "budget"] },
                    ai_reason: { type: "string", description: "1-2 sentence explanation of fit" },
                  },
                  required: ["index", "keep", "name", "category", "category_alignment", "town_appeal", "is_independent", "has_website", "estimated_price_positioning", "estimated_store_quality"],
                  additionalProperties: false,
                },
              },
            },
            required: ["prospects"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "classify_prospects" } },
      messages: [
        {
          role: "system",
          content: `You are a UK retail analyst classifying REAL businesses found via web search for Nomination Italy (premium charm jewellery brand).

CRITICAL RULES:
- Use ONLY the names and URLs provided. NEVER invent or rename a business.
- Set keep=false for: directory pages, online-only retailers, supermarkets, chain stores (Pandora, H Samuel, Ernest Jones, John Lewis, Debenhams, M&S, Boots), toy shops, pharmacies, news pages, blog posts, irrelevant categories.
- Set keep=true ONLY for genuine independent physical retail shops in: jewellers, gift shops, fashion boutiques, lifestyle stores, premium accessories, concept stores, small department stores, wedding/bridal, heritage gift shops, multi-brand boutiques, garden centres with substantial gift halls.
- Do NOT generate phone, email, or address. Leave town empty if unsure.${notFitContext}`,
        },
        {
          role: "user",
          content: `Classify these REAL businesses found in ${county} for the "${category.replace(/_/g, " ")}" category:\n\n${businessList}`,
        },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const status = aiResponse.status;
    await aiResponse.text();
    if (status === 429) throw new Error("Rate limit exceeded");
    if (status === 402) throw new Error("AI credits exhausted");
    throw new Error("AI classification failed");
  }

  const aiData = await aiResponse.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return [];

  const parsed = JSON.parse(toolCall.function.arguments);
  const classified = parsed.prospects || [];

  return classified
    .filter((c: any) => c.keep)
    .map((c: any) => {
      const src = businesses[c.index - 1];
      if (!src) return null;
      return {
        name: src.name, // ALWAYS use the real name from Firecrawl, never the AI's
        town: c.town || "",
        category: c.category,
        rating: c.rating || 0,
        review_count: c.review_count || 0,
        estimated_store_quality: c.estimated_store_quality,
        category_alignment: c.category_alignment,
        town_appeal: c.town_appeal,
        has_social_media: c.has_social_media || false,
        is_independent: c.is_independent !== false,
        has_website: !!src.url,
        estimated_price_positioning: c.estimated_price_positioning,
        ai_reason: c.ai_reason || "",
        website: src.url || "",
        _description: src.description || "",
      };
    })
    .filter(Boolean);
}

async function discoverBatch(
  supabase: any,
  userId: string,
  county: string,
  category: string,
  LOVABLE_API_KEY: string,
  FIRECRAWL_API_KEY: string,
  notFitContext: string = "",
  existingRetailers: RetailerLite[] = [],
  existingProspects: Array<{ name: string; town: string }> = [],
): Promise<{ inserted: any[]; matchedAccounts: Array<{ retailer_id: string; retailer_name: string; retailer_town: string; matched_name: string }> }> {
  const matchedAccounts: Array<{ retailer_id: string; retailer_name: string; retailer_town: string; matched_name: string }> = [];

  // Step 1: Real-business discovery via Firecrawl
  const rawBusinesses = await firecrawlSearchBusinesses(county, category, FIRECRAWL_API_KEY);

  // RULE 1: Drop anything without a valid, non-directory URL
  const realBusinesses = rawBusinesses.filter(b =>
    b.url && isValidShopUrl(b.url) && !isDirectoryUrl(b.url) && !isGenericName(b.name)
  );

  if (realBusinesses.length === 0) {
    console.log(`No real businesses found via Firecrawl for ${county}/${category}`);
    return { inserted: [], matchedAccounts };
  }

  // Step 2: AI classification & scoring (no name invention)
  const classified = await classifyAndScoreWithAI(realBusinesses, county, category, LOVABLE_API_KEY, notFitContext);

  if (classified.length === 0) return { inserted: [], matchedAccounts };

  // Step 3: Dedup and current-account filtering
  const lowerExistingProspects = new Set(
    existingProspects.map(p => `${p.name.toLowerCase()}|${(p.town || "").toLowerCase()}`)
  );
  const seenInBatch = new Set<string>();
  const branchFlags: Map<number, { related_account_id: string; related_name: string; related_town: string }> = new Map();
  const candidates: any[] = [];

  for (const p of classified) {
    // Drop generic names that survived AI cleaning
    if (isGenericName(p.name)) continue;

    const key = `${p.name.toLowerCase()}|${(p.town || "").toLowerCase()}`;
    if (seenInBatch.has(key)) continue;
    if (lowerExistingProspects.has(key)) continue;

    // RULE 2: Fuzzy match against current accounts (name + town OR root domain)
    const matched = matchExistingRetailer(p.name, p.town || "", p.website || null, existingRetailers);
    if (matched) {
      const sameTown = normTown(matched.town || "") === normTown(p.town || "");
      const sameDomain = !!rootDomain(p.website) && rootDomain(p.website) === rootDomain(matched.website);
      if (sameTown || sameDomain) {
        // Already a current account → never insert as prospect
        matchedAccounts.push({
          retailer_id: matched.id,
          retailer_name: matched.name,
          retailer_town: matched.town || "",
          matched_name: p.name,
        });
        continue;
      }
      // Same brand, different town → flag as branch
      branchFlags.set(candidates.length, {
        related_account_id: matched.id,
        related_name: matched.name,
        related_town: matched.town || "",
      });
    }

    seenInBatch.add(key);
    candidates.push(p);
  }

  // RULE 3: Probe every candidate URL — anything that doesn't respond is dropped
  const probeResults = await Promise.all(candidates.map(c => probeUrl(c.website)));
  const unique = candidates.filter((_, i) => probeResults[i]);

  if (unique.length === 0) return { inserted: [], matchedAccounts };

  // Step 4: Build insert payload — every row passed URL probe → web_verified
  const toInsert = unique.map((p: any, idx: number) => {
    const originalIdx = candidates.indexOf(p);
    const factors = {
      estimated_store_quality: p.estimated_store_quality || 50,
      category_alignment: p.category_alignment || "moderate",
      town_appeal: p.town_appeal || "average",
      has_social_media: p.has_social_media || false,
      is_independent: p.is_independent !== false,
      estimated_rating: p.rating || 0,
      has_website: true,
      price_positioning: p.estimated_price_positioning || "mid_market",
    };
    const breakdown = calculateFitScore(factors);
    const branch = branchFlags.get(originalIdx);

    return {
      user_id: userId,
      name: p.name,
      town: p.town || county,
      county,
      category: p.category,
      rating: p.rating,
      review_count: p.review_count,
      estimated_store_quality: p.estimated_store_quality,
      predicted_fit_score: breakdown.total,
      ai_reason: branch
        ? `⚡ Potential branch of existing account "${branch.related_name}" in ${branch.related_town}. ${p.ai_reason}`
        : p.ai_reason,
      estimated_price_positioning: p.estimated_price_positioning,
      website: p.website,
      address: null,
      phone: null,
      email: null,
      discovery_source: "Firecrawl + AI",
      verification_status: "web_verified",
      verification_data: {
        verified_at: new Date().toISOString(),
        method: "firecrawl_search_url_probed",
        source_url: p.website,
      },
      status: "new",
      raw_data: {
        fit_score_factors: factors,
        fit_score_breakdown: breakdown,
        firecrawl_description: p._description,
        ...(branch ? { related_account_id: branch.related_account_id, related_account_name: branch.related_name, related_account_town: branch.related_town, is_potential_branch: true } : {}),
      },
    };
  });

  if (toInsert.length === 0) return { inserted: [], matchedAccounts };

  const { data: inserted, error: insertError } = await supabase
    .from("discovered_prospects")
    .insert(toInsert)
    .select();

  if (insertError) {
    console.error("Insert error:", insertError);
    throw new Error("Failed to save prospects");
  }

  return { inserted: inserted || [], matchedAccounts };
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const { county, category, fullScan } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY not configured — connect Firecrawl in Connectors" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingRetailers } = await supabase.from("retailers").select("id, name, town, website");
    const { data: existingProspects } = await supabase.from("discovered_prospects").select("name, town");
    const retailerEntries: RetailerLite[] = (existingRetailers || []).map((r: any) => ({ id: r.id, name: r.name, town: r.town, website: r.website }));

    const { data: disqualPatterns } = await supabase.from("disqualification_patterns").select("*").order("created_at", { ascending: false }).limit(50);
    let notFitContext = "";
    if (disqualPatterns && disqualPatterns.length > 0) {
      const reasonCounts: Record<string, number> = {};
      const examples: string[] = [];
      disqualPatterns.forEach((dp: any) => {
        reasonCounts[dp.reason] = (reasonCounts[dp.reason] || 0) + 1;
        if (examples.length < 10) {
          examples.push(`"${dp.prospect_name}" (${dp.prospect_town}) — ${dp.reason}${dp.reason_detail ? ': ' + dp.reason_detail : ''}`);
        }
      });
      const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).map(([r, c]) => `${r} (${c}x)`).join(", ");
      notFitContext = `\n\nLEARNED "NOT FIT" PATTERNS — Set keep=false for similar:\nTop reasons: ${topReasons}\nExamples:\n${examples.join("\n")}`;
    }

    let allInserted: any[] = [];
    let allMatched: Array<{ retailer_id: string; retailer_name: string; retailer_town: string; matched_name: string }> = [];

    if (fullScan) {
      for (const c of SOUTH_WEST_COUNTIES) {
        for (const cat of CATEGORIES) {
          try {
            const result = await discoverBatch(supabase, userId, c, cat, LOVABLE_API_KEY, FIRECRAWL_API_KEY, notFitContext, retailerEntries, existingProspects || []);
            allInserted = allInserted.concat(result.inserted);
            allMatched = allMatched.concat(result.matchedAccounts);
          } catch (err: any) {
            console.error(`Batch error for ${c}/${cat}:`, err.message);
            if (err.message.includes("Rate limit") || err.message.includes("credits")) {
              return new Response(JSON.stringify({
                success: true,
                prospects: allInserted,
                matched_current_accounts: allMatched,
                partial: true,
                stoppedAt: `${c}/${cat}`,
                error: err.message,
              }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }
          }
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    } else {
      const targetCounty = county || SOUTH_WEST_COUNTIES[Math.floor(Math.random() * SOUTH_WEST_COUNTIES.length)];
      const targetCategory = category || CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const result = await discoverBatch(supabase, userId, targetCounty, targetCategory, LOVABLE_API_KEY, FIRECRAWL_API_KEY, notFitContext, retailerEntries, existingProspects || []);
      allInserted = result.inserted;
      allMatched = result.matchedAccounts;
    }

    const matchSummary = allMatched.length > 0
      ? ` ${allMatched.length} match${allMatched.length === 1 ? '' : 'es'} skipped — already current accounts.`
      : "";

    return new Response(JSON.stringify({
      success: true,
      prospects: allInserted,
      matched_current_accounts: allMatched,
      message: allInserted.length === 0 && allMatched.length === 0
        ? "No verified businesses found for this county/category combination. Try a different scan."
        : `Discovered ${allInserted.length} verified real businesses.${matchSummary}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
