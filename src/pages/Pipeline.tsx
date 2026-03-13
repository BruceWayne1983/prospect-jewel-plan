import { useState } from "react";
import { mockRetailers, PIPELINE_STAGES, type PipelineStage } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

export default function Pipeline() {
  const navigate = useNavigate();
  const [retailers] = useState(mockRetailers);

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Manage</p>
        <h1 className="page-title">Retailer Pipeline</h1>
        <p className="page-subtitle">Track prospects through research, qualification and outreach</p>
      </div>
      <div className="divider-gold" />

      <div className="flex gap-3 overflow-x-auto pb-6">
        {PIPELINE_STAGES.map((stage) => {
          const stageRetailers = retailers.filter(r => r.pipelineStage === stage.key);
          return (
            <div key={stage.key} className="min-w-[230px] w-[230px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{stage.label}</h3>
                <span className="text-[10px] text-muted-foreground bg-champagne/50 px-2 py-0.5 rounded-full font-medium">{stageRetailers.length}</span>
              </div>
              <div className="space-y-2.5 min-h-[200px] p-2 bg-cream/50 rounded-xl border border-border/20">
                {stageRetailers.map(r => (
                  <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="card-premium p-3.5 cursor-pointer group">
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-gold-dark transition-colors truncate">{r.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.town}, {r.county}</p>
                    <div className="divider-gold mt-2 mb-2 opacity-40" />
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-display font-bold ${r.fitScore >= 85 ? 'score-excellent' : r.fitScore >= 70 ? 'score-good' : 'score-moderate'}`}>{r.fitScore}% fit</span>
                      <span className="text-[10px] text-muted-foreground">{r.estimatedSpendBand.split('–')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase ${
                        r.outreach.outreachPriority === 'high' ? 'bg-success-light text-success' :
                        r.outreach.outreachPriority === 'medium' ? 'bg-warning-light text-warning' :
                        'bg-muted text-muted-foreground'
                      }`}>{r.outreach.outreachPriority} priority</span>
                      {r.activity.meetingScheduled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-champagne text-gold-dark font-medium">Meeting</span>}
                    </div>
                    {r.riskFlags && r.riskFlags.length > 0 && <div className="mt-1.5"><span className="badge-risk text-[8px]">⚠ Risk</span></div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
