import { COUNTIES, territoryOpportunities, performanceBenchmarks } from "@/data/constants";
import { useRetailers, getOutreach, getAIIntelligence } from "@/hooks/useRetailers";
import { Brain, TrendingUp, Target, MapPin, Sparkles, Users, BarChart3, Radar, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function IntelligenceDashboard() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();
  const [prospectCount, setProspectCount] = useState(0);

  useEffect(() => {
    supabase.from("discovered_prospects").select("id", { count: "exact", head: true }).eq("status", "new").then(({ count }) => setProspectCount(count ?? 0));
  }, []);

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const highConfidence = retailers.filter(r => getAIIntelligence(r).confidenceLevel === 'high');
  const avgPriority = retailers.length > 0 ? Math.round(retailers.reduce((s, r) => s + (r.priority_score ?? 0), 0) / retailers.length) : 0;
  const topTowns = [...territoryOpportunities].sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 5);

  const countyStats = COUNTIES.map(c => {
    const rs = retailers.filter(r => r.county === c);
    if (rs.length === 0) return null;
    return {
      county: c, count: rs.length,
      avgPriority: Math.round(rs.reduce((s, r) => s + (r.priority_score ?? 0), 0) / rs.length),
      highPriority: rs.filter(r => getOutreach(r).outreachPriority === 'high').length,
    };
  }).filter(Boolean) as any[];

  const categoryStats = [
    { key: 'jeweller', label: 'Jewellers' },
    { key: 'lifestyle_store', label: 'Lifestyle' },
    { key: 'fashion_boutique', label: 'Fashion' },
    { key: 'gift_shop', label: 'Gift Shops' },
    { key: 'premium_accessories', label: 'Accessories' },
  ].map(c => ({
    ...c,
    count: retailers.filter(r => r.category === c.key).length,
    avgFit: Math.round(retailers.filter(r => r.category === c.key).reduce((s, r) => s + (r.fit_score ?? 0), 0) / (retailers.filter(r => r.category === c.key).length || 1)),
  }));

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">AI Intelligence</p>
          <h1 className="page-title">Retail Intelligence Dashboard</h1>
          <p className="page-subtitle">AI-powered insights across territory, prospects and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Agents Active</span>
        </div>
      </div>
      <div className="divider-gold" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Brain, label: 'AI Analysed', value: highConfidence.length.toString(), sub: 'High confidence profiles', accent: true },
          { icon: Radar, label: 'Discovered', value: prospectCount.toString(), sub: 'New prospects in queue' },
          { icon: Target, label: 'Avg Priority', value: avgPriority.toString(), sub: 'Across all prospects' },
          { icon: TrendingUp, label: 'Pipeline Size', value: retailers.length.toString(), sub: 'Active retailers' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent ? 'border-gold/30 bg-champagne/20' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.accent ? 'gold-gradient' : 'bg-muted'}`}>
              <s.icon className={`w-4 h-4 ${s.accent ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            <p className="text-[9px] text-muted-foreground/60">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card-premium p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <MapPin className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Highest Opportunity Towns</h3>
          </div>
          <div className="space-y-3">
            {topTowns.map((t, i) => (
              <div key={t.town} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground/50 w-4 font-display">{i + 1}</span>
                <div className="w-32">
                  <p className="text-sm font-medium text-foreground">{t.town}</p>
                  <p className="text-[10px] text-muted-foreground">{t.county}</p>
                </div>
                <div className="flex-1">
                  <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                    <div className="h-full bg-gold/60 rounded-full" style={{ width: `${t.opportunityScore}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-display font-bold ${t.opportunityScore >= 85 ? 'score-excellent' : t.opportunityScore >= 70 ? 'score-good' : 'score-moderate'}`}>{t.opportunityScore}</span>
                <span className="text-xs text-muted-foreground w-28 text-right">{t.predictedValue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <BarChart3 className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Performance Patterns</h3>
          </div>
          <div className="space-y-3">
            {performanceBenchmarks.topPerformingTypes.map(t => (
              <div key={t.type} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                <span className="text-xs text-foreground">{t.type}</span>
                <div className="flex gap-4">
                  <span className="text-xs text-gold-dark font-semibold">{t.avgAnnual}</span>
                  <span className="text-[10px] text-muted-foreground">{t.reorderRate}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="divider-gold mt-4 mb-3 opacity-40" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Avg Opening Order</span>
            <span className="font-medium text-foreground">{performanceBenchmarks.averageOpeningOrder}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">Best Season</span>
            <span className="font-medium text-foreground">{performanceBenchmarks.bestSeason}</span>
          </div>
        </div>
      </div>

      {(countyStats.length > 0 || categoryStats.some(c => c.count > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {countyStats.length > 0 && (
            <div className="card-premium p-6">
              <h3 className="text-lg font-display font-semibold text-foreground mb-5">Priority Score by County</h3>
              <div className="space-y-3">
                {countyStats.sort((a: any, b: any) => b.avgPriority - a.avgPriority).map((c: any) => (
                  <div key={c.county} className="flex items-center gap-4">
                    <span className="text-sm text-foreground w-28">{c.county}</span>
                    <div className="flex-1"><ScoreBar score={c.avgPriority} label="" /></div>
                    <span className="text-xs text-muted-foreground w-20 text-right">{c.highPriority} high priority</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card-premium p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-5">Fit Score by Category</h3>
            <div className="space-y-3">
              {categoryStats.filter(c => c.count > 0).sort((a, b) => b.avgFit - a.avgFit).map(c => (
                <div key={c.key} className="flex items-center gap-4">
                  <span className="text-sm text-foreground w-28">{c.label}</span>
                  <div className="flex-1"><ScoreBar score={c.avgFit} label="" /></div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{c.count} stores</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Territory Insights */}
      <div className="card-premium p-6 border-gold/20">
        <div className="flex items-center gap-2.5 mb-4">
          <Zap className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">Territory Intelligence Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Strongest Cluster', text: 'Bath and Cheltenham show the highest concentration of high-value prospects. These towns mirror the characteristics of top-performing Nomination locations nationally.' },
            { title: 'Whitespace Opportunity', text: 'Stow-on-the-Wold, Dartmouth, and Marlborough have zero current prospects but score 74-78 on the opportunity index. These represent untapped premium markets.' },
            { title: 'Best Performing Type', text: 'Premium jewellers deliver the highest predicted annual value (£18k avg) with 4.2x reorder frequency. Lifestyle stores follow at £12k with growing market share.' },
            { title: 'Outreach Readiness', text: `${retailers.filter(r => getOutreach(r).outreachPriority === 'high').length} retailers are at high outreach priority. Focus on follow-ups for maximum conversion.` },
          ].map(insight => (
            <div key={insight.title} className="bg-cream/50 rounded-lg p-4 border border-border/15">
              <h4 className="text-xs font-semibold text-foreground mb-1.5">{insight.title}</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
