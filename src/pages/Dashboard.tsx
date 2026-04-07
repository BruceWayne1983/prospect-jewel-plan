import { COUNTIES, PIPELINE_STAGES } from "@/data/constants";
import { useRetailers, getOutreach, getPerformancePrediction, getAIIntelligence, getActivity } from "@/hooks/useRetailers";
import { useDataInsights } from "@/hooks/useDataInsights";
import { TrendingUp, Users, Target, MapPin, ArrowUpRight, Sparkles, Calendar, Brain, Radar, Zap, FileText, Phone, Loader2, BarChart3, Database, PoundSterling, Store, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import nominationLogo from "@/assets/nomination-logo.webp";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { EarningsTracker } from "@/components/earnings/EarningsTracker";
import { AlertsSection, computeAlerts } from "@/components/accounts/BillingAlerts";
import { EmmaAssistant } from "@/components/dashboard/EmmaAssistant";

export default function Dashboard() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();
  const dataInsights = useDataInsights();
  const [prospectCount, setProspectCount] = useState(0);
  const [profile, setProfile] = useState<{ display_name: string | null } | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Tables<"calendar_events">[]>([]);
  const [allEvents, setAllEvents] = useState<Tables<"calendar_events">[]>([]);
  const [recentActivity, setRecentActivity] = useState<Tables<"activity_log">[]>([]);

  useEffect(() => {
    supabase.from("discovered_prospects").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setProspectCount(count ?? 0));
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("profiles").select("display_name").eq("user_id", data.user.id).single().then(({ data: p }) => setProfile(p));
        // Fetch upcoming calendar events
        const today = new Date().toISOString().split("T")[0];
        supabase.from("calendar_events").select("*").eq("user_id", data.user.id).gte("date", today).eq("completed", false).order("date", { ascending: true }).limit(6).then(({ data: events }) => setUpcomingEvents(events ?? []));
        // Fetch all events for alerts
        supabase.from("calendar_events").select("*").eq("user_id", data.user.id).then(({ data: events }) => setAllEvents(events ?? []));
        // Fetch recent activity
        supabase.from("activity_log").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(8).then(({ data: acts }) => setRecentActivity(acts ?? []));
      }
    });
  }, []);

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  // Core segments
  const currentAccounts = retailers.filter(r => r.pipeline_stage === "approved" || r.pipeline_stage === "retention_risk" || r.pipeline_stage === "dormant");
  const activeProspects = retailers.filter(r => !["approved", "rejected", "retention_risk", "dormant"].includes(r.pipeline_stage));
  const highPriority = retailers.filter(r => getOutreach(r).outreachPriority === "high").sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0));
  const atRisk = currentAccounts.filter(r => (r.risk_flags ?? []).length > 0);
  const withMeetings = retailers.filter(r => getActivity(r).meetingScheduled);
  const needsFollowUp = retailers.filter(r => r.pipeline_stage === "follow_up_needed");
  const recommended = retailers.filter(r => getAIIntelligence(r).confidenceLevel === "high" || getPerformancePrediction(r).predictionConfidence === "high").sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)).slice(0, 5);

  const displayName = profile?.display_name?.split(" ")[0] ?? "there";

  // Sales value calculations
  const portfolioValue = currentAccounts.reduce((s, r) => {
    const val = String(getPerformancePrediction(r).predictedAnnualValue).replace(/[^0-9.]/g, "");
    return s + (parseFloat(val) || 0);
  }, 0);
  const prospectPipelineValue = activeProspects.reduce((s, r) => {
    const val = String(getPerformancePrediction(r).predictedAnnualValue).replace(/[^0-9.]/g, "");
    return s + (parseFloat(val) || 0);
  }, 0);
  const avgFitCurrent = currentAccounts.length > 0
    ? Math.round(currentAccounts.reduce((s, r) => s + (r.fit_score ?? 0), 0) / currentAccounts.length) : 0;

  const formatValue = (v: number) => v >= 1000 ? `£${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `£${v.toFixed(0)}`;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
          <p className="section-header mb-2">{greeting}, {displayName}</p>
          <h1 className="page-title">Territory Overview</h1>
          <p className="page-subtitle">Emma Louise Lux · Nomination Brand Development · South West UK & South Wales</p>
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

      {/* Proactive Alerts */}
      <AlertsSection alerts={computeAlerts(retailers, allEvents)} maxItems={5} />

      {/* Earnings Summary */}
      <EarningsTracker retailers={retailers} compact />

      {/* Territory Revenue Dashboard */}
      {(() => {
        const billingAccounts = currentAccounts.filter(r => r.billing_2026_ytd || r.billing_2025_full_year);
        if (billingAccounts.length === 0) return null;

        const totalYtd = billingAccounts.reduce((s, r) => s + Number(r.billing_2026_ytd || 0), 0);
        const totalPriorYear = billingAccounts.reduce((s, r) => s + Number(r.billing_2025_full_year || 0), 0);
        const currentMonth = new Date().getMonth() + 1;
        const priorYearProrated = totalPriorYear > 0 ? (totalPriorYear / 12) * currentMonth : 0;
        const ytdChangePct = priorYearProrated > 0 ? Math.round(((totalYtd - priorYearProrated) / priorYearProrated) * 1000) / 10 : null;

        // Revenue at risk: accounts with historical spend but zero/declining 2026
        const revenueAtRisk = currentAccounts.reduce((s, r) => {
          const b2024 = Number(r.billing_2024_full_year || 0);
          const b2025 = Number(r.billing_2025_full_year || 0);
          const b2026ytd = Number(r.billing_2026_ytd || 0);
          const historicalBest = Math.max(b2024, b2025);
          if (historicalBest > 0 && b2026ytd === 0) return s + historicalBest;
          if (historicalBest > 0 && b2026ytd > 0) {
            const projected = b2026ytd * (12 / currentMonth);
            const decline = historicalBest - projected;
            if (decline > historicalBest * 0.3) return s + decline;
          }
          return s;
        }, 0);

        const sortedByBilling = [...billingAccounts]
          .sort((a, b) => Number(b.billing_2026_ytd || 0) - Number(a.billing_2026_ytd || 0));
        const top5 = sortedByBilling.slice(0, 5);
        const bottom5 = sortedByBilling.filter(r => Number(r.billing_2026_ytd || 0) > 0).slice(-5).reverse();

        return (
          <div className="card-premium p-5 border-gold/20 bg-champagne/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <PoundSterling className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">Territory Revenue</h3>
                  <p className="text-[10px] text-muted-foreground">From {billingAccounts.length} accounts with billing data</p>
                </div>
              </div>
              <button onClick={() => navigate("/accounts")} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
                Accounts <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                <p className="text-xl font-display font-bold text-foreground">£{(totalYtd / 1000).toFixed(1)}k</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">2026 YTD</p>
              </div>
              {totalPriorYear > 0 && (
                <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                  <p className="text-xl font-display font-bold text-foreground">£{(totalPriorYear / 1000).toFixed(0)}k</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">2025 Full Year</p>
                </div>
              )}
              {ytdChangePct !== null && (
                <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                  <p className={`text-xl font-display font-bold ${ytdChangePct >= 0 ? "text-success" : "text-destructive"}`}>
                    {ytdChangePct >= 0 ? "+" : ""}{ytdChangePct}%
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">YTD vs Prior Year</p>
                </div>
              )}
              <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                <p className="text-xl font-display font-bold text-foreground">{billingAccounts.length}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Billing Accounts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top 5 */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-success" /> Top 5 by YTD Billing
                </p>
                <div className="space-y-1">
                  {top5.map((r, i) => (
                    <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-champagne/15 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-gold font-display font-bold w-4">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                          <p className="text-[9px] text-muted-foreground">{r.town}</p>
                        </div>
                      </div>
                      <span className="text-xs font-display font-bold text-foreground flex-shrink-0">
                        £{Number(r.billing_2026_ytd || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom 5 (at-risk) */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-warning" /> Bottom 5 — Attention Needed
                </p>
                <div className="space-y-1">
                  {bottom5.map((r, i) => (
                    <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-champagne/15 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] text-warning font-display font-bold w-4">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                          <p className="text-[9px] text-muted-foreground">{r.town}</p>
                        </div>
                      </div>
                      <span className="text-xs font-display font-bold text-warning flex-shrink-0">
                        £{Number(r.billing_2026_ytd || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Key Sales Metrics - Top Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Current Accounts", value: currentAccounts.length.toString(), icon: Store, sub: "Active stockists", accent: true, link: "/accounts" },
          { label: "Portfolio Value", value: formatValue(portfolioValue), icon: PoundSterling, sub: "Predicted annual", accent: true, link: "/accounts" },
          { label: "Active Prospects", value: activeProspects.length.toString(), icon: Target, sub: "In pipeline", link: "/pipeline" },
          { label: "Pipeline Value", value: formatValue(prospectPipelineValue), icon: TrendingUp, sub: "Prospect potential", link: "/pipeline" },
          { label: "Meetings Booked", value: withMeetings.length.toString(), icon: Calendar, sub: "Scheduled", link: "/calendar" },
          { label: "Follow-ups Due", value: needsFollowUp.length.toString(), icon: Clock, sub: "Need action", link: "/pipeline" },
        ].map((s) => (
          <div key={s.label} onClick={() => navigate(s.link)} className={`stat-card cursor-pointer hover:border-gold/30 transition-all ${'accent' in s && s.accent ? "border-gold/20 bg-champagne/15" : ""}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${'accent' in s && s.accent ? "gold-gradient shadow-sm" : "bg-muted"}`}>
                <s.icon className={`w-4 h-4 ${'accent' in s && s.accent ? "text-card" : "text-muted-foreground"}`} strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground tracking-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[9px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Data Hub Sales Summary - if data available */}
      {!dataInsights.loading && dataInsights.analysedFiles > 0 && (
        <div className="card-premium p-5 border-gold/20 bg-champagne/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <BarChart3 className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
              </div>
              <div>
                <h3 className="text-base font-display font-semibold text-foreground">Current Sales Performance</h3>
                <p className="text-[10px] text-muted-foreground">From {dataInsights.analysedFiles} analysed file(s) in Data Hub</p>
              </div>
            </div>
            <button onClick={() => navigate("/data-hub")} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              Data Hub <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {dataInsights.aggregatedMetrics.total_revenue > 0 && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                <p className="text-xl font-display font-bold text-foreground">£{(dataInsights.aggregatedMetrics.total_revenue / 1000).toFixed(0)}k</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Revenue</p>
              </div>
            )}
            {dataInsights.aggregatedMetrics.total_accounts > 0 && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                <p className="text-xl font-display font-bold text-foreground">{dataInsights.aggregatedMetrics.total_accounts}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Data Accounts</p>
              </div>
            )}
            {dataInsights.aggregatedMetrics.average_order_value > 0 && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                <p className="text-xl font-display font-bold text-foreground">£{dataInsights.aggregatedMetrics.average_order_value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Order Value</p>
              </div>
            )}
            {dataInsights.aggregatedMetrics.growth_rate && (
              <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
                <p className="text-xl font-display font-bold text-success">{dataInsights.aggregatedMetrics.growth_rate}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Growth Rate</p>
              </div>
            )}
          </div>
          {/* Sales Patterns */}
          {dataInsights.allSalesPatterns.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Sales Periods</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {dataInsights.allSalesPatterns.slice(0, 6).map((sp, i) => (
                  <div key={i} className="flex items-center justify-between bg-background/40 rounded-lg px-3 py-2 border border-border/10">
                    <span className="text-[11px] text-foreground font-medium">{sp.period}</span>
                    <div className="flex items-center gap-2">
                      {sp.revenue && <span className="text-[10px] text-gold-dark font-medium">£{sp.revenue.toLocaleString()}</span>}
                      {sp.units && <span className="text-[10px] text-muted-foreground">{sp.units} units</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Key Insights */}
          {dataInsights.allInsights.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Key Insights</p>
              <div className="space-y-1.5">
                {dataInsights.allInsights.slice(0, 4).map((insight, i) => (
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

      {/* Alerts Row - At Risk + Follow-ups + Discovery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* At-Risk Accounts */}
        <div className={`card-premium p-5 ${atRisk.length > 0 ? "border-warning/20" : ""}`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className={`w-4 h-4 ${atRisk.length > 0 ? "text-warning" : "text-muted-foreground/40"}`} />
            <h3 className="text-sm font-display font-semibold text-foreground">At-Risk Accounts</h3>
            <span className="text-[10px] ml-auto text-muted-foreground">{atRisk.length}</span>
          </div>
          {atRisk.length > 0 ? (
            <div className="space-y-2">
              {atRisk.slice(0, 4).map(r => (
                <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-champagne/15 cursor-pointer transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[9px] text-warning truncate">{(r.risk_flags ?? [])[0]}</p>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/50 italic">No risk flags — all accounts healthy</p>
          )}
        </div>

        {/* Upcoming Actions */}
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-display font-semibold text-foreground">Upcoming Actions</h3>
            <button onClick={() => navigate("/calendar")} className="text-[10px] text-gold hover:text-gold-dark ml-auto flex items-center gap-0.5">
              Calendar <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          </div>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map(e => (
                <div key={e.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-muted/30">
                  <div className="text-center w-10 flex-shrink-0">
                    <p className="text-xs font-display font-bold text-foreground">{new Date(e.date).getDate()}</p>
                    <p className="text-[8px] text-muted-foreground uppercase">{new Date(e.date).toLocaleDateString("en-GB", { month: "short" })}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{e.retailer_name}{e.town ? ` · ${e.town}` : ""}</p>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${e.type === "visit" ? "bg-gold/15 text-gold-dark" : e.type === "call" ? "bg-info-light text-info" : "bg-muted text-muted-foreground"}`}>{e.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/50 italic">No upcoming events scheduled</p>
          )}
        </div>

        {/* AI Discovery Alert */}
        <div className="card-premium p-5">
          <div className="flex items-center gap-2 mb-3">
            <Radar className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-display font-semibold text-foreground">Discovery & Prospects</h3>
          </div>
          <div className="space-y-3">
            {prospectCount > 0 && (
              <div onClick={() => navigate("/discovery")} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-champagne/15 border border-gold/15 cursor-pointer hover:bg-champagne/25 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{prospectCount} new AI prospects</p>
                  <p className="text-[9px] text-muted-foreground">Ready for review</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-lg font-display font-bold text-foreground">{retailers.filter(r => r.pipeline_stage === "qualified").length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Qualified</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <p className="text-lg font-display font-bold text-foreground">{retailers.filter(r => r.pipeline_stage === "contacted").length}</p>
                <p className="text-[8px] text-muted-foreground uppercase">Contacted</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground">Avg Fit Score (Current)</p>
              <p className="text-lg font-display font-bold text-gold-dark">{avgFitCurrent}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommended */}
      {recommended.length > 0 && (
        <div className="card-premium p-6 border-gold/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                <Sparkles className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
              </div>
              <div>
                <h3 className="text-lg font-display font-semibold text-foreground">AI Recommended Accounts</h3>
                <p className="text-[10px] text-muted-foreground">Top picks based on predicted value, fit, and outreach readiness</p>
              </div>
            </div>
            <button onClick={() => navigate("/intelligence")} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              Intelligence <ArrowUpRight className="w-3 h-3" />
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
                    <p className="text-[10px] text-muted-foreground">{r.town} · {r.category.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className={`text-sm font-display font-bold ${(r.priority_score ?? 0) >= 90 ? "score-excellent" : "score-good"}`}>{r.priority_score ?? 0}</span>
                      <p className="text-[8px] text-muted-foreground uppercase">Priority</p>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-display font-bold text-foreground">{pred.predictedAnnualValue}</span>
                      <p className="text-[8px] text-muted-foreground uppercase">Predicted</p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${ai.confidenceLevel === "high" ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}>{ai.confidenceLevel}</span>
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
          <h3 className="text-base font-display font-semibold text-foreground mb-4">Pipeline Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: "New Leads", count: retailers.filter(r => r.pipeline_stage === "new_lead").length, color: "bg-info/60" },
              { label: "Research / Qualified", count: retailers.filter(r => ["research_needed", "qualified"].includes(r.pipeline_stage)).length, color: "bg-warning/60" },
              { label: "Outreach / Contacted", count: retailers.filter(r => ["priority_outreach", "contacted", "follow_up_needed"].includes(r.pipeline_stage)).length, color: "bg-gold/60" },
              { label: "Meeting / Review", count: retailers.filter(r => ["meeting_booked", "under_review"].includes(r.pipeline_stage)).length, color: "bg-success/60" },
              { label: "Approved (Current)", count: currentAccounts.length, color: "bg-success" },
              { label: "Rejected", count: retailers.filter(r => r.pipeline_stage === "rejected").length, color: "bg-destructive/40" },
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-semibold text-foreground">Territory Coverage</h3>
            <button onClick={() => navigate("/map")} className="text-[10px] text-gold hover:text-gold-dark flex items-center gap-0.5">
              Map <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          </div>
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

        {/* Category & Stockist Breakdown */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-semibold text-foreground">Accounts by Category</h3>
            <button onClick={() => navigate("/accounts")} className="text-[10px] text-gold hover:text-gold-dark flex items-center gap-0.5">
              Accounts <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          </div>
          {retailers.length > 0 ? (
            <div className="space-y-3">
              {[
                { key: "jeweller", label: "Jewellers" },
                { key: "gift_shop", label: "Gift Shops" },
                { key: "fashion_boutique", label: "Fashion Boutiques" },
                { key: "lifestyle_store", label: "Lifestyle Stores" },
                { key: "premium_accessories", label: "Premium Accessories" },
                { key: "concept_store", label: "Concept Stores" },
              ].map(cat => {
                const count = retailers.filter(r => r.category === cat.key).length;
                const currentCount = currentAccounts.filter(r => r.category === cat.key).length;
                return (
                  <div key={cat.key} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-32 truncate">{cat.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gold/50 rounded-full transition-all duration-700" style={{ width: `${retailers.length > 0 ? (count / retailers.length) * 100 : 0}%` }} />
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-muted-foreground w-6">{count}</span>
                      <span className="text-success font-medium w-6 text-right">{currentCount}</span>
                    </div>
                  </div>
                );
              })}
              <p className="text-[9px] text-muted-foreground text-right">Total / Current</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/50 italic">No accounts yet.</p>
          )}
        </div>
      </div>

      {/* Recent Activity & Current Stockists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pipeline Activity */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-display font-semibold text-foreground">Recent Pipeline Activity</h3>
            <button onClick={() => navigate("/pipeline")} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              Pipeline <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {retailers.length > 0 ? (
            <div className="space-y-2">
              {[...retailers].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 8).map(r => (
                <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-champagne/15 cursor-pointer transition-colors border border-border/10">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.town}, {r.county}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      r.pipeline_stage === "approved" ? "bg-success-light text-success" :
                      r.pipeline_stage === "meeting_booked" ? "bg-info-light text-info" :
                      r.pipeline_stage === "priority_outreach" ? "bg-warning-light text-warning" :
                      "bg-muted text-muted-foreground"
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

        {/* Current Stockists from Data Hub */}
        {dataInsights.allStockists.length > 0 && (
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-display font-semibold text-foreground">Current Stockists (Data Hub)</h3>
              <button onClick={() => navigate("/data-hub")} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
                Data Hub <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {dataInsights.allStockists.sort((a, b) => (b.sales_value ?? 0) - (a.sales_value ?? 0)).slice(0, 10).map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/20">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-[9px] text-muted-foreground">{s.town}{s.county ? `, ${s.county}` : ""}</p>
                  </div>
                  {s.sales_value && (
                    <span className="text-xs font-display font-bold text-gold-dark flex-shrink-0">£{s.sales_value.toLocaleString()}</span>
                  )}
                </div>
              ))}
              {dataInsights.allStockists.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center">+{dataInsights.allStockists.length - 10} more stockists</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Priority Outreach Table */}
      {highPriority.length > 0 && (
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-display font-semibold text-foreground">Priority Outreach Targets</h3>
            <button onClick={() => navigate("/prospects")} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  {["Retailer", "Location", "Category", "Fit", "Priority", "Predicted Value", "Confidence"].map(h => (
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
                      <td className="py-3.5"><span className="badge-category">{r.category.replace("_", " ")}</span></td>
                      <td className="py-3.5"><div className="w-20"><ScoreBar score={r.fit_score ?? 0} label="" /></div></td>
                      <td className="py-3.5"><span className={`text-sm font-display font-bold ${(r.priority_score ?? 0) >= 90 ? "score-excellent" : "score-good"}`}>{r.priority_score ?? 0}</span></td>
                      <td className="py-3.5 text-sm text-foreground">{pred.predictedAnnualValue}</td>
                      <td className="py-3.5 text-right">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${pred.predictionConfidence === "high" ? "bg-success-light text-success" : pred.predictionConfidence === "medium" ? "bg-warning-light text-warning" : "bg-muted text-muted-foreground"}`}>{pred.predictionConfidence}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seasonal Trends */}
      {dataInsights.seasonalTrends.length > 0 && (
        <div className="card-premium p-5">
          <h3 className="text-base font-display font-semibold text-foreground mb-3">Seasonal Trends</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dataInsights.seasonalTrends.map((st, i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-3 text-center border border-border/10">
                <p className="text-xs font-semibold text-foreground mb-1">{st.season}</p>
                {st.revenue_share && <p className="text-sm font-display font-bold text-gold-dark">{st.revenue_share}</p>}
                {st.impact && <p className="text-[9px] text-muted-foreground mt-1">{st.impact}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {retailers.length === 0 && (
        <div className="card-premium p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-display font-semibold text-foreground mb-2">No retailers in your pipeline</h3>
          <p className="text-sm text-muted-foreground mb-4">Run an AI scan in the Discovery Engine and promote accepted prospects to build your pipeline.</p>
          <button onClick={() => navigate("/discovery")} className="text-xs text-gold hover:text-gold-dark font-medium">Go to Discovery Engine →</button>
        </div>
      )}
      <EmmaAssistant
        displayName={displayName}
        context={{
          currentAccounts: currentAccounts.length,
          activeProspects: activeProspects.length,
          followUps: needsFollowUp.length,
          atRisk: atRisk.length,
          meetingsBooked: withMeetings.length,
          prospectCount,
          upcomingEvents: upcomingEvents.length,
        }}
      />
    </div>
  );
}
