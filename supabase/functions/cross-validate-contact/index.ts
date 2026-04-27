// Cross-validate that name + website + phone + email + address ALL belong to the same business.
// Runs 8 independent checks, computes a 0-100 identity score, and sets verification_status accordingly.
// HARD GATES: name on website + town on website. Without both, max status = 'needs_review'.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";

// ---------- helpers ----------
function rootDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return null; }
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Token-set similarity: % of business-name tokens that appear in target text
function nameTokenMatch(name: string, text: string): number {
  const stop = new Set(["the","and","of","ltd","limited","co","company","jewellers","jeweller","jewellery","jewelry","gift","gifts","shop","store","boutique"]);
  const nameTokens = normalise(name).split(" ").filter(t => t.length >= 3 && !stop.has(t));
  if (!nameTokens.length) return 0;
  const target = normalise(text);
  const hits = nameTokens.filter(t => target.includes(t)).length;
  return hits / nameTokens.length;
}

function normalisePhone(p: string): string {
  return p.replace(/[^\d]/g, "").replace(/^44/, "0");
}

function extractUkPostcode(text: string): string | null {
  const m = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i);
  return m ? m[1].toUpperCase().replace(/\s+/g, " ") : null;
}

async function firecrawlScrape(url: string): Promise<{ markdown: string; html: string; title: string } | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return null;
  try {
    const res = await fetch(`${FIRECRAWL}/scrape`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: false, waitFor: 1500 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const doc = data?.data ?? data;
    return {
      markdown: doc?.markdown || "",
      html: doc?.html || "",
      title: doc?.metadata?.title || "",
    };
  } catch { return null; }
}

