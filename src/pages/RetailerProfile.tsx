import { useParams, useNavigate } from "react-router-dom";
import { mockRetailers } from "@/data/mockData";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, AlertTriangle, Sparkles, ExternalLink, Users, TrendingUp, Instagram, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing, ScoreBar } from "@/components/ScoreIndicators";
import { Separator } from "@/components/ui/separator";

export default function RetailerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const r = mockRetailers.find(r => r.id === id);

  if (!r) return <div className="page-container text-muted-foreground">Retailer not found.</div>;

  const strengths = [
    r.hasWebsite && 'Active website',
    r.hasSocial && 'Social media presence',
    r.isIndependent && 'Independent retailer',
    r.rating >= 4.5 && 'Excellent customer ratings',
    r.fitScore >= 80 && 'Strong brand alignment',
    r.commercialHealthScore >= 80 && 'Healthy commercial indicators',
  ].filter(Boolean) as string[];

  return (
    <div className="page-container max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground -ml-3 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> Back
      </Button>

      {/* Header */}
      <div className="card-premium p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="badge-category">{r.category.replace('_', ' ')}</span>
              {r.riskFlags && r.riskFlags.length > 0 && <span className="badge-risk">⚠ {r.riskFlags.length} risk flag{r.riskFlags.length > 1 ? 's' : ''}</span>}
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{r.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />{r.town}, {r.county} · {r.postcode}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="w-3.5 h-3.5 text-warning" />{r.rating} <span className="text-xs">({r.reviewCount} reviews)</span></span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="section-header text-[9px] mb-1">Est. Annual Wholesale</p>
            <p className="text-2xl font-display font-bold shimmer-gold">{r.estimatedSpendBand}</p>
          </div>
        </div>

        <div className="divider-gold mt-6 mb-6" />

        {/* Score rings row */}
        <div className="flex items-center justify-center gap-12">
          <ScoreRing score={r.fitScore} label="Brand Fit" size={80} />
          <ScoreRing score={r.commercialHealthScore} label="Commercial Health" size={80} />
          <ScoreRing score={r.priorityScore} label="Priority Score" size={80} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contact Details */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="text-base font-display font-semibold text-foreground">Contact Details</h3>
          <div className="space-y-3">
            {r.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div>
                <span className="text-sm text-foreground">{r.phone}</span>
              </div>
            )}
            {r.email && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div>
                <span className="text-sm text-foreground">{r.email}</span>
              </div>
            )}
            {r.website && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Globe className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div>
                <a href={r.website} className="text-sm text-gold hover:text-gold-dark transition-colors flex items-center gap-1">{r.website.replace('https://', '')} <ExternalLink className="w-3 h-3" /></a>
              </div>
            )}
          </div>
          <Separator className="opacity-30" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {r.hasWebsite && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Website</span>}
            {r.hasSocial && <span className="flex items-center gap-1"><Instagram className="w-3 h-3" /> Social</span>}
            {r.isIndependent && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Independent</span>}
          </div>
        </div>

        {/* Scoring Breakdown */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="text-base font-display font-semibold text-foreground">Score Breakdown</h3>
          <div className="space-y-4">
            <ScoreBar score={r.fitScore} label="Brand Fit" />
            <ScoreBar score={r.commercialHealthScore} label="Commercial Health" />
            <ScoreBar score={r.priorityScore} label="Priority Score" />
            <ScoreBar score={Math.round(r.rating * 20)} label="Customer Rating" />
            <ScoreBar score={Math.min(100, Math.round(r.reviewCount / 3.5))} label="Review Volume" />
          </div>
        </div>

        {/* Strengths */}
        <div className="card-premium p-6 space-y-4">
          <h3 className="text-base font-display font-semibold text-foreground">Key Strengths</h3>
          <div className="space-y-2.5">
            {strengths.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Positioning */}
      <div className="card-premium p-6">
        <h3 className="text-base font-display font-semibold text-foreground mb-3">Retailer Positioning</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{r.positioning}</p>
      </div>

      {/* AI Analysis */}
      <div className="card-premium p-6 border-gold/20">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'hsl(var(--sidebar-background))' }} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">AI Prospect Analysis</h3>
            <p className="text-[10px] text-muted-foreground">Automated brand fit assessment</p>
          </div>
        </div>
        <div className="bg-champagne/20 rounded-lg p-4 border border-gold/10">
          <p className="text-sm text-foreground leading-relaxed italic font-display">{r.aiNotes}</p>
        </div>
      </div>

      {/* Risk Flags */}
      {r.riskFlags && r.riskFlags.length > 0 && (
        <div className="card-premium p-6 border-destructive/20">
          <div className="flex items-center gap-2.5 mb-3">
            <AlertTriangle className="w-5 h-5 text-destructive" strokeWidth={1.5} />
            <h3 className="text-base font-display font-semibold text-foreground">Risk Assessment</h3>
          </div>
          <div className="space-y-2">
            {r.riskFlags.map((flag, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 bg-destructive/5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-destructive/50 flex-shrink-0" />
                <span className="text-sm text-foreground">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
