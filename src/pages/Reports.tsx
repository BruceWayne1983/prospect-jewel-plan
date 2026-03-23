import { COUNTIES } from "@/data/constants";
import { useRetailers } from "@/hooks/useRetailers";
import { useDataInsights } from "@/hooks/useDataInsights";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";
import { TrendingUp, Target, Users, Loader2, Sparkles, Database, BarChart3 } from "lucide-react";

export default function Reports() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const countyStats = COUNTIES.map(c => {
    const rs = retailers.filter(r => r.county === c);
    if (rs.length === 0) return null;
    return {
      county: c, count: rs.length,
      avgFit: Math.round(rs.reduce((s, r) => s + (r.fit_score ?? 0), 0) / rs.length),
      avgPriority: Math.round(rs.reduce((s, r) => s + (r.priority_score ?? 0), 0) / rs.length),
    };
  }).filter(Boolean) as { county: string; count: number; avgFit: number; avgPriority: number }[];

  const topRetailers = [...retailers].sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)).slice(0, 8);
  const overallAvgFit = retailers.length > 0 ? Math.round(retailers.reduce((s, r) => s + (r.fit_score ?? 0), 0) / retailers.length) : 0;

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Intelligence</p>
        <h1 className="page-title">Territory Reports</h1>
        <p className="page-subtitle">Performance summary and opportunity analysis</p>
      </div>
      <div className="divider-gold" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: Users, label: "Total Prospects", value: retailers.length.toString() },
          { icon: Target, label: "Average Fit Score", value: `${overallAvgFit}%` },
          { icon: TrendingUp, label: "Counties Active", value: countyStats.length.toString() },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <s.icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-display font-bold text-foreground tracking-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {countyStats.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Prospects by County</h3>
          <div className="space-y-4">
            {countyStats.sort((a, b) => b.count - a.count).map(c => (
              <div key={c.county} className="flex items-center gap-4">
                <span className="text-sm text-foreground w-32 font-medium">{c.county}</span>
                <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                  <div className="h-full bg-gold/50 rounded-full transition-all duration-700" style={{ width: `${(c.count / countyStats[0].count) * 100}%` }} />
                </div>
                <div className="flex gap-6 text-xs min-w-[200px] justify-end">
                  <span className="text-muted-foreground">{c.count} prospects</span>
                  <span className="text-muted-foreground">Fit: {c.avgFit}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {topRetailers.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Top Opportunity Retailers</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                {['#', 'Retailer', 'Location', 'Fit', 'Priority'].map(h => (
                  <th key={h} className="text-left py-3 section-header text-[10px] first:w-8 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topRetailers.map((r, i) => (
                <tr key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="border-b border-border/15 hover:bg-champagne/15 transition-colors cursor-pointer group">
                  <td className="py-3.5 text-xs text-muted-foreground/50 font-display">{i + 1}</td>
                  <td className="py-3.5 text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</td>
                  <td className="py-3.5 text-sm text-muted-foreground">{r.town}, {r.county}</td>
                  <td className="py-3.5"><div className="w-20"><ScoreBar score={r.fit_score ?? 0} label="" /></div></td>
                  <td className="py-3.5 text-right"><span className={`text-sm font-display font-bold ${(r.priority_score ?? 0) >= 90 ? 'score-excellent' : 'score-good'}`}>{r.priority_score ?? 0}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {retailers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No data to report yet.</p>
          <p className="text-xs mt-1">Promote prospects from the Discovery Engine to see territory analytics.</p>
        </div>
      )}
    </div>
  );
}
