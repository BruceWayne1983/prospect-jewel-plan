import { useParams, useNavigate } from "react-router-dom";
import { mockRetailers } from "@/data/mockData";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function ScoreRing({ score, label, size = 64 }: { score: number; label: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? 'hsl(var(--success))' : score >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-lg font-display font-semibold text-foreground -mt-[calc(50%+10px)] mb-4">{score}%</span>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function RetailerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const retailer = mockRetailers.find(r => r.id === id);

  if (!retailer) return <div className="p-6 text-muted-foreground">Retailer not found.</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-foreground">{retailer.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{retailer.town}, {retailer.county}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{retailer.category.replace('_', ' ')}</span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="w-3.5 h-3.5 text-warning" />{retailer.rating}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-display font-semibold text-foreground">{retailer.estimatedSpendBand}</p>
          <p className="text-xs text-muted-foreground">Estimated annual wholesale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreRing score={retailer.fitScore} label="Brand Fit" />
        <ScoreRing score={retailer.commercialHealthScore} label="Commercial Health" />
        <ScoreRing score={retailer.priorityScore} label="Priority Score" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-premium rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-display font-semibold text-foreground">Contact Details</h3>
          {retailer.phone && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-3.5 h-3.5" />{retailer.phone}</p>}
          {retailer.email && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-3.5 h-3.5" />{retailer.email}</p>}
          {retailer.website && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Globe className="w-3.5 h-3.5" />{retailer.website}</p>}
          <p className="text-sm text-muted-foreground">{retailer.postcode}</p>
        </div>

        <div className="card-premium rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-display font-semibold text-foreground">Retailer Positioning</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{retailer.positioning}</p>
        </div>
      </div>

      <div className="card-premium rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">AI Prospect Analysis</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{retailer.aiNotes}</p>
      </div>

      {retailer.riskFlags && retailer.riskFlags.length > 0 && (
        <div className="card-premium rounded-lg p-5 space-y-3 border-destructive/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="text-sm font-display font-semibold text-foreground">Risk Flags</h3>
          </div>
          <ul className="space-y-1">
            {retailer.riskFlags.map((flag, i) => (
              <li key={i} className="text-sm text-destructive/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
