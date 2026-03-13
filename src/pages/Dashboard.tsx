import { mockRetailers, COUNTIES, PIPELINE_STAGES, getTotalPipelineValue, discoveredProspects, weeklyBriefing, calendarEvents } from "@/data/mockData";
import { TrendingUp, Users, Target, Gem, MapPin, ArrowUpRight, Sparkles, Calendar, Brain, Radar, Zap, FileText, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";

const highPriority = mockRetailers.filter(r => r.outreach.outreachPriority === 'high').sort((a, b) => b.priorityScore - a.priorityScore);
const pipelineValue = getTotalPipelineValue();
const qualified = mockRetailers.filter(r => r.qualificationStatus === 'qualified');
const meetings = mockRetailers.filter(r => r.activity.meetingScheduled);
const newDiscoveries = discoveredProspects.filter(d => d.status === 'new');
const upcomingEvents = calendarEvents.filter(e => e.date >= '2025-06-10').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);

const recommended = mockRetailers
  .filter(r => r.aiIntelligence.confidenceLevel === 'high' || r.performancePrediction.predictionConfidence === 'high')
  .sort((a, b) => b.priorityScore - a.priorityScore)
  .slice(0, 5);

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground">AI Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Gem className="w-5 h-5 text-gold" />
            <span className="text-sm font-display font-medium text-foreground italic">Nomination Italy</span>
          </div>
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

      {/* Weekly AI Briefing */}
      <div className="card-premium p-6 border-gold/20 bg-champagne/5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
              <FileText className="w-4 h-4" style={{ color: 'hsl(var(--sidebar-background))' }} />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">Emma's Opportunity Briefing</h3>
              <p className="text-[10px] text-muted-foreground">Week of {weeklyBriefing.weekOf} · AI-generated weekly intelligence</p>
            </div>
          </div>
          <div className="flex gap-3 text-center">
            <div><p className="text-lg font-display font-bold text-foreground">{weeklyBriefing.meetingsThisWeek}</p><p className="text-[8px] text-muted-foreground uppercase">Meetings</p></div>
            <div><p className="text-lg font-display font-bold text-foreground">{weeklyBriefing.followUpsNeeded}</p><p className="text-[8px] text-muted-foreground uppercase">Follow Ups</p></div>
            <div><p className="text-lg font-display font-bold text-foreground">{weeklyBriefing.newDiscoveries}</p><p className="text-[8px] text-muted-foreground uppercase">New Leads</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <p className="section-header text-[9px] mb-3">Top Accounts to Contact This Week</p>
            <div className="space-y-2">
              {weeklyBriefing.topAccountsToContact.map((a, i) => (
                <div key={a.name} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-card border border-border/15">
                  <span className="text-xs text-gold font-display font-bold w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{a.reason}</p>
                  </div>
                  <span className={`text-sm font-display font-bold ${a.priority >= 90 ? 'score-excellent' : 'score-good'}`}>{a.priority}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-cream/50 rounded-lg p-4 border border-border/15">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                <h4 className="text-xs font-semibold text-foreground">Territory Insight</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic font-display">{weeklyBriefing.territoryInsight}</p>
            </div>
            <div className="bg-cream/50 rounded-lg p-4 border border-gold/15">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                <h4 className="text-xs font-semibold text-foreground">Performance Tip</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic font-display">{weeklyBriefing.performanceTip}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommended This Week */}
      <div className="card-premium p-6 border-gold/20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--sidebar-background))' }} />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-foreground">Recommended Accounts This Week</h3>
              <p className="text-[10px] text-muted-foreground">AI-selected based on predicted value, fit, and outreach readiness</p>
            </div>
          </div>
          <button onClick={() => navigate('/intelligence')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
            Intelligence Dashboard <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {recommended.map((r, i) => (
            <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-champagne/15 transition-colors cursor-pointer group border border-border/10">
              <span className="text-xs text-gold font-display font-bold w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.town} · {r.category.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <span className={`text-sm font-display font-bold ${r.priorityScore >= 90 ? 'score-excellent' : 'score-good'}`}>{r.priorityScore}</span>
                  <p className="text-[8px] text-muted-foreground uppercase">Priority</p>
                </div>
                <div className="text-center">
                  <span className="text-sm font-display font-bold text-foreground">{r.performancePrediction.predictedAnnualValue.split('–')[0]}</span>
                  <p className="text-[8px] text-muted-foreground uppercase">Predicted</p>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  r.aiIntelligence.confidenceLevel === 'high' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                }`}>{r.aiIntelligence.confidenceLevel} confidence</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upcoming schedule */}
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-display font-semibold text-foreground">Upcoming Schedule</h3>
            <button onClick={() => navigate('/calendar')} className="text-xs text-gold hover:text-gold-dark flex items-center gap-1 font-medium">
              Calendar <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map(ev => {
              const iconMap: Record<string, typeof Phone> = { meeting: Users, call: Phone, visit: MapPin, follow_up: Calendar, admin: FileText, campaign: Calendar };
              const Icon = iconMap[ev.type] || Calendar;
              const clsMap: Record<string, string> = { meeting: 'bg-champagne text-gold-dark', call: 'bg-success-light text-success', visit: 'bg-warning-light text-warning', follow_up: 'bg-info-light text-info', admin: 'bg-muted text-muted-foreground', campaign: 'bg-champagne text-gold-dark' };
              return (
                <div key={ev.id} className="flex items-center gap-3 py-2.5 border-b border-border/10 last:border-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${clsMap[ev.type] || 'bg-muted'}`}>
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ev.retailerName || ev.title}</p>
                    <p className="text-[10px] text-muted-foreground">{ev.date} · {ev.time}</p>
                  </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline */}
        <div className="card-premium p-6">
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

        {/* Forecast preview */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-display font-semibold text-foreground">Revenue Forecast</h3>
            <button onClick={() => navigate('/forecast')} className="text-xs text-gold hover:text-gold-dark flex items-center gap-1 font-medium">
              Full Forecast <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-cream/50 rounded-lg">
              <p className="text-lg font-display font-bold shimmer-gold">£180k</p>
              <p className="text-[9px] text-muted-foreground uppercase">Annual Target</p>
            </div>
            <div className="text-center p-3 bg-cream/50 rounded-lg">
              <p className="text-lg font-display font-bold text-foreground">£95k</p>
              <p className="text-[9px] text-muted-foreground uppercase">Existing</p>
            </div>
            <div className="text-center p-3 bg-cream/50 rounded-lg">
              <p className="text-lg font-display font-bold text-foreground">£54k</p>
              <p className="text-[9px] text-muted-foreground uppercase">Pipeline</p>
            </div>
          </div>
          <div className="bg-cream/30 rounded-lg p-3 border border-gold/10">
            <p className="text-[11px] text-muted-foreground italic font-display">Christmas season (Oct–Dec) represents 38% of annual revenue. Begin pre-season outreach in September for maximum impact.</p>
          </div>
        </div>
      </div>

      {/* AI Discovery Alert */}
      {newDiscoveries.length > 0 && (
        <div className="card-premium p-5 border-gold/20 bg-champagne/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <Radar className="w-4 h-4 text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{newDiscoveries.length} new prospects discovered by AI</p>
                <p className="text-[10px] text-muted-foreground">Review AI-identified retailers in the Discovery Engine</p>
              </div>
            </div>
            <button onClick={() => navigate('/discovery')} className="text-xs text-gold hover:text-gold-dark font-medium flex items-center gap-1">
              Review <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

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
                {['Retailer', 'Location', 'Category', 'Fit', 'Priority', 'Predicted Value', 'Confidence'].map(h => (
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
                  <td className="py-3.5 text-sm text-foreground">{r.performancePrediction.predictedAnnualValue}</td>
                  <td className="py-3.5 text-right">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      r.performancePrediction.predictionConfidence === 'high' ? 'bg-success-light text-success' :
                      r.performancePrediction.predictionConfidence === 'medium' ? 'bg-warning-light text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>{r.performancePrediction.predictionConfidence}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
