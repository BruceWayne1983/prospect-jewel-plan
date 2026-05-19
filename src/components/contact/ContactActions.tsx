import { Phone, Mail, Globe, Navigation } from "lucide-react";
import { telHref, mailtoHref, websiteHref, directionsHref, type DirectionTarget } from "@/utils/contactLinks";

interface ContactActionsProps {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  directionTarget?: DirectionTarget | null;
  /** Visual size — "sm" for in-card use, "md" for retailer-detail pages. */
  size?: "sm" | "md";
  /** Stop card-level navigation from triggering when these buttons are tapped. */
  stopPropagation?: boolean;
}

// Tap-to-call / -email / -website / -directions buttons. Each is an <a> with
// the appropriate href; missing data hides the corresponding button rather
// than rendering it disabled.
export function ContactActions({
  phone,
  email,
  website,
  directionTarget,
  size = "sm",
  stopPropagation = true,
}: ContactActionsProps) {
  const tel = telHref(phone);
  const mail = mailtoHref(email);
  const site = websiteHref(website);
  const directions = directionTarget ? directionsHref(directionTarget) : null;

  if (!tel && !mail && !site && !directions) return null;

  const iconClass = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const buttonClass =
    size === "md"
      ? "p-2 rounded-md hover:bg-accent inline-flex items-center justify-center min-w-[40px] min-h-[40px]"
      : "p-1 rounded hover:bg-accent inline-flex items-center justify-center";

  const handler = stopPropagation
    ? (e: React.MouseEvent) => e.stopPropagation()
    : undefined;

  return (
    <div className="flex items-center gap-1.5" onClick={handler}>
      {tel && (
        <a href={tel} title={`Call ${phone ?? ""}`} aria-label="Call retailer" className={buttonClass}>
          <Phone className={iconClass} />
        </a>
      )}
      {mail && (
        <a href={mail} title={`Email ${email ?? ""}`} aria-label="Email retailer" className={buttonClass}>
          <Mail className={iconClass} />
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
