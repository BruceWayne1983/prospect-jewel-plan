import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, CheckCircle, XCircle, Eye, Star, MapPin, Loader2, Radar, ArrowUpRight, Globe, Zap, Tag, Search, Phone, Mail, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type DiscoveredProspect = Database["public"]["Tables"]["discovered_prospects"]["Row"];

const COUNTIES = ["Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Avon", "Cardiff", "Swansea", "Newport", "Vale of Glamorgan", "Bridgend", "Neath Port Talbot", "Carmarthenshire", "Pembrokeshire", "Monmouthshire"];
const CATEGORIES = [
  { value: "jeweller", label: "Jewellers" },
  { value: "gift_shop", label: "Gift Shops" },
  { value: "fashion_boutique", label: "Fashion Boutiques" },
  { value: "lifestyle_store", label: "Lifestyle Stores" },
  { value: "premium_accessories", label: "Premium Accessories" },
  { value: "concept_store", label: "Concept Stores" },
];

const BRAND_OPTIONS = [
  "Pandora", "ChloBo", "Joma Jewellery", "Thomas Sabo", "Swarovski",
  "Daisy London", "Olivia Burton", "Kit Heath", "Annie Haak", "Coeur de Lion",
  "Gecko", "Hot Diamonds", "Fiorelli", "Lola Rose", "Missoma",
  "Monica Vinader", "Astley Clarke", "Clogau", "Carrie Elizabeth", "Tutti & Co",
  "Pilgrim", "Ania Haie", "Orelia", "Estella Bartlett", "Scream Pretty",
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

export default function ProspectDiscovery() {
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

  // Get existing retailer towns for "close to current" filter
  const [existingTowns, setExistingTowns] = useState<string[]>([]);
  const [filterNearCurrent, setFilterNearCurrent] = useState(false);
  useEffect(() => {
    supabase.from("retailers").select("town").then(({ data }) => {
      if (data) setExistingTowns(data.map(r => r.town));
    });
  }, []);

  const filtered = useMemo(() => {
    let result = prospects.filter(p => {
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
  }, [prospects, filter, filterCounty, filterCategory, filterSource, filterBrandStockist, filterHasWebsite, filterHasContact, filterFitMin, filterRatingMin, filterNearCurrent, sortBy, existingTowns]);

  const updateStatus = async (id: string, status: DiscoveredProspect['status']) => {
    const { error } = await supabase.from("discovered_prospects").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const labels: Record<string, string> = { accepted: 'Accepted', dismissed: 'Dismissed', reviewing: 'Marked for review' };
    toast.success(labels[status] || 'Updated');
  };

  const promoteToRetailer = async (p: DiscoveredProspect) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); return; }

    const { error } = await supabase.from("retailers").insert({
      user_id: user.id, name: p.name, town: p.town, county: p.county,
      category: p.category, rating: p.rating, review_count: p.review_count,
      store_positioning: p.estimated_price_positioning, fit_score: p.predicted_fit_score,
      address: p.address, website: p.website, lat: p.lat, lng: p.lng,
      phone: (p as any).phone || null, email: (p as any).email || null,
      pipeline_stage: 'new_lead', ai_notes: p.ai_reason,
    });

    if (error) { toast.error("Failed to promote prospect"); console.error(error); return; }
    await supabase.from("discovered_prospects").delete().eq("id", p.id);
    setProspects(prev => prev.filter(x => x.id !== p.id));
    toast.success(`${p.name} promoted to Pipeline!`);
  };

  const runAIScan = async () => {
    setScanning(true);
    setScanType('ai');
    setScanProgress("Generating prospects...");
    try {
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

  const newCount = prospects.filter(p => p.status === 'new').length;
  const reviewingCount = prospects.filter(p => p.status === 'reviewing').length;
  const acceptedCount = prospects.filter(p => p.status === 'accepted').length;
  const webCount = prospects.filter(p => p.discovery_source === 'Web Scanner').length;
  const brandCount = prospects.filter(p => p.discovery_source?.startsWith('Brand:')).length;

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

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'new', 'reviewing', 'accepted', 'dismissed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all ${filter === f ? 'bg-card border-gold/30 text-foreground shadow-sm' : 'border-border/20 text-muted-foreground hover:bg-card'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${prospects.length})` : `(${prospects.filter(p => p.status === f).length})`}
          </button>
        ))}
      </div>

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
          <div key={p.id} className={`card-premium p-6 ${p.status === 'new' ? 'border-gold/20' : p.status === 'dismissed' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-2">
                  <h3 className="text-base font-display font-semibold text-foreground">{p.name}</h3>
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
                <div className="flex items-center gap-4 mb-3">
                  {(p as any).phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" strokeWidth={1.5} />{(p as any).phone}</span>
                  )}
                  {(p as any).email && (
                    <a href={`mailto:${(p as any).email}`} className="flex items-center gap-1 text-xs text-info hover:underline"><Mail className="w-3 h-3" strokeWidth={1.5} />{(p as any).email}</a>
                  )}
                  {p.address && (
                    <span className="text-xs text-muted-foreground truncate max-w-[300px]">{p.address}</span>
                  )}
                </div>
                {p.ai_reason && (
                  <div className="bg-champagne/15 rounded-lg p-3 border border-gold/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <p className="text-xs text-foreground leading-relaxed italic font-display">{p.ai_reason}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <div className="text-center">
                  <span className={`text-2xl font-display font-bold ${(p.predicted_fit_score ?? 0) >= 80 ? 'score-excellent' : (p.predicted_fit_score ?? 0) >= 70 ? 'score-good' : 'score-moderate'}`}>{p.predicted_fit_score}</span>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Predicted Fit</p>
                </div>
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
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'dismissed')} className="text-[10px] h-7 px-2 text-muted-foreground/50">
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
    </div>
  );
}
