import { useMemo, useState } from "react";
import { MapPin, Plus, Radar, Car } from "lucide-react";
import { haversine, estimateDriveMinutes } from "@/pages/JourneyPlanner";

interface NearbyCluster {
  town: string;
  county: string;
  lat: number;
  lng: number;
}

interface NearbyRetailer {
  id: string;
  name: string;
  town: string;
  county: string;
  lat: number | null;
  lng: number | null;
  fit_score: number;
  priority_score: number;
  pipeline_stage: string;
}

interface NearbyAccountsProps {
  routeClusters: NearbyCluster[];
  allRetailers: NearbyRetailer[];
  routeRetailerIds: Set<string>;
  onAddToRoute: (id: string) => void;
  radiusKm?: number;
}

export function NearbyAccounts({
  routeClusters,
  allRetailers,
  routeRetailerIds,
  onAddToRoute,
  radiusKm = 15,
}: NearbyAccountsProps) {
  const [expanded, setExpanded] = useState(false);

  const nearbyAccounts = useMemo(() => {
    if (routeClusters.length === 0) return [];

    return allRetailers
      .filter(r => !routeRetailerIds.has(r.id) && r.lat && r.lng)
      .map(r => {
        // Find closest cluster on the route
        let minDist = Infinity;
        let closestTown = "";
        for (const c of routeClusters) {
          const dist = haversine(r.lat!, r.lng!, c.lat, c.lng);
          if (dist < minDist) {
            minDist = dist;
            closestTown = c.town;
          }
        }
        return { ...r, distanceKm: minDist, closestTown, driveMinutes: estimateDriveMinutes(minDist) };
      })
      .filter(r => r.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [routeClusters, allRetailers, routeRetailerIds, radiusKm]);

  if (nearbyAccounts.length === 0) return null;

  const shown = expanded ? nearbyAccounts : nearbyAccounts.slice(0, 4);

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-semibold text-foreground">
            Nearby Accounts
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-champagne/30 text-primary font-medium">
            {nearbyAccounts.length} within {radiusKm}km
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mb-2">
        Other accounts near this route — add to visit on the way
      </p>

      <div className="space-y-0.5">
        {shown.map(r => (
          <div key={r.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-foreground truncate">{r.name}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium
                  ${r.pipeline_stage === 'approved' ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                  {r.pipeline_stage.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground">{r.town}</span>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                  <Car className="w-2.5 h-2.5" />{r.driveMinutes}m from {r.closestTown}
                </span>
              </div>
            </div>
            <button
              onClick={() => onAddToRoute(r.id)}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-accent font-medium px-2 py-1 rounded-lg hover:bg-champagne/20 transition-colors"
            >
              <Plus className="w-3 h-3" />Add
            </button>
          </div>
        ))}
      </div>

      {nearbyAccounts.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-1.5 text-[10px] text-primary hover:text-accent font-medium py-1.5 transition-colors"
        >
          {expanded ? 'Show less' : `Show all ${nearbyAccounts.length} nearby accounts`}
        </button>
      )}
    </div>
  );
}
