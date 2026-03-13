import { mockRetailers, COUNTIES, CATEGORIES } from "@/data/mockData";

const countyStats = COUNTIES.map(c => {
  const rs = mockRetailers.filter(r => r.county === c);
  if (rs.length === 0) return null;
  return {
    county: c,
    count: rs.length,
    avgFit: Math.round(rs.reduce((s, r) => s + r.fitScore, 0) / rs.length),
    avgPriority: Math.round(rs.reduce((s, r) => s + r.priorityScore, 0) / rs.length),
    totalValue: rs.reduce((s, r) => {
      const m = r.estimatedSpendBand.match(/£([\d,]+)/);
      return s + (m ? parseInt(m[1].replace(',', '')) : 0);
    }, 0),
  };
}).filter(Boolean) as { county: string; count: number; avgFit: number; avgPriority: number; totalValue: number }[];

const topRetailers = [...mockRetailers].sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8);

export default function Reports() {
  const totalValue = countyStats.reduce((s, c) => s + c.totalValue, 0);
  const overallAvgFit = Math.round(mockRetailers.reduce((s, r) => s + r.fitScore, 0) / mockRetailers.length);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Territory intelligence and performance summary</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card rounded-lg text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Prospects</p>
          <p className="text-3xl font-display font-semibold mt-1 text-foreground">{mockRetailers.length}</p>
        </div>
        <div className="stat-card rounded-lg text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Fit Score</p>
          <p className="text-3xl font-display font-semibold mt-1 text-foreground">{overallAvgFit}%</p>
        </div>
        <div className="stat-card rounded-lg text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Territory Value</p>
          <p className="text-3xl font-display font-semibold mt-1 text-foreground">£{(totalValue / 1000).toFixed(0)}k</p>
        </div>
      </div>

      <div className="card-premium rounded-lg p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4">Prospects by County</h3>
        <div className="space-y-3">
          {countyStats.sort((a, b) => b.totalValue - a.totalValue).map(c => (
            <div key={c.county} className="flex items-center gap-4">
              <span className="text-sm text-foreground w-32">{c.county}</span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/50 rounded-full" style={{ width: `${(c.totalValue / countyStats[0].totalValue) * 100}%` }} />
              </div>
              <div className="flex gap-6 text-xs">
                <span className="text-muted-foreground">{c.count} prospects</span>
                <span className="text-muted-foreground">Fit: {c.avgFit}%</span>
                <span className="text-primary font-medium">£{(c.totalValue / 1000).toFixed(0)}k</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-premium rounded-lg p-5">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4">Top Opportunity Retailers</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">#</th>
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">Retailer</th>
              <th className="text-left py-2 text-xs text-muted-foreground font-medium">Location</th>
              <th className="text-center py-2 text-xs text-muted-foreground font-medium">Fit</th>
              <th className="text-center py-2 text-xs text-muted-foreground font-medium">Priority</th>
              <th className="text-right py-2 text-xs text-muted-foreground font-medium">Est. Spend</th>
            </tr>
          </thead>
          <tbody>
            {topRetailers.map((r, i) => (
              <tr key={r.id} className="border-b border-border/20">
                <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                <td className="py-2.5 font-medium text-foreground">{r.name}</td>
                <td className="py-2.5 text-muted-foreground">{r.town}, {r.county}</td>
                <td className="py-2.5 text-center text-foreground">{r.fitScore}%</td>
                <td className="py-2.5 text-center text-primary font-medium">{r.priorityScore}</td>
                <td className="py-2.5 text-right text-muted-foreground">{r.estimatedSpendBand}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
