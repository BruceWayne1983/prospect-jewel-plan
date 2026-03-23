import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer } from "@/hooks/useRetailers";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Store, Users, Package, AlertTriangle, Zap, Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type Briefing = {
  bullets: { icon: string; title: string; detail: string }[];
  openingLine: string;
  keyObjection: string;
  productToLead: string;
};

const iconMap: Record<string, React.ElementType> = {
  store: Store,
  customer: Users,
  product: Package,
  risk: AlertTriangle,
  action: Zap,
};

export function PreVisitBriefing({ retailer }: { retailer: Retailer }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-briefing", {
        body: { retailerId: retailer.id },
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
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Briefing copied!");
  };

  if (!briefing) {
    return (
      <div className="card-premium p-8 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-base font-display font-semibold text-foreground mb-2">Pre-Visit Briefing</h3>
        <p className="text-sm text-muted-foreground mb-4">Generate a 60-second briefing to read before walking in.</p>
        <Button onClick={generate} disabled={loading} className="gold-gradient text-sidebar-background text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
          {loading ? "Generating..." : "Generate Briefing"}
        </Button>
      </div>
    );
  }

  return (
    <div className="card-premium p-6 border-gold/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <FileText className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">Pre-Visit Briefing</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyAll} className="text-xs border-border/40">
            <Copy className="w-3 h-3 mr-1.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="text-xs border-border/40">
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
