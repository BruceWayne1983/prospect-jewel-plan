import { COUNTIES, PIPELINE_STAGES } from "@/data/constants";
import { useRetailers, getOutreach, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";
import { useDataInsights } from "@/hooks/useDataInsights";
import { TrendingUp, Users, Target, MapPin, ArrowUpRight, Sparkles, Calendar, Brain, Radar, Zap, FileText, Phone, Loader2, BarChart3, Database } from "lucide-react";
import nominationLogo from "@/assets/nomination-logo.webp";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();
  const dataInsights = useDataInsights();
  const [prospectCount, setProspectCount] = useState(0);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);

  useEffect(() => {
    supabase.from("discovered_prospects").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setProspectCount(count ?? 0));
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("profiles").select("display_name").eq("user_id", data.user.id).single().then(({ data: p }) => setProfile(p));
      }
    });
  }, []);

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const highPriority = retailers.filter(r => getOutreach(r).outreachPriority === 'high').sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
  const qualified = retailers.filter(r => r.qualification_status === 'qualified');
  const meetings = retailers.filter(r => getActivity(r).meetingScheduled);
  const recommended = retailers.filter(r => getAIIntelligence(r).confidenceLevel === 'high' || getPerformancePrediction(r).predictionConfidence === 'high').sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)).slice(0, 5);

  const displayName = profile?.display_name?.split(' ')[0] ?? 'there';

  const stats = [
    { label: "Total Accounts", value: retailers.length.toString(), icon: Users, sub: "South West & South Wales" },
    { label: "Qualified", value: qualified.length.toString(), icon: Target, sub: "Passed brand fit evaluation" },
    { label: "Pipeline Active", value: `${retailers.filter(r => r.pipeline_stage !== 'rejected').length}`, icon: TrendingUp, sub: "Active in pipeline", accent: true },
    { label: "Meetings Booked", value: meetings.length.toString(), icon: Calendar, sub: "Active conversations" },
  ];

  const countyData = COUNTIES.map(c => {
    const rs = retailers.filter(r => r.county === c);
    if (rs.length === 0) return null;
    const avgFit = Math.round(rs.reduce((s, r) => s + (r.fit_score ?? 0), 0) / rs.length);
    return { county: c, count: rs.length, avgFit };
  }).filter(Boolean) as { county: string; count: number; avgFit: number }[];

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Good morning, {displayName}</p>
          <h1 className="page-title">Territory Overview</h1>
          <p className="page-subtitle">South West UK & South Wales · Nomination Brand Development</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] text-muted-foreground">AI Active</span>
          </div>
          <img src={nominationLogo} alt="Nomination Italy" className="h-6 w-auto object-contain" />
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

      {/* AI Recommended */}
      {recommended.length > 0 && (
        <div className="card-premium p-6 border-gold/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--sidebar-background))' }} />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-foreground">Recommended Accounts</h3>
                <p className="text-[10px] text-muted-foreground">AI-selected based on predicted value, fit, and outreach readiness</p>
              </div>
            </div>
            <button onClick={() => navigate('/intelligence')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              Intelligence Dashboard <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recommended.map((r, i) => {
              const pred = getPerformancePrediction(r);
              const ai = getAIIntelligence(r);
              return (
                <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-champagne/15 transition-colors cursor-pointer group border border-border/10">
                  <span className="text-xs text-gold font-display font-bold w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.town} · {r.category.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className={`text-sm font-display font-bold ${(r.priority_score ?? 0) >= 90 ? 'score-excellent' : 'score-good'}`}>{r.priority_score ?? 0}</span>
                      <p className="text-[8px] text-muted-foreground uppercase">Priority</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-display font-bold text-foreground">{pred.predictedAnnualValue}</span>
                      <p className="text-[8px] text-muted-foreground uppercase">Predicted</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${ai.confidenceLevel === 'high' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}>{ai.confidenceLevel} confidence</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Status Breakdown */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Account Status</h3>
          <div className="space-y-3">
            {[
              { label: 'New Leads', count: retailers.filter(r => r.pipeline_stage === 'new_lead').length, color: 'bg-info/60' },
              { label: 'Research / Qualified', count: retailers.filter(r => ['research_needed', 'qualified'].includes(r.pipeline_stage)).length, color: 'bg-warning/60' },
              { label: 'Outreach / Contacted', count: retailers.filter(r => ['priority_outreach', 'contacted', 'follow_up_needed'].includes(r.pipeline_stage)).length, color: 'bg-gold/60' },
              { label: 'Meeting / Review', count: retailers.filter(r => ['meeting_booked', 'under_review'].includes(r.pipeline_stage)).length, color: 'bg-success/60' },
              { label: 'Approved', count: retailers.filter(r => r.pipeline_stage === 'approved').length, color: 'bg-success' },
              { label: 'Rejected', count: retailers.filter(r => r.pipeline_stage === 'rejected').length, color: 'bg-destructive/40' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground w-32 truncate">{s.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${retailers.length > 0 ? (s.count / retailers.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-display font-semibold text-foreground w-5 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Territory Summary */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Territory Summary</h3>
          {countyData.length > 0 ? (
            <div className="space-y-3">
              {countyData.sort((a, b) => b.count - a.count).slice(0, 10).map((c) => (
                <div key={c.county} className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 w-28">
                    <MapPin className="w-3 h-3 text-gold" strokeWidth={1.5} />
                    <span className="text-[11px] text-foreground truncate">{c.county}</span>
                  </div>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 rounded-full" style={{ width: `${(c.count / countyData[0].count) * 100}%` }} />
                  </div>
                  <div className="flex gap-3 text-[10px]">
                    <span className="text-muted-foreground w-10">{c.count}</span>
                    <span className="text-gold-dark font-medium w-10 text-right">{c.avgFit}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No retailers yet.</p>
          )}
        </div>

        {/* Pipeline Stages */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Pipeline Stages</h3>
          <div className="space-y-3">
            {PIPELINE_STAGES.filter(s => s.key !== 'rejected').map((stage) => {
              const count = retailers.filter(r => r.pipeline_stage === stage.key).length;
              const pct = retailers.length > 0 ? (count / retailers.length) * 100 : 0;
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
      </div>

      {/* Recent Activity / Calendar Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-display font-semibold text-foreground">Recent Pipeline Activity</h3>
            <button onClick={() => navigate('/pipeline')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              Pipeline <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {retailers.length > 0 ? (
            <div className="space-y-2.5">
              {[...retailers].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 8).map(r => (
                <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-champagne/15 cursor-pointer transition-colors border border-border/10">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.town}, {r.county}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      r.pipeline_stage === 'approved' ? 'bg-success-light text-success' :
                      r.pipeline_stage === 'meeting_booked' ? 'bg-info-light text-info' :
                      r.pipeline_stage === 'priority_outreach' ? 'bg-warning-light text-warning' :
                      'bg-muted text-muted-foreground'
                    }`}>{PIPELINE_STAGES.find(s => s.key === r.pipeline_stage)?.label}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(r.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No activity yet.</p>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Accounts by Category</h3>
          {retailers.length > 0 ? (
            <div className="space-y-3">
              {[
                { key: 'jeweller', label: 'Jewellers' },
                { key: 'gift_shop', label: 'Gift Shops' },
                { key: 'fashion_boutique', label: 'Fashion Boutiques' },
                { key: 'lifestyle_store', label: 'Lifestyle Stores' },
                { key: 'premium_accessories', label: 'Premium Accessories' },
                { key: 'concept_store', label: 'Concept Stores' },
              ].map(cat => {
                const count = retailers.filter(r => r.category === cat.key).length;
                const avgFit = count > 0 ? Math.round(retailers.filter(r => r.category === cat.key).reduce((s, r) => s + (r.fit_score ?? 0), 0) / count) : 0;
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-32 truncate">{cat.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gold/50 rounded-full transition-all duration-700" style={{ width: `${retailers.length > 0 ? (count / retailers.length) * 100 : 0}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <span className="text-muted-foreground w-6">{count}</span>
                      <span className="text-gold-dark font-medium w-10 text-right">{avgFit}% fit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No accounts yet.</p>
          )}
        </div>
      </div>

      {/* AI Discovery Alert */}
      {prospectCount > 0 && (
        <div className="card-premium p-5 border-gold/20 bg-champagne/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                <Radar className="w-4 h-4 text-gold" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{prospectCount} new prospects discovered by AI</p>
                <p className="text-[10px] text-muted-foreground">Review AI-identified retailers in the Discovery Engine</p>
              </div>
            </div>
            <button onClick={() => navigate('/discovery')} className="text-xs text-gold hover:text-gold-dark font-medium flex items-center gap-1">
              Review <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Priority Outreach */}
      {highPriority.length > 0 && (
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
                {highPriority.slice(0, 6).map((r) => {
                  const pred = getPerformancePrediction(r);
                  return (
                    <tr key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="border-b border-border/15 hover:bg-champagne/20 transition-colors cursor-pointer group">
                      <td className="py-3.5 pl-0 text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</td>
                      <td className="py-3.5 text-sm text-muted-foreground">{r.town}</td>
                      <td className="py-3.5"><span className="badge-category">{r.category.replace('_', ' ')}</span></td>
                      <td className="py-3.5"><div className="w-20"><ScoreBar score={r.fit_score ?? 0} label="" /></div></td>
                      <td className="py-3.5"><span className={`text-sm font-display font-bold ${(r.priority_score ?? 0) >= 90 ? 'score-excellent' : 'score-good'}`}>{r.priority_score ?? 0}</span></td>
                      <td className="py-3.5 text-sm text-foreground">{pred.predictedAnnualValue}</td>
                      <td className="py-3.5 text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${pred.predictionConfidence === 'high' ? 'bg-success-light text-success' : pred.predictionConfidence === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>{pred.predictionConfidence}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Hub Insights */}
      {!dataInsights.loading && dataInsights.analysedFiles > 0 && (
        <div className="card-premium p-6 border-gold/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <Database className="w-4 h-4" style={{ color: 'hsl(var(--sidebar-background))' }} />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-foreground">Data Hub Insights</h3>
                <p className="text-[10px] text-muted-foreground">Extracted from {dataInsights.analysedFiles} analysed file(s)</p>
              </div>
            </div>
            <button onClick={() => navigate('/data-hub')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              Data Hub <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {dataInsights.aggregatedMetrics.total_revenue > 0 && (
              <div className="bg-cream/30 rounded-lg p-3 text-center">
                <p className="text-xl font-display font-bold text-foreground">£{(dataInsights.aggregatedMetrics.total_revenue / 1000).toFixed(0)}k</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Revenue</p>
              </div>
            )}
            {dataInsights.aggregatedMetrics.total_accounts > 0 && (
              <div className="bg-cream/30 rounded-lg p-3 text-center">
                <p className="text-xl font-display font-bold text-foreground">{dataInsights.aggregatedMetrics.total_accounts}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Accounts</p>
              </div>
            )}
            {dataInsights.aggregatedMetrics.average_order_value > 0 && (
              <div className="bg-cream/30 rounded-lg p-3 text-center">
                <p className="text-xl font-display font-bold text-foreground">£{dataInsights.aggregatedMetrics.average_order_value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Order Value</p>
              </div>
            )}
            {dataInsights.aggregatedMetrics.growth_rate && (
              <div className="bg-cream/30 rounded-lg p-3 text-center">
                <p className="text-xl font-display font-bold text-success">{dataInsights.aggregatedMetrics.growth_rate}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Growth Rate</p>
              </div>
            )}
          </div>

          {dataInsights.allStockists.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Current Stockists from Data ({dataInsights.allStockists.length})</p>
              <div className="flex flex-wrap gap-2">
                {dataInsights.allStockists.slice(0, 12).map((s, i) => (
                  <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-champagne/30 text-foreground border border-gold/10">
                    {s.name}{s.town ? ` · ${s.town}` : ''}{s.sales_value ? ` · £${s.sales_value.toLocaleString()}` : ''}
                  </span>
                ))}
                {dataInsights.allStockists.length > 12 && (
                  <span className="text-[10px] px-2.5 py-1 text-muted-foreground">+{dataInsights.allStockists.length - 12} more</span>
                )}
              </div>
            </div>
          )}

          {dataInsights.allInsights.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Key Insights</p>
              <div className="space-y-1.5">
                {dataInsights.allInsights.slice(0, 5).map((insight, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {retailers.length === 0 && (
        <div className="card-premium p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-display font-semibold text-foreground mb-2">No retailers in your pipeline</h3>
          <p className="text-sm text-muted-foreground mb-4">Run an AI scan in the Discovery Engine and promote accepted prospects to build your pipeline.</p>
          <button onClick={() => navigate('/discovery')} className="text-xs text-gold hover:text-gold-dark font-medium">Go to Discovery Engine →</button>
        </div>
      )}
    </div>
  );
}

function getActivity(r: any) {
  const a = (r.activity ?? {}) as Record<string, any>;
  return { meetingScheduled: a.meetingScheduled ?? false };
}
