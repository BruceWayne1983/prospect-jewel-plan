import { mockRetailers } from "@/data/mockData";
import { MapPin } from "lucide-react";

const clusters = [
  { name: "Bristol & Bath", towns: ["Bristol", "Bath"], color: "bg-primary" },
  { name: "Dorset Coast", towns: ["Bournemouth", "Poole"], color: "bg-accent" },
  { name: "Cheltenham & Gloucester", towns: ["Cheltenham", "Gloucester"], color: "bg-warning" },
  { name: "Devon", towns: ["Exeter", "Plymouth"], color: "bg-info" },
  { name: "Cornwall", towns: ["Truro"], color: "bg-success" },
  { name: "Wiltshire", towns: ["Salisbury", "Swindon"], color: "bg-taupe" },
  { name: "Somerset", towns: ["Taunton"], color: "bg-stone" },
];

export default function TerritoryMap() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Territory Map</h1>
        <p className="text-sm text-muted-foreground mt-1">South West UK retailer locations and opportunity clusters</p>
      </div>

      <div className="card-premium rounded-lg p-6">
        <div className="aspect-[16/9] bg-muted/50 rounded-lg border border-border/30 relative overflow-hidden flex items-center justify-center">
          {/* Stylised territory map */}
          <svg viewBox="0 0 800 450" className="w-full h-full" fill="none">
            {/* SW England outline - simplified */}
            <path d="M150,50 L650,50 Q700,50 700,100 L700,350 Q700,400 650,400 L150,400 Q100,400 100,350 L100,100 Q100,50 150,50Z" fill="hsl(35 12% 93%)" stroke="hsl(35 15% 88%)" strokeWidth="2"/>
            {/* County divisions */}
            <line x1="300" y1="50" x2="300" y2="400" stroke="hsl(35 15% 88%)" strokeWidth="1" strokeDasharray="4"/>
            <line x1="500" y1="50" x2="500" y2="400" stroke="hsl(35 15% 88%)" strokeWidth="1" strokeDasharray="4"/>
            <line x1="100" y1="200" x2="700" y2="200" stroke="hsl(35 15% 88%)" strokeWidth="1" strokeDasharray="4"/>

            {/* Retailer pins */}
            {mockRetailers.map((r, i) => {
              // Map lat/lng to SVG coords (approximate)
              const x = ((r.lng + 6) / 5) * 600 + 100;
              const y = ((52 - r.lat) / 2.5) * 350 + 50;
              const fill = r.priorityScore >= 85 ? 'hsl(36 45% 55%)' : r.priorityScore >= 70 ? 'hsl(38 90% 55%)' : 'hsl(30 8% 60%)';
              return (
                <g key={r.id}>
                  <circle cx={x} cy={y} r={r.priorityScore >= 85 ? 8 : 6} fill={fill} opacity="0.8" />
                  <circle cx={x} cy={y} r={r.priorityScore >= 85 ? 12 : 9} fill={fill} opacity="0.15" />
                  <text x={x} y={y - 14} textAnchor="middle" fontSize="8" fill="hsl(30 10% 25%)" fontFamily="Inter">{r.town}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clusters.map(cluster => {
          const clusterRetailers = mockRetailers.filter(r => cluster.towns.includes(r.town));
          const avgPriority = Math.round(clusterRetailers.reduce((s, r) => s + r.priorityScore, 0) / (clusterRetailers.length || 1));
          return (
            <div key={cluster.name} className="card-premium rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{cluster.name}</h3>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{clusterRetailers.length} prospects</span>
                <span>Avg priority: <span className="text-primary font-medium">{avgPriority}</span></span>
              </div>
              <div className="mt-2 space-y-1">
                {clusterRetailers.slice(0, 3).map(r => (
                  <p key={r.id} className="text-xs text-muted-foreground truncate">• {r.name}</p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
