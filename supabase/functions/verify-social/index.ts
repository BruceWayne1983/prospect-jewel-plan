import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOCIAL_DOMAINS = [
  { platform: "instagram", patterns: ["instagram.com/", "instagr.am/"] },
  { platform: "facebook", patterns: ["facebook.com/", "fb.com/", "fb.me/"] },
  { platform: "tiktok", patterns: ["tiktok.com/@", "tiktok.com/"] },
  { platform: "twitter", patterns: ["twitter.com/", "x.com/"] },
  { platform: "linkedin", patterns: ["linkedin.com/company/", "linkedin.com/in/"] },
];

function extractSocialLinks(html: string): Record<string, string> {
  const socials: Record<string, string> = {};
  // Match href="..." or href='...' containing social domains
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const url = match[1];
    for (const { platform, patterns } of SOCIAL_DOMAINS) {
      if (!socials[platform]) {
        for (const pattern of patterns) {
          if (url.toLowerCase().includes(pattern)) {
            socials[platform] = url;
            break;
          }
        }
      }
    }
  }
  // Also check plain text for social URLs
  const urlRegex = /https?:\/\/(?:www\.)?(?:instagram\.com|facebook\.com|fb\.com|tiktok\.com|twitter\.com|x\.com|linkedin\.com)\/[^\s"'<>)}\]]+/gi;
  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[0];
    for (const { platform, patterns } of SOCIAL_DOMAINS) {
      if (!socials[platform]) {
        for (const pattern of patterns) {
          if (url.toLowerCase().includes(pattern)) {
            socials[platform] = url;
            break;
          }
        }
      }
    }
  }
  return socials;
}

