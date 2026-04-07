import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle, XCircle, Eye, Star, MapPin, Loader2, Radar, ArrowUpRight, Globe, Zap, Tag, Search, Phone, Mail, SlidersHorizontal, ArrowUpDown, Users, Info, UserSearch, ShieldCheck, ShieldAlert, ShieldQuestion, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Database } from "@/integrations/supabase/types";

type DiscoveredProspect = Database["public"]["Tables"]["discovered_prospects"]["Row"];

const COUNTIES = [
  "Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Bristol", "Avon",
  "Herefordshire", "Worcestershire",
  "Cardiff", "Swansea", "Newport", "Vale of Glamorgan", "Bridgend", "Neath Port Talbot",
  "Carmarthenshire", "Pembrokeshire", "Monmouthshire", "Rhondda Cynon Taf", "Merthyr Tydfil",
  "Caerphilly", "Blaenau Gwent", "Torfaen", "Powys", "Ceredigion",
];
const CATEGORIES = [
  { value: "jeweller", label: "Jewellers" },
  { value: "gift_shop", label: "Gift Shops" },
  { value: "fashion_boutique", label: "Fashion Boutiques" },
  { value: "lifestyle_store", label: "Lifestyle Stores" },
  { value: "premium_accessories", label: "Premium Accessories" },
  { value: "concept_store", label: "Concept Stores" },
  { value: "department_store", label: "Department Stores" },
  { value: "garden_centre_gift_hall", label: "Garden Centre Gift Halls" },
  { value: "wedding_bridal", label: "Wedding & Bridal" },
  { value: "heritage_tourist_gift", label: "Heritage / Tourist Gift Shops" },
  { value: "multi_brand_retailer", label: "Multi-Brand Retailers" },
];

const BRAND_OPTIONS = [
  "Pandora", "ChloBo", "Joma Jewellery", "Thomas Sabo", "Swarovski",
  "Daisy London", "Olivia Burton", "Kit Heath", "Annie Haak", "Coeur de Lion",
  "Gecko", "Hot Diamonds", "Fiorelli", "Lola Rose", "Missoma",
  "Monica Vinader", "Astley Clarke", "Clogau", "Carrie Elizabeth", "Tutti & Co",
  "Pilgrim", "Ania Haie", "Orelia", "Estella Bartlett", "Scream Pretty",
  "Jellycat", "Katie Loxton", "Radley", "Joules", "Emma Bridgewater",
];

