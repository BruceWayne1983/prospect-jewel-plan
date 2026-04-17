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

  // Collapse whitespace
  n = n.replace(/\s+/g, " ").trim();

  return n;
}
