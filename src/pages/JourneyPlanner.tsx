import { useState, useMemo, useEffect } from "react";
import { useRetailers, getOutreach, getActivity } from "@/hooks/useRetailers";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Navigation, MapPin, Clock, Car, Target, CheckCircle2, Circle, Loader2, Route, ArrowUpRight, Home, Plus, X, Search, Radar, ExternalLink, Trash2, Map as MapIcon, AlertTriangle } from "lucide-react";
import { ScoreBar } from "@/components/ScoreIndicators";
import { DiaryWeekView, type DayPreference, type ScheduledVisit } from "@/components/journey/DiaryWeekView";
import { RouteScheduler } from "@/components/journey/RouteScheduler";
import { NearbyAccounts } from "@/components/journey/NearbyAccounts";
import { MeetingBooker } from "@/components/journey/MeetingBooker";
import { nearestNeighbourOrder, twoOptImprove } from "@/utils/routeOptimisation";

const ensureSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;
  await new Promise<void>((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (sess) { subscription.unsubscribe(); resolve(); }
    });
  });
};

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

// Stable id for use in the route-distances matrix.
function clusterId(c: { town: string }): string {
  return `cluster:${c.town.toLowerCase().trim()}`;
}
const HOME_ID = "home";

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
  // Optional traffic-aware totals (only set when route-distances returned them).
  trafficDriveMinutes?: number;
  trafficFromHomeMinutes?: number;
  trafficHomeMinutes?: number;
  source?: 'haversine' | 'google';
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

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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

  // Per-route removed stop IDs (persisted)
  const [removedStops, setRemovedStops] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('journey_removed_stops') || '{}'); }
    catch { return {}; }
  });

  const isStopRemoved = (routeName: string, retailerId: string) =>
    (removedStops[routeName] || []).includes(retailerId);

  const removeStopFromRoute = (routeName: string, retailerId: string) => {
    setRemovedStops(prev => {
      const next = { ...prev, [routeName]: [...(prev[routeName] || []), retailerId] };
      localStorage.setItem('journey_removed_stops', JSON.stringify(next));
      return next;
    });
  };

  const restoreStopsForRoute = (routeName: string) => {
    setRemovedStops(prev => {
      const next = { ...prev };
      delete next[routeName];
      localStorage.setItem('journey_removed_stops', JSON.stringify(next));
      return next;
    });
  };

  // Fetch nearby prospects for route stops
  const [nearbyProspects, setNearbyProspects] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("discovered_prospects")
      .select("id, name, town, county, category, lat, lng, predicted_fit_score, status")
      .neq("status", "dismissed")
      .neq("status", "accepted")
      .then(({ data }) => setNearbyProspects(data || []));
  }, []);

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

  // ── Real road-distance enrichment via Google Maps Distance Matrix ──
  // Falls back silently to the haversine baseline if the edge function fails
  // or no API key is configured.
  type EnrichmentState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ok'; routes: PlannedRoute[]; hasTraffic: boolean }
    | { status: 'fallback'; reason: string };
  const [enrichment, setEnrichment] = useState<EnrichmentState>({ status: 'idle' });

  // Routes shown to the rest of the UI: prefer the enriched, real-distance
  // version when it matches the current haversine baseline.
  const enrichedAllRoutes: PlannedRoute[] = useMemo(() => {
    if (enrichment.status !== 'ok') return allRoutes;
    // Map by name for safety
    const byName = new Map(enrichment.routes.map(r => [r.name, r]));
    return allRoutes.map(r => byName.get(r.name) ?? r);
  }, [allRoutes, enrichment]);

  // Decide departureTime: use 'now' for traffic if any planned date is today
  // and the day starts within the next hour. (Safe default: undefined.)
  const departureTime: 'now' | undefined = useMemo(() => {
    if (!selectedDate) return undefined;
    const today = new Date().toISOString().slice(0, 10);
    if (selectedDate !== today) return undefined;
    const startMins = selectedDayPref ? timeToMinutes(selectedDayPref.startTime) : 510;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return startMins - nowMins <= 60 ? 'now' : undefined;
  }, [selectedDate, selectedDayPref]);

  // Build a stable key for the set of input routes so the effect doesn't
  // re-fire on unrelated state changes.
  const routesKey = useMemo(
    () => allRoutes
      .map(r => r.name + '|' + r.clusters.map(c => `${c.town}@${c.lat.toFixed(3)},${c.lng.toFixed(3)}`).join('>'))
      .join('||') + '##' + `${home.lat.toFixed(3)},${home.lng.toFixed(3)}` + '##' + (departureTime ?? ''),
    [allRoutes, home, departureTime],
  );

  useEffect(() => {
    let cancelled = false;
    if (allRoutes.length === 0) {
      setEnrichment({ status: 'idle' });
      return;
    }

    const run = async () => {
      setEnrichment({ status: 'loading' });

      // Collect unique cluster points
      const seen = new Set<string>();
      const points: Array<{ id: string; lat: number; lng: number }> = [];
      const pushPoint = (id: string, lat: number, lng: number) => {
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return;
        if (seen.has(id)) return;
        seen.add(id);
        points.push({ id, lat, lng });
      };
      pushPoint(HOME_ID, home.lat, home.lng);
      for (const r of allRoutes) {
        for (const c of r.clusters) pushPoint(clusterId(c), c.lat, c.lng);
      }

      if (points.length < 2) {
        setEnrichment({ status: 'fallback', reason: 'Not enough geocoded stops' });
        return;
      }

      try {
        await ensureSession();
        const { data, error } = await supabase.functions.invoke('route-distances', {
          body: { origins: points, destinations: points, departureTime },
        });
        if (cancelled) return;
        if (error || !data || (data as any).error) {
          const reason = (data as any)?.error || (error as any)?.message || 'Real-time drive estimates unavailable.';
          setEnrichment({ status: 'fallback', reason });
          return;
        }

        // Build distance lookup: id->id->{minutes, trafficMinutes|null, km}
        const lookup = new Map<string, Map<string, { minutes: number; trafficMinutes: number | null; km: number }>>();
        let hasTraffic = false;
        for (const row of (data as any).matrix as Array<{ originId: string; results: Array<{ destinationId: string; distance_km: number; duration_minutes: number; duration_in_traffic_minutes: number | null }> }>) {
          const inner = new Map<string, { minutes: number; trafficMinutes: number | null; km: number }>();
          for (const cell of row.results) {
            inner.set(cell.destinationId, {
              minutes: cell.duration_minutes,
              trafficMinutes: cell.duration_in_traffic_minutes,
              km: cell.distance_km,
            });
            if (cell.duration_in_traffic_minutes != null) hasTraffic = true;
          }
          lookup.set(row.originId, inner);
        }

        // Distance fn used by optimisation: id->id minutes, falling back to haversine.
        const idToCoords = new Map<string, { lat: number; lng: number }>();
        for (const p of points) idToCoords.set(p.id, { lat: p.lat, lng: p.lng });

        const distanceMinutes = (a: string, b: string): number => {
          const cell = lookup.get(a)?.get(b);
          if (cell) return cell.minutes;
          const ca = idToCoords.get(a);
          const cb = idToCoords.get(b);
          if (!ca || !cb) return Infinity;
          return estimateDriveMinutes(haversine(ca.lat, ca.lng, cb.lat, cb.lng));
        };
        const trafficMinutesOrPlain = (a: string, b: string): number => {
          const cell = lookup.get(a)?.get(b);
          if (cell?.trafficMinutes != null) return cell.trafficMinutes;
          return distanceMinutes(a, b);
        };

        const recomputeRoute = (route: PlannedRoute, reorder: boolean): PlannedRoute => {
          const validClusters = route.clusters.filter(c => (c.lat !== 0 || c.lng !== 0));
          if (validClusters.length === 0) return route;

          let orderedIds: string[];
          if (reorder && validClusters.length >= 2) {
            const ids = validClusters.map(clusterId);
            const seeded = nearestNeighbourOrder(ids, HOME_ID, distanceMinutes);
            orderedIds = twoOptImprove(seeded, HOME_ID, distanceMinutes, 50);
          } else {
            orderedIds = validClusters.map(clusterId);
          }

          // Map ordered ids back to clusters
          const byId = new Map(validClusters.map(c => [clusterId(c), c]));
          const orderedClusters = orderedIds.map(id => byId.get(id)!).filter(Boolean);

          // Sum durations
          const first = clusterId(orderedClusters[0]);
          const last = clusterId(orderedClusters[orderedClusters.length - 1]);
          const driveFromHomeMinutes = Math.round(distanceMinutes(HOME_ID, first));
          const driveHomeMinutes = Math.round(distanceMinutes(last, HOME_ID));
          let between = 0;
          for (let i = 1; i < orderedClusters.length; i++) {
            between += distanceMinutes(clusterId(orderedClusters[i - 1]), clusterId(orderedClusters[i]));
          }
          const estimatedDriveMinutes = Math.round(between);

          let trafficFromHome: number | undefined;
          let trafficHome: number | undefined;
          let trafficBetween: number | undefined;
          if (hasTraffic) {
            trafficFromHome = Math.round(trafficMinutesOrPlain(HOME_ID, first));
            trafficHome = Math.round(trafficMinutesOrPlain(last, HOME_ID));
            let tb = 0;
            for (let i = 1; i < orderedClusters.length; i++) {
              tb += trafficMinutesOrPlain(clusterId(orderedClusters[i - 1]), clusterId(orderedClusters[i]));
            }
            trafficBetween = Math.round(tb);
          }

          return {
            ...route,
            clusters: orderedClusters,
            estimatedDriveMinutes,
            driveFromHomeMinutes,
            driveHomeMinutes,
            trafficDriveMinutes: trafficBetween,
            trafficFromHomeMinutes: trafficFromHome,
            trafficHomeMinutes: trafficHome,
            source: 'google',
          };
        };

        const enriched = allRoutes.map(r => recomputeRoute(r, r.name !== '📌 My Custom Route'));
        if (cancelled) return;
        setEnrichment({ status: 'ok', routes: enriched, hasTraffic });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Real-time drive estimates unavailable.';
        setEnrichment({ status: 'fallback', reason: msg });
      }
    };

    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesKey]);

  const filteredRoutes = useMemo(() => {
    if (!selectedDayPref || selectedDayPref.availability === 'full_day') return enrichedAllRoutes;
    if (selectedDayPref.availability === 'local_only' && selectedDayPref.maxDriveMinutes > 0) {
      return [...enrichedAllRoutes].sort((a, b) => {
        const aLocal = (a.estimatedDriveMinutes + a.driveFromHomeMinutes) <= selectedDayPref.maxDriveMinutes * 2;
        const bLocal = (b.estimatedDriveMinutes + b.driveFromHomeMinutes) <= selectedDayPref.maxDriveMinutes * 2;
        if (aLocal && !bLocal) return -1;
        if (!aLocal && bLocal) return 1;
        return 0;
      });
    }
    return enrichedAllRoutes;
  }, [enrichedAllRoutes, selectedDayPref]);

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
  const highPriorityRoutes = enrichedAllRoutes.filter(r => r.priority === 'high').length;
  const totalDriveTime = enrichedAllRoutes.reduce((s, r) => s + r.estimatedDriveMinutes, 0);

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

      {/* Real-time drive estimate fallback banner */}
      {enrichment.status === 'fallback' && allRoutes.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-foreground/80">
            <p className="font-medium text-warning">Real-time drive estimates unavailable.</p>
            <p className="text-muted-foreground mt-0.5">Showing approximate distances. {enrichment.reason}</p>
          </div>
        </div>
      )}
      {enrichment.status === 'loading' && allRoutes.length > 0 && (
        <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-champagne/15 border border-primary/10 text-[11px] text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          Refining routes with live road distances…
        </div>
      )}

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
          {activeRoute && (() => {
            const removedForRoute = removedStops[activeRoute.name] || [];
            // Build ordered list of remaining stops (with coords) for navigation
            const orderedStops = activeRoute.clusters.flatMap(c =>
              c.retailers
                .filter(r => !removedForRoute.includes(r.id))
                .sort((a, b) => b.priority_score - a.priority_score)
            );
            const navStops = orderedStops.filter(r => r.lat != null && r.lng != null);

            const buildGoogleMapsUrl = (stops: typeof navStops) => {
              if (stops.length === 0) return null;
              const origin = `${home.lat},${home.lng}`;
              const destination = origin; // round-trip back home
              const waypoints = stops.map(s => `${s.lat},${s.lng}`).join('|');
              return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
            };

            // Google Maps caps at ~9 waypoints — split into legs of 8
            const MAX_WAYPOINTS = 8;
            const legs: Array<{ url: string; label: string }> = [];
            if (navStops.length > 0) {
              if (navStops.length <= MAX_WAYPOINTS) {
                legs.push({ url: buildGoogleMapsUrl(navStops)!, label: 'Open in Google Maps' });
              } else {
                for (let i = 0; i < navStops.length; i += MAX_WAYPOINTS) {
                  const slice = navStops.slice(i, i + MAX_WAYPOINTS);
                  legs.push({
                    url: buildGoogleMapsUrl(slice)!,
                    label: `Leg ${legs.length + 1} (${slice.length} stops)`,
                  });
                }
              }
            }

            return (
            <div className="card-premium p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground">{activeRoute.name}</h3>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />{orderedStops.length} accounts{removedForRoute.length > 0 && <span className="text-warning"> ({removedForRoute.length} removed)</span>}
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

              {/* Navigation actions */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {legs.length > 0 ? (
                  legs.map(leg => (
                    <a
                      key={leg.url}
                      href={leg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg gold-gradient text-card text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      {leg.label}
                    </a>
                  ))
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">No stops with coordinates — add lat/lng on retailer profiles to enable navigation</span>
                )}
                {removedForRoute.length > 0 && (
                  <button
                    onClick={() => restoreStopsForRoute(activeRoute.name)}
                    className="text-[10px] text-primary hover:text-accent underline ml-auto"
                  >
                    Restore {removedForRoute.length} removed stop{removedForRoute.length === 1 ? '' : 's'}
                  </button>
                )}
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
                      {cluster.retailers.filter(r => !removedForRoute.includes(r.id)).sort((a, b) => b.priority_score - a.priority_score).map((r, ri) => {
                        // Estimate arrival time for this stop
                        const visitIndex = activeRoute.clusters.slice(0, ci).reduce((s, c) => s + c.retailers.length, 0) + ri;
                        const baseMinutes = activeRoute.driveFromHomeMinutes + visitIndex * 30;
                        let driveSoFar = activeRoute.driveFromHomeMinutes;
                        for (let pi = 1; pi <= ci; pi++) {
                          driveSoFar += estimateDriveMinutes(haversine(
                            activeRoute.clusters[pi - 1].lat, activeRoute.clusters[pi - 1].lng,
                            activeRoute.clusters[pi].lat, activeRoute.clusters[pi].lng
                          ));
                        }
                        const startMins = selectedDayPref ? timeToMinutes(selectedDayPref.startTime) : 510; // 08:30 default
                        const arrivalMins = startMins + driveSoFar + ri * 30;
                        const suggestedArrival = `${String(Math.floor(arrivalMins / 60)).padStart(2, '0')}:${String(arrivalMins % 60).padStart(2, '0')}`;

                        return (
                        <div key={r.id}>
                        <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-champagne/15 transition-colors group">
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
                            <span className="text-[10px] text-muted-foreground font-mono">{suggestedArrival}</span>
                            <div className="w-14"><ScoreBar score={r.fit_score} label="" /></div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium
                              ${r.outreachPriority === 'high' ? 'bg-success-light text-success' : r.outreachPriority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                              {r.pipeline_stage.replace(/_/g, ' ')}
                            </span>
                            {r.meetingScheduled && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-champagne text-primary font-medium">Meeting</span>
                            )}
                            {selectedDate && (
                              <MeetingBooker
                                retailerId={r.id}
                                retailerName={r.name}
                                town={cluster.town}
                                suggestedArrival={suggestedArrival}
                                selectedDate={selectedDate}
                                routeName={activeRoute.name}
                                onBooked={() => {}}
                              />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeStopFromRoute(activeRoute.name, r.id); }}
                              className="ml-1 p-1 rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Remove this stop from the route"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        </div>
                        );
                      })}
                    </div>

                    {/* Nearby un-contacted prospects for this stop */}
                    {(() => {
                      const clusterProspects = nearbyProspects.filter(p => {
                        if (!p.lat || !p.lng || !cluster.lat || !cluster.lng) return false;
                        const km = haversine(cluster.lat, cluster.lng, p.lat, p.lng);
                        const miles = km * 0.621371;
                        return miles <= 10;
                      }).map(p => ({
                        ...p,
                        distanceMiles: haversine(cluster.lat, cluster.lng, p.lat, p.lng) * 0.621371,
                      })).sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 3);

                      if (clusterProspects.length === 0) return null;
                      return (
                        <div className="ml-3 pl-6 border-l-2 border-primary/10 pb-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Radar className="w-3 h-3 text-primary/60" />
                            <span className="text-[9px] text-primary/70 font-medium uppercase tracking-wider">Prospects nearby</span>
                          </div>
                          {clusterProspects.map(p => (
                            <button
                              key={p.id}
                              onClick={() => navigate(`/prospect/${p.id}`)}
                              className="w-full text-left flex items-center justify-between py-1.5 px-2.5 rounded-md hover:bg-champagne/10 transition-colors"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-foreground/70">{p.name}</span>
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-champagne/30 text-primary font-medium">
                                  {p.category.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-muted-foreground">{p.distanceMiles.toFixed(1)} mi</span>
                                <span className="text-[9px] text-muted-foreground/60">fit {p.predicted_fit_score ?? 0}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/30" />
                              </div>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

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

              {/* Nearby Accounts Suggestions */}
              <NearbyAccounts
                routeClusters={activeRoute.clusters}
                allRetailers={enrichedRetailers}
                routeRetailerIds={new Set(activeRoute.clusters.flatMap(c => c.retailers.map(r => r.id)))}
                onAddToRoute={addAccountToRoute}
              />

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
            );
          })()}
        </div>
      )}
    </div>
  );
}
