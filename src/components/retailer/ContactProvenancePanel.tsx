import { ShieldCheck, ShieldAlert, ShieldQuestion, Phone, Mail, MapPin, Hash, Instagram } from "lucide-react";
import {
  ContactProvenance,
  ContactProvenanceField,
  getProvenance,
  isVerified,
  provenanceLabel,
  provenanceBadgeColor,
} from "@/utils/contactProvenance";

interface Props {
  provenance: unknown;
  values: Partial<Record<ContactProvenanceField, string | null | undefined>>;
}

const FIELDS: { key: ContactProvenanceField; label: string; Icon: typeof Phone }[] = [
  { key: "phone", label: "Phone", Icon: Phone },
  { key: "email", label: "Email", Icon: Mail },
  { key: "address", label: "Address", Icon: MapPin },
  { key: "postcode", label: "Postcode", Icon: Hash },
  { key: "instagram", label: "Instagram", Icon: Instagram },
];

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
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

const StatusIcon = ({ p }: { p: ContactProvenance | null }) => {
  if (isVerified(p)) return <ShieldCheck className="w-3.5 h-3.5 text-success" strokeWidth={1.75} />;
  if (p?.needs_review) return <ShieldAlert className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.75} />;
  return <ShieldQuestion className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />;
};

export function ContactProvenancePanel({ provenance, values }: Props) {
  const verifiedCount = FIELDS.reduce((acc, f) => {
    const p = getProvenance(provenance, f.key);
    return acc + (isVerified(p) ? 1 : 0);
  }, 0);

  return (
    <div className="card-premium p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-display font-semibold text-foreground">Contact Provenance</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Per-field verification source &amp; capture date
          </p>
        </div>
        <span
          className={`text-[10px] font-medium px-2 py-1 rounded-full border ${
            verifiedCount === FIELDS.length
              ? "bg-success/10 text-success border-success/30"
              : verifiedCount === 0
              ? "bg-muted text-muted-foreground border-border/40"
              : "bg-amber-500/10 text-amber-700 border-amber-500/30"
          }`}
        >
          {verifiedCount}/{FIELDS.length} verified
        </span>
      </div>

      <div className="space-y-2">
        {FIELDS.map(({ key, label, Icon }) => {
          const p = getProvenance(provenance, key);
          const tone = provenanceBadgeColor(p);
          const value = values[key];
          const captured = formatDate(p?.verified_at ?? null);

          return (
            <div
              key={key}
              className="flex items-start justify-between gap-3 py-2 px-3 rounded-md border border-border/30 bg-cream/20"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{label}</span>
                    {!value && (
                      <span className="text-[10px] text-muted-foreground/60 italic">not captured</span>
                    )}
                  </div>
                  {value && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{value}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusIcon p={p} />
                    <span className="text-[10px] text-muted-foreground">
                      {provenanceLabel(p)}
                    </span>
                    {captured && (
                      <span className="text-[10px] text-muted-foreground/60">· {captured}</span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={`text-[9px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${badgeClasses(
                  tone,
                )}`}
              >
                {tone === "green" ? "VERIFIED" : tone === "amber" ? "REVIEW" : tone === "red" ? "AI GUESS" : "UNKNOWN"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
        Verified fields come directly from official sources (website, Google Maps, Companies House) or
        manual entry. AI-generated guesses are never persisted to retailer records.
      </p>
    </div>
  );
}
