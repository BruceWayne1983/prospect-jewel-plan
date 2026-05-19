import { Phone, Mail, Globe, Navigation, AlertTriangle } from "lucide-react";
import { telHref, mailtoHref, websiteHref, directionsHref, type DirectionTarget } from "@/utils/contactLinks";
import { getProvenance, isVerified, type ContactProvenanceField } from "@/utils/contactProvenance";

interface ContactActionsProps {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  directionTarget?: DirectionTarget | null;
  /**
   * Optional provenance map keyed by field. When provided, fields whose
   * provenance is AI-inferred (or otherwise unverified) get a warning dot
   * and a confirm dialog before the action fires.
   */
  provenance?: unknown;
  /** Visual size — "sm" for in-card use, "md" for retailer-detail pages. */
  size?: "sm" | "md";
  /** Stop card-level navigation from triggering when these buttons are tapped. */
  stopPropagation?: boolean;
}

function isFieldUnverified(provenance: unknown, field: ContactProvenanceField): boolean {
  if (!provenance) return false;
  const p = getProvenance(provenance, field);
  if (!p) return false;
  return !isVerified(p);
}

// Tap-to-call / -email / -website / -directions buttons. Each is an <a> with
// the appropriate href; missing data hides the corresponding button rather
// than rendering it disabled.
export function ContactActions({
  phone,
  email,
  website,
  directionTarget,
  provenance,
  size = "sm",
  stopPropagation = true,
}: ContactActionsProps) {
  const tel = telHref(phone);
  const mail = mailtoHref(email);
  const site = websiteHref(website);
  const directions = directionTarget ? directionsHref(directionTarget) : null;

  if (!tel && !mail && !site && !directions) return null;

  const phoneUnverified = isFieldUnverified(provenance, "phone");
  const emailUnverified = isFieldUnverified(provenance, "email");

  const iconClass = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const buttonClass =
    size === "md"
      ? "p-2 rounded-md hover:bg-accent inline-flex items-center justify-center min-w-[40px] min-h-[40px] relative"
      : "p-1 rounded hover:bg-accent inline-flex items-center justify-center relative";
  const warnDotClass = "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-warning border border-background";

  const handler = stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  // Confirm before opening an unverified contact action to stop Emma calling
  // an AI-inferred number. Native confirm() keeps this tiny — a styled modal
  // would be nicer but isn't worth the surface area here.
  const confirmIfUnverified = (label: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const ok = window.confirm(
      `This ${label} hasn't been verified. It may be an AI suggestion. Continue?`,
    );
    if (!ok) e.preventDefault();
  };

  return (
    <div className="flex items-center gap-1.5" onClick={handler}>
      {tel && (
        <a
          href={tel}
          title={phoneUnverified ? `Call ${phone ?? ""} — UNVERIFIED` : `Call ${phone ?? ""}`}
          aria-label={phoneUnverified ? "Call retailer (unverified number)" : "Call retailer"}
          className={buttonClass}
          onClick={phoneUnverified ? confirmIfUnverified("phone number") : undefined}
        >
          <Phone className={iconClass} />
          {phoneUnverified && (
            <>
              <span className={warnDotClass} aria-hidden="true" />
              <AlertTriangle className="sr-only" />
            </>
          )}
        </a>
      )}
      {mail && (
        <a
          href={mail}
          title={emailUnverified ? `Email ${email ?? ""} — UNVERIFIED` : `Email ${email ?? ""}`}
          aria-label={emailUnverified ? "Email retailer (unverified address)" : "Email retailer"}
          className={buttonClass}
          onClick={emailUnverified ? confirmIfUnverified("email address") : undefined}
        >
          <Mail className={iconClass} />
          {emailUnverified && <span className={warnDotClass} aria-hidden="true" />}
        </a>
      )}
      {site && (
        <a href={site} target="_blank" rel="noopener noreferrer" title="Open website" aria-label="Open retailer website" className={buttonClass}>
          <Globe className={iconClass} />
        </a>
      )}
      {directions && (
        <a href={directions} target="_blank" rel="noopener noreferrer" title="Directions in Google Maps" aria-label="Directions to retailer" className={buttonClass}>
          <Navigation className={iconClass} />
        </a>
      )}
    </div>
  );
}
