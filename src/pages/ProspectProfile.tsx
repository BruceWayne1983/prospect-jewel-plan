import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MapPin, Phone, Mail, Globe, Star, Sparkles, CheckCircle, XCircle, Eye, ArrowUpRight, Loader2, Tag, Users, Instagram, Calendar, AlertTriangle, Search, Info, ShieldCheck, ShieldAlert, ShieldQuestion, Shield } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { QuickBookButton } from "@/components/calendar/EventBooker";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScoreRing } from "@/components/ScoreIndicators";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type DiscoveredProspect = Database["public"]["Tables"]["discovered_prospects"]["Row"];

function ConfidenceBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-success-light text-success' : score >= 70 ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground';
  const label = score >= 80 ? 'High Confidence' : score >= 70 ? 'Medium Confidence' : 'Low Confidence';
  return <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

export default function ProspectProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prospect, setProspect] = useState<DiscoveredProspect | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissDialog, setDismissDialog] = useState<{ open: boolean; reason: string; detail: string }>({ open: false, reason: 'not_fit', detail: '' });
  const [verifying, setVerifying] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const enrichContacts = async () => {
    if (!prospect) return;
    setEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-contact-details', {
        body: {
          prospect_id: prospect.id,
          name: prospect.name,
          town: prospect.town,
          county: prospect.county,
          website: prospect.website,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      await fetchProspect();
      const prov = data?.provenance || {};
      const verifiedFields = ['phone','email','website','address'].filter(f => prov[f]?.confidence === 'high').length;
      if (verifiedFields > 0) {
        toast.success(`Verified ${verifiedFields} contact field${verifiedFields > 1 ? 's' : ''} from real sources`);
      } else {
        toast.warning('No contact details could be verified from the official website');
      }
    } catch (e: any) {
      toast.error(e.message || 'Enrichment failed');
    } finally {
      setEnriching(false);
    }
  };

  const verifyProspect = async () => {
    if (!prospect) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-prospect', {
        body: { prospect_id: prospect.id, name: prospect.name, town: prospect.town, county: prospect.county, category: prospect.category },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setProspect(prev => prev ? {
        ...prev,
        verification_status: data.verification_status,
        verification_data: data,
        website: data.website || prev.website,
        phone: data.phone || prev.phone,
        address: data.address || prev.address,
        email: data.email || prev.email,
      } as any : prev);
      if (data.exists) {
        toast.success(`Verified — business found online (${data.confidence} confidence)`);
      } else {
        toast.warning(`Could not verify this business exists online. It may be AI-generated.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const markManuallyVerified = async () => {
    if (!id) return;
    const { error } = await supabase.from("discovered_prospects").update({
      verification_status: 'manually_verified',
      verification_data: { verified_at: new Date().toISOString(), method: 'manual', verified_by: 'field_visit' },
    } as any).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    setProspect(prev => prev ? { ...prev, verification_status: 'manually_verified' } as any : prev);
    toast.success("Marked as manually verified");
  };

  const fetchProspect = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("discovered_prospects").select("*").eq("id", id).single();
    if (error) {
      console.error("Error fetching prospect:", error);
      toast.error("Prospect not found");
    } else {
      setProspect(data);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProspect(); }, [id]);

  const updateStatus = async (status: DiscoveredProspect['status']) => {
    if (!id) return;
    const { error } = await supabase.from("discovered_prospects").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    setProspect(prev => prev ? { ...prev, status } : prev);
    const labels: Record<string, string> = { accepted: 'Accepted', dismissed: 'Dismissed', reviewing: 'Marked for review' };
    toast.success(labels[status] || 'Updated');
  };

  const confirmDismiss = async () => {
    if (!prospect) return;
    const { reason, detail } = dismissDialog;

    await supabase.from("discovered_prospects").update({
      status: 'dismissed' as any,
      dismiss_reason: `${reason}${detail ? ': ' + detail : ''}` as any,
    } as any).eq("id", prospect.id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("disqualification_patterns").insert({
        user_id: user.id,
        prospect_name: prospect.name,
        prospect_town: prospect.town,
        prospect_county: prospect.county,
        prospect_category: prospect.category,
        reason,
        reason_detail: detail || null,
        patterns: {
          category: prospect.category,
          discovery_source: prospect.discovery_source,
          rating: prospect.rating,
          predicted_fit_score: prospect.predicted_fit_score,
          ai_reason: prospect.ai_reason,
        },
      } as any);
    }

    setProspect(prev => prev ? { ...prev, status: 'dismissed' as any } : prev);
    setDismissDialog({ open: false, reason: 'not_fit', detail: '' });
    toast.success('Dismissed — pattern logged for AI learning');
  };

  const promoteToRetailer = async () => {
    if (!prospect) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); return; }

    const p = prospect;
    const { data: inserted, error } = await supabase.from("retailers").insert({
      user_id: user.id, name: p.name, town: p.town, county: p.county,
      category: p.category, rating: p.rating, review_count: p.review_count,
      store_positioning: p.estimated_price_positioning, fit_score: p.predicted_fit_score,
      address: p.address, website: p.website, lat: p.lat, lng: p.lng,
      phone: p.phone || null, email: p.email || null,
      instagram: p.instagram || null, facebook: p.facebook || null,
      tiktok: p.tiktok || null, twitter: p.twitter || null,
      linkedin: p.linkedin || null, social_verified: p.social_verified || false,
      pipeline_stage: 'new_lead', ai_notes: p.ai_reason,
      store_images: p.store_images || [],
      follower_counts: p.follower_counts || {},
      estimated_monthly_traffic: p.estimated_monthly_traffic || null,
      google_review_summary: p.google_review_summary || null,
      google_review_highlights: p.google_review_highlights || [],
    }).select().single();

    if (error) { toast.error("Failed to promote prospect"); console.error(error); return; }
    await supabase.from("discovered_prospects").delete().eq("id", p.id);
    toast.success(`${p.name} promoted to Pipeline!`);
    if (inserted) {
      navigate(`/retailer/${inserted.id}`);
    } else {
      navigate('/discovery');
    }
  };

  if (loading) return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  if (!prospect) return <div className="page-container text-muted-foreground">Prospect not found.</div>;

  const p = prospect;
  const fc = (p.follower_counts ?? {}) as Record<string, number>;
  const totalFollowers = Object.values(fc).reduce((s, v) => s + (v || 0), 0);

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
              <span className="badge-category">{p.category.replace('_', ' ')}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider ${
                p.status === 'accepted' ? 'bg-success-light text-success' :
                p.status === 'reviewing' ? 'bg-warning-light text-warning' :
                p.status === 'dismissed' ? 'bg-destructive/10 text-destructive' :
                'bg-champagne text-gold-dark'
              }`}>{p.status}</span>
              <ConfidenceBadge score={p.predicted_fit_score ?? 0} />
              {p.discovery_source && <span className="text-[10px] text-muted-foreground">{p.discovery_source}</span>}
              {/* Verification Badge */}
              {(() => {
                const vs = (p as any).verification_status;
                if (vs === 'web_verified') return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" />CROSS-CHECKED</span>;
                if (vs === 'manually_verified') return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-info-light text-info flex items-center gap-1"><Shield className="w-2.5 h-2.5" />MANUALLY VERIFIED</span>;
                if (vs === 'needs_review') return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-warning-light text-warning flex items-center gap-1"><ShieldQuestion className="w-2.5 h-2.5" />NEEDS REVIEW</span>;
                if (vs === 'verified_fake') return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-destructive/15 text-destructive flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" />IDENTITY MISMATCH</span>;
                return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-warning-light text-warning flex items-center gap-1"><ShieldQuestion className="w-2.5 h-2.5" />UNVERIFIED</span>;
              })()}
              {((p.raw_data as any)?.is_potential_branch) && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-accent/20 text-accent-foreground flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" />Branch of {(p.raw_data as any)?.related_account_name} ({(p.raw_data as any)?.related_account_town})
                </span>
              )}
              {!p.instagram && !p.facebook && !p.tiktok && !p.twitter && !p.linkedin && (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-medium uppercase tracking-wider bg-info-light text-info">💡 Social Opportunity</span>
              )}
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{p.name}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />{p.address && `${p.address}, `}{p.town}, {p.county}</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><Star className="w-3.5 h-3.5 text-warning" />{p.rating ?? 0} ({p.review_count ?? 0})</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="section-header text-[9px] mb-1">Predicted Fit</p>
            <p className={`text-3xl font-display font-bold ${(p.predicted_fit_score ?? 0) >= 80 ? 'score-excellent' : (p.predicted_fit_score ?? 0) >= 70 ? 'score-good' : 'score-moderate'}`}>{p.predicted_fit_score}</p>
          </div>
        </div>

        <div className="divider-gold mt-6 mb-6" />

        {/* Scores */}
        <div className="flex items-center justify-center gap-10">
          <ScoreRing score={p.predicted_fit_score ?? 0} label="Predicted Fit" size={80} />
          <ScoreRing score={p.estimated_store_quality ?? 0} label="Store Quality" size={80} />
          <ScoreRing score={p.rating ? Math.round((p.rating / 5) * 100) : 0} label="Rating" size={80} />
        </div>
      </div>

      {/* Actions */}
      <div className="card-premium p-6">
        <h3 className="text-sm font-display font-semibold text-foreground mb-4">Actions</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <QuickBookButton retailerId={p.id} retailerName={p.name} town={p.town} defaultType="call" />
          <QuickBookButton retailerId={p.id} retailerName={p.name} town={p.town} defaultType="visit" />
          {/* Verification actions */}
          {((p as any).verification_status === 'unverified' || !(p as any).verification_status) && (
            <Button onClick={verifyProspect} disabled={verifying} variant="outline" className="text-xs h-9 px-4 border-warning/40 text-warning hover:bg-warning-light">
              {verifying ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
              Verify Store Exists
            </Button>
          )}
          {(p as any).verification_status === 'web_verified' && (
            <Button onClick={markManuallyVerified} variant="outline" className="text-xs h-9 px-4 border-info/40 text-info hover:bg-info-light">
              <Shield className="w-3.5 h-3.5 mr-1.5" /> Mark as Visited
            </Button>
          )}
          {(p.status === 'new' || p.status === 'reviewing') && (
            <>
              <Button onClick={() => updateStatus('reviewing')} variant="outline" className="text-xs h-9 px-4 border-border/40">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Mark for Review
              </Button>
              <Button onClick={() => updateStatus('accepted')} variant="outline" className="text-xs h-9 px-4 border-success/40 text-success hover:bg-success-light">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept
              </Button>
              <Button onClick={() => setDismissDialog({ open: true, reason: 'not_fit', detail: '' })} variant="outline" className="text-xs h-9 px-4 border-destructive/40 text-destructive hover:bg-destructive/10">
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
              </Button>
            </>
          )}
          {p.status === 'accepted' && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      onClick={promoteToRetailer}
                      disabled={(p as any).verification_status === 'unverified' || !(p as any).verification_status}
                      className="gold-gradient text-sidebar-background text-xs h-9 px-4"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" /> Promote to Pipeline
                    </Button>
                  </span>
                </TooltipTrigger>
                {((p as any).verification_status === 'unverified' || !(p as any).verification_status) && (
                  <TooltipContent>Verify this store exists before adding to pipeline</TooltipContent>
                )}
              </Tooltip>
              <Button onClick={() => setDismissDialog({ open: true, reason: 'not_fit', detail: '' })} variant="outline" className="text-xs h-9 px-4 border-destructive/40 text-destructive hover:bg-destructive/10">
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
              </Button>
            </>
          )}
          {(p as any).verification_status === 'verified_fake' && (
            <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/20">
              ⚠ Could not verify this business exists online. It may be AI-generated. Consider removing from pipeline.
            </div>
          )}
          {p.status === 'dismissed' && (
            <>
              <Button onClick={() => updateStatus('new')} variant="outline" className="text-xs h-9 px-4">
                Restore to New
              </Button>
              <span className="text-xs text-muted-foreground italic">
                {p.dismiss_reason && `Reason: ${p.dismiss_reason}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Contact & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Contact Info */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold text-foreground">Contact & Web</h3>
            <Button size="sm" variant="outline" onClick={enrichContacts} disabled={enriching} className="text-xs h-7">
              {enriching ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Verifying…</> : <><ShieldCheck className="w-3 h-3 mr-1" /> Verify contacts</>}
            </Button>
          </div>
          <div className="space-y-3">
            {(() => {
              const prov = ((p as any).verification_data || {}).contact_provenance || {};
              const renderField = (
                key: 'phone' | 'email' | 'website' | 'address',
                value: string | null | undefined,
                Icon: any,
                href?: string,
                external?: boolean,
              ) => {
                if (!value) return null;
                const f = prov[key] || {};
                const conf = f.confidence as string | undefined;
                const isVerified = conf === 'high';
                const isMedium = conf === 'medium';
                const sourceHost = (() => { try { return f.source_url ? new URL(f.source_url).hostname.replace(/^www\./, '') : (f.source || ''); } catch { return f.source || ''; } })();
                return (
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      {href ? (
                        <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className={`text-sm ${external ? 'text-info hover:underline truncate' : 'text-foreground hover:text-info'}`}>{value}</a>
                      ) : (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                      {isVerified && (
                        <Tooltip>
                          <TooltipTrigger><ShieldCheck className="w-3.5 h-3.5 text-success" /></TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div>Verified from <span className="font-mono">{sourceHost}</span></div>
                              {f.scraped_at && <div className="text-muted-foreground">{new Date(f.scraped_at).toLocaleDateString('en-GB')}</div>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isMedium && (
                        <Tooltip>
                          <TooltipTrigger><ShieldQuestion className="w-3.5 h-3.5 text-warning" /></TooltipTrigger>
                          <TooltipContent><div className="text-xs">Cross-checked from {sourceHost} — confirm before use.</div></TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {!conf && (
                      <p className="text-[10px] text-warning ml-6 mt-0.5">⚠ Unverified — click "Verify contacts" to confirm from the official site</p>
                    )}
                  </div>
                );
              };
              return (
                <>
                  {renderField('phone', p.phone, Phone, p.phone ? `tel:${p.phone}` : undefined)}
                  {renderField('email', p.email, Mail, p.email ? `mailto:${p.email}` : undefined)}
                  {renderField('website', p.website, Globe, p.website || undefined, true)}
                  {renderField('address', p.address, MapPin)}
                  {!p.phone && !p.email && !p.website && (
                    <p className="text-xs text-muted-foreground italic">No contact information available — click "Verify contacts" to scrape from the official site</p>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Social & Online */}
        <div className="card-premium p-6">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4">Social & Online Presence</h3>
          <div className="space-y-3">
            {p.instagram && (
              <a href={`https://instagram.com/${p.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-info hover:underline">
                📷 Instagram: {p.instagram} {fc.instagram ? `(${fc.instagram.toLocaleString()} followers)` : ''}
              </a>
            )}
            {p.facebook && (
              <a href={p.facebook.startsWith('http') ? p.facebook : `https://facebook.com/${p.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-info hover:underline">
                Facebook {fc.facebook ? `(${fc.facebook.toLocaleString()} followers)` : ''}
              </a>
            )}
            {p.tiktok && (
              <a href={`https://tiktok.com/@${p.tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-info hover:underline">
                🎵 TikTok: {p.tiktok}
              </a>
            )}
            {p.twitter && (
              <a href={`https://x.com/${p.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-info hover:underline">
                𝕏 Twitter: {p.twitter}
              </a>
            )}
            {p.linkedin && (
              <a href={p.linkedin.startsWith('http') ? p.linkedin : `https://linkedin.com/company/${p.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-info hover:underline">
                LinkedIn
              </a>
            )}
            {p.social_verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-light text-success font-medium">✓ Socials Verified</span>}
            {totalFollowers > 0 && <p className="text-xs text-muted-foreground">👥 {totalFollowers.toLocaleString()} total followers</p>}
            {p.estimated_monthly_traffic && p.estimated_monthly_traffic > 0 && <p className="text-xs text-muted-foreground">🌐 ~{p.estimated_monthly_traffic.toLocaleString()}/mo website visitors</p>}
            {!p.instagram && !p.facebook && !p.tiktok && !p.twitter && !p.linkedin && (
              <div className="p-3 rounded-lg bg-info-light border border-info/20">
                <p className="text-xs font-semibold text-info flex items-center gap-1.5">💡 Social Media Setup Opportunity</p>
                <p className="text-[11px] text-info/80 mt-1">This retailer has no detectable social media presence. This is a value-add opportunity — Emma can offer to help them set up Instagram/Facebook as part of the Nomination partnership, increasing their visibility and your brand's reach.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identity Confidence — cross-validation results */}
      {(() => {
        const ic = ((p as any).verification_data || {}).identity_check;
        if (!ic) {
          return (
            <div className="card-premium p-6 border-warning/30">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2"><ShieldQuestion className="w-4 h-4 text-warning" /> Identity Confidence</h3>
                  <p className="text-xs text-muted-foreground mt-1">No cross-validation has run yet. Click "Verify contacts" above — it will scrape the official site, then run 8 identity checks to prove every contact field belongs to this exact business.</p>
                </div>
              </div>
            </div>
          );
        }
        const score = ic.score ?? 0;
        const tone = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'destructive';
        const labels: Record<string, string> = {
          name_on_site: 'Business name appears on its website',
          town_on_site: 'Town/postcode appears on the website',
          email_domain_matches: 'Email domain matches website',
          phone_reverse_lookup: 'Phone reverse-lookup links to business',
          maps_agreement: 'Google Maps name + postcode agree',
          companies_house_match: 'Companies House registration matches',
          postcode_valid: 'Postcode resolves correctly (postcodes.io)',
          social_ownership: 'Social bio mentions town or website',
        };
        return (
          <div className={`card-premium p-6 border-${tone}/30`}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  {tone === 'success' ? <ShieldCheck className="w-4 h-4 text-success" /> : tone === 'warning' ? <ShieldQuestion className="w-4 h-4 text-warning" /> : <ShieldAlert className="w-4 h-4 text-destructive" />}
                  Identity Confidence
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">Last checked {ic.ran_at ? new Date(ic.ran_at).toLocaleString('en-GB') : '—'}</p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-display font-bold ${tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-destructive'}`}>{score}<span className="text-base text-muted-foreground">/100</span></p>
                {ic.hard_gate_failed && <p className="text-[10px] text-destructive font-medium mt-0.5">⚠ Name or location mismatch</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              {Object.entries(ic.checks || {}).map(([key, c]: [string, any]) => {
                const label = labels[key] || key;
                const isHard = c.hard_gate;
                const icon = c.pass === true ? '✓' : c.pass === false ? '✗' : '–';
                const color = c.pass === true ? 'text-success' : c.pass === false ? 'text-destructive' : 'text-muted-foreground';
                return (
                  <div key={key} className="flex items-start gap-2 text-xs py-1 border-b border-border/10 last:border-0">
                    <span className={`${color} font-bold w-4 flex-shrink-0`}>{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-foreground">{label}</span>
                        {isHard && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">required</span>}
                        {c.source_url && <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline text-[10px] truncate">source ↗</a>}
                      </div>
                      {c.reason && <p className="text-[10px] text-muted-foreground">{c.reason.replace(/_/g, ' ')}</p>}
                      {c.email_domain && c.website_domain && c.pass === false && <p className="text-[10px] text-destructive">{c.email_domain} vs {c.website_domain}</p>}
                      {c.maps_postcode && c.site_postcode && c.maps_postcode !== c.site_postcode && <p className="text-[10px] text-warning">Maps: {c.maps_postcode} · Site: {c.site_postcode}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* AI Analysis & Discovery Details */}
      <div className="card-premium p-6 border-gold/20">
        <div className="flex items-center gap-2.5 mb-4">
          <Sparkles className="w-4 h-4 text-gold" strokeWidth={1.5} />
          <h3 className="text-sm font-display font-semibold text-foreground">AI Analysis & Discovery Details</h3>
        </div>

        {/* How it was discovered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="bg-muted/30 rounded-lg p-3.5 border border-border/15">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1"><Search className="w-3 h-3" /> Discovery Method</p>
            <p className="text-sm font-medium text-foreground">{p.discovery_source || 'AI Scanner'}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {p.discovery_source?.startsWith('Brand:')
                ? `Found by searching for retailers that stock ${p.discovery_source.replace('Brand: ', '')} or similar brands in the South West.`
                : p.discovery_source === 'Web Scanner'
                ? 'Found by searching real business directories and websites using Firecrawl web scraping.'
                : 'Found by AI analysis of the independent retail landscape in the target territory.'}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3.5 border border-border/15">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Discovered</p>
            <p className="text-sm font-medium text-foreground">{new Date(p.discovered_date || p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Added to your prospect pipeline on this date.</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3.5 border border-border/15">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1"><Info className="w-3 h-3" /> Data Confidence</p>
            <p className="text-sm font-medium text-foreground">
              {p.discovery_source === 'Web Scanner' ? 'Higher' : 'Moderate'} Confidence
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {p.discovery_source === 'Web Scanner'
                ? 'Based on real web data scraped from business directories. Contact details likely accurate.'
                : 'AI-generated based on market knowledge. Store name, address, phone, email & website should all be verified before outreach.'}
            </p>
          </div>
        </div>

        {/* AI Reasoning */}
        {p.ai_reason && (
          <div className="mb-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">AI Reasoning — Why This Prospect?</p>
            <div className="bg-champagne/15 rounded-lg p-4 border border-gold/10">
              <p className="text-sm text-foreground leading-relaxed italic font-display">{p.ai_reason}</p>
            </div>
          </div>
        )}

        {/* What to verify */}
        <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
          <p className="text-xs font-semibold text-warning flex items-center gap-1.5 mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Before You Reach Out — Verify These</p>
          <ul className="text-[11px] text-foreground/80 space-y-1.5 ml-5 list-disc">
            <li><strong>Store exists:</strong> Check the website URL actually works and belongs to this business</li>
            <li><strong>Contact details:</strong> Phone number, email, and address may be AI-estimated — confirm via Google or their website</li>
            <li><strong>Still trading:</strong> Confirm the store is currently open and operating</li>
            <li><strong>Correct category:</strong> Verify they actually sell jewellery/gifts/accessories (not just toys or unrelated products)</li>
            <li><strong>Social media:</strong> Run a social verification scan to find their real Instagram, Facebook, etc.</li>
            {p.discovery_source?.startsWith('Brand:') && (
              <li><strong>Brand connection:</strong> Confirm they actually stock {p.discovery_source.replace('Brand: ', '')} — the AI inferred this from market knowledge</li>
            )}
          </ul>
        </div>
      </div>

      {/* Google Reviews */}
      {p.google_review_summary && (
        <div className="card-premium p-6">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3">Google Review Summary</h3>
          <p className="text-sm text-foreground leading-relaxed">{p.google_review_summary}</p>
          {p.google_review_highlights && Array.isArray(p.google_review_highlights) && (p.google_review_highlights as any[]).length > 0 && (
            <div className="mt-3 space-y-2">
              {(p.google_review_highlights as any[]).map((h: any, i: number) => (
                <div key={i} className="bg-cream/50 rounded-lg p-3 border border-border/15">
                  <p className="text-xs text-foreground">"{h.text || h}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Store Images */}
      {p.store_images && p.store_images.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-sm font-display font-semibold text-foreground mb-3">Store Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {p.store_images.map((img, i) => (
              <img key={i} src={img} alt={`${p.name} store`} className="rounded-lg object-cover h-32 w-full border border-border/20" />
            ))}
          </div>
        </div>
      )}

      {/* Dismiss Dialog */}
      <Dialog open={dismissDialog.open} onOpenChange={(open) => !open && setDismissDialog({ open: false, reason: 'not_fit', detail: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-display">Dismiss {prospect?.name}</DialogTitle>
            <DialogDescription className="text-xs">
              Your feedback helps the AI learn what doesn't fit — improving future discovery results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Reason</label>
              <Select value={dismissDialog.reason} onValueChange={(v) => setDismissDialog(prev => ({ ...prev, reason: v }))}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_fit">Not a brand fit</SelectItem>
                  <SelectItem value="wrong_category">Wrong store type (e.g. toy store, chain)</SelectItem>
                  <SelectItem value="wrong_positioning">Wrong price positioning</SelectItem>
                  <SelectItem value="too_small">Too small / low quality</SelectItem>
                  <SelectItem value="wrong_location">Wrong location / area</SelectItem>
                  <SelectItem value="already_approached">Already approached / declined</SelectItem>
                  <SelectItem value="competitor_conflict">Competitor conflict</SelectItem>
                  <SelectItem value="closed">Store closed / no longer trading</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Details (optional)</label>
              <Textarea
                placeholder="e.g. 'Purely a toy shop, no jewellery or gift accessories'"
                value={dismissDialog.detail}
                onChange={(e) => setDismissDialog(prev => ({ ...prev, detail: e.target.value }))}
                className="text-xs min-h-[60px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDismissDialog({ open: false, reason: 'not_fit', detail: '' })}>Cancel</Button>
              <Button size="sm" className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDismiss}>Dismiss & Log Pattern</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
