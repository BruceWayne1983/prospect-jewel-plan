import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle, XCircle, Eye, Star, MapPin, Loader2, Radar, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DiscoveredProspect = Database["public"]["Tables"]["discovered_prospects"]["Row"];

function ConfidenceBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-success-light text-success' : score >= 70 ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground';
  const label = score >= 80 ? 'High Confidence' : score >= 70 ? 'Medium Confidence' : 'Low Confidence';
  return <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

export default function ProspectDiscovery() {
  const [prospects, setProspects] = useState<DiscoveredProspect[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewing' | 'accepted' | 'dismissed'>('all');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchProspects = async () => {
    const { data, error } = await supabase
      .from("discovered_prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Failed to load prospects");
    } else {
      setProspects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  const filtered = filter === 'all' ? prospects : prospects.filter(p => p.status === filter);

  const updateStatus = async (id: string, status: DiscoveredProspect['status']) => {
    const { error } = await supabase
      .from("discovered_prospects")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }

    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const labels: Record<string, string> = { accepted: 'Accepted — added to prospect list', dismissed: 'Dismissed', reviewing: 'Marked for review' };
    toast.success(labels[status] || 'Updated');
  };

  const runDiscovery = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-prospects", {
        body: { count: 5 },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Discovered ${data.prospects?.length || 0} new prospects!`);
        await fetchProspects();
      } else {
        toast.error(data?.error || "Discovery failed");
      }
    } catch (err: any) {
      console.error("Discovery error:", err);
      toast.error(err.message || "Failed to run discovery");
    } finally {
      setScanning(false);
    }
  };

  const newCount = prospects.filter(p => p.status === 'new').length;
  const reviewingCount = prospects.filter(p => p.status === 'reviewing').length;
  const acceptedCount = prospects.filter(p => p.status === 'accepted').length;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">AI Discovery</p>
          <h1 className="page-title">Prospect Discovery Engine</h1>
          <p className="page-subtitle">AI-identified potential retailers across the South West territory</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={runDiscovery}
            disabled={scanning}
            className="gold-gradient text-sidebar-background text-xs h-8 px-4"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Radar className="w-3.5 h-3.5 mr-1.5" />}
            {scanning ? "Scanning..." : "Run AI Scan"}
          </Button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${scanning ? 'bg-warning' : 'bg-success'} animate-pulse`} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {scanning ? 'Scanning...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'New', value: newCount, color: 'bg-champagne text-gold-dark' },
          { label: 'Reviewing', value: reviewingCount, color: 'bg-info-light text-info' },
          { label: 'Accepted', value: acceptedCount, color: 'bg-success-light text-success' },
          { label: 'Total Scanned', value: prospects.length, color: 'bg-muted text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${s.color} inline-block mt-1`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'new', 'reviewing', 'accepted', 'dismissed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${filter === f ? 'bg-card border-gold/30 text-foreground shadow-sm' : 'border-border/20 text-muted-foreground hover:bg-card'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${prospects.length})` : `(${prospects.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {prospects.length === 0 && (
        <div className="card-premium p-12 text-center">
          <Radar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-display font-semibold text-foreground mb-2">No prospects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Run the AI Scanner to discover potential retailers in your territory</p>
          <Button onClick={runDiscovery} disabled={scanning} className="gold-gradient text-sidebar-background text-xs">
            {scanning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Radar className="w-3.5 h-3.5 mr-1.5" />}
            Run First Scan
          </Button>
        </div>
      )}

      {/* Prospect Cards */}
      <div className="space-y-4">
        {filtered.map(p => (
          <div key={p.id} className={`card-premium p-6 ${p.status === 'new' ? 'border-gold/20' : p.status === 'dismissed' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <h3 className="text-base font-display font-semibold text-foreground">{p.name}</h3>
                  <span className="badge-category text-[9px]">{p.category.replace('_', ' ')}</span>
                  <ConfidenceBadge score={p.predicted_fit_score ?? 0} />
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3" strokeWidth={1.5} />{p.town}, {p.county}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-warning" />{p.rating} ({p.review_count})</span>
                  <span className="text-[10px] text-gold-dark">{p.discovery_source}</span>
                </div>
                {p.ai_reason && (
                  <div className="bg-champagne/15 rounded-lg p-3 border border-gold/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <p className="text-xs text-foreground leading-relaxed italic font-display">{p.ai_reason}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="text-center">
                  <span className={`text-2xl font-display font-bold ${(p.predicted_fit_score ?? 0) >= 80 ? 'score-excellent' : (p.predicted_fit_score ?? 0) >= 70 ? 'score-good' : 'score-moderate'}`}>{p.predicted_fit_score}</span>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Predicted Fit</p>
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  Est. quality: {p.estimated_store_quality}/100
                </div>
                {p.status === 'new' || p.status === 'reviewing' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'reviewing')} className="text-[10px] h-7 px-2 border-border/40">
                      <Eye className="w-3 h-3 mr-1" /> Review
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'accepted')} className="text-[10px] h-7 px-2 border-success/40 text-success hover:bg-success-light">
                      <CheckCircle className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'dismissed')} className="text-[10px] h-7 px-2 text-muted-foreground/50">
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                ) : p.status === 'accepted' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success">accepted</span>
                    <Button variant="outline" size="sm" onClick={() => promoteToRetailer(p)} className="text-[10px] h-7 px-2 border-gold/40 text-gold-dark hover:bg-champagne/30">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> Promote to Pipeline
                    </Button>
                  </div>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{p.status}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
