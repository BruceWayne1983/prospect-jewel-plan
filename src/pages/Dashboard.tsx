import { mockRetailers, COUNTIES, PIPELINE_STAGES, getTotalPipelineValue } from "@/data/mockData";
import { TrendingUp, Users, Target, Gem, MapPin, ArrowUpRight, Sparkles, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";

const highPriority = mockRetailers.filter(r => r.outreach.outreachPriority === 'high').sort((a, b) => b.priorityScore - a.priorityScore);
const pipelineValue = getTotalPipelineValue();
const qualified = mockRetailers.filter(r => r.qualificationStatus === 'qualified');
const meetings = mockRetailers.filter(r => r.activity.meetingScheduled);

const stats = [
  { label: "Total Prospects", value: mockRetailers.length.toString(), icon: Users, sub: "Across South West UK" },
  { label: "Qualified", value: qualified.length.toString(), icon: Target, sub: "Passed brand fit evaluation" },
  { label: "Pipeline Value", value: `£${(pipelineValue / 1000).toFixed(0)}k`, icon: TrendingUp, sub: "Est. wholesale potential", accent: true },
  { label: "Meetings Booked", value: meetings.length.toString(), icon: Calendar, sub: "Active conversations" },
];

const countyData = COUNTIES.map(c => {
  const rs = mockRetailers.filter(r => r.county === c);
  if (rs.length === 0) return null;
  const avgFit = Math.round(rs.reduce((s, r) => s + r.fitScore, 0) / rs.length);
  const value = rs.reduce((s, r) => { const m = r.estimatedSpendBand.match(/£([\d,]+)/); return s + (m ? parseInt(m[1].replace(',', '')) : 0); }, 0);
  return { county: c, count: rs.length, avgFit, value };
}).filter(Boolean) as { county: string; count: number; avgFit: number; value: number }[];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Good morning, Emma-Louise</p>
          <h1 className="page-title">Territory Overview</h1>
          <p className="page-subtitle">South West UK · Nomination Brand Development</p>
        </div>
        <div className="flex items-center gap-2">
          <Gem className="w-5 h-5 text-gold" />
          <span className="text-sm font-display font-medium text-foreground italic">Nomination Italy</span>
        </div>
      </div>
      <div className="divider-gold" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className={`stat-card group cursor-default ${'accent' in s && s.accent ? 'border-gold/30 bg-champagne/20' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${'accent' in s && s.accent ? 'gold-gradient shadow-sm' : 'bg-muted'}`}>
                <s.icon className={`w-4 h-4 ${'accent' in s && s.accent ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-foreground tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Pipeline Stages</h3>
          <div className="space-y-3">
            {PIPELINE_STAGES.filter(s => s.key !== 'rejected').map((stage) => {
              const count = mockRetailers.filter(r => r.pipelineStage === stage.key).length;
              const pct = (count / mockRetailers.length) * 100;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground w-28 truncate">{stage.label}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gold/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-display font-semibold text-foreground w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Territory Summary</h3>
          <div className="space-y-4">
            {countyData.sort((a, b) => b.value - a.value).map((c) => (
              <div key={c.county} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-32">
                  <MapPin className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                  <span className="text-sm text-foreground">{c.county}</span>
                </div>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/40 rounded-full" style={{ width: `${(c.value / countyData[0].value) * 100}%` }} />
                </div>
                <div className="flex gap-5 text-xs">
                  <span className="text-muted-foreground w-16">{c.count} prospects</span>
                  <span className="text-gold-dark font-medium w-14 text-right">£{(c.value / 1000).toFixed(0)}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-semibold text-foreground">Priority Outreach Targets</h3>
          <button onClick={() => navigate('/prospects')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                {['Retailer', 'Location', 'Category', 'Fit', 'Priority', 'Outreach', 'Est. Spend'].map(h => (
                  <th key={h} className="text-left py-3 section-header text-[10px] first:pl-0 last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {highPriority.slice(0, 6).map((r) => (
                <tr key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="border-b border-border/15 hover:bg-champagne/20 transition-colors cursor-pointer group">
                  <td className="py-3.5 pl-0 text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</td>
                  <td className="py-3.5 text-sm text-muted-foreground">{r.town}</td>
                  <td className="py-3.5"><span className="badge-category">{r.category.replace('_', ' ')}</span></td>
                  <td className="py-3.5"><div className="w-20"><ScoreBar score={r.fitScore} label="" /></div></td>
                  <td className="py-3.5"><span className={`text-sm font-display font-bold ${r.priorityScore >= 90 ? 'score-excellent' : 'score-good'}`}>{r.priorityScore}</span></td>
                  <td className="py-3.5"><span className="text-xs text-muted-foreground capitalize">{r.outreach.bestContactMethod}</span></td>
                  <td className="py-3.5 text-right text-sm text-foreground">{r.estimatedSpendBand}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
