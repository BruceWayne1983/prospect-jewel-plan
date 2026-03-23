import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type Retailer, getOutreach, getActivity, getAIIntelligence, getPerformancePrediction, getQualification, getCompetitorBrands } from "@/hooks/useRetailers";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, AlertTriangle, Sparkles, ExternalLink, Instagram, CheckCircle, XCircle, Building2, ShieldCheck, Target, MessageSquare, Calendar, TrendingUp, Copy, Brain, Radar, Shield, Zap, BarChart3, Clock, Send, FileText, Loader2, Route } from "lucide-react";
import { PreVisitBriefing } from "@/components/retailer/PreVisitBriefing";
import { FollowUpDrafter } from "@/components/retailer/FollowUpDrafter";
import { PitchPersonaliser } from "@/components/retailer/PitchPersonaliser";
import { VoiceToCRM } from "@/components/retailer/VoiceToCRM";
import { CompaniesHouseCheck } from "@/components/retailer/CompaniesHouseCheck";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScoreRing, ScoreBar } from "@/components/ScoreIndicators";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

function Check({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {checked ? <CheckCircle className="w-4 h-4 text-success flex-shrink-0" strokeWidth={1.5} /> : <XCircle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" strokeWidth={1.5} />}
      <span className={`text-sm ${checked ? 'text-foreground' : 'text-muted-foreground/60'}`}>{label}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number | boolean }) {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{display}</span>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const cls = level === 'high' ? 'bg-success-light text-success' : level === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground';
  return <span className={`text-[9px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${cls}`}>{level} confidence</span>;
}

export default function RetailerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [r, setRetailer] = useState<Retailer | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ phone: '', email: '', website: '', instagram: '', address: '', postcode: '' });

  const fetchRetailer = () => {
    if (!id) return;
    supabase.from("retailers").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setRetailer(data);
        setContactForm({
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          instagram: data.instagram || '',
          address: data.address || '',
          postcode: data.postcode || '',
        });
      }
      setLoading(false);
    });
  };

  useEffect(() => { fetchRetailer(); }, [id]);

  const saveContact = async () => {
    if (!id) return;
    const updates: Record<string, string | null> = {};
    if (contactForm.phone !== (r?.phone || '')) updates.phone = contactForm.phone || null;
    if (contactForm.email !== (r?.email || '')) updates.email = contactForm.email || null;
    if (contactForm.website !== (r?.website || '')) updates.website = contactForm.website || null;
    if (contactForm.instagram !== (r?.instagram || '')) updates.instagram = contactForm.instagram || null;
    if (contactForm.address !== (r?.address || '')) updates.address = contactForm.address || null;
    if (contactForm.postcode !== (r?.postcode || '')) updates.postcode = contactForm.postcode || null;
    if (Object.keys(updates).length === 0) { setEditingContact(false); return; }
    const { error } = await supabase.from("retailers").update(updates).eq("id", id);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Contact details updated");
    setEditingContact(false);
    fetchRetailer();
  };

  const runAnalysis = async () => {
    if (!id) return;
    setAnalysing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyse-retailer", {
        body: { retailerId: id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("AI analysis complete!");
        fetchRetailer(); // reload with new data
      } else {
        toast.error(data?.error || "Analysis failed");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Failed to run analysis");
    } finally {
      setAnalysing(false);
    }
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  if (!r) return <div className="page-container text-muted-foreground">Retailer not found.</div>;

  const outreach = getOutreach(r);
  const activity = getActivity(r);
  const ai = getAIIntelligence(r);
  const pred = getPerformancePrediction(r);
  const q = getQualification(r);
  const competitors = getCompetitorBrands(r);

  const qualScore = Math.round(
    ([q.premiumEnvironment, q.strongMerchandising, q.wellPresentedFloor,
      q.femaleGiftingAudience, q.jewelleryBuyingCustomer, q.strongGiftingTrade,
      q.jewelleryPresent, q.complementaryBrands, q.pricePositionCompatible,
      q.touristPotential, q.strongRetailTown, q.highFootfall,
      q.aestheticMatch, q.suitableForDisplay, q.noConflictingPositioning,
    ].filter(Boolean).length / 15) * 100
  );

  const copyMessage = () => {
    navigator.clipboard.writeText(outreach.suggestedFirstMessage);
    toast.success('Message copied to clipboard');
  };

  return (
    <div className="page-container max-w-5xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground -ml-3 mb-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> Back
      </Button>

      {/* Header */}
      <div className="card-premium p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="badge-category">{r.category.replace('_', ' ')}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${
                r.qualification_status === 'qualified' ? 'bg-success-light text-success' :
                r.qualification_status === 'in_progress' ? 'bg-warning-light text-warning' :
                r.qualification_status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>{r.qualification_status === 'in_progress' ? 'Qualifying' : r.qualification_status ?? 'unqualified'}</span>
              <ConfidenceBadge level={ai.confidenceLevel} />
              {r.risk_flags && r.risk_flags.length > 0 && <span className="badge-risk">⚠ {r.risk_flags.length} risk{r.risk_flags.length > 1 ? 's' : ''}</span>}
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{r.name}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />{r.address && `${r.address}, `}{r.town}, {r.county}{r.postcode ? ` ${r.postcode}` : ''}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="w-3.5 h-3.5 text-warning" />{r.rating ?? 0} ({r.review_count ?? 0})</span>
              {r.is_independent && <span className="text-xs text-muted-foreground">Independent</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0 space-y-2">
            <p className="section-header text-[9px] mb-1">Predicted Annual Value</p>
            <p className="text-2xl font-display font-bold shimmer-gold">{pred.predictedAnnualValue}</p>
            <Button
              onClick={runAnalysis}
              disabled={analysing}
              className="gold-gradient text-sidebar-background text-xs h-8 px-4"
            >
              {analysing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1.5" />}
              {analysing ? "Analysing..." : ai.summary ? "Re-analyse" : "Run AI Analysis"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 px-4"
              onClick={() => {
                try {
                  const existing = JSON.parse(localStorage.getItem('custom_route_accounts') || '[]') as string[];
                  if (existing.includes(r.id)) {
                    toast.info(`${r.name} is already on your route`);
                    return;
                  }
                  existing.push(r.id);
                  localStorage.setItem('custom_route_accounts', JSON.stringify(existing));
                  toast.success(`${r.name} added to route`);
                } catch {
                  toast.error('Failed to add to route');
                }
              }}
            >
              <Route className="w-3.5 h-3.5 mr-1.5" />
              Add to Route
            </Button>
          </div>
        </div>

        <div className="divider-gold mt-6 mb-6" />

        <div className="flex items-center justify-center gap-10">
          <ScoreRing score={r.fit_score ?? 0} label="Brand Fit" size={80} />
          <ScoreRing score={r.commercial_health_score ?? 0} label="Commercial Health" size={80} />
          <ScoreRing score={r.priority_score ?? 0} label="Priority" size={80} />
          <ScoreRing score={r.spend_potential_score ?? 0} label="Spend Potential" size={80} />
          <ScoreRing score={pred.productMixSuitability} label="Product Mix" size={80} />
          <ScoreRing score={qualScore} label="Qualification" size={80} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="intelligence" className="space-y-5">
        <TabsList className="bg-cream/50 border border-border/30 p-1 h-auto gap-1 flex-wrap">
          <TabsTrigger value="intelligence" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">🧠 AI Intelligence</TabsTrigger>
          <TabsTrigger value="briefing" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">📋 Briefing</TabsTrigger>
          <TabsTrigger value="pitch" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">🎯 Pitch</TabsTrigger>
          <TabsTrigger value="research" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Research</TabsTrigger>
          <TabsTrigger value="qualification" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Qualification</TabsTrigger>
          <TabsTrigger value="outreach" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Outreach</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">Activity</TabsTrigger>
          <TabsTrigger value="voice" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">🎙️ Voice</TabsTrigger>
          <TabsTrigger value="health" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2">🏢 Health</TabsTrigger>
        </TabsList>

        {/* AI INTELLIGENCE */}
        <TabsContent value="intelligence" className="space-y-5 mt-0">
          {ai.summary ? (
            <div className="card-premium p-6 border-gold/20">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                  <Brain className="w-4 h-4" style={{ color: 'hsl(var(--sidebar-background))' }} />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold text-foreground">AI Retailer Intelligence</h3>
                  <p className="text-[10px] text-muted-foreground">Last analysed: {ai.lastAnalysed} · <ConfidenceBadge level={ai.confidenceLevel} /></p>
                </div>
              </div>
              <div className="bg-champagne/20 rounded-lg p-5 border border-gold/10 mb-5">
                <p className="text-sm text-foreground leading-relaxed italic font-display">{ai.summary}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Why Attractive', text: ai.whyAttractive, icon: Sparkles },
                  { title: 'Good Stockist', text: ai.whyGoodStockist, icon: Target },
                  { title: 'Risks', text: ai.risksOrConcerns, icon: AlertTriangle },
                  { title: 'Buying Motivation', text: ai.likelyBuyingMotivation, icon: Zap },
                ].filter(i => i.text).map(item => (
                  <div key={item.title} className="bg-cream/50 rounded-lg p-4 border border-border/15">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon className="w-3.5 h-3.5 text-gold" strokeWidth={1.5} />
                      <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-premium p-12 text-center">
              <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-base font-display font-semibold text-foreground mb-2">No AI intelligence yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Run an AI analysis to generate intelligence, predictions, and outreach strategy.</p>
              <Button onClick={runAnalysis} disabled={analysing} className="gold-gradient text-sidebar-background text-xs">
                {analysing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Brain className="w-3.5 h-3.5 mr-1.5" />}
                {analysing ? "Analysing..." : "Run AI Analysis"}
              </Button>
            </div>
          )}

          {pred.predictedAnnualValue !== '–' && (
            <div className="card-premium p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <BarChart3 className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <div>
                  <h3 className="text-base font-display font-semibold text-foreground">Performance Prediction</h3>
                  <ConfidenceBadge level={pred.predictionConfidence} />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-cream/50 rounded-lg">
                  <p className="text-lg font-display font-bold text-foreground">{pred.predictedOpeningOrder}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Opening Order</p>
                </div>
                <div className="text-center p-3 bg-cream/50 rounded-lg">
                  <p className="text-lg font-display font-bold shimmer-gold">{pred.predictedAnnualValue}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Annual Value</p>
                </div>
                <div className="text-center p-3 bg-cream/50 rounded-lg">
                  <p className="text-lg font-display font-bold text-foreground capitalize">{pred.reorderPotential}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Reorder</p>
                </div>
                <div className="text-center p-3 bg-cream/50 rounded-lg">
                  <p className="text-lg font-display font-bold text-foreground">{pred.productMixSuitability}%</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Product Mix</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* RESEARCH */}
        <TabsContent value="research" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-premium p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-semibold text-foreground">Contact & Location</h3>
                <Button variant="ghost" size="sm" onClick={() => { if (editingContact) saveContact(); else setEditingContact(true); }} className="text-[10px] h-7 px-2 text-gold-dark">
                  {editingContact ? 'Save' : (!r.phone && !r.email ? '+ Add Details' : 'Edit')}
                </Button>
              </div>
              {editingContact ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} /><Input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" className="h-8 text-xs bg-cream/30 border-border/30" /></div>
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} /><Input value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" className="h-8 text-xs bg-cream/30 border-border/30" /></div>
                  <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} /><Input value={contactForm.website} onChange={e => setContactForm(f => ({ ...f, website: e.target.value }))} placeholder="Website URL" className="h-8 text-xs bg-cream/30 border-border/30" /></div>
                  <div className="flex items-center gap-2"><Instagram className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} /><Input value={contactForm.instagram} onChange={e => setContactForm(f => ({ ...f, instagram: e.target.value }))} placeholder="Instagram handle" className="h-8 text-xs bg-cream/30 border-border/30" /></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} /><Input value={contactForm.address} onChange={e => setContactForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" className="h-8 text-xs bg-cream/30 border-border/30" /></div>
                  <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 opacity-0" /><Input value={contactForm.postcode} onChange={e => setContactForm(f => ({ ...f, postcode: e.target.value }))} placeholder="Postcode" className="h-8 text-xs bg-cream/30 border-border/30 w-32" /></div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveContact} className="text-[10px] h-7 px-3 gold-gradient text-sidebar-background">Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingContact(false)} className="text-[10px] h-7 px-3 text-muted-foreground">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {r.phone ? <div className="flex items-center gap-3"><Phone className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /><span className="text-sm text-foreground">{r.phone}</span></div> : <div className="flex items-center gap-3"><Phone className="w-3.5 h-3.5 text-muted-foreground/30" strokeWidth={1.5} /><span className="text-xs text-muted-foreground/50 italic">No phone — click Edit or run AI Analysis</span></div>}
                  {r.email ? <div className="flex items-center gap-3"><Mail className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /><span className="text-sm text-foreground">{r.email}</span></div> : <div className="flex items-center gap-3"><Mail className="w-3.5 h-3.5 text-muted-foreground/30" strokeWidth={1.5} /><span className="text-xs text-muted-foreground/50 italic">No email — click Edit or run AI Analysis</span></div>}
                  {r.website ? <div className="flex items-center gap-3"><Globe className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /><a href={r.website.startsWith('http') ? r.website : `https://${r.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:text-gold-dark">{r.website.replace('https://', '')}</a></div> : <div className="flex items-center gap-3"><Globe className="w-3.5 h-3.5 text-muted-foreground/30" strokeWidth={1.5} /><span className="text-xs text-muted-foreground/50 italic">No website</span></div>}
                  {r.instagram && <div className="flex items-center gap-3"><Instagram className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /><span className="text-sm text-foreground">{r.instagram}</span></div>}
                  {r.address && <div className="flex items-center gap-3"><MapPin className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} /><span className="text-sm text-foreground">{r.address}{r.postcode ? `, ${r.postcode}` : ''}</span></div>}
                </div>
              )}
            </div>
            <div className="card-premium p-6 space-y-1">
              <h3 className="text-base font-display font-semibold text-foreground mb-3">Classification</h3>
              <InfoRow label="Retailer Type" value={r.category.replace('_', ' ')} />
              <InfoRow label="Independent" value={r.is_independent ?? false} />
              <InfoRow label="Positioning" value={r.store_positioning?.replace('_', ' ')} />
            </div>
          </div>
        </TabsContent>

        {/* QUALIFICATION */}
        <TabsContent value="qualification" className="space-y-5 mt-0">
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-gold" strokeWidth={1.5} />
                <h3 className="text-lg font-display font-semibold text-foreground">Nomination Fit Evaluation</h3>
              </div>
              <ScoreRing score={qualScore} label="Fit Score" size={64} strokeWidth={3} />
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
            </div>
          </div>
          {r.risk_flags && r.risk_flags.length > 0 && (
            <div className="card-premium p-6 border-destructive/20">
              <div className="flex items-center gap-2.5 mb-3">
                <AlertTriangle className="w-5 h-5 text-destructive" strokeWidth={1.5} />
                <h3 className="text-base font-display font-semibold text-foreground">Risk Assessment</h3>
              </div>
              <div className="space-y-2">
                {r.risk_flags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 bg-destructive/5 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-destructive/50 flex-shrink-0" />
                    <span className="text-sm text-foreground">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* OUTREACH */}
        <TabsContent value="outreach" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Contact Details</h3>
              <div className="space-y-1">
                <InfoRow label="Contact Name" value={outreach.contactName || 'Not yet identified'} />
                <InfoRow label="Role" value={outreach.contactRole} />
                <InfoRow label="Email" value={outreach.contactEmail} />
                <InfoRow label="Phone" value={outreach.contactPhone} />
                <InfoRow label="Best Method" value={outreach.bestContactMethod} />
                <InfoRow label="Priority" value={outreach.outreachPriority} />
              </div>
            </div>
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Outreach Strategy</h3>
              <div className="space-y-3">
                {outreach.bestOutreachAngle && <div><p className="section-header text-[9px] mb-1">Best Angle</p><p className="text-sm text-foreground">{outreach.bestOutreachAngle}</p></div>}
                {outreach.productAngle && <div><p className="section-header text-[9px] mb-1">Product Angle</p><p className="text-sm text-muted-foreground">{outreach.productAngle}</p></div>}
              </div>
            </div>
          </div>

          {outreach.suggestedFirstMessage && (
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
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{outreach.suggestedFirstMessage}</p>
              </div>
            </div>
          )}

          <FollowUpDrafter retailer={r} />
        </TabsContent>

        {/* ACTIVITY */}
        <TabsContent value="activity" className="space-y-5 mt-0">
          <div className="card-premium p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <Calendar className="w-5 h-5 text-gold" strokeWidth={1.5} />
              <h3 className="text-base font-display font-semibold text-foreground">Activity Status</h3>
            </div>
            <div className="space-y-1">
              <InfoRow label="Pipeline Stage" value={r.pipeline_stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
              <InfoRow label="First Contact" value={activity.firstContactDate || 'Not yet contacted'} />
              <InfoRow label="Last Contact" value={activity.lastContactDate || 'Not yet contacted'} />
              <InfoRow label="Next Action" value={activity.nextActionDate || 'Not scheduled'} />
              <InfoRow label="Follow-up #" value={activity.followUpNumber} />
              <InfoRow label="Meeting Scheduled" value={activity.meetingScheduled} />
              <InfoRow label="Outcome" value={activity.outcomeStatus || 'Pending'} />
            </div>
          </div>
          {activity.suggestedNextStep && (
            <div className="card-premium p-6 border-gold/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-gold" strokeWidth={1.5} />
                <h4 className="text-sm font-display font-semibold text-foreground">AI Recommended Next Step</h4>
              </div>
              <p className="text-sm text-foreground leading-relaxed italic font-display">{activity.suggestedNextStep}</p>
            </div>
          )}
          {activity.conversationNotes.length > 0 && (
            <div className="card-premium p-6">
              <h3 className="text-base font-display font-semibold text-foreground mb-4">Conversation Notes</h3>
              <div className="space-y-2">
                {activity.conversationNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2 border-b border-border/10 last:border-0">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-medium text-muted-foreground">{i + 1}</span>
                    </span>
                    <p className="text-sm text-muted-foreground">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        {/* BRIEFING */}
        <TabsContent value="briefing" className="space-y-5 mt-0">
          <PreVisitBriefing retailer={r} />
        </TabsContent>

        {/* PITCH */}
        <TabsContent value="pitch" className="space-y-5 mt-0">
          <PitchPersonaliser retailer={r} />
        </TabsContent>

        {/* VOICE-TO-CRM */}
        <TabsContent value="voice" className="space-y-5 mt-0">
          <VoiceToCRM retailer={r} onUpdate={fetchRetailer} />
        </TabsContent>

        {/* BUSINESS HEALTH */}
        <TabsContent value="health" className="space-y-5 mt-0">
          <CompaniesHouseCheck retailer={r} />
        </TabsContent>
      </Tabs>
    </div>
  );
}