async function firecrawlSearch(query: string, limit = 5): Promise<any[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch(`${FIRECRAWL}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit, lang: "en", country: "gb" }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const web = data?.data?.web ?? data?.data ?? [];
    return Array.isArray(web) ? web : [];
  } catch { return []; }
}

// Validate UK postcode via free postcodes.io API (no key required)
async function validatePostcode(pc: string): Promise<{ valid: boolean; town?: string; county?: string }> {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return {
      valid: data?.status === 200,
      town: data?.result?.admin_district || data?.result?.parish,
      county: data?.result?.admin_county || data?.result?.region,
    };
  } catch { return { valid: false }; }
}

// ---------- main ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { prospect_id, retailer_id, name, town, county, website, phone, email, address, instagram, facebook } = body || {};
    if (!name || !town) {
      return new Response(JSON.stringify({ error: "name and town are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const checks: Record<string, any> = {
      name_on_site: { pass: null, weight: 25, hard_gate: true },
      town_on_site: { pass: null, weight: 15, hard_gate: true },
      email_domain_matches: { pass: null, weight: 15 },
      phone_reverse_lookup: { pass: null, weight: 15 },
      maps_agreement: { pass: null, weight: 15 },
      companies_house_match: { pass: null, weight: 5 },
      postcode_valid: { pass: null, weight: 5 },
      social_ownership: { pass: null, weight: 5 },
    };

    // ---- 1 & 2: Name and town on official website ----
    let siteText = "";
    let siteTitle = "";
    const websiteDomain = rootDomain(website);

    if (website) {
      const root = await firecrawlScrape(website);
      let contact: typeof root = null;
      try {
        const u = new URL(website.startsWith("http") ? website : `https://${website}`);
        contact = await firecrawlScrape(`${u.protocol}//${u.host}/contact`);
      } catch { /* ignore */ }

      siteText = `${root?.markdown || ""}\n${contact?.markdown || ""}`;
      siteTitle = root?.title || "";
      const haystack = `${siteTitle}\n${siteText}`;

      const nameMatch = nameTokenMatch(name, haystack);
      checks.name_on_site = {
        pass: nameMatch >= 0.5,
        weight: 25,
        hard_gate: true,
        score: Math.round(nameMatch * 100),
        source_url: website,
      };

      const townInSite = normalise(haystack).includes(normalise(town));
      const sitePostcode = extractUkPostcode(haystack);
      checks.town_on_site = {
        pass: townInSite || !!sitePostcode,
        weight: 15,
        hard_gate: true,
        source_url: website,
        site_postcode: sitePostcode,
      };
    } else {
      checks.name_on_site = { pass: false, weight: 25, hard_gate: true, reason: "no_website" };
      checks.town_on_site = { pass: false, weight: 15, hard_gate: true, reason: "no_website" };
    }

    // ---- 3: Email domain matches website domain ----
    if (email && websiteDomain) {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      const generic = ["gmail.com","hotmail.com","yahoo.com","yahoo.co.uk","outlook.com","icloud.com","aol.com","live.co.uk"];
      if (generic.includes(emailDomain)) {
        checks.email_domain_matches = { pass: false, weight: 15, reason: "generic_provider", email_domain: emailDomain };
      } else if (emailDomain === websiteDomain || emailDomain?.endsWith(`.${websiteDomain}`) || websiteDomain.endsWith(`.${emailDomain}`)) {
        checks.email_domain_matches = { pass: true, weight: 15, email_domain: emailDomain, website_domain: websiteDomain };
      } else {
        checks.email_domain_matches = { pass: false, weight: 15, reason: "domain_mismatch", email_domain: emailDomain, website_domain: websiteDomain };
      }
    } else if (!email) {
      checks.email_domain_matches = { pass: null, weight: 15, reason: "no_email" };
    } else {
      checks.email_domain_matches = { pass: null, weight: 15, reason: "no_website_to_compare" };
    }

    // ---- 4: Phone reverse lookup ----
    if (phone) {
      const norm = normalisePhone(phone);
      const formatted = phone.replace(/\s+/g, " ").trim();
      const results = await firecrawlSearch(`"${formatted}" ${town} UK`, 5);
      const hit = results.find((r: any) => {
        const blob = `${r.title || ""} ${r.description || ""} ${r.url || ""}`;
        return nameTokenMatch(name, blob) >= 0.4 || normalise(blob).includes(normalise(name));
      });
      checks.phone_reverse_lookup = {
        pass: !!hit,
        weight: 15,
        normalised: norm,
        source_url: hit?.url || null,
        results_count: results.length,
      };
    } else {
      checks.phone_reverse_lookup = { pass: null, weight: 15, reason: "no_phone" };
    }

    // ---- 5: Google Maps agreement ----
    {
      const maps = await firecrawlSearch(`"${name}" ${town} site:google.com/maps`, 3);
      const m = maps.find((r: any) => r.url?.includes("google.com/maps"));
      if (m) {
        const blob = `${m.title || ""} ${m.description || ""}`;
        const nameOk = nameTokenMatch(name, blob) >= 0.5;
        const mapsPostcode = extractUkPostcode(blob);
        const sitePostcode = checks.town_on_site?.site_postcode;
        const postcodeOk = !sitePostcode || !mapsPostcode || sitePostcode.split(" ")[0] === mapsPostcode.split(" ")[0];
        checks.maps_agreement = {
          pass: nameOk && postcodeOk,
          weight: 15,
          maps_postcode: mapsPostcode,
          site_postcode: sitePostcode || null,
          source_url: m.url,
        };
      } else {
        checks.maps_agreement = { pass: false, weight: 15, reason: "no_maps_listing" };
      }
    }

    // ---- 6: Companies House (best-effort) ----
    try {
      const { data: chData } = await supabase.functions.invoke("companies-house", {
        body: { name, town },
      });
      if (chData?.company) {
        const chAddress = `${chData.company.registered_office_address?.address_line_1 || ""} ${chData.company.registered_office_address?.postal_code || ""}`;
        const addressMatch = address && chAddress ? nameTokenMatch(address, chAddress) >= 0.4 : false;
        checks.companies_house_match = {
          pass: chData.company.company_status === "active" && (addressMatch || !address),
          weight: 5,
          status: chData.company.company_status,
          company_number: chData.company.company_number,
        };
      } else {
        checks.companies_house_match = { pass: null, weight: 5, reason: "not_registered_or_sole_trader" };
      }
    } catch {
      checks.companies_house_match = { pass: null, weight: 5, reason: "ch_lookup_failed" };
    }

    // ---- 7: Postcode validity (postcodes.io, free, no key) ----
    {
      const pc = extractUkPostcode(address || "") || checks.town_on_site?.site_postcode;
      if (pc) {
        const v = await validatePostcode(pc);
        const townMatches = v.valid && v.town && (normalise(v.town).includes(normalise(town)) || normalise(town).includes(normalise(v.town)));
        checks.postcode_valid = {
          pass: v.valid && (townMatches || !town),
          weight: 5,
          postcode: pc,
          resolved_town: v.town,
          resolved_county: v.county,
        };
      } else {
        checks.postcode_valid = { pass: null, weight: 5, reason: "no_postcode" };
      }
    }

    // ---- 8: Social handle ownership ----
    if (instagram || facebook) {
      const handle = instagram || facebook;
      const url = instagram ? `https://www.instagram.com/${String(instagram).replace(/^@/, "")}` : `https://www.facebook.com/${facebook}`;
      const doc = await firecrawlScrape(url);
      if (doc?.markdown) {
        const blob = doc.markdown;
        const mentionsTown = normalise(blob).includes(normalise(town));
        const mentionsDomain = websiteDomain ? blob.toLowerCase().includes(websiteDomain) : false;
        checks.social_ownership = {
          pass: mentionsTown || mentionsDomain,
          weight: 5,
          handle,
          source_url: url,
          mentions_town: mentionsTown,
          mentions_domain: mentionsDomain,
        };
      } else {
        checks.social_ownership = { pass: null, weight: 5, reason: "social_unreachable" };
      }
    } else {
      checks.social_ownership = { pass: null, weight: 5, reason: "no_handle" };
    }

    // ---- Compute score ----
    let earned = 0;
    let possible = 0;
    for (const k of Object.keys(checks)) {
      const c = checks[k];
      if (c.pass === null) continue; // skip N/A — don't penalise
      possible += c.weight;
      if (c.pass) earned += c.weight;
    }
    const score = possible > 0 ? Math.round((earned / possible) * 100) : 0;

    // Hard gates
    const nameGateFailed = checks.name_on_site.pass === false;
    const townGateFailed = checks.town_on_site.pass === false;
    const hardGateFailed = nameGateFailed || townGateFailed;

    let verification_status: "web_verified" | "needs_review" | "verified_fake";
    if (hardGateFailed) {
      verification_status = score < 30 ? "verified_fake" : "needs_review";
    } else if (score >= 80) {
      verification_status = "web_verified";
    } else if (score >= 50) {
      verification_status = "needs_review";
    } else {
      verification_status = "verified_fake";
    }

    const identity_check = {
      score,
      ran_at: new Date().toISOString(),
      verification_status,
      hard_gate_failed: hardGateFailed,
      checks,
    };

    // ---- Persist ----
    if (prospect_id) {
      const { data: existing } = await supabase.from("discovered_prospects").select("verification_data").eq("id", prospect_id).single();
      const merged = { ...((existing?.verification_data as any) || {}), identity_check };
      await supabase.from("discovered_prospects").update({
        verification_status,
        verification_data: merged,
      }).eq("id", prospect_id).eq("user_id", user.id);
    } else if (retailer_id) {
      const { data: existing } = await supabase.from("retailers").select("ai_intelligence").eq("id", retailer_id).single();
      const aiInt = (existing?.ai_intelligence as any) || {};
      await supabase.from("retailers").update({
        ai_intelligence: { ...aiInt, identity_check },
      }).eq("id", retailer_id).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ success: true, identity_check }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cross-validate-contact error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Cross-validation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
