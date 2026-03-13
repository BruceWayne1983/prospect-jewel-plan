import { useParams, useNavigate } from "react-router-dom";
import { mockRetailers } from "@/data/mockData";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, AlertTriangle, Sparkles, ExternalLink, Users, Instagram, CheckCircle, XCircle, Building2, ShieldCheck, Target, MessageSquare, Calendar, TrendingUp, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreRing, ScoreBar } from "@/components/ScoreIndicators";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

function Check({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {checked
        ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.5} />
        : <XCircle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" strokeWidth={1.5} />
      }
      <span className={`text-sm ${checked ? 'text-foreground' : 'text-muted-foreground/60'}`}>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | boolean }) {
  if (value === undefined || value === null) return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{display}</span>
    </div>
  );
}

function PresenceBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{score}/100</span>
      </div>
      <div className="h-1.5 bg-cream rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${score >= 80 ? 'bg-success' : score >= 60 ? 'bg-gold' : 'bg-stone'}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SpendBadge({ potential }: { potential: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    small: { label: 'Small Opportunity', cls: 'bg-muted text-muted-foreground' },
    moderate: { label: 'Moderate Opportunity', cls: 'bg-warning-light text-warning' },
    strong: { label: 'Strong Opportunity', cls: 'bg-champagne text-gold-dark' },
    high: { label: 'High Potential', cls: 'bg-success-light text-success' },
  };
  const c = config[potential] || config.small;
  return <span className={`text-[10px] px-3 py-1 rounded-full font-semibold uppercase tracking-wider ${c.cls}`}>{c.label}</span>;
}

