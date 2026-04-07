import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRetailers, getActivity, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";
import { Loader2, Store, Search, TrendingUp, Calendar, AlertTriangle, Filter, DatabaseZap, Sparkles, PoundSterling, ShieldAlert, MapPin } from "lucide-react";
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
  const { retailers, loading, refetch } = useRetailers();
  const [search, setSearch] = useState("");
  const [filterCounty, setFilterCounty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [viewTab, setViewTab] = useState<"all" | "alerts" | "retention">("all");
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

  // All established (unfiltered) for stats
  const allEstablished = useMemo(
    () => retailers.filter((r) => r.pipeline_stage === "approved" || r.pipeline_stage === "retention_risk"),
    [retailers]
  );

  const retentionRisk = useMemo(() => retailers.filter(r => r.pipeline_stage === "retention_risk"), [retailers]);
  const alerts = useMemo(() => computeAlerts(allEstablished, calendarEvents), [allEstablished, calendarEvents]);

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
      <div className="flex items-center gap-2">
        {([
          { key: "all" as const, label: "All Accounts" },
          { key: "alerts" as const, label: `Alerts (${alerts.length})` },
          { key: "retention" as const, label: `Retention (${retentionRisk.length})` },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setViewTab(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${viewTab === tab.key ? 'gold-gradient text-sidebar-background' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            {tab.label}
          </button>
        ))}
      </div>

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
