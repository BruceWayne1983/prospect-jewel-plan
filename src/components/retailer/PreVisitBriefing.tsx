import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer } from "@/hooks/useRetailers";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Store, Users, Package, AlertTriangle, Zap, Copy, MessageSquare, Target, RefreshCw, TrendingDown, ShoppingBag, Handshake, ClipboardList } from "lucide-react";
import { toast } from "sonner";

const CURRENT_ACCOUNT_STAGES = ["approved", "retention_risk"];

const VISIT_PURPOSES = [
  { value: "range_review", label: "Range Review", icon: ClipboardList, description: "Review current stock levels, bestsellers, and identify gaps" },
  { value: "new_season", label: "New Season Launch", icon: ShoppingBag, description: "Present new collections and seasonal lines" },
  { value: "relationship", label: "Relationship Check-in", icon: Handshake, description: "Strengthen the partnership, gather feedback" },
  { value: "reorder", label: "Reorder & Replenish", icon: RefreshCw, description: "Drive reorders on low-stock bestsellers" },
  { value: "recovery", label: "Win-Back / Recovery", icon: TrendingDown, description: "Re-engage a declining or lapsed account" },
  { value: "upsell", label: "Upsell & Expand", icon: Target, description: "Introduce new product categories or display upgrades" },
] as const;

type VisitPurpose = typeof VISIT_PURPOSES[number]["value"];

type Briefing = {
  bullets: { icon: string; title: string; detail: string }[];
  openingLine: string;
  keyObjection: string;
  productToLead: string;
  visitAgenda?: string[];
};

const iconMap: Record<string, React.ElementType> = {
  store: Store,
  customer: Users,
  product: Package,
  risk: AlertTriangle,
  action: Zap,
};

interface PreVisitBriefingProps {
  retailer: Retailer;
}

export function PreVisitBriefing({ retailer }: PreVisitBriefingProps) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [visitPurpose, setVisitPurpose] = useState<VisitPurpose | null>(null);

  const isCurrentAccount = CURRENT_ACCOUNT_STAGES.includes(retailer.pipeline_stage);

  const generate = async (purpose?: VisitPurpose) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-briefing", {
        body: {
          retailerId: retailer.id,
          accountType: isCurrentAccount ? "current_account" : "prospect",
          visitPurpose: purpose || visitPurpose || undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        setBriefing(data.briefing);
        toast.success("Briefing generated!");
      } else {
        toast.error(data?.error || "Failed to generate briefing");
      }
    } catch (err: any) {
      toast.error(err.message || "Briefing generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!briefing) return;
    const text = [
      `PRE-VISIT BRIEFING: ${retailer.name}`,
      "",
      ...briefing.bullets.map(b => `• ${b.title}: ${b.detail}`),
      "",
      `Opening Line: ${briefing.openingLine}`,
      `Key Objection: ${briefing.keyObjection}`,
      `Lead Product: ${briefing.productToLead}`,
      ...(briefing.visitAgenda?.length ? ["", "Visit Agenda:", ...briefing.visitAgenda.map((a, i) => `${i + 1}. ${a}`)] : []),
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Briefing copied!");
  };

  // Show purpose selector for current accounts before generating
  if (!briefing && isCurrentAccount && !visitPurpose) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <FileText className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Pre-Visit Briefing</h3>
            <p className="text-[10px] text-muted-foreground">What's the purpose of this visit?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {VISIT_PURPOSES.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.value}
                onClick={() => {
                  setVisitPurpose(p.value);
                  generate(p.value);
                }}
                disabled={loading}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/20 bg-cream/30 hover:bg-champagne/30 hover:border-gold/30 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-champagne/40 flex items-center justify-center flex-shrink-0 group-hover:bg-champagne/60 transition-colors">
                  <Icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{p.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Show simple generate button for prospects
  if (!briefing) {
    return (
      <div className="card-premium p-8 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-base font-display font-semibold text-foreground mb-2">Pre-Visit Briefing</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isCurrentAccount
            ? "Generate a briefing tailored to your visit purpose."
            : "Generate a 60-second briefing to read before walking in."}
        </p>
        <Button onClick={() => generate()} disabled={loading} className="gold-gradient text-sidebar-background text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
          {loading ? "Generating..." : "Generate Briefing"}
        </Button>
      </div>
    );
  }

  const purposeLabel = visitPurpose ? VISIT_PURPOSES.find(p => p.value === visitPurpose)?.label : null;

  return (
    <div className="card-premium p-6 border-gold/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <FileText className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Pre-Visit Briefing</h3>
            {purposeLabel && (
              <p className="text-[10px] text-muted-foreground">Purpose: {purposeLabel}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyAll} className="text-xs border-border/40">
            <Copy className="w-3 h-3 mr-1.5" /> Copy
          </Button>
          {isCurrentAccount && (
            <Button variant="outline" size="sm" onClick={() => { setBriefing(null); setVisitPurpose(null); }} className="text-xs border-border/40">
              Change Purpose
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => generate()} disabled={loading} className="text-xs border-border/40">
            {loading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        {briefing.bullets.map((b, i) => {
          const Icon = iconMap[b.icon] || Zap;
          return (
            <div key={i} className="flex items-start gap-3 bg-cream/50 rounded-lg p-3 border border-border/15">
              <Icon className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-semibold text-foreground">{b.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{b.detail}</p>
              </div>
            </div>
          );
        })}
      </div>

      {briefing.visitAgenda && briefing.visitAgenda.length > 0 && (
        <div className="mb-4 bg-champagne/10 rounded-lg p-4 border border-gold/10">
          <p className="section-header text-[9px] mb-2">Visit Agenda</p>
          <div className="space-y-1.5">
            {briefing.visitAgenda.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-gold">{i + 1}</span>
                </span>
                <p className="text-[11px] text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
          <p className="section-header text-[9px] mb-1">Opening Line</p>
          <p className="text-[11px] text-foreground italic font-display">"{briefing.openingLine}"</p>
        </div>
        <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
          <p className="section-header text-[9px] mb-1">Key Objection</p>
          <p className="text-[11px] text-muted-foreground">{briefing.keyObjection}</p>
        </div>
        <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
          <p className="section-header text-[9px] mb-1">Lead Product</p>
          <p className="text-[11px] text-muted-foreground">{briefing.productToLead}</p>
        </div>
      </div>
    </div>
  );
}