function extractHandle(url: string, platform: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "");
    if (!path || path === "#") return url;
    // For Instagram/TikTok/Twitter, return @handle format
    if (["instagram", "tiktok", "twitter"].includes(platform)) {
      const handle = path.split("/")[0].replace("@", "");
      return handle ? `@${handle}` : url;
    }
    return url;
  } catch {
    return url;
  }
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { retailerId, prospectId, name, town, county, website } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ error: "Store name is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let socialsFound: Record<string, string> = {};
    let confidence: "high" | "medium" | "low" = "low";
    let dataSources: string[] = [];
    let method = "none";

    // STEP 1: If we have a website, scrape it for social links
    if (website) {
      console.log(`Scraping website for social links: ${website}`);
      try {
        const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: website,
            formats: ["html", "links"],
            onlyMainContent: false,
            waitFor: 3000,
          }),
        });

        if (scrapeResp.ok) {
          const scrapeData = await scrapeResp.json();
          const html = scrapeData.data?.html || scrapeData.html || "";
          const links = scrapeData.data?.links || scrapeData.links || [];

          // Extract social links from HTML
          socialsFound = extractSocialLinks(html);

          // Also check the extracted links array
          for (const link of links) {
            const url = typeof link === "string" ? link : link?.url || "";
            for (const { platform, patterns } of SOCIAL_DOMAINS) {
              if (!socialsFound[platform]) {
                for (const pattern of patterns) {
                  if (url.toLowerCase().includes(pattern)) {
                    socialsFound[platform] = url;
                    break;
                  }
                }
              }
            }
          }

          if (Object.keys(socialsFound).length > 0) {
            confidence = "high";
            method = "website_scrape";
            dataSources.push(website);
          }
        } else {
          console.warn("Website scrape failed:", scrapeResp.status);
          if (scrapeResp.status === 402) {
            return new Response(JSON.stringify({ error: "Firecrawl credits exhausted" }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (e) {
        console.warn("Website scrape error:", e);
      }
    }

    // STEP 2: If no socials found yet, search the web
    if (Object.keys(socialsFound).length === 0) {
      console.log(`Web search for social links: ${name} ${town}`);
      const searchQuery = `"${name}" ${town} ${county || ""} instagram OR facebook OR social media`;

      try {
        const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            limit: 10,
            lang: "en",
            country: "gb",
            scrapeOptions: { formats: ["markdown"] },
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const results = searchData.data || [];

          // First check: do any result URLs directly point to social profiles?
          for (const result of results) {
            const url = result.url || "";
            for (const { platform, patterns } of SOCIAL_DOMAINS) {
              if (!socialsFound[platform]) {
                for (const pattern of patterns) {
                  if (url.toLowerCase().includes(pattern)) {
                    socialsFound[platform] = url;
                    dataSources.push(url);
                    break;
                  }
                }
              }
            }
          }

          // Second: use AI to extract handles from scraped content
          if (Object.keys(socialsFound).length === 0 && results.length > 0) {
            const scrapedContent = results.map((r: any, i: number) =>
              `[${i + 1}] URL: ${r.url}\nTitle: ${r.title || ""}\nContent: ${(r.markdown || "").substring(0, 1000)}`
            ).join("\n\n---\n\n");

            const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    name: "extract_social_handles",
                    description: "Extract social media handles for a specific store from web search results",
                    parameters: {
                      type: "object",
                      properties: {
                        instagram: { type: "string", description: "Instagram URL or handle, empty if not found" },
                        facebook: { type: "string", description: "Facebook URL or page name, empty if not found" },
                        tiktok: { type: "string", description: "TikTok URL or handle, empty if not found" },
                        twitter: { type: "string", description: "Twitter/X URL or handle, empty if not found" },
                        linkedin: { type: "string", description: "LinkedIn URL, empty if not found" },
                        source_urls: { type: "array", items: { type: "string" }, description: "URLs where handles were found" },
                      },
                      required: ["instagram", "facebook", "tiktok", "twitter", "linkedin", "source_urls"],
                      additionalProperties: false,
                    },
                  },
                }],
                tool_choice: { type: "function", function: { name: "extract_social_handles" } },
                messages: [
                  {
                    role: "system",
                    content: `Extract social media handles for "${name}" in ${town} from the web search results below. ONLY return handles that actually appear in the scraped content — do NOT guess or fabricate handles. Return empty strings for any platform not found in the content.`,
                  },
                  {
                    role: "user",
                    content: `Find social media handles for "${name}" (${town}, ${county || "UK"}) from these search results:\n\n${scrapedContent}`,
                  },
                ],
              }),
            });

            if (aiResp.ok) {
              const aiData = await aiResp.json();
              const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
              if (toolCall) {
                const extracted = JSON.parse(toolCall.function.arguments);
                if (extracted.instagram) socialsFound.instagram = extracted.instagram;
                if (extracted.facebook) socialsFound.facebook = extracted.facebook;
                if (extracted.tiktok) socialsFound.tiktok = extracted.tiktok;
                if (extracted.twitter) socialsFound.twitter = extracted.twitter;
                if (extracted.linkedin) socialsFound.linkedin = extracted.linkedin;
                dataSources.push(...(extracted.source_urls || []));
              }
            }
          }

          if (Object.keys(socialsFound).length > 0 && confidence !== "high") {
            confidence = "medium";
            method = "web_search";
          }
        } else {
          console.warn("Search failed:", searchResp.status);
          if (searchResp.status === 402) {
            return new Response(JSON.stringify({ error: "Firecrawl credits exhausted" }), {
              status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (e) {
        console.warn("Search error:", e);
      }
    }

    // Build update object
    const hasSocials = Object.keys(socialsFound).length > 0;
    const updates: Record<string, any> = {
      social_verified: true,
    };

    if (socialsFound.instagram) updates.instagram = extractHandle(socialsFound.instagram, "instagram");
    if (socialsFound.facebook) updates.facebook = socialsFound.facebook;
    if (socialsFound.tiktok) updates.tiktok = extractHandle(socialsFound.tiktok, "tiktok");
    if (socialsFound.twitter) updates.twitter = extractHandle(socialsFound.twitter, "twitter");
    if (socialsFound.linkedin) updates.linkedin = socialsFound.linkedin;

    const table = retailerId ? "retailers" : "discovered_prospects";
    const id = retailerId || prospectId;

    if (id) {
      await supabase.from(table).update(updates).eq("id", id);
    }

    return new Response(JSON.stringify({
      success: true,
      has_social_media: hasSocials,
      social_opportunity: !hasSocials,
      confidence,
      method,
      data_sources: dataSources,
      social: {
        instagram: updates.instagram || null,
        facebook: updates.facebook || null,
        tiktok: updates.tiktok || null,
        twitter: updates.twitter || null,
        linkedin: updates.linkedin || null,
      },
      notes: hasSocials
        ? `Found ${Object.keys(socialsFound).length} social platform(s) via ${method}. Confidence: ${confidence}.`
        : `No verifiable social media presence found for "${name}" in ${town}. This is an opportunity — Emma can offer social media setup support as a value-add during the pitch.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