export default function RetailerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const r = mockRetailers.find(r => r.id === id);

  if (!r) return <div className="page-container text-muted-foreground">Retailer not found.</div>;

  const q = r.qualification;
  const qualScore = Math.round(
    ([q.premiumEnvironment, q.strongMerchandising, q.wellPresentedFloor,
      q.femaleGiftingAudience, q.jewelleryBuyingCustomer, q.strongGiftingTrade,
      q.jewelleryPresent, q.complementaryBrands, q.pricePositionCompatible,
      q.touristPotential, q.strongRetailTown, q.highFootfall,
      q.aestheticMatch, q.suitableForDisplay, q.noConflictingPositioning,
    ].filter(Boolean).length / 15) * 100
  );

  const copyMessage = () => {
    navigator.clipboard.writeText(r.outreach.suggestedFirstMessage);
    toast.success('Message copied to clipboard');
  };

  return (
    <div className="page-container max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground -ml-3 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> Back
      </Button>

      {/* Header Card */}
      <div className="card-premium p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="badge-category">{r.category.replace('_', ' ')}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${
                r.qualificationStatus === 'qualified' ? 'bg-success-light text-success' :
                r.qualificationStatus === 'in_progress' ? 'bg-warning-light text-warning' :
                r.qualificationStatus === 'rejected' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>{r.qualificationStatus === 'in_progress' ? 'Qualifying' : r.qualificationStatus}</span>
              {r.riskFlags && r.riskFlags.length > 0 && <span className="badge-risk">⚠ {r.riskFlags.length} risk{r.riskFlags.length > 1 ? 's' : ''}</span>}
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{r.name}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />{r.address}, {r.town}, {r.county} {r.postcode}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="w-3.5 h-3.5 text-warning" />{r.rating} ({r.reviewCount})</span>
              {r.isIndependent && <span className="text-xs text-muted-foreground">Independent</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="section-header text-[9px] mb-1">Est. Annual Wholesale</p>
            <p className="text-2xl font-display font-bold shimmer-gold">{r.estimatedSpendBand}</p>
            <SpendBadge potential={r.spendPotential} />
          </div>
        </div>

        <div className="divider-gold mt-6 mb-6" />

        <div className="flex items-center justify-center gap-10">
          <ScoreRing score={r.fitScore} label="Brand Fit" size={80} />
          <ScoreRing score={r.commercialHealthScore} label="Commercial Health" size={80} />
          <ScoreRing score={r.priorityScore} label="Priority" size={80} />
          <ScoreRing score={r.spendPotentialScore} label="Spend Potential" size={80} />
          <ScoreRing score={qualScore} label="Qualification" size={80} />
        </div>
      </div>

      {/* Tabbed sections */}
      <Tabs defaultValue="research" className="space-y-5">
        <TabsList className="bg-cream/50 border border-border/30 p-1 h-auto gap-1">
          <TabsTrigger value="research" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Research</TabsTrigger>
          <TabsTrigger value="qualification" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Qualification</TabsTrigger>
          <TabsTrigger value="commercial" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Commercial</TabsTrigger>
          <TabsTrigger value="outreach" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Outreach</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Activity</TabsTrigger>
        </TabsList>

        {/* RESEARCH TAB */}
        <TabsContent value="research" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Contact & Location */}
            <div className="card-premium p-6 space-y-4">
              <h3 className="text-base font-display font-semibold text-foreground">Contact & Location</h3>
              <div className="space-y-3">
                {r.phone && <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div><span className="text-sm text-foreground">{r.phone}</span></div>}
                {r.email && <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div><span className="text-sm text-foreground">{r.email}</span></div>}
                {r.website && <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Globe className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div><a className="text-sm text-gold hover:text-gold-dark flex items-center gap-1">{r.website.replace('https://', '')} <ExternalLink className="w-3 h-3" /></a></div>}
                {r.instagram && <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Instagram className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /></div><span className="text-sm text-foreground">{r.instagram}</span></div>}
              </div>
            </div>

            {/* Classification */}
            <div className="card-premium p-6 space-y-1">
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Classification</h3>
              <InfoRow label="Retailer Type" value={r.category.replace('_', ' ')} />
              <InfoRow label="Independent" value={r.isIndependent} />
              <InfoRow label="Locations" value={r.locationCount} />
              <InfoRow label="Est. Store Size" value={r.estimatedStoreSize} />
              <InfoRow label="Positioning" value={r.storePositioning.replace('_', ' ')} />
              <InfoRow label="Nearest Stockist" value={r.distanceToNearestStockist} />
            </div>

            {/* Brand Environment */}
            <div className="card-premium p-6 space-y-1">
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Brand Environment</h3>
              <InfoRow label="Jewellery Focus" value={r.jewelleryFocus} />
              <InfoRow label="Gifting Focus" value={r.giftingFocus} />
              <InfoRow label="Fashion Accessories" value={r.fashionAccessoriesPresent} />
              <InfoRow label="Tourist Location" value={r.touristLocation} />
              <InfoRow label="Affluent Area" value={r.affluentArea} />
              {r.adjacentBrands.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1.5">Adjacent Brands</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.adjacentBrands.map(b => <span key={b} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{b}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Presence Indicators */}
          <div className="card-premium p-6">
            <h3 className="text-base font-display font-semibold text-foreground mb-4">Public Presence Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
              <PresenceBar score={r.websiteQuality} label="Website Quality" />
              <PresenceBar score={r.socialPresence} label="Social Presence" />
              <PresenceBar score={r.visualPresentation} label="Visual Presentation" />
              <PresenceBar score={r.merchandisingQuality} label="Merchandising Quality" />
              <PresenceBar score={r.storeAestheticQuality} label="Store Aesthetic" />
              <PresenceBar score={r.highStreetQuality} label="High Street Quality" />
              <PresenceBar score={r.retailClusterStrength} label="Retail Cluster Strength" />
            </div>
          </div>

          {/* Location Intelligence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Retailer Positioning</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.positioning}</p>
            </div>

            {r.companiesHouse && (
              <div className="card-premium p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <h3 className="text-base font-display font-semibold text-foreground">Companies House</h3>
                </div>
                <div className="space-y-1">
                  <InfoRow label="Legal Name" value={r.companiesHouse.legalName} />
                  <InfoRow label="Company Number" value={r.companiesHouse.companyNumber} />
                  <InfoRow label="Status" value={r.companiesHouse.companyStatus} />
                  <InfoRow label="Accounts" value={r.companiesHouse.accountsFilingStatus} />
                  <InfoRow label="Confirmation" value={r.companiesHouse.confirmationStatementStatus} />
                  <InfoRow label="Health Confidence" value={r.companiesHouse.healthConfidence} />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* QUALIFICATION TAB */}
        <TabsContent value="qualification" className="space-y-5 mt-0">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <h3 className="text-lg font-display font-semibold text-foreground">Nomination Fit Evaluation</h3>
              </div>
              <div className="flex items-center gap-3">
                <ScoreRing score={qualScore} label="Fit Score" size={64} strokeWidth={3} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="section-header text-[10px] mb-3">Store Quality</p>
                <Check checked={q.premiumEnvironment} label="Premium retail environment" />
                <Check checked={q.strongMerchandising} label="Strong visual merchandising" />
                <Check checked={q.wellPresentedFloor} label="Well presented shop floor" />
              </div>
              <div>
                <p className="section-header text-[10px] mb-3">Customer Alignment</p>
                <Check checked={q.femaleGiftingAudience} label="Female gifting audience" />
                <Check checked={q.jewelleryBuyingCustomer} label="Jewellery buying customer" />
                <Check checked={q.strongGiftingTrade} label="Strong gifting trade" />
              </div>
              <div>
                <p className="section-header text-[10px] mb-3">Product Alignment</p>
                <Check checked={q.jewelleryPresent} label="Jewellery category present" />
                <Check checked={q.complementaryBrands} label="Complementary brands" />
                <Check checked={q.pricePositionCompatible} label="Price position compatible" />
              </div>
              <div>
                <p className="section-header text-[10px] mb-3">Location Suitability</p>
                <Check checked={q.touristPotential} label="Tourist gifting potential" />
                <Check checked={q.strongRetailTown} label="Strong retail town" />
                <Check checked={q.highFootfall} label="High footfall environment" />
              </div>
              <div>
                <p className="section-header text-[10px] mb-3">Brand Suitability</p>
                <Check checked={q.aestheticMatch} label="Aesthetic matches Nomination" />
                <Check checked={q.suitableForDisplay} label="Suitable for branded display" />
                <Check checked={q.noConflictingPositioning} label="No conflicting positioning" />
              </div>
            </div>

            {r.qualificationNotes && (
              <>
                <div className="divider-gold mt-5 mb-4" />
                <div>
                  <p className="section-header text-[10px] mb-2">Qualification Notes</p>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">{r.qualificationNotes}</p>
                </div>
              </>
            )}
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
        </TabsContent>

        {/* COMMERCIAL TAB */}
        <TabsContent value="commercial" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-premium p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <TrendingUp className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <h3 className="text-base font-display font-semibold text-foreground">Spend Potential</h3>
              </div>
              <div className="text-center py-4">
                <ScoreRing score={r.spendPotentialScore} label="Spend Potential Score" size={96} strokeWidth={4} />
              </div>
              <div className="divider-gold my-4" />
              <div className="space-y-1">
                <InfoRow label="Potential Category" value={r.spendPotential.charAt(0).toUpperCase() + r.spendPotential.slice(1) + ' opportunity'} />
                <InfoRow label="Est. Annual Value" value={r.estimatedSpendBand} />
                <InfoRow label="Est. Opening Order" value={r.estimatedOpeningOrder} />
                <InfoRow label="Confidence Level" value={r.spendConfidence.charAt(0).toUpperCase() + r.spendConfidence.slice(1)} />
              </div>
            </div>

            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Contributing Factors</h3>
              <div className="space-y-3">
                <ScoreBar score={r.highStreetQuality} label="Location Quality" />
                <ScoreBar score={Math.min(100, Math.round(r.reviewCount / 3.5))} label="Review Volume" />
                <ScoreBar score={r.storeAestheticQuality} label="Store Positioning" />
                <ScoreBar score={r.retailClusterStrength} label="Retail Cluster" />
                <ScoreBar score={r.merchandisingQuality} label="Merchandising Quality" />
                <ScoreBar score={r.websiteQuality} label="Digital Presence" />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* OUTREACH TAB */}
        <TabsContent value="outreach" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Contact Details */}
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Contact Details</h3>
              <div className="space-y-1">
                <InfoRow label="Contact Name" value={r.outreach.contactName || 'Not yet identified'} />
                <InfoRow label="Role" value={r.outreach.contactRole} />
                <InfoRow label="Email" value={r.outreach.contactEmail} />
                <InfoRow label="Phone" value={r.outreach.contactPhone} />
                <InfoRow label="Best Method" value={r.outreach.bestContactMethod.charAt(0).toUpperCase() + r.outreach.bestContactMethod.slice(1)} />
                <InfoRow label="Priority" value={r.outreach.outreachPriority.charAt(0).toUpperCase() + r.outreach.outreachPriority.slice(1)} />
              </div>
            </div>

            {/* Strategy */}
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Outreach Strategy</h3>
              <div className="space-y-3">
                <div>
                  <p className="section-header text-[9px] mb-1">Best Outreach Angle</p>
                  <p className="text-sm text-foreground">{r.outreach.bestOutreachAngle}</p>
                </div>
                <div>
                  <p className="section-header text-[9px] mb-1">Why This Store is Attractive</p>
                  <p className="text-sm text-muted-foreground">{r.outreach.whyAttractive}</p>
                </div>
                <div>
                  <p className="section-header text-[9px] mb-1">Product Angle</p>
                  <p className="text-sm text-muted-foreground">{r.outreach.productAngle}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Outreach Summary */}
          <div className="card-premium p-6 border-gold/20">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg gold-gradient flex items-center justify-center">
                <Target className="w-3.5 h-3.5" style={{ color: 'hsl(var(--sidebar-background))' }} />
              </div>
              <h3 className="text-base font-display font-semibold text-foreground">AI Outreach Intelligence</h3>
            </div>
            <div className="bg-champagne/20 rounded-lg p-4 border border-gold/10">
              <p className="text-sm text-foreground leading-relaxed italic font-display">{r.outreach.aiOutreachSummary}</p>
            </div>
          </div>

          {/* Suggested First Message */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <h3 className="text-base font-display font-semibold text-foreground">Suggested First Message</h3>
              </div>
              <Button variant="outline" size="sm" onClick={copyMessage} className="text-xs border-border/40 hover:bg-champagne/30">
                <Copy className="w-3 h-3 mr-1.5" /> Copy
              </Button>
            </div>
            <div className="bg-cream/60 rounded-lg p-5 border border-border/20">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{r.outreach.suggestedFirstMessage}</p>
            </div>
          </div>

          {/* Objection Handling */}
          {r.outreach.objections.length > 0 && (
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Objection Preparation</h3>
              <div className="space-y-4">
                {r.outreach.objections.map((obj, i) => (
                  <div key={i} className="rounded-lg border border-border/20 overflow-hidden">
                    <div className="bg-muted/40 px-4 py-2.5">
                      <p className="text-xs font-semibold text-foreground">❝ {obj.concern}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">{obj.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-premium p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <Calendar className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <h3 className="text-base font-display font-semibold text-foreground">Activity Status</h3>
              </div>
              <div className="space-y-1">
                <InfoRow label="Pipeline Stage" value={r.pipelineStage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
                <InfoRow label="Last Contact" value={r.activity.lastContactDate || 'Not yet contacted'} />
                <InfoRow label="Next Action" value={r.activity.nextActionDate || 'Not scheduled'} />
                <InfoRow label="Follow-up #" value={r.activity.followUpNumber} />
                <InfoRow label="Meeting Scheduled" value={r.activity.meetingScheduled} />
                <InfoRow label="Outcome" value={r.activity.outcomeStatus || 'Pending'} />
              </div>
            </div>

            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Conversation Notes</h3>
              {r.activity.conversationNotes.length > 0 ? (
                <div className="space-y-2">
                  {r.activity.conversationNotes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/10 last:border-0">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] font-medium text-muted-foreground">{i + 1}</span>
                      </span>
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">No conversation notes yet</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
