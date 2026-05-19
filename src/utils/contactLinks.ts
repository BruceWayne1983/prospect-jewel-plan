// Helpers for building tap-to-act URLs Emma uses in the field:
//   - tel:    one-tap call from any device
//   - mailto: opens the default mail client
//   - https://www.google.com/maps/search/?api=1&query=... for directions
//
// All helpers tolerate null/undefined input and return null when there's
// nothing useful to link to.

export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  // Keep digits, +, and leading 00. Strip everything else (spaces, hyphens,
  // parens) so the dialler doesn't reject the string on some Android builds.
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned) return null;
  return `tel:${cleaned}`;
}

export function mailtoHref(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!trimmed.includes("@")) return null;
  return `mailto:${trimmed}`;
}

export function websiteHref(website: string | null | undefined): string | null {
  if (!website) return null;
  const trimmed = website.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

export interface DirectionTarget {
  address?: string | null;
  postcode?: string | null;
  town?: string | null;
  county?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export function directionsHref(target: DirectionTarget): string | null {
  // Prefer lat/lng (most accurate), then full address, then postcode, then
  // town + county. Returns null if nothing useful is available.
  if (target.lat != null && target.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
  }
  const parts: string[] = [];
  if (target.address) parts.push(target.address);
  if (target.postcode) parts.push(target.postcode);
  if (parts.length === 0 && target.town) {
    parts.push(target.town);
    if (target.county) parts.push(target.county);
  }
  if (parts.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(", "))}`;
}
