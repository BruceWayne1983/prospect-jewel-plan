import { useState, useEffect } from "react";
import { PIPELINE_STAGES } from "@/data/constants";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PipelineRetailer {
  id: string;
  name: string;
  town: string;
  county: string;
  fit_score: number | null;
  pipeline_stage: string;
  outreach: any;
  activity: any;
  risk_flags: string[] | null;
  spend_potential_score: number | null;
}

export default function Pipeline() {
  const navigate = useNavigate();
  const [retailers, setRetailers] = useState<PipelineRetailer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("retailers")
        .select("id, name, town, county, fit_score, pipeline_stage, outreach, activity, risk_flags, spend_potential_score")
        .order("priority_score", { ascending: false });
      setRetailers(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Manage</p>
        <h1 className="page-title">Retailer Pipeline</h1>
        <p className="page-subtitle">Track prospects through research, qualification and outreach</p>
      </div>
      <div className="divider-gold" />

      {retailers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No retailers in the pipeline yet.</p>
          <p className="text-xs mt-1">Accept prospects from the Discovery Engine to get started.</p>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-6">
        {PIPELINE_STAGES.map((stage) => {
          const stageRetailers = retailers.filter(r => r.pipeline_stage === stage.key);
          return (
            <div key={stage.key} className="min-w-[230px] w-[230px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{stage.label}</h3>
                <span className="text-[10px] text-muted-foreground bg-champagne/50 px-2 py-0.5 rounded-full font-medium">{stageRetailers.length}</span>
              </div>
              <div className="space-y-2.5 min-h-[200px] p-2 bg-cream/50 rounded-xl border border-border/20">
                {stageRetailers.map(r => {
                  const fitScore = r.fit_score ?? 0;
                  const outreach = r.outreach as any ?? {};
                  const activity = r.activity as any ?? {};
                  const riskFlags = r.risk_flags ?? [];
                  return (
                    <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="card-premium p-3.5 cursor-pointer group">
                      <h4 className="text-xs font-semibold text-foreground group-hover:text-gold-dark transition-colors truncate">{r.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{r.town}, {r.county}</p>
                      <div className="divider-gold mt-2 mb-2 opacity-40" />
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-display font-bold ${fitScore >= 85 ? 'score-excellent' : fitScore >= 70 ? 'score-good' : 'score-moderate'}`}>{fitScore}% fit</span>
                        <span className="text-[10px] text-muted-foreground">{r.spend_potential_score ?? 0}pts</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${
                          outreach.outreachPriority === 'high' ? 'bg-success-light text-success' :
                          outreach.outreachPriority === 'medium' ? 'bg-warning-light text-warning' :
                          'bg-muted text-muted-foreground'
                        }`}>{outreach.outreachPriority ?? 'low'} priority</span>
                        {activity.meetingScheduled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-champagne text-gold-dark font-medium">Meeting</span>}
                      </div>
                      {riskFlags.length > 0 && <div className="mt-1.5"><span className="badge-risk text-[8px]">⚠ Risk</span></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
