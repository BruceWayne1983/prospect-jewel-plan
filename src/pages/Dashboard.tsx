import { mockRetailers, COUNTIES, PIPELINE_STAGES, getTotalPipelineValue } from "@/data/mockData";
import { TrendingUp, Users, Target, Activity, MapPin } from "lucide-react";

const stats = [
  { label: "Prospects Discovered", value: mockRetailers.length.toString(), icon: Users, change: "+3 this week" },
  { label: "High Priority", value: mockRetailers.filter(r => r.priorityScore >= 85).length.toString(), icon: Target, change: "Ready to contact" },
  { label: "Pipeline Value", value: `£${(getTotalPipelineValue() / 1000).toFixed(0)}k`, icon: TrendingUp, change: "Est. wholesale" },
  { label: "Active Outreach", value: mockRetailers.filter(r => ['contacted', 'meeting_needed', 'contact_planned'].includes(r.pipelineStage)).length.toString(), icon: Activity, change: "In progress" },
];

const countyData = COUNTIES.map(c => ({
  county: c,
  count: mockRetailers.filter(r => r.county === c).length,
  avgFit: Math.round(mockRetailers.filter(r => r.county === c).reduce((sum, r) => sum + r.fitScore, 0) / (mockRetailers.filter(r => r.county === c).length || 1)),
})).filter(c => c.count > 0);

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Territory Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">South West UK — Nomination Brand Development</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-display font-semibold mt-1 text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium rounded-lg p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4">Pipeline Summary</h3>
          <div className="space-y-2">
            {PIPELINE_STAGES.filter(s => s.key !== 'rejected').map((stage) => {
              const count = mockRetailers.filter(r => r.pipelineStage === stage.key).length;
              const pct = (count / mockRetailers.length) * 100;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 truncate">{stage.label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-foreground w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-premium rounded-lg p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4">Territory by County</h3>
          <div className="space-y-3">
            {countyData.sort((a, b) => b.count - a.count).map((c) => (
              <div key={c.county} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-sm text-foreground">{c.county}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{c.count} prospects</span>
                  <span className="text-xs font-medium text-primary">Avg fit: {c.avgFit}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-premium rounded-lg p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4">High Priority Prospects</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40">
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Retailer</th>
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Location</th>
                <th className="text-left py-2 text-xs text-muted-foreground font-medium">Type</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">Fit</th>
                <th className="text-center py-2 text-xs text-muted-foreground font-medium">Priority</th>
                <th className="text-right py-2 text-xs text-muted-foreground font-medium">Est. Spend</th>
              </tr>
            </thead>
            <tbody>
              {mockRetailers.filter(r => r.priorityScore >= 85).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 6).map((r) => (
                <tr key={r.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="py-2.5 font-medium text-foreground">{r.name}</td>
                  <td className="py-2.5 text-muted-foreground">{r.town}</td>
                  <td className="py-2.5"><span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{r.category.replace('_', ' ')}</span></td>
                  <td className="py-2.5 text-center"><span className="font-medium text-foreground">{r.fitScore}%</span></td>
                  <td className="py-2.5 text-center"><span className="font-medium text-primary">{r.priorityScore}</span></td>
                  <td className="py-2.5 text-right text-muted-foreground">{r.estimatedSpendBand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
