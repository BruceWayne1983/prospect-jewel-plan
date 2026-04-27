/**
 * Normalises retailer/account names so the same business across reports
 * (with different suffixes, town tags, numeric prefixes, etc.) collapses
 * to a single key.
 *
 * Examples:
 *   "Bumble Tree"               → "bumble tree"
 *   "BUMBLE TREE LTD"           → "bumble tree"
 *   "Bumble Tree, Bath"         → "bumble tree"
 *   "246750-MOUNT CYCLE LTD"    → "mount cycle"
 *   "Allum & Sidaway"           → "allum and sidaway"
 *   "Jones (Cardiff) Limited"   → "jones"
 */
export function normaliseAccountName(name: string): string {
  if (!name) return "";

  let n = name.toLowerCase();

  // Strip leading numeric prefix like "246750-"
  n = n.replace(/^\d+\s*-\s*/, "");

  // Drop trailing ", [Town]" — anything after the LAST comma
  const lastComma = n.lastIndexOf(",");
  if (lastComma !== -1) n = n.slice(0, lastComma);

  // Strip parenthetical content
  n = n.replace(/\([^)]*\)/g, " ");

  // Normalise & → and
  n = n.replace(/&/g, " and ");

  // Drop legal suffixes (whole words, with optional punctuation)
  n = n.replace(/\b(ltd|limited|co\.?|plc)\b\.?/g, " ");

  // Strip remaining punctuation — keep letters, numbers, spaces only
  n = n.replace(/[^a-z0-9\s]/g, " ");

  // Drop generic retail filler words so brand-only fuzzy matching works
  n = n.replace(/\b(jewellers?|jewelry|jewellery|the|shop|store|boutique|gallery|gift|gifts)\b/g, " ");

  // Collapse whitespace
  n = n.replace(/\s+/g, " ").trim();

  return n;
}

function normaliseTown(t: string): string {
  return (t || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function rootDomain(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    // Take last 2-3 labels (foo.co.uk, foo.com)
    const parts = host.split(".");
    if (parts.length >= 3 && parts[parts.length - 2].length <= 3) {
      return parts.slice(-3).join(".");
    }
    return parts.slice(-2).join(".");
  } catch {
    return "";
  }
}

export interface RetailerLite {
  id: string;
  name: string;
  town?: string | null;
  website?: string | null;
}

/**
 * Find a current-account retailer that matches the given prospect.
 * Match logic (any of):
 *  - Same root domain (strongest signal)
 *  - Normalised name equal AND same town
 *  - Normalised name equal AND no town conflict (one side empty)
 */
export function findMatchingRetailer(
  name: string,
  town: string | null | undefined,
  website: string | null | undefined,
  retailers: RetailerLite[],
): RetailerLite | null {
  if (!retailers || retailers.length === 0) return null;
  const nName = normaliseAccountName(name);
  const nTown = normaliseTown(town || "");
  const nDomain = rootDomain(website);

  if (nDomain) {
    const byDomain = retailers.find(r => rootDomain(r.website) === nDomain);
    if (byDomain) return byDomain;
  }

  if (!nName) return null;

  // Strict: same name + same town
  const exact = retailers.find(r => normaliseAccountName(r.name) === nName && normaliseTown(r.town || "") === nTown && nTown !== "");
  if (exact) return exact;

  // Looser: same name, town unknown on one side
  const loose = retailers.find(r => normaliseAccountName(r.name) === nName && (!r.town || !nTown));
  if (loose) return loose;

  return null;
}