function ConfidenceBadge({ score }: { score: number }) {
  const cls = score >= 80 ? 'bg-success-light text-success' : score >= 70 ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground';
  const label = score >= 80 ? 'High Confidence' : score >= 70 ? 'Medium Confidence' : 'Low Confidence';
  return <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function SourceBadge({ source }: { source: string | null }) {
  if (source === "Web Scanner") {
    return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-info-light text-info flex items-center gap-1"><Globe className="w-2.5 h-2.5" />Web Verified</span>;
  }
  return <span className="text-[10px] text-gold-dark">{source}</span>;
}

function VerificationBadge({ status }: { status: string | null | undefined }) {
  switch (status) {
    case 'web_verified':
      return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" />WEB VERIFIED</span>;
    case 'manually_verified':
      return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-info-light text-info flex items-center gap-1"><Shield className="w-2.5 h-2.5" />MANUALLY VERIFIED</span>;
    case 'verified_fake':
      return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-destructive/15 text-destructive flex items-center gap-1"><ShieldAlert className="w-2.5 h-2.5" />NOT FOUND ONLINE</span>;
    case 'unverified':
    default:
      return <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-warning-light text-warning flex items-center gap-1"><ShieldQuestion className="w-2.5 h-2.5" />AI GENERATED — NOT VERIFIED</span>;
  }
}

function ScoreBreakdownTooltip({ prospect }: { prospect: DiscoveredProspect }) {
  const p = prospect;
  const quality = p.estimated_store_quality ?? 50;
  const hasSocials = !!(p.instagram || p.facebook || p.tiktok || p.twitter || p.linkedin);
  const reviewScore = Math.min(100, ((p.review_count ?? 0) / 200) * 100);

  // Approximate the factor scores
  const storeQuality = Math.round(quality * 0.25);
  const brandAlignment = Math.round((p.predicted_fit_score ?? 50) * 0.20);
  const location = Math.round(((p.rating ?? 3) / 5) * 100 * 0.15);
  const onlinePresence = Math.round((hasSocials ? 80 : 15) * 0.15);
  const commercialHealth = Math.round(((reviewScore + ((p.rating ?? 3) / 5) * 100) / 2) * 0.15);
  const independence = Math.round(90 * 0.10); // assumed independent

  const factors = [
    { label: 'Store Quality', score: storeQuality, max: 25, detail: `${quality}/100` },
    { label: 'Brand Alignment', score: brandAlignment, max: 20, detail: p.discovery_source?.startsWith('Brand:') ? p.discovery_source.replace('Brand: ', '') : 'General' },
    { label: 'Location', score: location, max: 15, detail: `${p.town}, ${p.county}` },
    { label: 'Online Presence', score: onlinePresence, max: 15, detail: hasSocials ? '✓ Has socials' : '✗ No socials (−15)' },
    { label: 'Commercial Health', score: commercialHealth, max: 15, detail: `★${p.rating ?? 0} (${p.review_count ?? 0} reviews)` },
    { label: 'Independence', score: independence, max: 10, detail: 'Independent' },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-center cursor-help group">
            <span className={`text-2xl font-display font-bold ${(p.predicted_fit_score ?? 0) >= 80 ? 'score-excellent' : (p.predicted_fit_score ?? 0) >= 70 ? 'score-good' : 'score-moderate'}`}>{p.predicted_fit_score}</span>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-0.5">Predicted Fit <Info className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" /></p>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="w-64 p-0 bg-card border-border/40 shadow-xl">
          <div className="p-3 border-b border-border/20">
            <p className="text-xs font-display font-semibold text-foreground">Score Breakdown</p>
            <p className="text-[10px] text-muted-foreground">How this fit score was calculated</p>
          </div>
          <div className="p-3 space-y-2.5">
            {factors.map(f => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium text-foreground">{f.label}</span>
                  <span className="text-[10px] text-muted-foreground">{f.score}/{f.max}</span>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${f.score / f.max >= 0.7 ? 'bg-success' : f.score / f.max >= 0.4 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${(f.score / f.max) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">{f.detail}</p>
              </div>
            ))}
          </div>
          {!hasSocials && (
            <div className="px-3 pb-3">
              <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                <p className="text-[9px] text-destructive font-medium">⚠ No social media — score penalised</p>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ProspectDiscovery() {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<DiscoveredProspect[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewing' | 'accepted' | 'dismissed'>('all');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanType, setScanType] = useState<'idle' | 'ai' | 'web' | 'full' | 'brand'>('idle');
  const [scanProgress, setScanProgress] = useState("");
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [brandSearch, setBrandSearch] = useState("");
  const [suggestedBrands, setSuggestedBrands] = useState<string[]>([]);
  // Advanced filters
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterBrandStockist, setFilterBrandStockist] = useState<string>("all");
  const [filterHasWebsite, setFilterHasWebsite] = useState<string>("all");
  const [filterHasContact, setFilterHasContact] = useState<string>("all");
  const [filterFitMin, setFilterFitMin] = useState<string>("0");
  const [filterRatingMin, setFilterRatingMin] = useState<string>("0");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ done: 0, total: 0 });
  const [dismissDialog, setDismissDialog] = useState<{ open: boolean; prospect: DiscoveredProspect | null; reason: string; detail: string }>({ open: false, prospect: null, reason: 'not_fit', detail: '' });
  // Manual store search
  const [manualSearchName, setManualSearchName] = useState("");
  const [manualSearchTown, setManualSearchTown] = useState("");
  const [manualSearchCategory, setManualSearchCategory] = useState<string>("all");
  const [manualSearching, setManualSearching] = useState(false);
  const [manualResult, setManualResult] = useState<any>(null);
  // Verification
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [hideUnverified, setHideUnverified] = useState(true);

  const fetchProspects = async () => {
    const { data, error } = await supabase
      .from("discovered_prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Failed to load prospects");
    } else {
      setProspects(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProspects(); fetchKnownBrands(); }, []);

  // Extract brands from existing retailers' competitor_brands field
  const fetchKnownBrands = async () => {
    const { data } = await supabase.from("retailers").select("competitor_brands");
    if (!data) return;
    const brandSet = new Set<string>();
    data.forEach((r: any) => {
      const brands = r.competitor_brands;
      if (Array.isArray(brands)) {
        brands.forEach((b: any) => {
          if (b?.name) brandSet.add(b.name);
        });
      }
    });
    setSuggestedBrands(Array.from(brandSet).sort());
  };

  // Extract unique brand sources for filter dropdown
  const brandSources = useMemo(() => {
    const set = new Set<string>();
    prospects.forEach(p => {
      if (p.discovery_source?.startsWith('Brand:')) {
        set.add(p.discovery_source.replace('Brand: ', '').trim());
      }
    });
    return Array.from(set).sort();
  }, [prospects]);

  // Get existing retailer names and towns for dedup and "close to current" filter
  const [existingTowns, setExistingTowns] = useState<string[]>([]);
  const [existingRetailerKeys, setExistingRetailerKeys] = useState<Set<string>>(new Set());
  const [filterNearCurrent, setFilterNearCurrent] = useState(false);
  useEffect(() => {
    supabase.from("retailers").select("name, town").then(({ data }) => {
      if (data) {
        setExistingTowns(data.map(r => r.town));
        setExistingRetailerKeys(new Set(data.map(r => `${r.name.toLowerCase().trim()}|${r.town.toLowerCase().trim()}`)));
      }
    });
  }, []);

  const filtered = useMemo(() => {
    let result = prospects.filter(p => {
      // Exclude prospects that already exist as current accounts
      const key = `${p.name.toLowerCase().trim()}|${p.town.toLowerCase().trim()}`;
      if (existingRetailerKeys.has(key)) return false;
      if (filter !== 'all' && p.status !== filter) return false;
      if (filterCounty !== 'all' && p.county !== filterCounty) return false;
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterSource === 'ai' && p.discovery_source !== 'AI Scanner') return false;
      if (filterSource === 'web' && p.discovery_source !== 'Web Scanner') return false;
      if (filterSource === 'brand' && !p.discovery_source?.startsWith('Brand:')) return false;
      if (filterBrandStockist !== 'all' && !(p.discovery_source ?? '').includes(filterBrandStockist)) return false;
      if (filterHasWebsite === 'yes' && !p.website) return false;
      if (filterHasWebsite === 'no' && p.website) return false;
      if (filterHasContact === 'yes' && !p.phone && !p.email) return false;
      if (filterHasContact === 'email' && !p.email) return false;
      if (filterHasContact === 'phone' && !p.phone) return false;
      if (Number(filterFitMin) > 0 && (p.predicted_fit_score ?? 0) < Number(filterFitMin)) return false;
      if (Number(filterRatingMin) > 0 && (p.rating ?? 0) < Number(filterRatingMin)) return false;
      if (filterNearCurrent && !existingTowns.includes(p.town)) return false;
      if (hideUnverified && (p as any).verification_status === 'unverified') return false;
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'fit_high': result.sort((a, b) => (b.predicted_fit_score ?? 0) - (a.predicted_fit_score ?? 0)); break;
      case 'fit_low': result.sort((a, b) => (a.predicted_fit_score ?? 0) - (b.predicted_fit_score ?? 0)); break;
      case 'rating': result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case 'reviews': result.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0)); break;
      case 'quality': result.sort((a, b) => (b.estimated_store_quality ?? 0) - (a.estimated_store_quality ?? 0)); break;
      case 'county': result.sort((a, b) => a.county.localeCompare(b.county)); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
      case 'newest':
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }
    return result;
  }, [prospects, filter, filterCounty, filterCategory, filterSource, filterBrandStockist, filterHasWebsite, filterHasContact, filterFitMin, filterRatingMin, filterNearCurrent, sortBy, existingTowns, existingRetailerKeys]);

  const updateStatus = async (id: string, status: DiscoveredProspect['status']) => {
    const { error } = await supabase.from("discovered_prospects").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const labels: Record<string, string> = { accepted: 'Accepted', dismissed: 'Dismissed', reviewing: 'Marked for review' };
    toast.success(labels[status] || 'Updated');
  };

  const openDismissDialog = (prospect: DiscoveredProspect) => {
    setDismissDialog({ open: true, prospect, reason: 'not_fit', detail: '' });
  };

  const confirmDismiss = async () => {
    const { prospect, reason, detail } = dismissDialog;
    if (!prospect) return;

    // Update prospect status
    await supabase.from("discovered_prospects").update({
      status: 'dismissed' as any,
      dismiss_reason: `${reason}${detail ? ': ' + detail : ''}` as any,
    } as any).eq("id", prospect.id);

    // Log the disqualification pattern for AI learning
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

    setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, status: 'dismissed' as any } : p));
    setDismissDialog({ open: false, prospect: null, reason: 'not_fit', detail: '' });
    toast.success('Dismissed — pattern logged for AI learning');
  };

  const promoteToRetailer = async (p: DiscoveredProspect) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); return; }

    const { error } = await supabase.from("retailers").insert({
      user_id: user.id, name: p.name, town: p.town, county: p.county,
      category: p.category, rating: p.rating, review_count: p.review_count,
      store_positioning: p.estimated_price_positioning, fit_score: p.predicted_fit_score,
      address: p.address, website: p.website, lat: p.lat, lng: p.lng,
      phone: p.phone || null, email: p.email || null,
      instagram: (p as any).instagram || null, facebook: (p as any).facebook || null,
      tiktok: (p as any).tiktok || null, twitter: (p as any).twitter || null,
      linkedin: (p as any).linkedin || null, social_verified: (p as any).social_verified || false,
      pipeline_stage: 'new_lead', ai_notes: p.ai_reason,
      store_images: (p as any).store_images || [],
      follower_counts: (p as any).follower_counts || {},
      estimated_monthly_traffic: (p as any).estimated_monthly_traffic || null,
      google_review_summary: (p as any).google_review_summary || null,
      google_review_highlights: (p as any).google_review_highlights || [],
    });

    if (error) { toast.error("Failed to promote prospect"); console.error(error); return; }
    await supabase.from("discovered_prospects").delete().eq("id", p.id);
    setProspects(prev => prev.filter(x => x.id !== p.id));
    toast.success(`${p.name} promoted to Pipeline!`);
  };

  const verifyProspect = async (p: DiscoveredProspect) => {
    setVerifyingIds(prev => new Set(prev).add(p.id));
    try {
      const { data, error } = await supabase.functions.invoke('verify-prospect', {
        body: { prospect_id: p.id, name: p.name, town: p.town, county: p.county, category: p.category },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setProspects(prev => prev.map(x => x.id === p.id ? {
        ...x,
        verification_status: data.verification_status,
        verification_data: data,
        website: data.website || x.website,
        phone: data.phone || x.phone,
        address: data.address || x.address,
        email: data.email || x.email,
      } as any : x));

      if (data.exists) {
        toast.success(`${p.name} verified — business found online (${data.confidence} confidence)`);
      } else {
        toast.warning(`${p.name} could not be verified online. It may be AI-generated.`);
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed");
    } finally {
      setVerifyingIds(prev => { const n = new Set(prev); n.delete(p.id); return n; });
    }
  };

  const markManuallyVerified = async (id: string) => {
    const { error } = await supabase.from("discovered_prospects").update({
      verification_status: 'manually_verified',
      verification_data: { verified_at: new Date().toISOString(), method: 'manual', verified_by: 'field_visit' },
    } as any).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    setProspects(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'manually_verified' } as any : p));
    toast.success("Marked as manually verified");
  };

  const ensureSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Wait for auto-login to complete
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Please wait for login to complete and try again")), 10000);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
          if (sess) {
            clearTimeout(timeout);
            subscription.unsubscribe();
            resolve();
          }
        });
      });
    }
  };

  const runAIScan = async () => {
    setScanning(true);
    setScanType('ai');
    setScanProgress("Generating prospects...");
    try {
      await ensureSession();
      const body: any = { count: 15 };
      if (selectedCounty !== "all") body.county = selectedCounty;
      if (selectedCategory !== "all") body.category = selectedCategory;

      const { data, error } = await supabase.functions.invoke("discover-prospects", { body });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Discovered ${data.prospects?.length || 0} new prospects!`);
        await fetchProspects();
      } else {
        toast.error(data?.error || "Discovery failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run discovery");
    } finally {
      setScanning(false);
      setScanType('idle');
      setScanProgress("");
    }
  };

  const runWebScan = async () => {
    if (selectedCounty === "all") {
      toast.error("Please select a county for web scanning");
      return;
    }
    setScanning(true);
    setScanType('web');
    setScanProgress(`Searching the web for real stores in ${selectedCounty}...`);
    try {
      await ensureSession();
      const body: any = { county: selectedCounty };
      if (selectedCategory !== "all") body.category = selectedCategory;

      const { data, error } = await supabase.functions.invoke("discover-web", { body });
      if (error) throw error;
      if (data?.success) {
        const count = data.prospects?.length || 0;
        toast.success(count > 0 ? `Found ${count} real stores!` : (data.message || "No new stores found"));
        await fetchProspects();
      } else {
        toast.error(data?.error || "Web scan failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Web scan failed");
    } finally {
      setScanning(false);
      setScanType('idle');
      setScanProgress("");
    }
  };

  const runFullScan = async () => {
    setScanning(true);
    setScanType('full');
    setScanProgress("Running full territory scan across all counties...");
    try {
      await ensureSession();
      const { data, error } = await supabase.functions.invoke("discover-prospects", {
        body: { fullScan: true },
      });
      if (error) throw error;
      if (data?.success) {
        const count = data.prospects?.length || 0;
        const msg = data.partial
          ? `Found ${count} prospects (stopped early: ${data.error})`
          : `Full scan complete! Found ${count} new prospects!`;
        toast.success(msg);
        await fetchProspects();
      } else {
        toast.error(data?.error || "Full scan failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Full scan failed");
    } finally {
      setScanning(false);
      setScanType('full');
      setScanProgress("");
    }
  };

  const runBrandScan = async (brand?: string) => {
    const searchBrand = brand || brandSearch.trim();
    if (!searchBrand || searchBrand.length < 2) {
      toast.error("Please enter a brand name (at least 2 characters)");
      return;
    }
    setScanning(true);
    setScanType('brand');
    setScanProgress(`Finding retailers that stock ${searchBrand}...`);
    try {
      await ensureSession();
      const body: any = { brand: searchBrand, count: 12 };
      if (selectedCounty !== "all") body.county = selectedCounty;

      const { data, error } = await supabase.functions.invoke("discover-by-brand", { body });
      if (error) throw error;
      if (data?.success) {
        const count = data.prospects?.length || 0;
        const msg = count > 0
          ? `Found ${count} retailers linked to ${searchBrand}!`
          : (data.message || "No new prospects found for this brand");
        count > 0 ? toast.success(msg) : toast.info(msg);
        if (data.similarBrands?.length) {
          toast.info(`Similar brands: ${data.similarBrands.join(", ")}`, { duration: 6000 });
        }
        await fetchProspects();
      } else {
        toast.error(data?.error || "Brand scan failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Brand scan failed");
    } finally {
      setScanning(false);
      setScanType('idle');
      setScanProgress("");
    }
  };

  const runBulkEnrich = async () => {
    const accepted = prospects.filter(p => p.status === 'accepted' && !p.social_verified);
    if (accepted.length === 0) {
      toast.info("No unenriched accepted prospects to process");
      return;
    }
    setEnriching(true);
    setEnrichProgress({ done: 0, total: accepted.length });
    let successCount = 0;
    for (const p of accepted) {
      try {
        const { data, error } = await supabase.functions.invoke("verify-social", {
          body: { prospectId: p.id, name: p.name, town: p.town, county: p.county, website: p.website },
        });
        if (!error && data?.success) successCount++;
      } catch (err) {
        console.error(`Enrich failed for ${p.name}:`, err);
      }
      setEnrichProgress(prev => ({ ...prev, done: prev.done + 1 }));
    }
    toast.success(`Enriched ${successCount} of ${accepted.length} prospects`);
    await fetchProspects();
    setEnriching(false);
    setEnrichProgress({ done: 0, total: 0 });
  };

  const runManualSearch = async () => {
    if (!manualSearchName.trim() || manualSearchName.trim().length < 2) {
      toast.error("Please enter a store name (at least 2 characters)");
      return;
    }
    setManualSearching(true);
    setManualResult(null);
    try {
      await ensureSession();
      const { data, error } = await supabase.functions.invoke("search-store", {
        body: { storeName: manualSearchName.trim(), town: manualSearchTown.trim() || undefined, category: manualSearchCategory !== 'all' ? manualSearchCategory : undefined },
      });
      if (error) throw error;
      if (data?.found) {
        if (data.alreadyExists) {
          toast.info(data.message);
        } else {
          toast.success(`Found and saved "${data.store?.name}"!`);
          await fetchProspects();
        }
        setManualResult(data);
      } else {
        toast.info(data?.message || `No results found for "${manualSearchName}"`);
        setManualResult(data);
      }
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setManualSearching(false);
    }
  };

  const newCount = prospects.filter(p => p.status === 'new').length;
  const reviewingCount = prospects.filter(p => p.status === 'reviewing').length;
  const acceptedCount = prospects.filter(p => p.status === 'accepted').length;
  const webCount = prospects.filter(p => p.discovery_source === 'Web Scanner').length;
  const brandCount = prospects.filter(p => p.discovery_source?.startsWith('Brand:')).length;
  const unenrichedAccepted = prospects.filter(p => p.status === 'accepted' && !p.social_verified).length;

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">AI Discovery</p>
          <h1 className="page-title">Prospect Discovery Engine</h1>
          <p className="page-subtitle">AI + Web scanning to find real retailers across South West & South Wales</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${scanning ? 'bg-warning' : 'bg-success'} animate-pulse`} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {scanning ? scanProgress || 'Scanning...' : 'Ready'}
          </span>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Scan Controls */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border/30" />

          <Button onClick={runAIScan} disabled={scanning} className="gold-gradient text-sidebar-background text-xs h-8 px-4">
            {scanning && scanType === 'ai' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Radar className="w-3.5 h-3.5 mr-1.5" />}
            AI Scan (15)
          </Button>

          <Button onClick={runWebScan} disabled={scanning || selectedCounty === "all"} variant="outline" className="text-xs h-8 px-4 border-info/30 text-info hover:bg-info-light">
            {scanning && scanType === 'web' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 mr-1.5" />}
            Web Scan
          </Button>

          <Button onClick={runFullScan} disabled={scanning} variant="outline" className="text-xs h-8 px-4 border-gold/30 text-gold-dark hover:bg-champagne/30">
            {scanning && scanType === 'full' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
            Full Territory Scan
          </Button>
        </div>
        {selectedCounty === "all" && (
          <p className="text-[10px] text-muted-foreground mt-2">Select a county to enable Web Scan (searches real business directories)</p>
        )}
      </div>

      {/* Brand Search */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs font-semibold text-foreground">Find by Brand</span>
          <span className="text-[10px] text-muted-foreground">— Discover retailers stocking a specific brand or similar brands</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="All counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={brandSearch} onValueChange={(v) => { setBrandSearch(v === '__other__' ? '' : v); }}>
            <SelectTrigger className="w-[220px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="Select a brand..." />
            </SelectTrigger>
            <SelectContent>
              {BRAND_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              <SelectItem value="__other__">Other (type below)</SelectItem>
            </SelectContent>
          </Select>
          {(brandSearch === '' || !BRAND_OPTIONS.includes(brandSearch)) && (
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <Input
                placeholder="Type a brand name..."
                value={brandSearch}
                onChange={e => setBrandSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !scanning && runBrandScan()}
                className="pl-9 h-8 text-xs bg-cream/30 border-border/30"
              />
            </div>
          )}
          <Button onClick={() => runBrandScan()} disabled={scanning || brandSearch.trim().length < 2} className="text-xs h-8 px-4 bg-accent text-accent-foreground hover:bg-accent/80">
            {scanning && scanType === 'brand' ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Tag className="w-3.5 h-3.5 mr-1.5" />}
            Brand Scan
          </Button>
        </div>
        {suggestedBrands.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Known brands:</span>
            {suggestedBrands.slice(0, 12).map(b => (
              <button key={b} onClick={() => { setBrandSearch(b); runBrandScan(b); }} disabled={scanning}
                className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/40 text-gold-dark hover:bg-champagne/70 transition-colors border border-gold/10 disabled:opacity-50">
                {b}
              </button>
            ))}
            {suggestedBrands.length > 12 && (
              <span className="text-[10px] text-muted-foreground">+{suggestedBrands.length - 12} more</span>
            )}
          </div>
        )}
      </div>

      {/* Manual Store Search */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-2 mb-2">
          <UserSearch className="w-3.5 h-3.5 text-gold" />
          <span className="text-xs font-semibold text-foreground">Search by Store Name</span>
          <span className="text-[10px] text-muted-foreground">— Type a specific store name to get web-verified results</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Store name (e.g. The Silver Shop of Bath)..."
              value={manualSearchName}
              onChange={e => { setManualSearchName(e.target.value); setManualResult(null); }}
              onKeyDown={e => e.key === 'Enter' && !manualSearching && runManualSearch()}
              className="pl-9 h-8 text-xs bg-cream/30 border-border/30"
            />
          </div>
          <div className="relative min-w-[140px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Town (optional)..."
              value={manualSearchTown}
              onChange={e => setManualSearchTown(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !manualSearching && runManualSearch()}
              className="pl-9 h-8 text-xs bg-cream/30 border-border/30"
            />
          </div>
          <Select value={manualSearchCategory} onValueChange={setManualSearchCategory}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="Store type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Type</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={runManualSearch} disabled={manualSearching || manualSearchName.trim().length < 2} className="gold-gradient text-sidebar-background text-xs h-8 px-5">
            {manualSearching ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1.5" />}
            {manualSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* Manual search result */}
        {manualResult && (
          <div className={`mt-3 p-3 rounded-lg border ${manualResult.found ? 'border-success/30 bg-success-light/30' : 'border-warning/30 bg-warning-light/30'}`}>
            {manualResult.found ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{manualResult.store?.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{manualResult.store?.town}, {manualResult.store?.county}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${manualResult.store?.confidence === 'high' ? 'bg-success-light text-success' : manualResult.store?.confidence === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {manualResult.store?.confidence} confidence
                    </span>
                    {manualResult.alreadyExists && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-info-light text-info">
                        Already in {manualResult.existsAs === 'retailer' ? 'accounts' : 'prospects'}
                      </span>
                    )}
                    {!manualResult.alreadyExists && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success">
                        ✓ Saved to prospects
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{manualResult.store?.ai_reason}</p>
                <div className="flex items-center gap-4 flex-wrap text-[10px] text-muted-foreground">
                  {manualResult.store?.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{manualResult.store.website}</span>}
                  {manualResult.store?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{manualResult.store.phone}</span>}
                  {manualResult.store?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{manualResult.store.email}</span>}
                  {manualResult.store?.instagram && <span>IG: {manualResult.store.instagram}</span>}
                  {manualResult.store?.facebook && <span>FB: {manualResult.store.facebook}</span>}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span>Fit: <strong>{manualResult.store?.predicted_fit_score}</strong>/100</span>
                  <span>Quality: <strong>{manualResult.store?.estimated_store_quality}</strong>/100</span>
                  {manualResult.store?.rating > 0 && <span>★ {manualResult.store?.rating} ({manualResult.store?.review_count} reviews)</span>}
                </div>
                {manualResult.store?.data_sources?.length > 0 && (
                  <div className="text-[9px] text-muted-foreground">
                    Sources: {manualResult.store.data_sources.slice(0, 3).map((s: string, i: number) => (
                      <span key={i}>{i > 0 ? ', ' : ''}<a href={s} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{new URL(s).hostname}</a></span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-warning">{manualResult.message || `Store not found`}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: 'New', value: newCount, color: 'bg-champagne text-gold-dark' },
          { label: 'Reviewing', value: reviewingCount, color: 'bg-info-light text-info' },
          { label: 'Accepted', value: acceptedCount, color: 'bg-success-light text-success' },
          { label: 'Web Verified', value: webCount, color: 'bg-info-light text-info' },
          { label: 'Brand Linked', value: brandCount, color: 'bg-accent/20 text-accent-foreground' },
          { label: 'Total Scanned', value: prospects.length, color: 'bg-muted text-muted-foreground' },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${s.color} inline-block mt-1`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'new', 'reviewing', 'accepted', 'dismissed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${filter === f ? 'bg-card border-gold/30 text-foreground shadow-sm' : 'border-border/20 text-muted-foreground hover:bg-card'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${prospects.length})` : `(${prospects.filter(p => p.status === f).length})`}
          </button>
        ))}

        <Button
          onClick={runBulkEnrich}
          disabled={enriching || unenrichedAccepted === 0}
          variant="outline"
          size="sm"
          className="text-[10px] h-8 px-3 border-gold/30 text-gold-dark hover:bg-champagne/30"
        >
          {enriching ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Enriching {enrichProgress.done}/{enrichProgress.total}...
            </>
          ) : (
            <>
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Enrich All Accepted {unenrichedAccepted > 0 ? `(${unenrichedAccepted})` : ''}
            </>
          )}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
            className={`text-[10px] h-8 px-3 border-border/40 ${showFilters ? 'bg-champagne/30 border-gold/30' : ''}`}>
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            Filters {(filterCounty !== 'all' || filterCategory !== 'all' || filterSource !== 'all' || filterBrandStockist !== 'all' || filterHasWebsite !== 'all' || filterHasContact !== 'all' || Number(filterFitMin) > 0 || Number(filterRatingMin) > 0 || filterNearCurrent) ? '●' : ''}
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-cream/30 border-border/30">
              <ArrowUpDown className="w-3 h-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="fit_high">Fit Score ↓</SelectItem>
              <SelectItem value="fit_low">Fit Score ↑</SelectItem>
              <SelectItem value="rating">Rating ↓</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="quality">Store Quality ↓</SelectItem>
              <SelectItem value="county">County A–Z</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="card-premium p-4 border-gold/15">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">County</label>
              <Select value={filterCounty} onValueChange={setFilterCounty}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Category</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Discovery Source</label>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="ai">AI Scanner</SelectItem>
                  <SelectItem value="web">Web Scanner</SelectItem>
                  <SelectItem value="brand">Brand Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Brand Stockist</label>
              <Select value={filterBrandStockist} onValueChange={setFilterBrandStockist}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Brand</SelectItem>
                  {brandSources.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  {BRAND_OPTIONS.filter(b => !brandSources.includes(b)).slice(0, 15).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Online Presence</label>
              <Select value={filterHasWebsite} onValueChange={setFilterHasWebsite}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Has Website</SelectItem>
                  <SelectItem value="no">No Website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Contact Info</label>
              <Select value={filterHasContact} onValueChange={setFilterHasContact}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="yes">Has Phone or Email</SelectItem>
                  <SelectItem value="email">Has Email</SelectItem>
                  <SelectItem value="phone">Has Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Min Fit Score</label>
              <Select value={filterFitMin} onValueChange={setFilterFitMin}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                  <SelectItem value="60">60+</SelectItem>
                  <SelectItem value="70">70+</SelectItem>
                  <SelectItem value="80">80+</SelectItem>
                  <SelectItem value="90">90+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 block">Min Rating</label>
              <Select value={filterRatingMin} onValueChange={setFilterRatingMin}>
                <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="3">3+ stars</SelectItem>
                  <SelectItem value="3.5">3.5+ stars</SelectItem>
                  <SelectItem value="4">4+ stars</SelectItem>
                  <SelectItem value="4.5">4.5+ stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilterNearCurrent(!filterNearCurrent)}
                className={`h-8 text-xs px-3 rounded-md border transition-all w-full ${filterNearCurrent ? 'bg-champagne/40 border-gold/30 text-gold-dark' : 'border-border/30 text-muted-foreground hover:bg-cream/50'}`}>
                <MapPin className="w-3 h-3 inline mr-1" />
                {filterNearCurrent ? 'Near Current ✓' : 'Near Current Stockists'}
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setFilterCounty('all'); setFilterCategory('all'); setFilterSource('all'); setFilterBrandStockist('all'); setFilterHasWebsite('all'); setFilterHasContact('all'); setFilterFitMin('0'); setFilterRatingMin('0'); setFilterNearCurrent(false); }}
                className="h-8 text-xs px-3 rounded-md border border-border/30 text-muted-foreground hover:bg-cream/50 w-full">
                Clear All Filters
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Showing {filtered.length} of {prospects.length} prospects</p>
        </div>
      )}

      {/* Empty State */}
      {prospects.length === 0 && (
        <div className="card-premium p-12 text-center">
          <Radar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-display font-semibold text-foreground mb-2">No prospects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Run an AI Scan or Full Territory Scan to discover potential retailers</p>
        </div>
      )}

      {/* Prospect Cards */}
      <div className="space-y-4">
        {filtered.map(p => (
          <div key={p.id} onClick={() => navigate(`/prospect/${p.id}`)} className={`card-premium p-6 cursor-pointer hover:shadow-md transition-shadow ${p.status === 'new' ? 'border-gold/20' : p.status === 'dismissed' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <h3 className="text-base font-display font-semibold text-foreground hover:text-gold transition-colors">{p.name}</h3>
                  <span className="badge-category text-[9px]">{p.category.replace('_', ' ')}</span>
                  <ConfidenceBadge score={p.predicted_fit_score ?? 0} />
                  <SourceBadge source={p.discovery_source} />
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="w-3 h-3" strokeWidth={1.5} />{p.town}, {p.county}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-warning" />{p.rating} ({p.review_count})</span>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-info hover:underline">
                      <Globe className="w-3 h-3" />Website
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  {p.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" strokeWidth={1.5} />{p.phone}</span>
                  )}
                  {p.email && (
                    <a href={`mailto:${p.email}`} className="flex items-center gap-1 text-xs text-info hover:underline"><Mail className="w-3 h-3" strokeWidth={1.5} />{p.email}</a>
                  )}
                  {p.address && (
                    <span className="text-xs text-muted-foreground truncate max-w-[300px]">{p.address}</span>
                  )}
                </div>
                {/* Social Media Links */}
                {((p as any).instagram || (p as any).facebook || (p as any).tiktok || (p as any).twitter || (p as any).linkedin) && (
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {(p as any).instagram && <a href={`https://instagram.com/${(p as any).instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/30 text-gold-dark hover:bg-champagne/50 border border-gold/10">📷 {(p as any).instagram}</a>}
                    {(p as any).facebook && <a href={(p as any).facebook.startsWith('http') ? (p as any).facebook : `https://facebook.com/${(p as any).facebook}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-full bg-info-light text-info hover:bg-info-light/70 border border-info/10">Facebook</a>}
                    {(p as any).tiktok && <a href={`https://tiktok.com/@${(p as any).tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground hover:bg-muted/70 border border-border/20">🎵 {(p as any).tiktok}</a>}
                    {(p as any).twitter && <a href={`https://x.com/${(p as any).twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground hover:bg-muted/70 border border-border/20">𝕏 {(p as any).twitter}</a>}
                    {(p as any).linkedin && <a href={(p as any).linkedin.startsWith('http') ? (p as any).linkedin : `https://linkedin.com/company/${(p as any).linkedin}`} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-0.5 rounded-full bg-info-light text-info hover:bg-info-light/70 border border-info/10">LinkedIn</a>}
                    {(p as any).social_verified && <span className="text-[9px] px-2 py-0.5 rounded-full bg-success-light text-success font-medium">✓ Verified</span>}
                  </div>
                )}
                {/* Follower counts & traffic */}
                {((p as any).follower_counts && Object.values((p as any).follower_counts as Record<string, number>).some(v => v > 0)) || (p as any).estimated_monthly_traffic ? (
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    {(p as any).follower_counts && (() => {
                      const fc = (p as any).follower_counts as Record<string, number>;
                      const total = Object.values(fc).reduce((s, v) => s + (v || 0), 0);
                      return total > 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-champagne/30 text-gold-dark border border-gold/10">
                          👥 {total.toLocaleString()} total followers
                        </span>
                      ) : null;
                    })()}
                    {(p as any).estimated_monthly_traffic > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-info-light text-info border border-info/10">
                        🌐 ~{((p as any).estimated_monthly_traffic as number).toLocaleString()}/mo visitors
                      </span>
                    )}
                    {(p as any).google_review_summary && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning-light text-warning border border-warning/10" title={(p as any).google_review_summary}>
                        ⭐ Reviews analysed
                      </span>
                    )}
                    {(p as any).store_images?.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-foreground border border-border/20">
                        📸 {(p as any).store_images.length} images
                      </span>
                    )}
                  </div>
                ) : null}
                {p.ai_reason && (
                  <div className="bg-champagne/15 rounded-lg p-3 border border-gold/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <p className="text-xs text-foreground leading-relaxed italic font-display">{p.ai_reason}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <ScoreBreakdownTooltip prospect={p} />
                <div className="text-[10px] text-muted-foreground capitalize">
                  Est. quality: {p.estimated_store_quality}/100
                </div>
                {p.status === 'new' || p.status === 'reviewing' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'reviewing')} className="text-[10px] h-7 px-2 border-border/40">
                      <Eye className="w-3 h-3 mr-1" /> Review
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'accepted')} className="text-[10px] h-7 px-2 border-success/40 text-success hover:bg-success-light">
                      <CheckCircle className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDismissDialog(p)} className="text-[10px] h-7 px-2 text-muted-foreground/50">
                      <XCircle className="w-3 h-3" />
                    </Button>
                  </div>
                ) : p.status === 'accepted' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success">accepted</span>
                    <Button variant="outline" size="sm" onClick={() => promoteToRetailer(p)} className="text-[10px] h-7 px-2 border-gold/40 text-gold-dark hover:bg-champagne/30">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> Promote to Pipeline
                    </Button>
                  </div>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{p.status}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dismiss Dialog */}
      <Dialog open={dismissDialog.open} onOpenChange={(open) => !open && setDismissDialog({ open: false, prospect: null, reason: 'not_fit', detail: '' })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-display">Dismiss {dismissDialog.prospect?.name}</DialogTitle>
            <DialogDescription className="text-xs">
              Your feedback helps the AI learn what doesn't fit — improving future discovery results.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Reason</label>
              <Select value={dismissDialog.reason} onValueChange={(v) => setDismissDialog(prev => ({ ...prev, reason: v }))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
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
                placeholder="e.g. 'Purely a toy shop, no jewellery or gift accessories' or 'Chain store, not independent'"
                value={dismissDialog.detail}
                onChange={(e) => setDismissDialog(prev => ({ ...prev, detail: e.target.value }))}
                className="text-xs min-h-[60px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDismissDialog({ open: false, prospect: null, reason: 'not_fit', detail: '' })}>
                Cancel
              </Button>
              <Button size="sm" className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDismiss}>
                Dismiss & Log Pattern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
