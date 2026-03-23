import { salesForecast, promotionalCampaigns, performanceBenchmarks, COUNTIES } from "@/data/constants";
import { useRetailers } from "@/hooks/useRetailers";
import { useDataInsights } from "@/hooks/useDataInsights";
import { TrendingUp, CalendarDays, Target, Zap, Gift, BarChart3, Loader2, Database, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const totalForecast = salesForecast.reduce((s, m) => s + m.total, 0);
const existingTotal = salesForecast.reduce((s, m) => s + m.existingAccounts, 0);
const pipelineTotal = salesForecast.reduce((s, m) => s + m.prospectPipeline, 0);
const peakMonth = salesForecast.reduce((best, m) => m.total > best.total ? m : best, salesForecast[0]);

export default function SalesForecast() {
  const { retailers, loading } = useRetailers();
  const dataInsights = useDataInsights();

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const countyForecast = COUNTIES.map(c => {
    const rs = retailers.filter(r => r.county === c);
    if (rs.length === 0) return null;
    const qualified = rs.filter(r => r.qualification_status === 'qualified').length;
    return { county: c, prospects: rs.length, qualified };
  }).filter(Boolean) as { county: string; prospects: number; qualified: number }[];

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Forecast</p>
          <h1 className="page-title">Sales Forecast & Promotions</h1>
          <p className="page-subtitle">Revenue projections, seasonal analysis and promotional planning</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Forecasting Active</span>
        </div>
      </div>
      <div className="divider-gold" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Annual Forecast', value: `£${(totalForecast / 1000).toFixed(0)}k`, sub: 'Total projected revenue', accent: true },
          { icon: Target, label: 'Existing Accounts', value: `£${(existingTotal / 1000).toFixed(0)}k`, sub: 'Confirmed revenue base' },
          { icon: Zap, label: 'Pipeline Upside', value: `£${(pipelineTotal / 1000).toFixed(0)}k`, sub: 'From prospect conversion' },
          { icon: CalendarDays, label: 'Peak Month', value: peakMonth.month, sub: `£${(peakMonth.total / 1000).toFixed(0)}k projected` },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent ? 'border-gold/30 bg-champagne/20' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.accent ? 'gold-gradient' : 'bg-muted'}`}>
              <s.icon className={`w-4 h-4 ${s.accent ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="card-premium p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-5">12-Month Revenue Forecast</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(34 18% 89%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(25 8% 48%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(25 8% 48%)' }} tickFormatter={v => `£${v / 1000}k`} />
              <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`} contentStyle={{ borderRadius: 8, border: '1px solid hsl(34 18% 89%)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="existingAccounts" stackId="1" name="Existing Accounts" fill="hsl(34 52% 50% / 0.3)" stroke="hsl(34 52% 50%)" />
              <Area type="monotone" dataKey="prospectPipeline" stackId="1" name="Prospect Pipeline" fill="hsl(152 40% 38% / 0.2)" stroke="hsl(152 40% 38%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <Gift className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Promotional Campaigns</h3>
          </div>
          <div className="space-y-4">
            {promotionalCampaigns.map(c => (
              <div key={c.id} className={`rounded-xl p-4 border ${c.status === 'active' ? 'border-gold/20 bg-champagne/10' : c.status === 'upcoming' ? 'border-border/20 bg-cream/30' : 'border-border/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">{c.name}</h4>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-success-light text-success' : c.status === 'upcoming' ? 'bg-info-light text-info' : 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{c.description}</p>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>{c.startDate} – {c.endDate}</span>
                  <span>{c.targetRetailerCount} retailers</span>
                  <span className="text-gold-dark font-medium">{c.estimatedImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <BarChart3 className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Pipeline by County</h3>
          </div>
          {countyForecast.length > 0 ? (
            <div className="space-y-3">
              {countyForecast.sort((a, b) => b.prospects - a.prospects).map(c => (
                <div key={c.county} className="flex items-center gap-4">
                  <span className="text-sm text-foreground w-28">{c.county}</span>
                  <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-gold/50 rounded-full transition-all duration-700" style={{ width: `${(c.prospects / countyForecast[0].prospects) * 100}%` }} />
                  </div>
                  <div className="flex gap-4 text-xs min-w-[140px] justify-end">
                    <span className="text-muted-foreground">{c.qualified} qualified</span>
                    <span className="text-gold-dark font-semibold">{c.prospects} total</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No pipeline data yet.</p>
          )}
          <div className="divider-gold mt-5 mb-4 opacity-40" />
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Opening Order</span>
              <span className="font-medium text-foreground">{performanceBenchmarks.averageOpeningOrder}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bracelet:Charm Ratio</span>
              <span className="font-medium text-foreground">{performanceBenchmarks.braceletToCharmRatio}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Peak Season</span>
              <span className="font-medium text-foreground">{performanceBenchmarks.bestSeason}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium p-6 border-gold/20">
        <div className="flex items-center gap-2.5 mb-4">
          <Zap className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">AI Seasonal Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Christmas Window (Oct–Dec)', text: 'Expect 38% of annual revenue. Begin outreach to all qualified retailers by September. Christmas gift sets and limited editions drive highest margins.', urgent: true },
            { title: "Valentine's / Mother's Day (Jan–Mar)", text: "Combined 53% of Q1 revenue. Heart and family charms perform exceptionally. Tourist retailers see lower seasonal impact — focus on town-centre jewellers." },
            { title: 'Summer Tourist Season (Jun–Aug)', text: 'Coastal and tourist-town retailers peak. Composable concept works as "meaningful souvenir" purchase. Cornwall and Dorset coast retailers outperform.' },
          ].map(insight => (
            <div key={insight.title} className={`bg-cream/50 rounded-lg p-4 border ${insight.urgent ? 'border-gold/20' : 'border-border/15'}`}>
              <h4 className="text-xs font-semibold text-foreground mb-1.5">{insight.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
