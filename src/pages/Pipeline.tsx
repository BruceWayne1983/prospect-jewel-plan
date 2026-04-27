import { useState, useEffect, useMemo } from "react";
import { PIPELINE_STAGES } from "@/data/constants";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X } from "lucide-react";
import { QuickBookButton } from "@/components/calendar/EventBooker";
import { toast } from "sonner";

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

const ORDER_KEY = "pipeline_order_v1";

function loadOrder(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || "{}"); } catch { return {}; }
}
function saveOrder(o: Record<string, string[]>) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(o));
}

export default function Pipeline() {
  const navigate = useNavigate();
  const [retailers, setRetailers] = useState<PipelineRetailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Record<string, string[]>>(loadOrder);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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

  const sortStage = (stageKey: string, items: PipelineRetailer[]) => {
    const ord = order[stageKey] || [];
    const idx = (id: string) => {
      const i = ord.indexOf(id);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return [...items].sort((a, b) => idx(a.id) - idx(b.id));
  };

  const handleRemove = async (e: React.MouseEvent, r: PipelineRetailer) => {
    e.stopPropagation();
    const snapshot = r;
    setRetailers(prev => prev.filter(x => x.id !== r.id));
    const { error } = await supabase.from("retailers").delete().eq("id", r.id);
    if (error) {
      setRetailers(prev => [...prev, snapshot]);
      toast.error("Failed to remove", { description: error.message });
      return;
    }
    toast.success(`Removed ${r.name}`, {
      action: {
        label: "Undo",
        onClick: async () => {
          const { error: insErr } = await supabase.from("retailers").insert({
            id: snapshot.id,
            name: snapshot.name,
            town: snapshot.town,
            county: snapshot.county,
            fit_score: snapshot.fit_score,
            pipeline_stage: snapshot.pipeline_stage as any,
            outreach: snapshot.outreach,
            activity: snapshot.activity,
            risk_flags: snapshot.risk_flags,
            spend_potential_score: snapshot.spend_potential_score,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          } as any);
          if (insErr) { toast.error("Undo failed", { description: insErr.message }); return; }
          setRetailers(prev => [...prev, snapshot]);
          toast.success("Restored");
        },
      },
      duration: 6000,
    });
  };

  const onDragStart = (id: string) => setDragId(id);
  const onDragEnd = () => { setDragId(null); setDragOverStage(null); };

  const onDropOnCard = async (e: React.DragEvent, targetStage: string, targetId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragId || dragId === targetId) return;
    await applyDrop(targetStage, targetId);
  };

  const onDropOnColumn = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!dragId) return;
    await applyDrop(targetStage, null);
  };

  const applyDrop = async (targetStage: string, targetId: string | null) => {
    const dragged = retailers.find(r => r.id === dragId);
    if (!dragged) return;
    const sourceStage = dragged.pipeline_stage;

    // Cross-column: update DB stage
    if (sourceStage !== targetStage) {
      setRetailers(prev => prev.map(r => r.id === dragId ? { ...r, pipeline_stage: targetStage } : r));
      const { error } = await supabase.from("retailers").update({ pipeline_stage: targetStage as any }).eq("id", dragId);
      if (error) {
        setRetailers(prev => prev.map(r => r.id === dragId ? { ...r, pipeline_stage: sourceStage } : r));
        toast.error("Stage change failed", { description: error.message });
        return;
      }
      toast.success(`Moved to ${PIPELINE_STAGES.find(s => s.key === targetStage)?.label}`);
    }

    // Reorder in target column
    setOrder(prev => {
      const next = { ...prev };
      // Build the current sorted ids in target column
      const inStage = retailers
        .filter(r => (r.id === dragId ? targetStage : r.pipeline_stage) === targetStage)
        .map(r => r.id);
      const ord = next[targetStage] ? [...next[targetStage]] : [];
      // Ensure all stage ids present in ord (append missing in inStage order)
      inStage.forEach(id => { if (!ord.includes(id)) ord.push(id); });
      // Remove dragged then insert at position of target (or end)
      const without = ord.filter(id => id !== dragId);
      const insertAt = targetId ? without.indexOf(targetId) : without.length;
      without.splice(insertAt, 0, dragId!);
      next[targetStage] = without;
      // Clean dragged from source column order if changed
      if (sourceStage !== targetStage && next[sourceStage]) {
        next[sourceStage] = next[sourceStage].filter(id => id !== dragId);
      }
      saveOrder(next);
      return next;
    });

    setDragId(null); setDragOverStage(null);
  };

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
        <p className="page-subtitle">Drag cards to reorder or move between stages. Click ✕ to remove.</p>
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
          const stageRetailers = sortStage(stage.key, retailers.filter(r => r.pipeline_stage === stage.key));
          const isHover = dragOverStage === stage.key;
          return (
            <div key={stage.key} className="min-w-[230px] w-[230px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[10px] font-semibold text-foreground uppercase tracking-wider">{stage.label}</h3>
                <span className="text-[10px] text-muted-foreground bg-champagne/50 px-2 py-0.5 rounded-full font-medium">{stageRetailers.length}</span>
              </div>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage.key); }}
                onDragLeave={() => setDragOverStage(curr => curr === stage.key ? null : curr)}
                onDrop={(e) => onDropOnColumn(e, stage.key)}
                className={`space-y-2.5 min-h-[200px] p-2 rounded-xl border transition-all ${
                  stage.key === 'retention_risk' ? 'bg-warning/5 border-warning/20' : 'bg-cream/50 border-border/20'
                } ${isHover ? 'ring-2 ring-gold/40' : ''}`}
              >
                {stageRetailers.map(r => {
                  const fitScore = r.fit_score ?? 0;
                  const outreach = r.outreach as any ?? {};
                  const activity = r.activity as any ?? {};
                  const riskFlags = r.risk_flags ?? [];
                  const isDragging = dragId === r.id;
                  return (
                    <div
                      key={r.id}
                      draggable
                      onDragStart={() => onDragStart(r.id)}
                      onDragEnd={onDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDropOnCard(e, stage.key, r.id)}
                      onClick={() => navigate(`/retailer/${r.id}`)}
                      className={`card-premium p-3.5 cursor-pointer group relative transition-opacity ${isDragging ? 'opacity-40' : ''}`}
                    >
                      <button
                        onClick={(e) => handleRemove(e, r)}
                        title="Remove from pipeline"
                        className="absolute top-1.5 right-1.5 p-1 rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" strokeWidth={2} />
                      </button>
                      <h4 className="text-xs font-semibold text-foreground group-hover:text-gold-dark transition-colors truncate pr-5">{r.name}</h4>
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
                      <div className="mt-1.5 flex gap-1" onClick={e => e.stopPropagation()}>
                        <QuickBookButton retailerId={r.id} retailerName={r.name} town={r.town} defaultType="meeting" variant="small" />
                      </div>
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
