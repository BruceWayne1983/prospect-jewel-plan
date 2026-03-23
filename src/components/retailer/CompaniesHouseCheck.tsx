import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer } from "@/hooks/useRetailers";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "@/components/ScoreIndicators";

type Assessment = {
  source: string;
  companyName?: string;
  companyNumber?: string;
  companyStatus?: string;
  dateOfCreation?: string;
  registeredAddress?: string;
  directors?: { name: string; role: string; appointedOn?: string; approximateAge?: number }[];
  recentFilings?: { description: string; date: string; type: string }[];
  businessHealthScore: number;
  riskLevel: string;
  riskFactors: string[];
  positiveIndicators: string[];
  estimatedYearsTrading?: string;
  recommendation?: string;
  note?: string;
};

export function CompaniesHouseCheck({ retailer }: { retailer: Retailer }) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("companies-house", {
        body: { retailerId: retailer.id },
      });
      if (error) throw error;
      if (data?.success) {
        setAssessment(data.assessment);
        toast.success("Business check complete!");
      } else {
        toast.error(data?.error || "Check failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Business check failed");
    } finally {
      setLoading(false);
    }
  };

  if (!assessment) {
    return (
      <div className="card-premium p-8 text-center">
        <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-base font-display font-semibold text-foreground mb-2">Business Health Check</h3>
        <p className="text-sm text-muted-foreground mb-4">Validate business status, directors, and filing health.</p>
        <Button onClick={runCheck} disabled={loading} className="gold-gradient text-sidebar-background text-xs">
          {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5 mr-1.5" />}
          {loading ? "Checking..." : "Run Business Check"}
        </Button>
      </div>
    );
  }

  const riskColor = assessment.riskLevel === "low" ? "text-success" : assessment.riskLevel === "medium" ? "text-warning" : "text-destructive";

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Building2 className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Business Health Check</h3>
            <p className="text-[10px] text-muted-foreground">
              Source: {assessment.source === "companies_house" ? "Companies House" : "AI Estimated"}
              {assessment.companyNumber && ` · #${assessment.companyNumber}`}
            </p>
          </div>
        </div>
        <ScoreRing score={assessment.businessHealthScore} label="Health" size={64} strokeWidth={3} />
      </div>

      {assessment.companyName && (
        <div className="bg-cream/50 rounded-lg p-3 border border-border/15 mb-4">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-muted-foreground">Company: </span><span className="text-foreground font-medium">{assessment.companyName}</span></div>
            <div><span className="text-muted-foreground">Status: </span><span className="text-foreground font-medium capitalize">{assessment.companyStatus}</span></div>
            {assessment.dateOfCreation && <div><span className="text-muted-foreground">Founded: </span><span className="text-foreground font-medium">{assessment.dateOfCreation}</span></div>}
            <div><span className="text-muted-foreground">Risk Level: </span><span className={`font-semibold uppercase ${riskColor}`}>{assessment.riskLevel}</span></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {assessment.positiveIndicators.length > 0 && (
          <div className="bg-cream/50 rounded-lg p-3 border border-border/15">
            <p className="section-header text-[9px] mb-2">Positive Indicators</p>
            {assessment.positiveIndicators.map((p, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <CheckCircle className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-foreground">{p}</p>
              </div>
            ))}
          </div>
        )}
        {assessment.riskFactors.length > 0 && (
          <div className="bg-cream/50 rounded-lg p-3 border border-border/15">
            <p className="section-header text-[9px] mb-2">Risk Factors</p>
            {assessment.riskFactors.map((r, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5">
                <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">{r}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {assessment.directors && assessment.directors.length > 0 && (
        <div className="mb-4">
          <p className="section-header text-[9px] mb-2">Directors</p>
          <div className="space-y-1">
            {assessment.directors.map((d, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                <span className="text-[11px] text-foreground">{d.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {d.role}{d.approximateAge ? ` · ~${d.approximateAge}yo` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {assessment.recommendation && (
        <div className="bg-champagne/20 rounded-lg p-3 border border-gold/10">
          <p className="section-header text-[9px] mb-1">Recommendation</p>
          <p className="text-[11px] text-foreground">{assessment.recommendation}</p>
        </div>
      )}

      {assessment.note && (
        <p className="text-[9px] text-muted-foreground italic mt-3">{assessment.note}</p>
      )}

      <Button variant="outline" size="sm" onClick={runCheck} disabled={loading} className="text-xs mt-3 border-border/40">
        {loading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null} Re-check
      </Button>
    </div>
  );
}
