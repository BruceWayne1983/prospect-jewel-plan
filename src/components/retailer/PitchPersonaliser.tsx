import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer } from "@/hooks/useRetailers";
import { Button } from "@/components/ui/button";
import { Target, Loader2, Copy, Package, Sparkles, Shield, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type Pitch = {
  pitchOpening: string;
  valueProposition: string;
  competitorPositioning: string;
  recommendedProducts: { range: string; reason: string }[];
  closingHook: string;
  talkingPoints: string[];
};

export function PitchPersonaliser({ retailer }: { retailer: Retailer }) {
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-pitch", {
        body: { retailerId: retailer.id },
      });
      if (error) throw error;
      if (data?.success) {
        setPitch(data.pitch);
        toast.success("Pitch personalised!");
      } else {
        toast.error(data?.error || "Failed to generate pitch");
      }
    } catch (err: any) {
      toast.error(err.message || "Pitch generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    if (!pitch) return;
    const text = [
      `PERSONALISED PITCH: ${retailer.name}`,
      "",
      `Opening: ${pitch.pitchOpening}`,
      "",
      `Value Proposition: ${pitch.valueProposition}`,
      "",
      `Competitor Positioning: ${pitch.competitorPositioning}`,
      "",
      "Recommended Products:",
      ...pitch.recommendedProducts.map(p => `  • ${p.range}: ${p.reason}`),
      "",
      "Talking Points:",
      ...pitch.talkingPoints.map(t => `  • ${t}`),
      "",
      `Closing Hook: ${pitch.closingHook}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Pitch copied!");
  };

  if (!pitch) {
    return (
      <div className="card-premium p-8 text-center">
        <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-base font-display font-semibold text-foreground mb-2">Personalised Pitch</h3>
        <p className="text-sm text-muted-foreground mb-4">Generate a tailored pitch based on this store's profile and competitor brands.</p>
        <Button onClick={generate} disabled={loading} className="gold-gradient text-sidebar-background text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Target className="w-3.5 h-3.5 mr-1.5" />}
          {loading ? "Personalising..." : "Generate Pitch"}
        </Button>
      </div>
    );
  }

  return (
    <div className="card-premium p-6 border-gold/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Target className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">Personalised Pitch</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyAll} className="text-xs border-border/40">
            <Copy className="w-3 h-3 mr-1.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="text-xs border-border/40">
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-champagne/20 rounded-lg p-4 border border-gold/10 mb-4">
        <p className="section-header text-[9px] mb-1">Opening</p>
        <p className="text-sm text-foreground italic font-display leading-relaxed">"{pitch.pitchOpening}"</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-cream/50 rounded-lg p-4 border border-border/15">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
            <h4 className="text-xs font-semibold text-foreground">Value Proposition</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{pitch.valueProposition}</p>
        </div>
        <div className="bg-cream/50 rounded-lg p-4 border border-border/15">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
            <h4 className="text-xs font-semibold text-foreground">Competitor Positioning</h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{pitch.competitorPositioning}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="section-header text-[9px] mb-2">Recommended Products</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {pitch.recommendedProducts.map((p, i) => (
            <div key={i} className="bg-cream/50 rounded-lg p-3 border border-border/15">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-3 h-3 text-gold" strokeWidth={1.5} />
                <p className="text-xs font-semibold text-foreground">{p.range}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">{p.reason}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="section-header text-[9px] mb-2">Talking Points</p>
        <div className="space-y-1.5">
          {pitch.talkingPoints.map((t, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <span className="w-4 h-4 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[8px] font-bold text-gold">{i + 1}</span>
              </span>
              <p className="text-[11px] text-foreground">{t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-champagne/20 rounded-lg p-4 border border-gold/10">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
          <p className="section-header text-[9px]">Closing Hook</p>
        </div>
        <p className="text-sm text-foreground italic font-display">"{pitch.closingHook}"</p>
      </div>
    </div>
  );
}
