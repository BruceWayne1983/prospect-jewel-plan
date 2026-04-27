// Enrich a prospect/retailer with VERIFIED contact details (phone, email, address)
// scraped directly from the business's official website + Google Maps listing.
// No LLM guesses — all values must appear verbatim on a real source page.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL = "https://api.firecrawl.dev/v2";
const DIRECTORY_DOMAINS = [
  "yell.com", "yelp.com", "facebook.com", "instagram.com", "linkedin.com",
  "twitter.com", "x.com", "tiktok.com", "google.com", "google.co.uk",
  "tripadvisor.com", "tripadvisor.co.uk", "trustpilot.com", "bing.com",
  "wikipedia.org", "pinterest.com", "youtube.com", "thomsonlocal.com",
  "scoot.co.uk", "yelu.uk", "192.com", "cylex-uk.co.uk", "freeindex.co.uk",
];

function rootDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return null; }
}

function isDirectory(url: string): boolean {
  const d = rootDomain(url);
  if (!d) return true;
  return DIRECTORY_DOMAINS.some((dd) => d === dd || d.endsWith(`.${dd}`));
}

function pickUkPhone(text: string): string | null {
  // UK phone patterns: 01xxx, 02x, 03xx, 07xxx, +44
  const re = /(\+44\s?\d{2,4}|\(?0\d{2,4}\)?)[ \s\-]?\d{3,4}[ \s\-]?\d{3,4}/g;
  const m = text.match(re);
  if (!m) return null;
  const cleaned = m[0].replace(/\s+/g, " ").trim();
  return cleaned.length >= 10 ? cleaned : null;
}

function pickEmail(text: string, businessDomain: string | null): string | null {
  const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  const matches = text.match(re) || [];
  // Prefer email matching the business's own domain
  if (businessDomain) {
    const own = matches.find((e) => e.toLowerCase().endsWith(`@${businessDomain}`) || e.toLowerCase().endsWith(`.${businessDomain}`));
    if (own) return own.toLowerCase();
  }
  // Otherwise first non-noreply
  const real = matches.find((e) => !/noreply|no-reply|donotreply|wixpress|sentry|example/i.test(e));
  return real ? real.toLowerCase() : null;
}

