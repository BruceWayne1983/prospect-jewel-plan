import { useState, useMemo } from "react";
import { useRetailers, getOutreach, getActivity } from "@/hooks/useRetailers";
import { useNavigate } from "react-router-dom";
import { Navigation, MapPin, Clock, Car, ChevronRight, Target, Phone, CalendarDays, CheckCircle2, Circle, Loader2, Route, Fuel, ArrowUpRight } from "lucide-react";
import { ScoreBar } from "@/components/ScoreIndicators";

interface TownCluster {
  town: string;
  county: string;
  retailers: RetailerWithMeta[];
  lat: number;
  lng: number;
}

interface RetailerWithMeta {
  id: string;
  name: string;
  town: string;
  county: string;
  fit_score: number;
  priority_score: number;
  pipeline_stage: string;
  lat: number | null;
  lng: number | null;
  contactMethod: string;
  outreachPriority: string;
  meetingScheduled: boolean;
  suggestedNextStep: string;
  contactName: string;
}

interface PlannedRoute {
  name: string;
  clusters: TownCluster[];
  totalStops: number;
  estimatedDriveMinutes: number;
  priority: 'high' | 'medium' | 'low';
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimate drive time: ~2 min per km (mixed roads)
function estimateDriveMinutes(km: number): number {
  return Math.round(km * 2);
}

function clusterTowns(retailers: RetailerWithMeta[], maxClusterRadiusKm = 40): PlannedRoute[] {
  // Group by town
  const townMap = new Map<string, TownCluster>();
  for (const r of retailers) {
    const key = r.town.toLowerCase();
    if (!townMap.has(key)) {
      townMap.set(key, { town: r.town, county: r.county, retailers: [], lat: r.lat ?? 0, lng: r.lng ?? 0 });
    }
    townMap.get(key)!.retailers.push(r);
    // Update lat/lng if we have a better one
    if (r.lat && r.lng && !townMap.get(key)!.lat) {
      const c = townMap.get(key)!;
      c.lat = r.lat;
      c.lng = r.lng;
    }
  }

  const towns = Array.from(townMap.values()).filter(t => t.lat && t.lng);
  const used = new Set<string>();
  const routes: PlannedRoute[] = [];

  // Greedy clustering
  for (const town of towns) {
    if (used.has(town.town.toLowerCase())) continue;
    const cluster: TownCluster[] = [town];
    used.add(town.town.toLowerCase());

    for (const other of towns) {
      if (used.has(other.town.toLowerCase())) continue;
      const dist = haversine(town.lat, town.lng, other.lat, other.lng);
      if (dist <= maxClusterRadiusKm) {
        cluster.push(other);
        used.add(other.town.toLowerCase());
      }
    }

    // Calculate total drive between consecutive stops
    let totalDriveKm = 0;
    for (let i = 1; i < cluster.length; i++) {
      totalDriveKm += haversine(cluster[i - 1].lat, cluster[i - 1].lng, cluster[i].lat, cluster[i].lng);
    }

    const totalStops = cluster.reduce((sum, c) => sum + c.retailers.length, 0);
    const avgPriority = cluster.reduce((sum, c) => sum + c.retailers.reduce((s, r) => s + r.priority_score, 0), 0) / totalStops;

    // Determine route name from counties
    const counties = [...new Set(cluster.map(c => c.county))];
    const townNames = cluster.map(c => c.town);
    const routeName = townNames.length <= 3
      ? townNames.join(' → ')
      : `${counties[0]} Circuit (${townNames.length} towns)`;

    routes.push({
      name: routeName,
      clusters: cluster,
      totalStops,
      estimatedDriveMinutes: estimateDriveMinutes(totalDriveKm),
      priority: avgPriority >= 70 ? 'high' : avgPriority >= 50 ? 'medium' : 'low',
    });
  }

  return routes.sort((a, b) => {
    const prio = { high: 3, medium: 2, low: 1 };
    return prio[b.priority] - prio[a.priority] || b.totalStops - a.totalStops;
  });
}

export default function JourneyPlanner() {
  const navigate = useNavigate();
  const { retailers, loading } = useRetailers();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [checkedStops, setCheckedStops] = useState<Set<string>>(new Set());

  const enrichedRetailers: RetailerWithMeta[] = useMemo(() =>
    retailers.map(r => {
      const outreach = getOutreach(r);
      const activity = getActivity(r);
      return {
        id: r.id,
        name: r.name,
        town: r.town,
        county: r.county,
        fit_score: r.fit_score ?? 0,
        priority_score: r.priority_score ?? 0,
        pipeline_stage: r.pipeline_stage,
        lat: r.lat,
        lng: r.lng,
        contactMethod: outreach.bestContactMethod,
        outreachPriority: outreach.outreachPriority,
        meetingScheduled: activity.meetingScheduled,
        suggestedNextStep: activity.suggestedNextStep,
        contactName: outreach.contactName,
      };
    }), [retailers]);

  const routes = useMemo(() => clusterTowns(enrichedRetailers), [enrichedRetailers]);
  const activeRoute = routes.find(r => r.name === selectedRoute) ?? routes[0];

  const toggleStop = (id: string) => {
    setCheckedStops(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const totalVisitable = retailers.filter(r => r.lat && r.lng).length;
  const highPriorityRoutes = routes.filter(r => r.priority === 'high').length;
  const totalDriveTime = routes.reduce((s, r) => s + r.estimatedDriveMinutes, 0);

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Plan</p>
          <h1 className="page-title">Journey Planner</h1>
          <p className="page-subtitle">Optimised visit routes grouped by proximity — plan your field days efficiently</p>
        </div>
        <button onClick={() => navigate('/calendar')} className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1 font-medium">
          Sales Calendar <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <div className="divider-gold" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Route, label: 'Routes', value: routes.length.toString(), highlight: true },
          { icon: MapPin, label: 'Visitable Accounts', value: totalVisitable.toString(), highlight: false },
          { icon: Target, label: 'High Priority Routes', value: highPriorityRoutes.toString(), highlight: false },
          { icon: Car, label: 'Est. Total Drive', value: `${Math.round(totalDriveTime / 60)}h ${totalDriveTime % 60}m`, highlight: false },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.highlight ? 'bg-champagne/20 border-primary/30' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.highlight ? 'gold-gradient' : 'bg-muted'}`}>
              <s.icon className={`w-4 h-4 ${s.highlight ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {retailers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Navigation className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No accounts with location data yet.</p>
          <p className="text-xs mt-1">Add retailers with town/location data to generate visit routes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route list */}
          <div className="card-premium p-5 lg:col-span-1 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-4">
              <Route className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h3 className="text-lg font-display font-semibold text-foreground">Routes</h3>
            </div>
            <div className="space-y-1.5">
              {routes.map(route => (
                <button
                  key={route.name}
                  onClick={() => setSelectedRoute(route.name)}
                  className={`w-full text-left flex items-center justify-between py-3 px-3 rounded-lg border transition-all group
                    ${activeRoute?.name === route.name
                      ? 'bg-champagne/30 border-primary/30 shadow-sm'
                      : 'border-transparent hover:bg-muted/50'}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${activeRoute?.name === route.name ? 'text-foreground' : 'text-foreground/80'}`}>
                      {route.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{route.totalStops} stops
                      </span>
                      {route.estimatedDriveMinutes > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{route.estimatedDriveMinutes}m drive
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2
                    ${route.priority === 'high' ? 'bg-success-light text-success' : route.priority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                    {route.priority}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Route detail */}
          {activeRoute && (
            <div className="card-premium p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground">{activeRoute.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />{activeRoute.totalStops} accounts
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />~{activeRoute.estimatedDriveMinutes} min driving
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />~{Math.round(activeRoute.totalStops * 30 + activeRoute.estimatedDriveMinutes)} min total
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-medium
                  ${activeRoute.priority === 'high' ? 'bg-success-light text-success' : activeRoute.priority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                  {activeRoute.priority} priority
                </span>
              </div>

              {/* Stops timeline */}
              <div className="space-y-0">
                {activeRoute.clusters.map((cluster, ci) => (
                  <div key={cluster.town}>
                    {/* Town header */}
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-display font-bold text-primary">{ci + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{cluster.town}</p>
                        <p className="text-[10px] text-muted-foreground">{cluster.county} · {cluster.retailers.length} account{cluster.retailers.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Retailer stops */}
                    <div className="ml-3 border-l-2 border-border/30 pl-6 space-y-1 pb-3">
                      {cluster.retailers.sort((a, b) => b.priority_score - a.priority_score).map(r => (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-champagne/15 transition-colors group"
                        >
                          <button onClick={() => toggleStop(r.id)} className="flex-shrink-0">
                            {checkedStops.has(r.id)
                              ? <CheckCircle2 className="w-4 h-4 text-success" />
                              : <Circle className="w-4 h-4 text-border" />}
                          </button>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/retailer/${r.id}`)}>
                            <p className={`text-sm font-medium group-hover:text-primary transition-colors ${checkedStops.has(r.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {r.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {r.contactName && (
                                <span className="text-[10px] text-muted-foreground">{r.contactName}</span>
                              )}
                              {r.suggestedNextStep && (
                                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">· {r.suggestedNextStep}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-14"><ScoreBar score={r.fit_score} label="" /></div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium
                              ${r.outreachPriority === 'high' ? 'bg-success-light text-success' : r.outreachPriority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                              {r.pipeline_stage.replace(/_/g, ' ')}
                            </span>
                            {r.meetingScheduled && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-champagne text-primary font-medium">Meeting</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Drive segment */}
                    {ci < activeRoute.clusters.length - 1 && (
                      <div className="flex items-center gap-2 ml-3 pl-6 py-1.5 text-muted-foreground/50">
                        <Car className="w-3 h-3" />
                        <span className="text-[10px]">
                          ~{estimateDriveMinutes(haversine(
                            cluster.lat, cluster.lng,
                            activeRoute.clusters[ci + 1].lat, activeRoute.clusters[ci + 1].lng
                          ))} min drive to {activeRoute.clusters[ci + 1].town}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary bar */}
              <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                    {checkedStops.size} of {activeRoute.totalStops} completed
                  </span>
                  <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full gold-gradient transition-all duration-500"
                      style={{ width: `${activeRoute.totalStops > 0 ? (checkedStops.size / activeRoute.totalStops) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/map')}
                  className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1 font-medium"
                >
                  View on map <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
