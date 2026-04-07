import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRetailers, getActivity, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";
import { Loader2, Store, Search, TrendingUp, Calendar, AlertTriangle, Filter, DatabaseZap, Sparkles, PoundSterling, ShieldAlert, MapPin, Users, ArrowUpRight, Ghost, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { COUNTIES } from "@/data/constants";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ensureSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;
  await new Promise<void>((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess) { subscription.unsubscribe(); resolve(); }
    });
  });
};
import { toast } from "sonner";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AtRiskSection } from "@/components/accounts/AtRiskSection";
import { AccountHealthSummary } from "@/components/accounts/AccountHealthSummary";
import { getAccountHealth } from "@/utils/accountHealth";
import { AlertsSection, computeAlerts } from "@/components/accounts/BillingAlerts";
import type { Tables } from "@/integrations/supabase/types";

export default function CurrentAccounts() {
  const navigate = useNavigate();
  const { retailers, loading, refetch } = useRetailers();
  const [search, setSearch] = useState("");
  const [filterCounty, setFilterCounty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [viewTab, setViewTab] = useState<"all" | "alerts" | "retention" | "groups" | "winback">("all");
  const [generatingBrief, setGeneratingBrief] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [analysingAll, setAnalysingAll] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState({ done: 0, total: 0 });
  const [geocoding, setGeocoding] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<Tables<"calendar_events">[]>([]);
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: "", name: "" });
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("calendar_events").select("*").eq("user_id", data.user.id).then(({ data: events }) => setCalendarEvents(events ?? []));
      }
    });
  }, []);

  const syncFromDataHub = async () => {
    setSyncing(true);
    try {
      await ensureSession();
      const { data, error } = await supabase.functions.invoke("sync-current-accounts");
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`Synced: ${data.created} new accounts added, ${data.skipped} duplicates skipped`);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // All established (unfiltered) for stats — includes dormant
  const allEstablished = useMemo(
    () => retailers.filter((r) => r.pipeline_stage === "approved" || r.pipeline_stage === "retention_risk" || r.pipeline_stage === "dormant"),
    [retailers]
  );

  // Dormant detection: approved/retention_risk accounts with no recent billing
  const dormantAccounts = useMemo(() => {
    return allEstablished.filter(r => {
      const b2024 = Number(r.billing_2024_full_year || 0);
      const b2025 = Number(r.billing_2025_full_year || 0);
      const b2026ytd = Number(r.billing_2026_ytd || 0);
      const hadHistorical = b2024 > 0 || b2025 > 0;

      // Explicitly dormant stage
      if (r.pipeline_stage === "dormant") return true;

      // YTD 2026 is zero while historical > 0
      if (b2026ytd === 0 && hadHistorical) return true;

      // Check billing_history for recency
      const bh = (r.billing_history ?? {}) as Record<string, any>;
      const monthly = Array.isArray(bh.monthly) ? bh.monthly : [];
      if (monthly.length > 0) {
        const lastEntry = monthly[monthly.length - 1];
        if (lastEntry?.month) {
          const lastDate = new Date(lastEntry.month + "-01");
          const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince > 90 && hadHistorical) return true;
        }
      }

      return false;
    }).map(r => {
      const b2024 = Number(r.billing_2024_full_year || 0);
      const b2025 = Number(r.billing_2025_full_year || 0);
      const b2026ytd = Number(r.billing_2026_ytd || 0);
      const historicalBest = Math.max(b2024, b2025);
      const revenueAtRisk = historicalBest - b2026ytd;

      // Days since last order
      const bh = (r.billing_history ?? {}) as Record<string, any>;
      const monthly = Array.isArray(bh.monthly) ? bh.monthly : [];
      let daysSinceLastOrder = 999;
      let lastOrderDate = "";
      if (monthly.length > 0) {
        const lastEntry = monthly[monthly.length - 1];
        if (lastEntry?.month) {
          lastOrderDate = lastEntry.month;
          daysSinceLastOrder = Math.floor((Date.now() - new Date(lastEntry.month + "-01").getTime()) / (1000 * 60 * 60 * 24));
        }
      } else if (b2026ytd > 0) {
        daysSinceLastOrder = 30; // has YTD so recent-ish
      } else if (b2025 > 0) {
        daysSinceLastOrder = 180;
        lastOrderDate = "2025 (est.)";
      } else if (b2024 > 0) {
        daysSinceLastOrder = 365;
        lastOrderDate = "2024 (est.)";
      }

      // Seasonal flag
      const isSeasonal = r.category === "heritage_tourist_gift" || (r.location_context ?? "").toLowerCase().includes("seasonal");

      return { ...r, historicalBest, revenueAtRisk, daysSinceLastOrder, lastOrderDate, isSeasonal, b2024, b2025, b2026ytd };
    }).sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);
  }, [allEstablished]);

  const totalRevenueAtRisk = useMemo(() => dormantAccounts.reduce((s, d) => s + Math.max(0, d.revenueAtRisk), 0), [dormantAccounts]);

  const generateWinBackBrief = async (retailer: typeof dormantAccounts[0]) => {
    setGeneratingBrief(retailer.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-briefing", {
        body: {
          retailerId: retailer.id,
          context: `WIN-BACK BRIEFING: This is a dormant account that previously generated £${retailer.historicalBest.toLocaleString()} annually. 2024: £${retailer.b2024.toLocaleString()}, 2025: £${retailer.b2025.toLocaleString()}, 2026 YTD: £${retailer.b2026ytd.toLocaleString()}. Last order approximately ${retailer.daysSinceLastOrder} days ago. Revenue at risk: £${retailer.revenueAtRisk.toLocaleString()}. Focus on: why they may have stopped ordering, what has changed, re-engagement approach, special offers or incentives to restart.`
        }
      });
      if (error) throw error;
      toast.success("Win-back brief generated — check the retailer profile");
      navigate(`/retailer/${retailer.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate brief");
    } finally {
      setGeneratingBrief(null);
    }
  };

  const retentionRisk = useMemo(() => retailers.filter(r => r.pipeline_stage === "retention_risk"), [retailers]);
  const alerts = useMemo(() => computeAlerts(allEstablished, calendarEvents), [allEstablished, calendarEvents]);

  // Group detection: group by business_group or by shared trading name
  const accountGroups = useMemo(() => {
    const groups: Record<string, typeof allEstablished> = {};
    for (const r of allEstablished) {
      const groupKey = (r as any).business_group || null;
      if (groupKey) {
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(r);
      }
    }
    // Also detect by shared name (normalised)
    const nameMap: Record<string, typeof allEstablished> = {};
    for (const r of allEstablished) {
      const norm = r.name.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").replace(/[^a-z0-9\s]/g, "").trim();
      if (!nameMap[norm]) nameMap[norm] = [];
      nameMap[norm].push(r);
    }
    for (const [name, members] of Object.entries(nameMap)) {
      if (members.length > 1) {
        const existingGroup = members.find(m => (m as any).business_group);
        const key = existingGroup ? (existingGroup as any).business_group : members[0].name;
        if (!groups[key]) groups[key] = [];
        for (const m of members) {
          if (!groups[key].find(g => g.id === m.id)) groups[key].push(m);
        }
      }
    }
    // Also detect parent_account_id groups
    for (const r of allEstablished) {
      if (r.parent_account_id) {
        const parent = allEstablished.find(p => p.id === r.parent_account_id);
        if (parent) {
          const key = (parent as any).business_group || parent.name;
          if (!groups[key]) groups[key] = [];
          if (!groups[key].find(g => g.id === parent.id)) groups[key].push(parent);
          if (!groups[key].find(g => g.id === r.id)) groups[key].push(r);
        }
      }
    }
    return Object.entries(groups).filter(([, members]) => members.length > 1).sort((a, b) => a[0].localeCompare(b[0]));
  }, [allEstablished]);

  const runBulkAIAnalysis = async () => {
    const unanalysed = allEstablished.filter((r) => {
      const ai = getAIIntelligence(r);
      return !ai.summary || ai.lastAnalysed === "Not yet analysed";
    });
    if (unanalysed.length === 0) {
      toast.info("All accounts already have AI analysis");
      return;
    }
    setAnalysingAll(true);
    setAnalysisProgress({ done: 0, total: unanalysed.length });
    let success = 0;
    for (const r of unanalysed) {
      try {
        const { data, error } = await supabase.functions.invoke("analyse-retailer", {
          body: { retailerId: r.id },
        });
        if (!error && data?.success) success++;
      } catch {}
      setAnalysisProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    toast.success(`AI analysis complete: ${success}/${unanalysed.length} accounts analysed`);
    setAnalysingAll(false);
    await refetch();
  };

  const missingCoords = useMemo(() => allEstablished.filter(r => !r.lat || !r.lng).length, [allEstablished]);

  const runGeocoding = async () => {
    setGeocoding(true);
    try {
      await ensureSession();
      const { data, error } = await supabase.functions.invoke("geocode-retailers");
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const notFoundMsg = data.notFound?.length > 0 ? ` (${data.notFound.length} towns not found)` : '';
      toast.success(`Geocoded ${data.updated}/${data.total} accounts${notFoundMsg}`);
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Geocoding failed");
    } finally {
      setGeocoding(false);
    }
  };

  const handleRemoveAccount = async () => {
    if (!removeDialog.id) return;
    setRemoving(true);
    try {
      const { error } = await supabase.from("retailers").delete().eq("id", removeDialog.id);
      if (error) throw error;
      toast.success(`${removeDialog.name} removed from accounts`);
      setRemoveDialog({ open: false, id: "", name: "" });
      await refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove account");
    } finally {
      setRemoving(false);
    }
  };

  // Filtered & sorted list
  const established = useMemo(() => {
    let list = [...allEstablished];

    // Tab filter
    if (viewTab === "alerts") {
      const alertIds = new Set(alerts.map(a => a.retailerId));
      list = list.filter(r => alertIds.has(r.id));
    } else if (viewTab === "retention") {
      list = list.filter(r => r.pipeline_stage === "retention_risk");
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.town.toLowerCase().includes(q));
    }
    if (filterCounty !== "all") list = list.filter((r) => r.county === filterCounty);
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);

    const getYoYGrowth = (r: any) => {
      const b2025 = parseFloat(r.billing_2025_full_year) || 0;
      const b2026ytd = parseFloat(r.billing_2026_ytd) || 0;
      if (b2025 === 0) return 0;
      const now = new Date();
      const months = now.getMonth() + (now.getDate() / 30);
      const projected = months > 0 ? b2026ytd * (12 / months) : 0;
      return ((projected - b2025) / b2025) * 100;
    };

    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "fit": return (b.fit_score ?? 0) - (a.fit_score ?? 0);
        case "spend": return (b.spend_potential_score ?? 0) - (a.spend_potential_score ?? 0);
        case "recent": return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case "health": return getAccountHealth(b).score - getAccountHealth(a).score;
        case "yoy": return getYoYGrowth(b) - getYoYGrowth(a);
        default: return (b.priority_score ?? 0) - (a.priority_score ?? 0);
      }
    });
    return list;
  }, [allEstablished, search, filterCounty, filterCategory, sortBy, viewTab, alerts]);

  // Stats from unfiltered list
  const totalValue = allEstablished.reduce((s, r) => {
    const pred = getPerformancePrediction(r);
    const val = String(pred.predictedAnnualValue).replace(/[^0-9.]/g, "");
    return s + (parseFloat(val) || 0);
  }, 0);

  const avgFit = allEstablished.length > 0
    ? Math.round(allEstablished.reduce((s, r) => s + (r.fit_score ?? 0), 0) / allEstablished.length)
    : 0;

  const withRisks = allEstablished.filter((r) => (r.risk_flags ?? []).length > 0).length;
  const withAI = allEstablished.filter((r) => {
    const ai = getAIIntelligence(r);
    return ai.summary && ai.lastAnalysed !== "Not yet analysed";
  }).length;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  const formatValue = (v: number) =>
    v >= 1000 ? `£${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `£${v.toFixed(0)}`;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="section-header mb-2">Manage</p>
          <h1 className="page-title">Current Accounts</h1>
          <p className="page-subtitle">Established Nomination stockists across South West UK & South Wales</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={syncFromDataHub}
            disabled={syncing || analysingAll}
            variant="outline"
            className="text-xs h-9 border-gold/30 text-gold-dark hover:bg-champagne/30"
          >
            {syncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <DatabaseZap className="w-3.5 h-3.5 mr-1.5" />}
            {syncing ? "Syncing..." : "Sync from Data Hub"}
          </Button>
          {missingCoords > 0 && (
            <Button
              onClick={runGeocoding}
              disabled={geocoding || syncing || analysingAll}
              variant="outline"
              className="text-xs h-9 border-gold/30 text-gold-dark hover:bg-champagne/30"
            >
              {geocoding ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 mr-1.5" />}
              {geocoding ? "Geocoding..." : `Geocode ${missingCoords} Accounts`}
            </Button>
          )}
          <Button
            onClick={runBulkAIAnalysis}
            disabled={analysingAll || syncing || allEstablished.length === 0}
            className="text-xs h-9 gold-gradient text-sidebar-background"
          >
            {analysingAll ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            {analysingAll ? `Analysing ${analysisProgress.done}/${analysisProgress.total}...` : "Run AI on All"}
          </Button>
        </div>
      </div>

      {/* Progress bar during bulk analysis */}
      {analysingAll && (
        <div className="space-y-1">
          <Progress value={(analysisProgress.done / analysisProgress.total) * 100} className="h-2" />
          <p className="text-[10px] text-muted-foreground">
            Analysing account {analysisProgress.done + 1} of {analysisProgress.total}…
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Active Accounts", value: allEstablished.length.toString(), icon: Store, sub: "Approved stockists" },
          { label: "Portfolio Value", value: formatValue(totalValue), icon: PoundSterling, sub: "Predicted annual" },
          { label: "Avg Fit Score", value: `${avgFit}%`, icon: TrendingUp, sub: "Brand alignment" },
          { label: "AI Analysed", value: `${withAI}/${allEstablished.length}`, icon: Sparkles, sub: "Intelligence coverage" },
          { label: "Risk Flags", value: withRisks.toString(), icon: AlertTriangle, sub: "Need attention" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted">
                <s.icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground tracking-tight">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Account Health Summary */}
      <AccountHealthSummary retailers={allEstablished} />

      {/* Billing Alerts */}
      <AlertsSection alerts={alerts} />

      {/* At-Risk Accounts */}
      <AtRiskSection retailers={allEstablished} />

      {/* Retention Risk Section */}
      {retentionRisk.length > 0 && (
        <div className="card-premium p-6 border-warning/20">
          <div className="flex items-center gap-2.5 mb-4">
            <ShieldAlert className="w-5 h-5 text-warning" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Retention Risk ({retentionRisk.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {retentionRisk.map(r => <AccountCard key={r.id} retailer={r} />)}
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { key: "all" as const, label: "All Accounts" },
          { key: "winback" as const, label: `Win-Back (${dormantAccounts.length})` },
          { key: "groups" as const, label: `Groups (${accountGroups.length})` },
          { key: "alerts" as const, label: `Alerts (${alerts.length})` },
          { key: "retention" as const, label: `Retention (${retentionRisk.length})` },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setViewTab(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${viewTab === tab.key ? 'gold-gradient text-sidebar-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Win-Back Targets */}
      {viewTab === "winback" && (
        <div className="space-y-4">
          <div className="card-premium p-6 border-destructive/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Ghost className="w-5 h-5 text-destructive" strokeWidth={1.5} />
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground">Win-Back Targets</h3>
                  <p className="text-[10px] text-muted-foreground">Dormant accounts with historical spend — revenue recovery opportunities</p>
                </div>
              </div>
              {totalRevenueAtRisk > 0 && (
                <div className="text-right">
                  <p className="text-lg font-display font-bold text-destructive">£{(totalRevenueAtRisk / 1000).toFixed(0)}k</p>
                  <p className="text-[9px] text-muted-foreground">Revenue at Risk</p>
                </div>
              )}
            </div>

            {dormantAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Ghost className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No dormant accounts detected.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Accounts become dormant when YTD billing is zero despite historical spend.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dormantAccounts.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-4 rounded-xl border border-border/20 hover:bg-champagne/10 transition-colors">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-gold transition-colors"
                            onClick={() => navigate(`/retailer/${d.id}`)}>{d.name}</p>
                          {d.isSeasonal && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-info-light text-info font-medium flex-shrink-0">Seasonal — verify</span>
                          )}
                          {d.pipeline_stage === "dormant" && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium flex-shrink-0">Dormant</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{d.town}, {d.county}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-xs font-display font-bold text-foreground">£{d.b2024.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">2024</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-display font-bold text-foreground">£{d.b2025.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">2025</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-display font-bold ${d.b2026ytd === 0 ? "text-destructive" : "text-warning"}`}>£{d.b2026ytd.toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">2026 YTD</p>
                      </div>
                      <div className="text-center border-l border-border/20 pl-4">
                        <p className="text-xs font-display font-bold text-destructive">£{Math.max(0, d.revenueAtRisk).toLocaleString()}</p>
                        <p className="text-[8px] text-muted-foreground">At Risk</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <p className="text-xs font-medium text-muted-foreground">{d.daysSinceLastOrder}d</p>
                        </div>
                        <p className="text-[8px] text-muted-foreground">Since order</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[10px] h-7 border-gold/30 text-gold-dark hover:bg-champagne/30"
                        disabled={generatingBrief === d.id}
                        onClick={() => generateWinBackBrief(d)}
                      >
                        {generatingBrief === d.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        Win-Back Brief
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group Accounts View */}
      {viewTab === "groups" && (
        <div className="space-y-4">
          {accountGroups.length === 0 ? (
            <div className="card-premium p-8 text-center">
              <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No multi-site groups detected.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Groups are auto-detected when accounts share the same trading name or are linked via parent accounts.</p>
            </div>
          ) : (
            accountGroups.map(([groupName, members]) => {
              const formatCurr = (v: number) => v > 0 ? `£${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}` : "—";
              const total2025 = members.reduce((s, m) => s + (parseFloat(String(m.billing_2025_full_year)) || 0), 0);
              const total2026 = members.reduce((s, m) => s + (parseFloat(String(m.billing_2026_ytd)) || 0), 0);

              return (
                <div key={groupName} className="card-premium p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-5 h-5 text-gold" strokeWidth={1.5} />
                      <h3 className="text-base font-display font-semibold text-foreground">{groupName}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/40 text-gold-dark font-medium">{members.length} sites</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-display font-bold text-foreground">{formatCurr(total2025)}</p>
                        <p className="text-[9px] text-muted-foreground">2025 Total</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-display font-bold shimmer-gold">{formatCurr(total2026)}</p>
                        <p className="text-[9px] text-muted-foreground">2026 YTD</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m.id} onClick={() => navigate(`/retailer/${m.id}`)} className="flex items-center justify-between p-3 rounded-lg hover:bg-champagne/10 cursor-pointer border border-border/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.town}, {m.county}</p>
                          </div>
                          {m.pipeline_stage === "retention_risk" && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-warning-light text-warning font-medium">At Risk</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-display font-bold text-foreground">{formatCurr(parseFloat(String(m.billing_2025_full_year)) || 0)}</p>
                            <p className="text-[9px] text-muted-foreground">2025</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-display font-bold text-foreground">{formatCurr(parseFloat(String(m.billing_2026_ytd)) || 0)}</p>
                            <p className="text-[9px] text-muted-foreground">2026 YTD</p>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterCounty} onValueChange={setFilterCounty}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <Filter className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories", "concept_store"].map((c) => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority Score</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="fit">Fit Score</SelectItem>
            <SelectItem value="spend">Spend Potential</SelectItem>
            <SelectItem value="recent">Recently Updated</SelectItem>
            <SelectItem value="health">Health Score</SelectItem>
            <SelectItem value="yoy">YoY Growth</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">
          {established.length} account{established.length !== 1 ? "s" : ""}
          {established.length !== allEstablished.length && ` of ${allEstablished.length}`}
        </span>
      </div>

      {/* Account Cards */}
      {established.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No established accounts yet.</p>
          <p className="text-xs mt-1">Retailers move here when approved in the Pipeline.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {established.map((r) => (
            <AccountCard
              key={r.id}
              retailer={r}
              onRemove={(id, name) => setRemoveDialog({ open: true, id, name })}
            />
          ))}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => !removing && setRemoveDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeDialog.name}</strong> from your current accounts? This will permanently delete all associated data including AI analysis, billing history, and activity logs.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setRemoveDialog({ open: false, id: "", name: "" })} disabled={removing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveAccount} disabled={removing}>
              {removing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
              {removing ? "Removing..." : "Remove Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
