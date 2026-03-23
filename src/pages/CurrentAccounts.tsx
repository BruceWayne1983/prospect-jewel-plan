import { useState, useMemo } from "react";
import { useRetailers, getOutreach, getActivity, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";
import { useNavigate } from "react-router-dom";
import { Loader2, Store, MapPin, Phone, Mail, Globe, ArrowUpRight, Search, TrendingUp, Calendar, AlertTriangle, Filter, DatabaseZap, Sparkles, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoreBar } from "@/components/ScoreIndicators";
import { COUNTIES } from "@/data/constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CurrentAccounts() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();
  const [search, setSearch] = useState("");
  const [filterCounty, setFilterCounty] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("priority");

  // Established accounts = approved pipeline stage
  const established = useMemo(() => {
    let list = retailers.filter(r => r.pipeline_stage === "approved");

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.town.toLowerCase().includes(q));
    }
    if (filterCounty !== "all") list = list.filter(r => r.county === filterCounty);
    if (filterCategory !== "all") list = list.filter(r => r.category === filterCategory);

    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "fit": return (b.fit_score ?? 0) - (a.fit_score ?? 0);
        case "spend": return (b.spend_potential_score ?? 0) - (a.spend_potential_score ?? 0);
        case "recent": return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default: return (b.priority_score ?? 0) - (a.priority_score ?? 0);
      }
    });
    return list;
  }, [retailers, search, filterCounty, filterCategory, sortBy]);

  const totalValue = established.reduce((s, r) => {
    const pred = getPerformancePrediction(r);
    const val = String(pred.predictedAnnualValue).replace(/[^0-9.]/g, '');
    return s + (parseFloat(val) || 0);
  }, 0);

  const avgFit = established.length > 0
    ? Math.round(established.reduce((s, r) => s + (r.fit_score ?? 0), 0) / established.length)
    : 0;

  const withRisks = established.filter(r => (r.risk_flags ?? []).length > 0).length;
  const withMeetings = established.filter(r => getActivity(r).meetingScheduled).length;

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Manage</p>
        <h1 className="page-title">Current Accounts</h1>
        <p className="page-subtitle">Established stockists actively carrying Nomination</p>
      </div>
      <div className="divider-gold" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Accounts", value: established.length.toString(), icon: Store, sub: "Approved stockists" },
          { label: "Avg Fit Score", value: `${avgFit}%`, icon: TrendingUp, sub: "Brand alignment" },
          { label: "Meetings Active", value: withMeetings.toString(), icon: Calendar, sub: "Scheduled follow-ups" },
          { label: "Risk Flags", value: withRisks.toString(), icon: AlertTriangle, sub: "Accounts needing attention" },
        ].map(s => (
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterCounty} onValueChange={setFilterCounty}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><Filter className="w-3 h-3 mr-1.5 text-muted-foreground" /><SelectValue placeholder="County" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["jeweller","gift_shop","fashion_boutique","lifestyle_store","premium_accessories","concept_store"].map(c => (
              <SelectItem key={c} value={c}>{c.replace(/_/g, ' ')}</SelectItem>
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
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground ml-auto">{established.length} account{established.length !== 1 ? 's' : ''}</span>
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
          {established.map(r => {
            const outreach = getOutreach(r);
            const activity = getActivity(r);
            const pred = getPerformancePrediction(r);
            const ai = getAIIntelligence(r);
            const risks = r.risk_flags ?? [];

            return (
              <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="card-premium p-5 cursor-pointer group hover:border-gold/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-gold-dark transition-colors truncate">{r.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-[11px] text-muted-foreground truncate">{r.town}, {r.county}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-gold transition-colors flex-shrink-0" />
                </div>

                <div className="divider-gold opacity-30 mb-3" />

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <span className={`text-sm font-display font-bold ${(r.fit_score ?? 0) >= 85 ? 'score-excellent' : (r.fit_score ?? 0) >= 70 ? 'score-good' : 'score-moderate'}`}>{r.fit_score ?? 0}%</span>
                    <p className="text-[8px] text-muted-foreground uppercase">Fit</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-display font-bold text-foreground">{r.priority_score ?? 0}</span>
                    <p className="text-[8px] text-muted-foreground uppercase">Priority</p>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-display font-bold text-foreground">{pred.predictedAnnualValue}</span>
                    <p className="text-[8px] text-muted-foreground uppercase">Annual</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <span className="badge-category text-[9px]">{r.category.replace(/_/g, ' ')}</span>
                  {r.store_positioning && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r.store_positioning.replace('_', ' ')}</span>}
                  {activity.meetingScheduled && <span className="text-[9px] px-1.5 py-0.5 rounded bg-champagne text-gold-dark font-medium">Meeting</span>}
                </div>

                {/* Contact quick-view */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {outreach.contactName && <span className="truncate">{outreach.contactName}</span>}
                  {r.phone && <Phone className="w-3 h-3 flex-shrink-0" />}
                  {r.email && <Mail className="w-3 h-3 flex-shrink-0" />}
                  {r.website && <Globe className="w-3 h-3 flex-shrink-0" />}
                </div>

                {risks.length > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
                    <span className="text-[9px] text-warning truncate">{risks[0]}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
