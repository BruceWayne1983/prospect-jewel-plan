import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import type { Retailer } from "@/hooks/useRetailers";

// Fix default marker icons not loading in bundled apps
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function createIcon(color: string, size: number) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

const highIcon = createIcon("hsl(34, 52%, 50%)", 18);
const medIcon = createIcon("hsl(34, 30%, 65%)", 14);
const lowIcon = createIcon("hsl(28, 8%, 70%)", 11);
const gapIcon = createIcon("hsl(30, 90%, 55%)", 20); // Amber for gaps

const COVERAGE_GAPS = [
  { name: "Newport", lat: 51.5842, lng: -3.0000, population: "167,900", reason: "Large city, no current stockists" },
  { name: "Cardiff Centre", lat: 51.4816, lng: -3.1791, population: "383,900", reason: "Capital city, only 1 stockist — room for more" },
  { name: "Cheltenham", lat: 51.8994, lng: -2.0783, population: "120,000", reason: "Highest average income in South West" },
  { name: "Bath", lat: 51.3811, lng: -2.3590, population: "90,000", reason: "UNESCO heritage, 6M+ tourists, premium market" },
  { name: "Exeter", lat: 50.7184, lng: -3.5339, population: "130,000", reason: "University city, regional hub" },
  { name: "Swindon", lat: 51.5558, lng: -1.7797, population: "215,000", reason: "Large population, Designer Outlet" },
  { name: "Bournemouth", lat: 50.7192, lng: -1.8808, population: "380,000", reason: "Coastal affluent area" },
  { name: "Truro", lat: 50.2632, lng: -5.0510, population: "22,000", reason: "Cornwall capital, seasonal coastal gift market" },
];

function FitBounds({ retailers, gaps }: { retailers: Retailer[]; gaps?: typeof COVERAGE_GAPS }) {
  const map = useMap();
  useEffect(() => {
    const points = retailers.filter((r) => r.lat && r.lng);
    const allPoints = [
      ...points.map(r => [r.lat!, r.lng!] as [number, number]),
      ...(gaps ?? []).map(g => [g.lat, g.lng] as [number, number]),
    ];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [retailers, gaps, map]);
  return null;
}

interface TerritoryLeafletMapProps {
  retailers: Retailer[];
  showGaps?: boolean;
}

export function TerritoryLeafletMap({ retailers, showGaps = false }: TerritoryLeafletMapProps) {
  const navigate = useNavigate();
  const mappable = retailers.filter((r) => r.lat && r.lng);

  const getIcon = (r: Retailer) => {
    const p = r.priority_score ?? 0;
    if (p >= 85) return highIcon;
    if (p >= 70) return medIcon;
    return lowIcon;
  };

  const getPipelineLabel = (stage: string) =>
    stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="relative w-full" style={{ height: "500px" }}>
      <MapContainer
        center={[51.2, -3.0]}
        zoom={8}
        className="w-full h-full rounded-lg z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds retailers={mappable} gaps={showGaps ? COVERAGE_GAPS : undefined} />
        {mappable.map((r) => (
          <Marker key={r.id} position={[r.lat!, r.lng!]} icon={getIcon(r)}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-sm mb-1">{r.name}</p>
                <p className="text-xs text-gray-500 mb-1">
                  {r.town}, {r.county}
                </p>
                <div className="flex gap-3 text-xs mb-2">
                  <span>
                    Fit: <strong>{r.fit_score ?? 0}%</strong>
                  </span>
                  <span>
                    Priority: <strong>{r.priority_score ?? 0}</strong>
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {getPipelineLabel(r.pipeline_stage)}
                </p>
                <button
                  onClick={() => navigate(`/retailer/${r.id}`)}
                  className="text-xs font-medium underline"
                  style={{ color: "hsl(34, 52%, 50%)" }}
                >
                  View Profile →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Coverage Gap Markers */}
        {showGaps && COVERAGE_GAPS.map((gap) => (
          <Marker key={`gap-${gap.name}`} position={[gap.lat, gap.lng]} icon={gapIcon}>
            <Popup>
              <div className="min-w-[200px]">
                <p className="font-semibold text-sm mb-1" style={{ color: "hsl(30, 90%, 45%)" }}>📍 {gap.name}</p>
                <p className="text-xs text-gray-500 mb-1">Coverage Gap</p>
                <p className="text-xs mb-1"><strong>Population:</strong> {gap.population}</p>
                <p className="text-xs text-gray-600 mb-2">{gap.reason}</p>
                <button
                  onClick={() => navigate(`/discovery?town=${encodeURIComponent(gap.name)}`)}
                  className="text-xs font-medium px-2 py-1 rounded"
                  style={{ background: "hsl(30, 90%, 55%)", color: "white" }}
                >
                  Scan for prospects here →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-3 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" style={{ background: "hsl(34, 52%, 50%)" }} />
          <span className="text-[10px] text-muted-foreground">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: "hsl(34, 30%, 65%)" }} />
          <span className="text-[10px] text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style={{ background: "hsl(28, 8%, 70%)" }} />
          <span className="text-[10px] text-muted-foreground">Standard</span>
        </div>
        {showGaps && (
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ background: "hsl(30, 90%, 55%)" }} />
            <span className="text-[10px] text-muted-foreground">Coverage Gap</span>
          </div>
        )}
      </div>

      {/* Count overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-2">
        <span className="text-xs text-foreground font-medium">
          {mappable.length} retailer{mappable.length !== 1 ? "s" : ""} mapped
          {showGaps && ` · ${COVERAGE_GAPS.length} gaps`}
        </span>
      </div>
    </div>
  );
}
