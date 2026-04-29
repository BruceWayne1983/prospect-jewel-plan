import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Retailer } from "@/hooks/useRetailers";
import { Loader2 } from "lucide-react";

const COVERAGE_GAPS = [
  { name: "Newport", lat: 51.5842, lng: -3.0000, population: "167,900", reason: "Large city, no current stockists" },
  { name: "Cardiff Centre", lat: 51.4816, lng: -3.1791, population: "383,900", reason: "Capital city, only 1 stockist" },
  { name: "Cheltenham", lat: 51.8994, lng: -2.0783, population: "120,000", reason: "Highest avg income in SW" },
  { name: "Bath", lat: 51.3811, lng: -2.3590, population: "90,000", reason: "UNESCO heritage, 6M+ tourists" },
  { name: "Exeter", lat: 50.7184, lng: -3.5339, population: "130,000", reason: "University city, regional hub" },
  { name: "Swindon", lat: 51.5558, lng: -1.7797, population: "215,000", reason: "Designer Outlet, large population" },
  { name: "Bournemouth", lat: 50.7192, lng: -1.8808, population: "380,000", reason: "Coastal affluent area" },
  { name: "Truro", lat: 50.2632, lng: -5.0510, population: "22,000", reason: "Cornwall capital, tourist gift market" },
];

let cachedKey: string | null = null;
async function getKey(): Promise<string> {
  if (cachedKey) return cachedKey;
  const { data, error } = await supabase.functions.invoke("maps-config");
  if (error || !data?.key) throw new Error("Failed to load Google Maps key");
  cachedKey = data.key;
  return cachedKey;
}

interface Props {
  retailers: Retailer[];
  showGaps?: boolean;
}

export function TerritoryGoogleMap({ retailers, showGaps = false }: Props) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const mappable = retailers.filter((r) => r.lat && r.lng);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const key = await getKey();
        const loader = new Loader({ apiKey: key, version: "weekly" });
        await loader.load();
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: 51.2, lng: -3.0 },
          zoom: 8,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          mapTypeId: "roadmap",
        });
        infoRef.current = new google.maps.InfoWindow();
        setReady(true);
      } catch (err) {
        console.error("Google Maps load failed:", err);
        setError(err instanceof Error ? err.message : "Failed to load map");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let any = false;

    const colourFor = (p: number) => p >= 85 ? "#B88A3E" : p >= 70 ? "#D4B58A" : "#B0A89E";

    mappable.forEach((r) => {
      const color = colourFor(r.priority_score ?? 0);
      const marker = new google.maps.Marker({
        position: { lat: r.lat!, lng: r.lng! },
        map: mapRef.current!,
        title: r.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: (r.priority_score ?? 0) >= 85 ? 8 : (r.priority_score ?? 0) >= 70 ? 6 : 5,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        infoRef.current?.setContent(`
          <div style="min-width:180px;font-family:system-ui;">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${r.name}</div>
            <div style="font-size:11px;color:#666;margin-bottom:4px;">${r.town}, ${r.county}</div>
            <div style="font-size:11px;margin-bottom:4px;">Fit: <b>${r.fit_score ?? 0}%</b> · Priority: <b>${r.priority_score ?? 0}</b></div>
            <div style="font-size:10px;color:#999;margin-bottom:6px;">${(r.pipeline_stage || "").replace(/_/g, " ")}</div>
            <a href="/retailer/${r.id}" id="gm-view-${r.id}" style="font-size:11px;color:#B88A3E;text-decoration:underline;cursor:pointer;">View Profile →</a>
          </div>
        `);
        infoRef.current?.open({ map: mapRef.current!, anchor: marker });
        // Hijack the link to use SPA navigation
        setTimeout(() => {
          const a = document.getElementById(`gm-view-${r.id}`);
          if (a) a.onclick = (e) => { e.preventDefault(); navigate(`/retailer/${r.id}`); };
        }, 0);
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: r.lat!, lng: r.lng! });
      any = true;
    });

    if (showGaps) {
      COVERAGE_GAPS.forEach((g) => {
        const marker = new google.maps.Marker({
          position: { lat: g.lat, lng: g.lng },
          map: mapRef.current!,
          title: `${g.name} (Coverage Gap)`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#E89A3B",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });
        marker.addListener("click", () => {
          infoRef.current?.setContent(`
            <div style="min-width:200px;font-family:system-ui;">
              <div style="font-weight:600;font-size:13px;color:#C77A20;margin-bottom:4px;">📍 ${g.name}</div>
              <div style="font-size:11px;color:#666;margin-bottom:4px;">Coverage Gap</div>
              <div style="font-size:11px;margin-bottom:2px;"><b>Population:</b> ${g.population}</div>
              <div style="font-size:11px;color:#555;margin-bottom:6px;">${g.reason}</div>
              <a href="/discovery?town=${encodeURIComponent(g.name)}" id="gm-gap-${g.name}" style="font-size:11px;background:#E89A3B;color:#fff;padding:4px 8px;border-radius:4px;text-decoration:none;">Scan for prospects →</a>
            </div>
          `);
          infoRef.current?.open({ map: mapRef.current!, anchor: marker });
          setTimeout(() => {
            const a = document.getElementById(`gm-gap-${g.name}`);
            if (a) a.onclick = (e) => { e.preventDefault(); navigate(`/discovery?town=${encodeURIComponent(g.name)}`); };
          }, 0);
        });
        markersRef.current.push(marker);
        bounds.extend({ lat: g.lat, lng: g.lng });
        any = true;
      });
    }

    if (any) {
      mapRef.current.fitBounds(bounds, 40);
      const listener = google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
        if ((mapRef.current!.getZoom() ?? 0) > 12) mapRef.current!.setZoom(12);
      });
      return () => google.maps.event.removeListener(listener);
    }
  }, [ready, mappable, showGaps, navigate]);

  if (error) {
    return (
      <div className="w-full h-[500px] rounded-lg border border-border/40 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
        Google Maps failed to load: {error}
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height: "500px" }}>
      <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden bg-muted/30" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-gold" />
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-3 flex items-center gap-5 pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ background: "#B88A3E" }} /><span className="text-[10px] text-muted-foreground">High Priority</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: "#D4B58A" }} /><span className="text-[10px] text-muted-foreground">Medium</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style={{ background: "#B0A89E" }} /><span className="text-[10px] text-muted-foreground">Standard</span></div>
        {showGaps && (
          <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: "#E89A3B" }} /><span className="text-[10px] text-muted-foreground">Coverage Gap</span></div>
        )}
      </div>
      <div className="absolute top-4 right-4 z-10 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-2 pointer-events-none">
        <span className="text-xs text-foreground font-medium">
          {mappable.length} retailer{mappable.length !== 1 ? "s" : ""} mapped
          {showGaps && ` · ${COVERAGE_GAPS.length} gaps`}
        </span>
      </div>
    </div>
  );
}
