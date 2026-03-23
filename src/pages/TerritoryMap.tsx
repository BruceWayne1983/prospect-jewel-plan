import { useState, useMemo } from "react";
import { COUNTIES } from "@/data/constants";
import { useRetailers } from "@/hooks/useRetailers";
import { MapPin, Filter, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TerritoryLeafletMap } from "@/components/map/TerritoryLeafletMap";

const clusters = [
  { name: "Bristol & Bath", towns: ["Bristol", "Bath"], region: "Avon / Somerset" },
  { name: "Dorset Coast", towns: ["Bournemouth", "Poole"], region: "Dorset" },
  { name: "Cheltenham & Gloucester", towns: ["Cheltenham", "Gloucester"], region: "Gloucestershire" },
  { name: "Devon", towns: ["Exeter", "Plymouth"], region: "Devon" },
  { name: "Cornwall", towns: ["Truro"], region: "Cornwall" },
  { name: "Wiltshire", towns: ["Salisbury", "Swindon"], region: "Wiltshire" },
  { name: "Somerset", towns: ["Taunton"], region: "Somerset" },
  { name: "Cardiff & South Wales", towns: ["Cardiff", "Swansea", "Newport", "Cowbridge"], region: "South Wales" },
];

export default function TerritoryMap() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const getActivity = (r: any) => ((r.activity ?? {}) as Record<string, any>);
    const getOutreach = (r: any) => ((r.outreach ?? {}) as Record<string, any>);
    switch (filter) {
      case "high_fit": return retailers.filter((r) => (r.fit_score ?? 0) >= 80);
      case "high_spend": return retailers.filter((r) => (r.spend_potential_score ?? 0) >= 75);
      case "uncontacted": return retailers.filter((r) => !getActivity(r).lastContactDate);
      case "high_priority": return retailers.filter((r) => getOutreach(r).outreachPriority === "high");
      case "approved": return retailers.filter((r) => r.pipeline_stage === "approved");
      default: return retailers;
    }
  }, [retailers, filter]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="section-header mb-2">Territory Intelligence</p>
          <h1 className="page-title">South West & South Wales Territory</h1>
          <p className="page-subtitle">
            Brioso · Retailer density, opportunity clusters and whitespace analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-background border-border/40 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Retailers ({retailers.length})</SelectItem>
              <SelectItem value="approved">Current Accounts</SelectItem>
              <SelectItem value="high_fit">High Fit Score</SelectItem>
              <SelectItem value="high_spend">High Spend Potential</SelectItem>
              <SelectItem value="uncontacted">Uncontacted</SelectItem>
              <SelectItem value="high_priority">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Interactive Map */}
      <div className="card-premium p-1 overflow-hidden">
        <TerritoryLeafletMap retailers={filtered} />
      </div>

      {/* Clusters */}
      {retailers.length > 0 && (
        <>
          <h2 className="text-xl font-display font-semibold text-foreground">
            Opportunity Clusters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clusters
              .map((cluster) => {
                const allRs = retailers.filter((r) =>
                  cluster.towns.some((t) => r.town.toLowerCase().includes(t.toLowerCase()))
                );
                if (allRs.length === 0) return null;
                const avgPriority = Math.round(
                  allRs.reduce((s, r) => s + (r.priority_score ?? 0), 0) / allRs.length
                );
                const avgFit = Math.round(
                  allRs.reduce((s, r) => s + (r.fit_score ?? 0), 0) / allRs.length
                );
                const priorityClass =
                  avgPriority >= 85
                    ? "score-excellent"
                    : avgPriority >= 70
                    ? "score-good"
                    : "score-moderate";

                return (
                  <div key={cluster.name} className="card-premium p-5 group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-display font-semibold text-foreground">
                          {cluster.name}
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                          {cluster.region}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-gold" strokeWidth={1.5} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <p className="text-base font-display font-bold text-foreground">
                          {allRs.length}
                        </p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wider">
                          Prospects
                        </p>
                      </div>
                      <div>
                        <p className={`text-base font-display font-bold ${priorityClass}`}>
                          {avgPriority}
                        </p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wider">
                          Priority
                        </p>
                      </div>
                      <div>
                        <p className="text-base font-display font-bold text-foreground">
                          {avgFit}%
                        </p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-wider">
                          Avg Fit
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {allRs.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          onClick={() => navigate(`/retailer/${r.id}`)}
                          className="flex items-center justify-between text-xs py-1 cursor-pointer hover:text-gold-dark transition-colors"
                        >
                          <span className="text-muted-foreground truncate">{r.name}</span>
                          <span className="text-gold font-medium ml-2">{r.fit_score ?? 0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        </>
      )}

      {retailers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No retailers to map yet.</p>
          <p className="text-xs mt-1">
            Promote prospects from the Discovery Engine to see them on the territory map.
          </p>
        </div>
      )}
    </div>
  );
}
