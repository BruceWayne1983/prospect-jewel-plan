import { useMemo, useState } from "react";
import { Sparkles, MapPin, Target, Loader2, Wand2 } from "lucide-react";
import { haversine } from "@/pages/JourneyPlanner";

interface RetailerLite {
  id: string;
  name: string;
  town: string;
  county: string;
  fit_score: number;
  priority_score: number;
  pipeline_stage: string;
  lat: number | null;
  lng: number | null;
}

interface ProspectLite {
  id: string;
  name: string;
  town: string;
  county: string;
  category: string;
  lat: number | null;
  lng: number | null;
  predicted_fit_score: number | null;
  status: string;
}

interface AutoPlanPanelProps {
  retailers: RetailerLite[];
  prospects: ProspectLite[];
  home: { lat: number; lng: number };
  /** Replace the custom route with the picked retailer ids. */
  onApply: (retailerIds: string[]) => void;
}

/**
 * "Auto-plan a journey" — picks the best retailers in a chosen area and seeds
 * the custom route. Uses the same fit / priority signals already on the data;
 * the actual road-distance ordering is handled downstream by the planner.
 *
 * Selection logic (transparent to the user — see the helper text in-card):
 *   1. Filter retailers by selected county (or "Any nearby" = within radius of home).
 *   2. Score = 0.5 · fit_score + 0.5 · priority_score, then -10 if pipeline is
 *      'closed_lost' / 'not_a_fit', and +5 if it's 'opportunity' / 'meeting_booked'.
 *   3. Drop anything without lat/lng (can't be routed) or beyond the radius.
 *   4. Take the top N (default 6 — fits a typical sales day with ~30m visits).
 */
export function AutoPlanPanel({ retailers, prospects, home, onApply }: AutoPlanPanelProps) {
  const [busy, setBusy] = useState(false);
  const [maxStops, setMaxStops] = useState(6);
  const [radiusMiles, setRadiusMiles] = useState(30);
  const [county, setCounty] = useState<string>("__any__");

  // Counties Emma actually has accounts/prospects in
  const counties = useMemo(() => {
    const set = new Set<string>();
    for (const r of retailers) if (r.county) set.add(r.county);
    for (const p of prospects) if (p.county) set.add(p.county);
    return Array.from(set).sort();
  }, [retailers, prospects]);

  // Retailers in scope (live preview of what auto-plan will choose)
  const candidates = useMemo(() => {
    const radiusKm = radiusMiles * 1.60934;
    const inScope = retailers.filter(r => {
      if (r.lat == null || r.lng == null) return false;
      if (county !== "__any__" && r.county !== county) return false;
      const distKm = haversine(home.lat, home.lng, r.lat, r.lng);
      if (distKm > radiusKm) return false;
      // Skip pipeline stages that shouldn't be re-visited
      if (r.pipeline_stage === "closed_lost" || r.pipeline_stage === "not_a_fit") return false;
      return true;
    });

    const score = (r: RetailerLite) => {
      let s = (r.fit_score ?? 0) * 0.5 + (r.priority_score ?? 0) * 0.5;
      if (r.pipeline_stage === "opportunity" || r.pipeline_stage === "meeting_booked") s += 5;
      return s;
    };

    return inScope
      .map(r => ({ r, score: score(r), distMi: haversine(home.lat, home.lng, r.lat!, r.lng!) * 0.621371 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxStops);
  }, [retailers, county, radiusMiles, maxStops, home]);

  // Top prospects in the same area (suggestion only — they aren't routed yet)
  const prospectSuggestions = useMemo(() => {
    const radiusKm = radiusMiles * 1.60934;
    return prospects
      .filter(p => p.lat != null && p.lng != null && p.status !== "dismissed" && p.status !== "accepted")
      .filter(p => county === "__any__" || p.county === county)
      .filter(p => haversine(home.lat, home.lng, p.lat!, p.lng!) <= radiusKm)
      .map(p => ({ p, fit: p.predicted_fit_score ?? 0 }))
      .sort((a, b) => b.fit - a.fit)
      .slice(0, 3);
  }, [prospects, county, radiusMiles, home]);

  const apply = async () => {
    if (candidates.length === 0) return;
    setBusy(true);
    try {
      onApply(candidates.map(c => c.r.id));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-premium p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
          <Wand2 className="w-3.5 h-3.5 text-card" strokeWidth={1.5} />
        </div>
        <div>
          <h4 className="text-sm font-display font-semibold text-foreground">Auto-plan a journey</h4>
          <p className="text-[10px] text-muted-foreground">Picks the best accounts in an area</p>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Area</label>
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="w-full mt-1 text-xs bg-muted/50 rounded-lg px-2 py-1.5 border border-border/20 text-foreground"
          >
            <option value="__any__">Any area within radius</option>
            {counties.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Max radius</label>
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="number"
                min={5}
                max={150}
                value={radiusMiles}
                onChange={e => setRadiusMiles(Math.max(5, Math.min(150, parseInt(e.target.value) || 30)))}
                className="w-full text-xs bg-muted/50 rounded-lg px-2 py-1.5 border border-border/20 text-foreground"
              />
              <span className="text-[10px] text-muted-foreground">mi</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Max stops</label>
            <input
              type="number"
              min={2}
              max={12}
              value={maxStops}
              onChange={e => setMaxStops(Math.max(2, Math.min(12, parseInt(e.target.value) || 6)))}
              className="w-full mt-1 text-xs bg-muted/50 rounded-lg px-2 py-1.5 border border-border/20 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="mt-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
          <Target className="w-3 h-3" />
          {candidates.length} top account{candidates.length === 1 ? "" : "s"} ready
        </p>
        {candidates.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/60 italic py-2">
            No geocoded accounts in this area. Try a wider radius or pick another county.
          </p>
        ) : (
          <div className="space-y-0.5 max-h-[140px] overflow-y-auto">
            {candidates.map(({ r, score, distMi }) => (
              <div key={r.id} className="flex items-center justify-between py-1 px-2 rounded-md bg-muted/20">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{r.name}</p>
                  <p className="text-[9px] text-muted-foreground">{r.town} · fit {r.fit_score} · pri {r.priority_score}</p>
                </div>
                <span className="text-[9px] text-muted-foreground font-mono ml-2 flex-shrink-0">
                  {distMi.toFixed(0)}mi
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prospect heads-up */}
      {prospectSuggestions.length > 0 && (
        <div className="mt-3 p-2 rounded-lg bg-champagne/15 border border-primary/10">
          <p className="text-[10px] text-primary font-medium flex items-center gap-1 mb-1">
            <Sparkles className="w-3 h-3" />
            Also worth scoping while you're there
          </p>
          {prospectSuggestions.map(({ p, fit }) => (
            <div key={p.id} className="flex items-center justify-between py-0.5">
              <span className="text-[10px] text-foreground/80 truncate">{p.name}</span>
              <span className="text-[9px] text-muted-foreground ml-2">{p.town} · fit {fit}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={apply}
        disabled={busy || candidates.length === 0}
        className="w-full mt-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5
          gold-gradient text-card hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
        Build auto-plan ({candidates.length})
      </button>
      <p className="text-[9px] text-muted-foreground/60 mt-1.5 text-center">
        Replaces your current custom route. The order is then optimised with real road distances.
      </p>
    </div>
  );
}
