import { mockRetailers } from "@/data/mockData";
import { MapPin, TrendingUp, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const clusters = [
  { name: "Bristol & Bath", towns: ["Bristol", "Bath"], region: "Avon / Somerset" },
  { name: "Dorset Coast", towns: ["Bournemouth", "Poole"], region: "Dorset" },
  { name: "Cheltenham & Gloucester", towns: ["Cheltenham", "Gloucester"], region: "Gloucestershire" },
  { name: "Devon", towns: ["Exeter", "Plymouth"], region: "Devon" },
  { name: "Cornwall", towns: ["Truro"], region: "Cornwall" },
  { name: "Wiltshire", towns: ["Salisbury", "Swindon"], region: "Wiltshire" },
  { name: "Somerset", towns: ["Taunton"], region: "Somerset" },
];

export default function TerritoryMap() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Territory Intelligence</p>
        <h1 className="page-title">South West Territory</h1>
        <p className="page-subtitle">Retailer locations, opportunity clusters and regional density</p>
      </div>

      <div className="divider-gold" />

      {/* Map visualization */}
      <div className="card-premium p-1 overflow-hidden">
        <div className="aspect-[16/8] bg-cream rounded-lg relative overflow-hidden">
          <svg viewBox="0 0 900 450" className="w-full h-full" fill="none">
            {/* Soft background regions */}
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(34 52% 50%)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="hsl(34 52% 50%)" stopOpacity="0" />
              </radialGradient>
              <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
              </filter>
            </defs>

            {/* SW England coastline - elegant simplified outline */}
            <path 
              d="M120,60 C200,55 350,50 500,55 C600,58 700,65 750,90 
                 C770,120 760,200 740,280 C720,340 680,380 620,395
                 C540,415 440,410 360,395 C280,380 200,360 160,320
                 C130,290 110,240 105,190 C100,150 108,100 120,60Z" 
              fill="hsl(38 35% 94%)" 
              stroke="hsl(34 18% 82%)" 
              strokeWidth="1.5"
            />

            {/* County labels */}
            <text x="250" y="140" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">GLOUCESTERSHIRE</text>
            <text x="600" y="140" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">WILTSHIRE</text>
            <text x="360" y="210" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">SOMERSET</text>
            <text x="200" y="300" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">DEVON</text>
            <text x="150" y="380" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">CORNWALL</text>
            <text x="600" y="300" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">DORSET</text>
            <text x="470" y="110" fontSize="10" fill="hsl(25 8% 70%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">AVON</text>

            {/* Heat zones for clusters */}
            {mockRetailers.filter(r => r.priorityScore >= 85).map(r => {
              const x = ((r.lng + 6) / 5.5) * 700 + 100;
              const y = ((52.2 - r.lat) / 2.8) * 380 + 40;
              return <circle key={`heat-${r.id}`} cx={x} cy={y} r="35" fill="url(#glow)" />;
            })}

            {/* Retailer pins */}
            {mockRetailers.map(r => {
              const x = ((r.lng + 6) / 5.5) * 700 + 100;
              const y = ((52.2 - r.lat) / 2.8) * 380 + 40;
              const isHigh = r.priorityScore >= 85;
              const isMed = r.priorityScore >= 70;
              
              return (
                <g key={r.id} className="cursor-pointer" onClick={() => navigate(`/retailer/${r.id}`)}>
                  {/* Outer pulse for high priority */}
                  {isHigh && <circle cx={x} cy={y} r="12" fill="hsl(34 52% 50%)" opacity="0.08" />}
                  {/* Pin */}
                  <circle cx={x} cy={y} r={isHigh ? 6 : isMed ? 5 : 4}
                    fill={isHigh ? 'hsl(34 52% 50%)' : isMed ? 'hsl(34 30% 65%)' : 'hsl(28 8% 70%)'}
                    stroke={isHigh ? 'hsl(32 48% 38%)' : 'transparent'} strokeWidth={isHigh ? 1.5 : 0}
                  />
                  {/* Inner dot for high priority */}
                  {isHigh && <circle cx={x} cy={y} r="2" fill="hsl(40 28% 97%)" />}
                  {/* Label */}
                  <text x={x} y={y - (isHigh ? 16 : 12)} textAnchor="middle" fontSize={isHigh ? "9" : "8"} 
                    fill={isHigh ? 'hsl(25 15% 12%)' : 'hsl(25 8% 48%)'} 
                    fontFamily="Inter" fontWeight={isHigh ? "500" : "400"}>
                    {r.town}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-3 flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(34 52% 50%)' }} />
              <span className="text-[10px] text-muted-foreground">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(34 30% 65%)' }} />
              <span className="text-[10px] text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(28 8% 70%)' }} />
              <span className="text-[10px] text-muted-foreground">Standard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cluster Cards */}
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-4">Opportunity Clusters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map(cluster => {
            const rs = mockRetailers.filter(r => cluster.towns.includes(r.town));
            const avgPriority = Math.round(rs.reduce((s, r) => s + r.priorityScore, 0) / (rs.length || 1));
            const avgFit = Math.round(rs.reduce((s, r) => s + r.fitScore, 0) / (rs.length || 1));
            const totalValue = rs.reduce((s, r) => { const m = r.estimatedSpendBand.match(/£([\d,]+)/); return s + (m ? parseInt(m[1].replace(',', '')) : 0); }, 0);
            const priorityClass = avgPriority >= 85 ? 'score-excellent' : avgPriority >= 70 ? 'score-good' : 'score-moderate';

            return (
              <div key={cluster.name} className="card-premium p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-display font-semibold text-foreground">{cluster.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{cluster.region}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-gold" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <p className="text-lg font-display font-bold text-foreground">{rs.length}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Prospects</p>
                  </div>
                  <div>
                    <p className={`text-lg font-display font-bold ${priorityClass}`}>{avgPriority}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Priority</p>
                  </div>
                  <div>
                    <p className="text-lg font-display font-bold text-foreground">£{(totalValue / 1000).toFixed(0)}k</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Value</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {rs.slice(0, 3).map(r => (
                    <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between text-xs py-1 cursor-pointer hover:text-gold-dark transition-colors">
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate">{r.name}</span>
                      <span className="text-gold font-medium ml-2">{r.fitScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
