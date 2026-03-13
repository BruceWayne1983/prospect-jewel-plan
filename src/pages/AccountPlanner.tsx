import { useRetailers, getOutreach, getPerformancePrediction, getActivity } from "@/hooks/useRetailers";
import { CalendarDays, Phone, MapPin, Target, ArrowUpRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";

export default function AccountPlanner() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const topTargets = retailers.filter(r => getOutreach(r).outreachPriority === 'high').sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)).slice(0, 10);
  const callList = retailers.filter(r => getOutreach(r).bestContactMethod === 'phone' && getOutreach(r).outreachPriority !== 'low').sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
  const visitPlan = retailers.filter(r => getOutreach(r).bestContactMethod === 'visit' || getActivity(r).meetingScheduled).sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Plan</p>
        <h1 className="page-title">Account Planner</h1>
        <p className="page-subtitle">Outreach strategy, visit planning and target account management</p>
      </div>
      <div className="divider-gold" />

      {retailers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No accounts to plan yet.</p>
          <p className="text-xs mt-1">Promote prospects from the Discovery Engine to start planning outreach.</p>
        </div>
      )}

      {topTargets.length > 0 && (
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Target className="w-5 h-5 text-gold" strokeWidth={1.5} />
              <h3 className="text-lg font-display font-semibold text-foreground">Top Target Accounts</h3>
            </div>
            <button onClick={() => navigate('/prospects')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              All prospects <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  {['#', 'Retailer', 'Location', 'Fit', 'Predicted Value', 'Next Action', 'Status'].map(h => (
                    <th key={h} className="text-left py-2.5 section-header text-[9px] first:w-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topTargets.map((r, i) => {
                  const pred = getPerformancePrediction(r);
                  const act = getActivity(r);
                  return (
                    <tr key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="border-b border-border/10 hover:bg-champagne/15 transition-colors cursor-pointer group">
                      <td className="py-3 text-xs text-muted-foreground/50 font-display">{i + 1}</td>
                      <td className="py-3 text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</td>
                      <td className="py-3 text-xs text-muted-foreground">{r.town}</td>
                      <td className="py-3"><div className="w-16"><ScoreBar score={r.fit_score ?? 0} label="" /></div></td>
                      <td className="py-3 text-xs text-foreground">{pred.predictedAnnualValue}</td>
                      <td className="py-3 text-xs text-muted-foreground max-w-[180px] truncate">{act.suggestedNextStep || 'Plan needed'}</td>
                      <td className="py-3"><span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{r.pipeline_stage.replace(/_/g, ' ')}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {callList.length > 0 && (
          <div className="card-premium p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Phone className="w-5 h-5 text-gold" strokeWidth={1.5} />
              <h3 className="text-lg font-display font-semibold text-foreground">Call List</h3>
            </div>
            <div className="space-y-1">
              {callList.slice(0, 6).map((r, i) => {
                const outreach = getOutreach(r);
                return (
                  <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 cursor-pointer hover:bg-champagne/15 -mx-2 px-2 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/50 w-4 font-display">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{outreach.contactName || 'Contact TBC'} · {r.town}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${outreach.outreachPriority === 'high' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>{outreach.outreachPriority}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visitPlan.length > 0 && (
          <div className="card-premium p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <MapPin className="w-5 h-5 text-gold" strokeWidth={1.5} />
              <h3 className="text-lg font-display font-semibold text-foreground">Visit Planning</h3>
            </div>
            <div className="space-y-1">
              {visitPlan.slice(0, 6).map((r, i) => {
                const act = getActivity(r);
                return (
                  <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 cursor-pointer hover:bg-champagne/15 -mx-2 px-2 rounded-lg transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground/50 w-4 font-display">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.town}, {r.county}</p>
                      </div>
                    </div>
                    {act.meetingScheduled ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-champagne text-gold-dark font-medium">Meeting booked</span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">Visit needed</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
