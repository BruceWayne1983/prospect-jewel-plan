import { useState, useMemo } from "react";
import { useRetailers, getOutreach, getActivity } from "@/hooks/useRetailers";
import { useNavigate } from "react-router-dom";
import { Navigation, MapPin, Clock, Car, Target, CheckCircle2, Circle, Loader2, Route, ArrowUpRight, Home, Plus, X, Search } from "lucide-react";
import { ScoreBar } from "@/components/ScoreIndicators";
import { DiaryWeekView, type DayPreference, type ScheduledVisit } from "@/components/journey/DiaryWeekView";
import { RouteScheduler } from "@/components/journey/RouteScheduler";

export interface HomeBase {
  address: string;
  postcode: string;
  lat: number;
  lng: number;
}

const DEFAULT_HOME: HomeBase = {
  address: '34 Nant Arain',
  postcode: 'CF38',
  lat: 51.5409,
  lng: -3.3410,
};

function loadHome(): HomeBase {
  try {
    const saved = localStorage.getItem('emma_home_base');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_HOME;
}

function saveHome(home: HomeBase) {
  localStorage.setItem('emma_home_base', JSON.stringify(home));
}

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
  driveFromHomeMinutes: number;
  driveHomeMinutes: number;
  priority: 'high' | 'medium' | 'low';
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateDriveMinutes(km: number): number {
  // ~50 km/h average for UK mixed roads (rural + town driving)
  // = 1.2 minutes per km
  return Math.round(km * 1.2);
}

function clusterTowns(retailers: RetailerWithMeta[], home: HomeBase, maxClusterRadiusKm = 40): PlannedRoute[] {
  const townMap = new Map<string, TownCluster>();
  for (const r of retailers) {
    const key = r.town.toLowerCase();
    if (!townMap.has(key)) {
      townMap.set(key, { town: r.town, county: r.county, retailers: [], lat: r.lat ?? 0, lng: r.lng ?? 0 });
    }
    townMap.get(key)!.retailers.push(r);
    if (r.lat && r.lng && !townMap.get(key)!.lat) {
      const c = townMap.get(key)!;
      c.lat = r.lat;
      c.lng = r.lng;
    }
  }

  const towns = Array.from(townMap.values()).filter(t => t.lat && t.lng);
  const used = new Set<string>();
  const routes: PlannedRoute[] = [];

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

    let totalDriveKm = 0;
    for (let i = 1; i < cluster.length; i++) {
      totalDriveKm += haversine(cluster[i - 1].lat, cluster[i - 1].lng, cluster[i].lat, cluster[i].lng);
    }

    const totalStops = cluster.reduce((sum, c) => sum + c.retailers.length, 0);
    const avgPriority = cluster.reduce((sum, c) => sum + c.retailers.reduce((s, r) => s + r.priority_score, 0), 0) / totalStops;

    const counties = [...new Set(cluster.map(c => c.county))];
    const townNames = cluster.map(c => c.town);
    const routeName = townNames.length <= 3
      ? townNames.join(' → ')
      : `${counties[0]} Circuit (${townNames.length} towns)`;

    // Drive from home to first stop and from last stop to home
    const firstCluster = cluster[0];
    const lastCluster = cluster[cluster.length - 1];
    const driveFromHomeKm = haversine(home.lat, home.lng, firstCluster.lat, firstCluster.lng);
    const driveHomeKm = haversine(lastCluster.lat, lastCluster.lng, home.lat, home.lng);

    routes.push({
      name: routeName,
      clusters: cluster,
      totalStops,
      estimatedDriveMinutes: estimateDriveMinutes(totalDriveKm),
      driveFromHomeMinutes: estimateDriveMinutes(driveFromHomeKm),
      driveHomeMinutes: estimateDriveMinutes(driveHomeKm),
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayPref, setSelectedDayPref] = useState<DayPreference | null>(null);
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([]);
  const [home, setHome] = useState<HomeBase>(loadHome);
  const [editingHome, setEditingHome] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [customRouteAccounts, setCustomRouteAccounts] = useState<Set<string>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('custom_route_accounts') || '[]') as string[];
      return new Set(saved);
    } catch { return new Set(); }
  });

  const enrichedRetailers: RetailerWithMeta[] = useMemo(() =>
    retailers.map(r => {
      const outreach = getOutreach(r);
      const activity = getActivity(r);
      return {
        id: r.id, name: r.name, town: r.town, county: r.county,
        fit_score: r.fit_score ?? 0, priority_score: r.priority_score ?? 0,
        pipeline_stage: r.pipeline_stage, lat: r.lat, lng: r.lng,
        contactMethod: outreach.bestContactMethod, outreachPriority: outreach.outreachPriority,
        meetingScheduled: activity.meetingScheduled, suggestedNextStep: activity.suggestedNextStep,
        contactName: outreach.contactName,
      };
    }), [retailers]);

  const routes = useMemo(() => clusterTowns(enrichedRetailers, home), [enrichedRetailers, home]);

  // Build a custom route from manually-added accounts
  const customRoute: PlannedRoute | null = useMemo(() => {
    if (customRouteAccounts.size === 0) return null;
    const selected = enrichedRetailers.filter(r => customRouteAccounts.has(r.id));
    if (selected.length === 0) return null;

    // Group by town
    const townMap = new Map<string, TownCluster>();
    for (const r of selected) {
      const key = r.town.toLowerCase();
      if (!townMap.has(key)) {
        townMap.set(key, { town: r.town, county: r.county, retailers: [], lat: r.lat ?? 0, lng: r.lng ?? 0 });
      }
      townMap.get(key)!.retailers.push(r);
    }
    const clusters = Array.from(townMap.values());

    // Sort clusters by distance from home (nearest first) — only if they have coords
    const hasCoords = (c: TownCluster) => c.lat !== 0 || c.lng !== 0;
    clusters.sort((a, b) => {
      if (!hasCoords(a) && !hasCoords(b)) return 0;
      if (!hasCoords(a)) return 1;
      if (!hasCoords(b)) return -1;
      return haversine(home.lat, home.lng, a.lat, a.lng) - haversine(home.lat, home.lng, b.lat, b.lng);
    });

    let totalDriveKm = 0;
    for (let i = 1; i < clusters.length; i++) {
      if (hasCoords(clusters[i - 1]) && hasCoords(clusters[i])) {
        totalDriveKm += haversine(clusters[i - 1].lat, clusters[i - 1].lng, clusters[i].lat, clusters[i].lng);
      }
    }

    const firstCluster = clusters[0];
    const lastCluster = clusters[clusters.length - 1];
    const driveFromHome = hasCoords(firstCluster) ? estimateDriveMinutes(haversine(home.lat, home.lng, firstCluster.lat, firstCluster.lng)) : 0;
    const driveHome = hasCoords(lastCluster) ? estimateDriveMinutes(haversine(lastCluster.lat, lastCluster.lng, home.lat, home.lng)) : 0;

    return {
      name: '📌 My Custom Route',
      clusters,
      totalStops: selected.length,
      estimatedDriveMinutes: estimateDriveMinutes(totalDriveKm),
      driveFromHomeMinutes: driveFromHome,
      driveHomeMinutes: driveHome,
      priority: 'high',
    };
  }, [customRouteAccounts, enrichedRetailers, home]);

  const allRoutes = useMemo(() => {
    const list = customRoute ? [customRoute, ...routes] : routes;
    return list;
  }, [customRoute, routes]);

  const filteredRoutes = useMemo(() => {
    if (!selectedDayPref || selectedDayPref.availability === 'full_day') return allRoutes;
    if (selectedDayPref.availability === 'local_only' && selectedDayPref.maxDriveMinutes > 0) {
      return [...allRoutes].sort((a, b) => {
        const aLocal = (a.estimatedDriveMinutes + a.driveFromHomeMinutes) <= selectedDayPref.maxDriveMinutes * 2;
        const bLocal = (b.estimatedDriveMinutes + b.driveFromHomeMinutes) <= selectedDayPref.maxDriveMinutes * 2;
        if (aLocal && !bLocal) return -1;
        if (!aLocal && bLocal) return 1;
        return 0;
      });
    }
    return allRoutes;
  }, [allRoutes, selectedDayPref]);

  const activeRoute = filteredRoutes.find(r => r.name === selectedRoute) ?? filteredRoutes[0];

  const toggleStop = (id: string) => {
    setCheckedStops(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDaySelect = (dayIndex: number, date: string, pref: DayPreference) => {
    setSelectedDay(dayIndex);
    setSelectedDate(date);
    setSelectedDayPref(pref);
  };

  const handleScheduled = (visits: ScheduledVisit[]) => {
    setScheduledVisits(prev => [...prev, ...visits]);
  };

  const updateHome = (updates: Partial<HomeBase>) => {
    const next = { ...home, ...updates };
    setHome(next);
    saveHome(next);
  };

  // Sync customRouteAccounts to localStorage
  const syncRouteToStorage = (accounts: Set<string>) => {
    localStorage.setItem('custom_route_accounts', JSON.stringify([...accounts]));
  };

  const addAccountToRoute = (id: string) => {
    setCustomRouteAccounts(prev => {
      const next = new Set([...prev, id]);
      syncRouteToStorage(next);
      return next;
    });
    setSelectedRoute('📌 My Custom Route');
  };

  const removeAccountFromRoute = (id: string) => {
    setCustomRouteAccounts(prev => {
      const next = new Set(prev);
      next.delete(id);
      syncRouteToStorage(next);
      return next;
    });
  };

  // Accounts available to add (not already in custom route)
  const addableAccounts = useMemo(() => {
    const search = addSearch.toLowerCase();
    return enrichedRetailers
      .filter(r => !customRouteAccounts.has(r.id))
      .filter(r => !search || r.name.toLowerCase().includes(search) || r.town.toLowerCase().includes(search))
      .slice(0, 8);
  }, [enrichedRetailers, customRouteAccounts, addSearch]);

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
          <p className="page-subtitle">Routes from home, linked to Emma's diary — respects availability, school runs & commitments</p>
        </div>
        <button onClick={() => navigate('/calendar')} className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1 font-medium">
          Sales Calendar <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <div className="divider-gold" />

      {/* Home Base Card */}
      <div className="card-premium p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
              <Home className="w-4 h-4 text-card" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Home Base</p>
              {!editingHome ? (
                <p className="text-sm font-medium text-foreground">{home.address}, {home.postcode}</p>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <input value={home.address} onChange={e => updateHome({ address: e.target.value })}
                    className="text-sm bg-muted/50 rounded px-2 py-1 border border-border/20 text-foreground w-48" placeholder="Address" />
                  <input value={home.postcode} onChange={e => updateHome({ postcode: e.target.value })}
                    className="text-sm bg-muted/50 rounded px-2 py-1 border border-border/20 text-foreground w-20" placeholder="Postcode" />
                  <input type="number" step="0.001" value={home.lat} onChange={e => updateHome({ lat: parseFloat(e.target.value) || 0 })}
                    className="text-[10px] bg-muted/50 rounded px-1.5 py-1 border border-border/20 text-foreground w-20" placeholder="Lat" />
                  <input type="number" step="0.001" value={home.lng} onChange={e => updateHome({ lng: parseFloat(e.target.value) || 0 })}
                    className="text-[10px] bg-muted/50 rounded px-1.5 py-1 border border-border/20 text-foreground w-20" placeholder="Lng" />
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setEditingHome(!editingHome)} className="text-[10px] text-primary hover:text-accent transition-colors font-medium">
            {editingHome ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Route, label: 'Routes', value: allRoutes.length.toString(), highlight: true },
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Diary sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <DiaryWeekView
              onDaySelect={handleDaySelect}
              selectedDay={selectedDay}
              scheduledVisits={scheduledVisits}
            />

            {selectedDayPref && selectedDayPref.availability === 'local_only' && (
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                <p className="text-[10px] text-warning font-medium flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5" />
                  Local only — max {selectedDayPref.maxDriveMinutes}m drive
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Routes exceeding this limit will be flagged
                </p>
              </div>
            )}

            {/* Add Accounts Panel */}
            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  <h4 className="text-sm font-display font-semibold text-foreground">Build a Route</h4>
                </div>
                {customRouteAccounts.size > 0 && (
                  <button onClick={() => { setCustomRouteAccounts(new Set()); syncRouteToStorage(new Set()); }} className="text-[9px] text-destructive hover:text-destructive/80 font-medium">Clear all</button>
                )}
              </div>

              {/* Selected accounts */}
              {customRouteAccounts.size > 0 && (
                <div className="space-y-1 mb-3">
                  {enrichedRetailers.filter(r => customRouteAccounts.has(r.id)).map(r => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-champagne/20">
                      <div>
                        <span className="text-xs font-medium text-foreground">{r.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{r.town}</span>
                      </div>
                      <button onClick={() => removeAccountFromRoute(r.id)}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors" />
                      </button>
                    </div>
                  ))}
                  {customRoute && (
                    <div className="flex items-center gap-2 pt-1.5 text-[10px] text-muted-foreground">
                      <Home className="w-3 h-3" />
                      <span>{customRoute.driveFromHomeMinutes}m from home → {customRoute.estimatedDriveMinutes}m between stops → {customRoute.driveHomeMinutes}m home</span>
                    </div>
                  )}
                  {customRouteAccounts.size > 0 && (
                    <button
                      onClick={() => {
                        setSelectedRoute('📌 My Custom Route');
                        setShowAddAccount(false);
                        setAddSearch('');
                      }}
                      className="w-full mt-2 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2
                        gold-gradient text-card hover:opacity-90"
                    >
                      <Route className="w-3.5 h-3.5" />
                      Build Route ({customRouteAccounts.size} account{customRouteAccounts.size !== 1 ? 's' : ''})
                    </button>
                  )}
                </div>
              )}

              {/* Search + add */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <input
                  type="text"
                  value={addSearch}
                  onChange={e => { setAddSearch(e.target.value); setShowAddAccount(true); }}
                  onFocus={() => setShowAddAccount(true)}
                  placeholder="Search accounts to add..."
                  className="w-full text-xs bg-muted/50 rounded-lg pl-8 pr-3 py-2 border border-border/20 text-foreground placeholder:text-muted-foreground/40"
                />
              </div>

              {showAddAccount && (
                <div className="mt-2 space-y-0.5 max-h-[200px] overflow-y-auto">
                  {addableAccounts.map(r => (
                    <button
                      key={r.id}
                      onClick={() => addAccountToRoute(r.id)}
                      className="w-full text-left flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <span className="text-xs font-medium text-foreground">{r.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">{r.town}, {r.county}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {r.lat && r.lng && (
                          <span className="text-[9px] text-muted-foreground">
                            {estimateDriveMinutes(haversine(home.lat, home.lng, r.lat, r.lng))}m
                          </span>
                        )}
                        <Plus className="w-3 h-3 text-primary" />
                      </div>
                    </button>
                  ))}
                  {addableAccounts.length === 0 && (
                    <p className="text-[10px] text-muted-foreground/50 text-center py-3">No matching accounts</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Route list */}
          <div className="card-premium p-5 lg:col-span-1 max-h-[700px] overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-4">
              <Route className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h3 className="text-base font-display font-semibold text-foreground">Routes</h3>
            </div>
            <div className="space-y-1.5">
              {filteredRoutes.map(route => {
                const totalWithHome = route.estimatedDriveMinutes + route.driveFromHomeMinutes + route.driveHomeMinutes;
                const isOverLimit = selectedDayPref?.availability === 'local_only'
                  && selectedDayPref.maxDriveMinutes > 0
                  && route.driveFromHomeMinutes > selectedDayPref.maxDriveMinutes;

                return (
                  <button
                    key={route.name}
                    onClick={() => setSelectedRoute(route.name)}
                    className={`w-full text-left flex items-center justify-between py-3 px-3 rounded-lg border transition-all
                      ${activeRoute?.name === route.name
                        ? 'bg-champagne/30 border-primary/30 shadow-sm'
                        : 'border-transparent hover:bg-muted/50'}
                      ${isOverLimit ? 'opacity-50' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-medium truncate ${activeRoute?.name === route.name ? 'text-foreground' : 'text-foreground/80'}`}>
                          {route.name}
                        </p>
                        {isOverLimit && <Car className="w-3 h-3 text-warning flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{route.totalStops}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${isOverLimit ? 'text-warning' : 'text-muted-foreground'}`}>
                          <Home className="w-3 h-3" />{route.driveFromHomeMinutes}m
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{totalWithHome}m total
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2
                      ${route.priority === 'high' ? 'bg-success-light text-success' : route.priority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {route.priority}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Route detail + scheduler */}
          {activeRoute && (
            <div className="card-premium p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground">{activeRoute.name}</h3>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />{activeRoute.totalStops} accounts
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" />~{activeRoute.estimatedDriveMinutes}m between stops
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />~{Math.round(activeRoute.totalStops * 30 + activeRoute.estimatedDriveMinutes + activeRoute.driveFromHomeMinutes + activeRoute.driveHomeMinutes)}m total day
                    </span>
                  </div>
                </div>
                <span className={`text-[9px] px-2.5 py-1 rounded-full font-medium
                  ${activeRoute.priority === 'high' ? 'bg-success-light text-success' : activeRoute.priority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                  {activeRoute.priority} priority
                </span>
              </div>

              {/* Home → First stop */}
              <div className="flex items-center gap-2 py-2 text-muted-foreground/70 mb-1">
                <Home className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Leave home</span>
                <span className="text-[10px] text-muted-foreground">({home.address}, {home.postcode})</span>
              </div>
              <div className="flex items-center gap-2 ml-2 pl-4 py-1.5 text-muted-foreground/50 border-l-2 border-primary/20">
                <Car className="w-3 h-3" />
                <span className="text-[10px]">~{activeRoute.driveFromHomeMinutes} min drive to {activeRoute.clusters[0]?.town}</span>
              </div>

              {/* Stops timeline */}
              <div className="space-y-0">
                {activeRoute.clusters.map((cluster, ci) => (
                  <div key={cluster.town}>
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-display font-bold text-primary">{ci + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{cluster.town}</p>
                        <p className="text-[10px] text-muted-foreground">{cluster.county} · {cluster.retailers.length} account{cluster.retailers.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="ml-3 border-l-2 border-border/30 pl-6 space-y-1 pb-3">
                      {cluster.retailers.sort((a, b) => b.priority_score - a.priority_score).map(r => (
                        <div key={r.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-champagne/15 transition-colors group">
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
                              {r.contactName && <span className="text-[10px] text-muted-foreground">{r.contactName}</span>}
                              {r.suggestedNextStep && <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">· {r.suggestedNextStep}</span>}
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

              {/* Last stop → Home */}
              <div className="flex items-center gap-2 ml-3 pl-6 py-1.5 text-muted-foreground/50 border-l-2 border-primary/20">
                <Car className="w-3 h-3" />
                <span className="text-[10px]">~{activeRoute.driveHomeMinutes} min drive home</span>
              </div>
              <div className="flex items-center gap-2 py-2 text-muted-foreground/70">
                <Home className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-foreground">Arrive home</span>
              </div>

              {/* Inline Add to Route */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-display font-semibold text-foreground">Add Account to Route</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <input
                    type="text"
                    value={addSearch}
                    onChange={e => { setAddSearch(e.target.value); setShowAddAccount(true); }}
                    onFocus={() => setShowAddAccount(true)}
                    placeholder="Search by name or town..."
                    className="w-full text-xs bg-muted/50 rounded-lg pl-8 pr-3 py-2 border border-border/20 text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
                {showAddAccount && addSearch.length > 0 && (
                  <div className="mt-1.5 space-y-0.5 max-h-[160px] overflow-y-auto rounded-lg border border-border/20 bg-card p-1">
                    {addableAccounts.map(r => (
                      <button
                        key={r.id}
                        onClick={() => addAccountToRoute(r.id)}
                        className="w-full text-left flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <span className="text-xs font-medium text-foreground">{r.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-1.5">{r.town}, {r.county}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {r.lat && r.lng && (
                            <span className="text-[9px] text-muted-foreground">
                              {estimateDriveMinutes(haversine(home.lat, home.lng, r.lat, r.lng))}m
                            </span>
                          )}
                          <Plus className="w-3 h-3 text-primary" />
                        </div>
                      </button>
                    ))}
                    {addableAccounts.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/50 text-center py-3">No matching accounts</p>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="mt-3 pt-4 border-t border-border/30 flex items-center justify-between">
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
                <button onClick={() => navigate('/map')} className="text-xs text-primary hover:text-accent transition-colors flex items-center gap-1 font-medium">
                  View on map <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Route Scheduler */}
              {selectedDate && selectedDayPref && (
                <RouteScheduler
                  route={activeRoute}
                  selectedDate={selectedDate}
                  dayPref={selectedDayPref}
                  homeBase={home}
                  onScheduled={handleScheduled}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