async function firecrawlSearch(query: string, limit = 8): Promise<any[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY missing");
  const res = await fetch(`${FIRECRAWL}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit, lang: "en", country: "gb" }),
  });
  if (!res.ok) {
    console.error("Firecrawl search failed", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  // v2 returns { data: { web: [...] } } or { data: [...] }
  const web = data?.data?.web ?? data?.data ?? [];
  return Array.isArray(web) ? web : [];
}

async function firecrawlScrape(url: string): Promise<{ markdown: string; html: string; title: string; statusCode: number } | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("FIRECRAWL_API_KEY missing");
  const res = await fetch(`${FIRECRAWL}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: false, waitFor: 1500 }),
  });
  if (!res.ok) {
    console.error("Firecrawl scrape failed", url, res.status);
    return null;
  }
  const data = await res.json();
  const doc = data?.data ?? data;
  return {
    markdown: doc?.markdown || "",
    html: doc?.html || "",
    title: doc?.metadata?.title || "",
    statusCode: doc?.metadata?.statusCode || 0,
  };
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (r.ok) return true;
    if (r.status === 405 || r.status === 403) {
      const g = await fetch(url, { method: "GET", redirect: "follow" });
      return g.ok;
    }
    return false;
  } catch { return false; }
}

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
    const { prospect_id, retailer_id, name, town, county, website } = body || {};
    if (!name || !town) {
      return new Response(JSON.stringify({ error: "name and town are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provenance: Record<string, any> = {
      phone: { value: null, source: null, confidence: "low" },
      email: { value: null, source: null, confidence: "low" },
      website: { value: null, source: null, confidence: "low" },
      address: { value: null, source: null, confidence: "low" },
    };

    // ---- 1. Find official website ----
    let officialUrl: string | null = website || null;
    let officialDomain = rootDomain(officialUrl);

    if (!officialUrl || isDirectory(officialUrl)) {
      const results = await firecrawlSearch(`"${name}" ${town} ${county || ""} UK official website contact`, 8);
      const candidate = results.find((r: any) => r.url && !isDirectory(r.url));
      if (candidate) {
        officialUrl = candidate.url;
        officialDomain = rootDomain(officialUrl);
      }
    }

    if (officialUrl) {
      const live = await probeUrl(officialUrl);
      if (live) {
        provenance.website = { value: officialUrl, source: "firecrawl_search", source_url: officialUrl, confidence: "high", scraped_at: new Date().toISOString() };
      } else {
        officialUrl = null;
      }
    }

    // ---- 2. Scrape root + /contact pages ----
    const pagesToScrape: string[] = [];
    if (officialUrl) {
      pagesToScrape.push(officialUrl);
      try {
        const u = new URL(officialUrl);
        const base = `${u.protocol}//${u.host}`;
        pagesToScrape.push(`${base}/contact`, `${base}/contact-us`, `${base}/about`);
      } catch { /* ignore */ }
    }

    let combinedText = "";
    let sourceUrlForContact: string | null = null;

    for (const p of pagesToScrape.slice(0, 4)) {
      const doc = await firecrawlScrape(p);
      if (doc && doc.markdown) {
        combinedText += `\n\n=== ${p} ===\n${doc.markdown}\n${doc.html.slice(0, 5000)}`;
        if (!sourceUrlForContact) sourceUrlForContact = p;
        // Stop early if we already see a phone+email
        if (pickUkPhone(combinedText) && pickEmail(combinedText, officialDomain)) break;
      }
    }

    const phone = pickUkPhone(combinedText);
    const email = pickEmail(combinedText, officialDomain);

    if (phone && sourceUrlForContact) {
      provenance.phone = { value: phone, source: "website", source_url: sourceUrlForContact, confidence: "high", scraped_at: new Date().toISOString() };
    }
    if (email && sourceUrlForContact) {
      const emailDomain = email.split("@")[1]?.toLowerCase();
      const matchesOwnDomain = officialDomain && (emailDomain === officialDomain || emailDomain?.endsWith(`.${officialDomain}`));
      provenance.email = {
        value: email,
        source: "website",
        source_url: sourceUrlForContact,
        confidence: matchesOwnDomain ? "high" : "medium",
        scraped_at: new Date().toISOString(),
      };
    }

    // ---- 3. Cross-check Google Maps listing for address (and phone fallback) ----
    if (!provenance.phone.value || !provenance.address.value) {
      const mapResults = await firecrawlSearch(`"${name}" ${town} site:google.com/maps`, 3);
      const mapCandidate = mapResults.find((r: any) => r.url?.includes("google.com/maps"));
      if (mapCandidate) {
        const desc = `${mapCandidate.title || ""} ${mapCandidate.description || ""}`;
        const mapPhone = pickUkPhone(desc);
        if (mapPhone && !provenance.phone.value) {
          provenance.phone = { value: mapPhone, source: "google_maps", source_url: mapCandidate.url, confidence: "medium", scraped_at: new Date().toISOString() };
        }
        // Address heuristic: take the description text trimmed
        const addrMatch = desc.match(/[\d]{1,4}[^,]{2,40},\s?[A-Z][^,]{2,40},?\s?[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}/i);
        if (addrMatch) {
          provenance.address = { value: addrMatch[0], source: "google_maps", source_url: mapCandidate.url, confidence: "high", scraped_at: new Date().toISOString() };
        }
      }
    }

    // ---- 4. Persist ----
    const updates: any = {};
    if (provenance.website.value && provenance.website.confidence === "high") updates.website = provenance.website.value;
    if (provenance.phone.value && provenance.phone.confidence !== "low") updates.phone = provenance.phone.value;
    if (provenance.email.value && provenance.email.confidence !== "low") updates.email = provenance.email.value;
    if (provenance.address.value && provenance.address.confidence === "high") updates.address = provenance.address.value;

    const verification_data = {
      verified_at: new Date().toISOString(),
      method: "enrich-contact-details",
      contact_provenance: provenance,
    };

    if (prospect_id) {
      const { data: existing } = await supabase.from("discovered_prospects").select("verification_data").eq("id", prospect_id).single();
      const merged = { ...(existing?.verification_data as any || {}), ...verification_data };
      await supabase.from("discovered_prospects").update({
        ...updates,
        verification_status: "web_verified",
        verification_data: merged,
      }).eq("id", prospect_id).eq("user_id", user.id);
    } else if (retailer_id) {
      const { data: existing } = await supabase.from("retailers").select("ai_intelligence").eq("id", retailer_id).single();
      const aiInt = (existing?.ai_intelligence as any) || {};
      await supabase.from("retailers").update({
        ...updates,
        ai_intelligence: { ...aiInt, contact_provenance: provenance, contact_verified_at: new Date().toISOString() },
      }).eq("id", retailer_id).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      success: true,
      official_website: officialUrl,
      provenance,
      sources_checked: pagesToScrape,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("enrich-contact-details error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Enrichment failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
