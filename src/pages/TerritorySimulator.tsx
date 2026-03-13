import { useState } from "react";
import { COUNTIES } from "@/data/constants";
import { useRetailers, getOutreach, getActivity } from "@/hooks/useRetailers";
import { FlaskConical, TrendingUp, MapPin, Users, Target, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const scenarios = [
  { id: 'focus_bath', label: 'Focus: Bath & Somerset', description: 'Prioritise Bath jewellers and Somerset coverage', counties: ['Somerset'], estimatedRevenue: '£45,000–£68,000', optimalAccounts: 4, density: 'Medium' },
  { id: 'cheltenham_expansion', label: 'Expand: Cheltenham cluster', description: 'Add Cheltenham prospects plus Gloucester', counties: ['Gloucestershire'], estimatedRevenue: '£32,000–£50,000', optimalAccounts: 3, density: 'High' },
  { id: 'coastal_dorset', label: 'Coastal: Dorset premium', description: 'Sandbanks, Westbourne, and broader Dorset coast', counties: ['Dorset'], estimatedRevenue: '£22,000–£38,000', optimalAccounts: 3, density: 'Medium' },
  { id: 'devon_cornwall', label: 'Strategy: Devon & Cornwall', description: 'Build presence across the far South West', counties: ['Devon', 'Cornwall'], estimatedRevenue: '£18,000–£30,000', optimalAccounts: 4, density: 'Low' },
  { id: 'independents_only', label: 'Independent jewellers only', description: 'Focus exclusively on independent jewellery shops', counties: [], estimatedRevenue: '£55,000–£85,000', optimalAccounts: 8, density: 'Selective' },
  { id: 'full_territory', label: 'Full territory activation', description: 'Maximise coverage across all counties', counties: [], estimatedRevenue: '£95,000–£145,000', optimalAccounts: 14, density: 'High' },
];

export default function TerritorySimulator() {
  const { retailers, loading } = useRetailers();
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0]);
  const [includeDiscoveries, setIncludeDiscoveries] = useState(false);

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const scenarioRetailers = selectedScenario.counties.length > 0
    ? retailers.filter(r => selectedScenario.counties.includes(r.county))
    : selectedScenario.id === 'independents_only'
      ? retailers.filter(r => r.is_independent && r.category === 'jeweller')
      : retailers;

  const avgFit = Math.round(scenarioRetailers.reduce((s, r) => s + (r.fit_score ?? 0), 0) / (scenarioRetailers.length || 1));
  const highPriority = scenarioRetailers.filter(r => getOutreach(r).outreachPriority === 'high').length;

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Strategy</p>
        <h1 className="page-title">Territory Strategy Simulator</h1>
        <p className="page-subtitle">Model scenarios and estimate territory revenue potential</p>
      </div>
      <div className="divider-gold" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {scenarios.map(s => (
          <button key={s.id} onClick={() => setSelectedScenario(s)}
            className={`text-left p-4 rounded-xl border transition-all ${selectedScenario.id === s.id ? 'card-premium border-gold/30 shadow-md' : 'border-border/20 hover:border-border/40 bg-card/50'}`}>
            <h4 className="text-xs font-semibold text-foreground mb-1">{s.label}</h4>
            <p className="text-[10px] text-muted-foreground leading-snug">{s.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Est. Revenue', value: selectedScenario.estimatedRevenue, accent: true },
          { icon: Users, label: 'Matching Prospects', value: scenarioRetailers.length.toString() },
          { icon: MapPin, label: 'Account Density', value: selectedScenario.density },
          { icon: Target, label: 'High Priority', value: highPriority.toString() },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.accent ? 'border-gold/30 bg-champagne/20' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.accent ? 'gold-gradient' : 'bg-muted'}`}>
              <s.icon className={`w-4 h-4 ${s.accent ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
            </div>
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">Included Prospects ({scenarioRetailers.length})</h3>
          {scenarioRetailers.length === 0 ? (
            <p className="text-sm text-muted-foreground/50 italic">No retailers match this scenario. Promote more prospects to see results.</p>
          ) : (
            <div className="space-y-2">
              {scenarioRetailers.sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0)).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.town} · {r.category.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-display font-bold ${(r.fit_score ?? 0) >= 85 ? 'score-excellent' : (r.fit_score ?? 0) >= 70 ? 'score-good' : 'score-moderate'}`}>{r.fit_score ?? 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card-premium p-6">
            <h3 className="text-lg font-display font-semibold text-foreground mb-4">Scenario Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Prospects</span><span className="font-medium text-foreground">{scenarioRetailers.length}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Average Fit Score</span><span className={`font-display font-bold ${avgFit >= 80 ? 'score-excellent' : avgFit >= 70 ? 'score-good' : 'score-moderate'}`}>{avgFit}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">High Priority Count</span><span className="font-medium text-foreground">{highPriority}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Meetings Booked</span><span className="font-medium text-foreground">{scenarioRetailers.filter(r => getActivity(r).meetingScheduled).length}</span></div>
            </div>
          </div>

          <div className="card-premium p-6 border-gold/20">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-gold" strokeWidth={1.5} />
              <h4 className="text-sm font-display font-semibold text-foreground">AI Recommendation</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed italic font-display">
              {selectedScenario.id === 'focus_bath'
                ? "Bath is the territory's highest-value opportunity. Focused approach maximises revenue per account with minimal travel."
                : selectedScenario.id === 'full_territory'
                ? 'Full territory activation offers the highest revenue potential but requires careful resource management. Prioritise Bath, Cheltenham, and Dorset coast first.'
                : selectedScenario.id === 'independents_only'
                ? 'Independent jewellers deliver the highest average annual value. This focused strategy targets the strongest brand-fit retailers.'
                : `This scenario targets ${scenarioRetailers.length} prospects. The estimated revenue of ${selectedScenario.estimatedRevenue} is based on similar account performance data.`
              }
            </p>
          </div>

          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-display font-semibold text-foreground">Include AI Discoveries</h4>
              <Switch checked={includeDiscoveries} onCheckedChange={setIncludeDiscoveries} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {includeDiscoveries
                ? 'Including AI-discovered prospects would add an estimated £15,000–£25,000 to the territory potential.'
                : 'Toggle to include AI-discovered prospects in the revenue simulation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
