import { useState, useMemo } from "react";
import { COUNTIES } from "@/data/constants";
import { useRetailers } from "@/hooks/useRetailers";
import { MapPin, Filter, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { retailers, loading } = useRetailers();
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const getOutreach = (r: any) => ((r.outreach ?? {}) as Record<string, any>);
    const getActivity = (r: any) => ((r.activity ?? {}) as Record<string, any>);
    switch (filter) {
      case 'high_fit': return retailers.filter(r => (r.fit_score ?? 0) >= 80);
      case 'high_spend': return retailers.filter(r => (r.spend_potential_score ?? 0) >= 75);
      case 'uncontacted': return retailers.filter(r => !getActivity(r).lastContactDate);
      case 'high_priority': return retailers.filter(r => getOutreach(r).outreachPriority === 'high');
      default: return retailers;
    }
  }, [retailers, filter]);

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Territory Intelligence</p>
          <h1 className="page-title">South West & South Wales Territory</h1>
          <p className="page-subtitle">Retailer density, opportunity clusters and whitespace analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-background border-border/40 h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Retailers ({retailers.length})</SelectItem>
              <SelectItem value="high_fit">High Fit Score</SelectItem>
              <SelectItem value="high_spend">High Spend Potential</SelectItem>
              <SelectItem value="uncontacted">Uncontacted</SelectItem>
              <SelectItem value="high_priority">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Map */}
      <div className="card-premium p-1 overflow-hidden">
        <div className="aspect-[16/8] bg-cream rounded-lg relative overflow-hidden">
          <svg viewBox="0 0 900 450" className="w-full h-full" fill="none">
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="hsl(34 52% 50%)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(34 52% 50%)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path d="M120,60 C200,55 350,50 500,55 C600,58 700,65 750,90 C770,120 760,200 740,280 C720,340 680,380 620,395 C540,415 440,410 360,395 C280,380 200,360 160,320 C130,290 110,240 105,190 C100,150 108,100 120,60Z" fill="hsl(38 35% 94%)" stroke="hsl(34 18% 82%)" strokeWidth="1.5"/>
            <text x="250" y="140" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">GLOUCESTERSHIRE</text>
            <text x="600" y="140" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">WILTSHIRE</text>
            <text x="360" y="210" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">SOMERSET</text>
            <text x="200" y="300" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">DEVON</text>
            <text x="150" y="380" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">CORNWALL</text>
            <text x="600" y="300" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">DORSET</text>
            <text x="470" y="110" fontSize="9" fill="hsl(25 8% 72%)" fontFamily="Inter" fontWeight="300" letterSpacing="3" textAnchor="middle">AVON</text>

            {filtered.filter(r => (r.priority_score ?? 0) >= 85 && r.lat && r.lng).map(r => {
              const x = ((r.lng! + 6) / 5.5) * 700 + 100;
              const y = ((52.2 - r.lat!) / 2.8) * 380 + 40;
              return <circle key={`h-${r.id}`} cx={x} cy={y} r="35" fill="url(#glow)" />;
            })}

            {filtered.filter(r => r.lat && r.lng).map(r => {
              const x = ((r.lng! + 6) / 5.5) * 700 + 100;
              const y = ((52.2 - r.lat!) / 2.8) * 380 + 40;
              const isHigh = (r.priority_score ?? 0) >= 85;
              const isMed = (r.priority_score ?? 0) >= 70;
              return (
                <g key={r.id} className="cursor-pointer" onClick={() => navigate(`/retailer/${r.id}`)}>
                  {isHigh && <circle cx={x} cy={y} r="12" fill="hsl(34 52% 50%)" opacity="0.08" />}
                  <circle cx={x} cy={y} r={isHigh ? 6 : isMed ? 5 : 4}
                    fill={isHigh ? 'hsl(34 52% 50%)' : isMed ? 'hsl(34 30% 65%)' : 'hsl(28 8% 70%)'}
                    stroke={isHigh ? 'hsl(32 48% 38%)' : 'transparent'} strokeWidth={isHigh ? 1.5 : 0} />
                  {isHigh && <circle cx={x} cy={y} r="2" fill="hsl(40 28% 97%)" />}
                  <text x={x} y={y - (isHigh ? 16 : 12)} textAnchor="middle" fontSize={isHigh ? "9" : "8"}
                    fill={isHigh ? 'hsl(25 15% 12%)' : 'hsl(25 8% 48%)'} fontFamily="Inter" fontWeight={isHigh ? "500" : "400"}>
                    {r.town}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-3 flex items-center gap-5">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: 'hsl(34 52% 50%)' }} /><span className="text-[10px] text-muted-foreground">High Priority</span></div>
            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: 'hsl(34 30% 65%)' }} /><span className="text-[10px] text-muted-foreground">Medium</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: 'hsl(28 8% 70%)' }} /><span className="text-[10px] text-muted-foreground">Standard</span></div>
          </div>
          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm border border-border/30 rounded-lg px-3 py-2">
            <span className="text-xs text-foreground font-medium">{filtered.length} retailer{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Clusters */}
      {retailers.length > 0 && (
        <>
          <h2 className="text-xl font-display font-semibold text-foreground">Opportunity Clusters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusters.map(cluster => {
              const allRs = retailers.filter(r => cluster.towns.includes(r.town));
              if (allRs.length === 0) return null;
              const avgPriority = Math.round(allRs.reduce((s, r) => s + (r.priority_score ?? 0), 0) / allRs.length);
              const avgFit = Math.round(allRs.reduce((s, r) => s + (r.fit_score ?? 0), 0) / allRs.length);
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
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div><p className="text-base font-display font-bold text-foreground">{allRs.length}</p><p className="text-[8px] text-muted-foreground uppercase tracking-wider">Prospects</p></div>
                    <div><p className={`text-base font-display font-bold ${priorityClass}`}>{avgPriority}</p><p className="text-[8px] text-muted-foreground uppercase tracking-wider">Priority</p></div>
                    <div><p className="text-base font-display font-bold text-foreground">{avgFit}%</p><p className="text-[8px] text-muted-foreground uppercase tracking-wider">Avg Fit</p></div>
                  </div>
                  <div className="space-y-1">
                    {allRs.slice(0, 3).map(r => (
                      <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between text-xs py-1 cursor-pointer hover:text-gold-dark transition-colors">
                        <span className="text-muted-foreground truncate">{r.name}</span>
                        <span className="text-gold font-medium ml-2">{r.fit_score ?? 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </>
      )}

      {retailers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No retailers to map yet.</p>
          <p className="text-xs mt-1">Promote prospects from the Discovery Engine to see them on the territory map.</p>
        </div>
      )}
    </div>
  );
}
