import { Phone, Mail, MapPin, Instagram, AlertTriangle, CheckCircle2, HelpCircle, Hash, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ContactProvenanceField,
  getProvenance,
  isVerified as isVerifiedProvenance,
  provenanceLabel,
  provenanceBadgeColor,
} from "@/utils/contactProvenance";

interface ContactFieldProps {
  field: ContactProvenanceField;
  value: string | null | undefined;
  provenanceData: unknown;
  onVerifyClick?: () => void;
  verifyBusy?: boolean;
}

const ICONS: Record<ContactProvenanceField, typeof Phone> = {
  phone: Phone,
  email: Mail,
  address: MapPin,
  postcode: Hash,
  instagram: Instagram,
};

const LABELS: Record<ContactProvenanceField, string> = {
  phone: "phone",
  email: "email",
  address: "address",
  postcode: "postcode",
  instagram: "Instagram",
};

const buildHref = (field: ContactProvenanceField, value: string): string | null => {
  switch (field) {
    case "phone":
      return `tel:${value.replace(/[^+\d]/g, "")}`;
    case "email":
      return `mailto:${value}`;
    case "instagram":
      return `https://instagram.com/${value.replace(/^@/, "")}`;
    default:
      return null;
  }
};

const badgeClasses = (tone: "green" | "amber" | "red" | "grey") => {
  switch (tone) {
    case "green":
      return "bg-success/10 text-success border-success/30";
    case "amber":
      return "bg-amber-500/10 text-amber-700 border-amber-500/30";
    case "red":
      return "bg-destructive/10 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground border-border/40";
  }
};

const badgeText = (tone: "green" | "amber" | "red" | "grey") =>
  tone === "green" ? "VERIFIED" : tone === "amber" ? "REVIEW" : tone === "red" ? "AI GUESS" : "UNKNOWN";

export function ContactField({ field, value, provenanceData, onVerifyClick, verifyBusy }: ContactFieldProps) {
  const Icon = ICONS[field];
  const label = LABELS[field];
  const provenance = getProvenance(provenanceData, field);
  const verified = isVerifiedProvenance(provenance);
  const tone = provenanceBadgeColor(provenance);

  // No value
  if (!value) {
    return (
      <div className="flex items-center gap-3 py-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0" strokeWidth={1.5} />
        <span className="text-xs text-muted-foreground/60 italic flex-1">
          No {label} on file
        </span>
        {onVerifyClick && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onVerifyClick}
            disabled={verifyBusy}
            className="h-6 text-[10px] px-2 text-gold-dark hover:text-gold hover:bg-champagne/40"
          >
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            Look up
          </Button>
        )}
      </div>
    );
  }

  const href = verified ? buildHref(field, value) : null;
  const StatusIcon = verified ? CheckCircle2 : provenance?.needs_review ? AlertTriangle : HelpCircle;
  const statusColor = verified
    ? "text-success"
    : provenance?.needs_review
    ? "text-amber-600"
    : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 py-1">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${verified ? "text-foreground" : "text-muted-foreground"}`} strokeWidth={1.5} />

      {href ? (
        <a
          href={href}
          target={field === "instagram" ? "_blank" : undefined}
          rel={field === "instagram" ? "noopener noreferrer" : undefined}
          className="text-sm text-foreground hover:text-gold-dark underline-offset-2 hover:underline truncate flex-1"
        >
          {value}
        </a>
      ) : (
        <span className={`text-sm truncate flex-1 ${verified ? "text-foreground" : "text-muted-foreground italic"}`}>
          {value}
        </span>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${badgeClasses(tone)}`}>
            <StatusIcon className={`w-2.5 h-2.5 ${statusColor}`} strokeWidth={2} />
            {badgeText(tone)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="text-xs space-y-0.5">
            <div className="font-medium">{provenanceLabel(provenance)}</div>
            {provenance?.verified_at && (
              <div className="text-muted-foreground">
                Captured {new Date(provenance.verified_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            )}
            {!verified && (
              <div className="text-muted-foreground italic">
                Tel/email links disabled until verified.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>

      {!verified && onVerifyClick && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onVerifyClick}
          disabled={verifyBusy}
          className="h-6 text-[10px] px-2 text-gold-dark hover:text-gold hover:bg-champagne/40"
        >
          Verify
        </Button>
      )}
    </div>
  );
}
