import { useState } from "react";
import { mockRetailers, PIPELINE_STAGES, type PipelineStage, type Retailer } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

export default function Pipeline() {
  const navigate = useNavigate();
  const [retailers, setRetailers] = useState(mockRetailers);

  const moveRetailer = (id: string, newStage: PipelineStage) => {
    setRetailers(prev => prev.map(r => r.id === id ? { ...r, pipelineStage: newStage } : r));
  };

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Retailer Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage prospects through the evaluation process</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageRetailers = retailers.filter(r => r.pipelineStage === stage.key);
          return (
            <div key={stage.key} className="min-w-[220px] flex-shrink-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{stage.label}</h3>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{stageRetailers.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px] p-2 bg-muted/30 rounded-lg border border-border/30">
                {stageRetailers.map(r => (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/retailer/${r.id}`)}
                    className="card-premium rounded-md p-3 cursor-pointer hover:shadow-md transition-all group"
                  >
                    <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{r.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.town}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-primary font-medium">Fit: {r.fitScore}%</span>
                      <span className="text-[10px] text-muted-foreground">{r.estimatedSpendBand.split('–')[0]}</span>
                    </div>
                    {r.riskFlags && r.riskFlags.length > 0 && (
                      <div className="mt-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">⚠ Risk</span>
                      </div>
                    )}
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
