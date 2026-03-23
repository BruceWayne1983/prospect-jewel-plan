import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2, MapPin, Store, ShoppingBag, TreePine, Building2, Search,
  Sparkles, Users, Gem, Gift, Shirt, ExternalLink, ChevronDown, ChevronUp, Globe, Radar
} from "lucide-react";

const COUNTIES = ["Somerset", "Devon", "Cornwall", "Dorset", "Wiltshire", "Gloucestershire", "Avon", "Cardiff", "Swansea", "Newport", "Vale of Glamorgan", "Bridgend", "Neath Port Talbot", "Carmarthenshire", "Pembrokeshire", "Monmouthshire"];

const LOCATION_TYPES = [
  { value: "all", label: "All Types", icon: MapPin },
  { value: "retail_park", label: "Retail Parks", icon: Store },
  { value: "shopping_centre", label: "Shopping Centres", icon: ShoppingBag },
  { value: "high_street", label: "High Streets", icon: Building2 },
  { value: "garden_centre", label: "Garden Centres", icon: TreePine },
];

const TYPE_LABELS: Record<string, { label: string; color: string; icon: typeof MapPin }> = {
  retail_park: { label: "Retail Park", color: "bg-info-light text-info", icon: Store },
  shopping_centre: { label: "Shopping Centre", color: "bg-champagne text-gold-dark", icon: ShoppingBag },
  high_street: { label: "High Street", color: "bg-success-light text-success", icon: Building2 },
  garden_centre: { label: "Garden Centre", color: "bg-accent/20 text-accent-foreground", icon: TreePine },
};

interface RetailLocation {
  id: string;
  name: string;
  location_type: string;
  town: string;
  county: string;
  address: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  footfall_estimate: string | null;
  tenant_count: number | null;
  key_tenants: string[] | null;
  has_jewellery_stores: boolean | null;
  has_gift_stores: boolean | null;
  has_fashion_boutiques: boolean | null;
  opportunity_notes: string | null;
  ai_summary: string | null;
  website: string | null;
  discovery_source: string | null;
  created_at: string;
}

function LocationCard({ loc }: { loc: RetailLocation }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_LABELS[loc.location_type] || TYPE_LABELS.shopping_centre;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-5 h-5 text-gold" strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{loc.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />{loc.town}, {loc.county}
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {loc.website && (
            <a href={loc.website.startsWith("http") ? loc.website : `https://${loc.website}`} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center gap-3 flex-wrap">
        {loc.footfall_estimate && (
          <span className="text-[10px] px-2 py-1 rounded bg-muted flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            {loc.footfall_estimate}
          </span>
        )}
        {loc.tenant_count && (
          <span className="text-[10px] px-2 py-1 rounded bg-muted flex items-center gap-1">
            <Store className="w-3 h-3 text-muted-foreground" />
            {loc.tenant_count} units
          </span>
        )}
        {loc.has_jewellery_stores && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark font-medium flex items-center gap-1">
            <Gem className="w-3 h-3" /> Jewellery
          </span>
        )}
        {loc.has_gift_stores && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-success-light text-success font-medium flex items-center gap-1">
            <Gift className="w-3 h-3" /> Gifts
          </span>
        )}
        {loc.has_fashion_boutiques && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-info-light text-info font-medium flex items-center gap-1">
            <Shirt className="w-3 h-3" /> Fashion
          </span>
        )}
      </div>

      {/* Opportunity notes */}
      {loc.opportunity_notes && (
        <div className="bg-cream/40 rounded-lg p-3 border border-gold/10">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider">Opportunity</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{loc.opportunity_notes}</p>
        </div>
      )}

      {/* Key tenants */}
      {loc.key_tenants && loc.key_tenants.length > 0 && (
        <div>
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground font-medium">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Key Tenants ({loc.key_tenants.length})
          </button>
          {expanded && (
            <div className="flex flex-wrap gap-1 mt-2">
              {loc.key_tenants.map((t, i) => (
                <Badge key={i} variant="secondary" className="text-[9px] bg-muted/60 text-muted-foreground">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50">
        {loc.discovery_source && <span>Source: {loc.discovery_source}</span>}
        {loc.postcode && <span>· {loc.postcode}</span>}
      </div>
    </div>
  );
}

export default function RetailLocations() {
  const [locations, setLocations] = useState<RetailLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanCounty, setScanCounty] = useState<string>("all");
  const [scanType, setScanType] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCounty, setFilterCounty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scanProgress, setScanProgress] = useState("");

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from("retail_locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Failed to load locations"); }
    setLocations((data as any as RetailLocation[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLocations(); }, []);

  const runScan = async (type?: string) => {
    const targetType = type || (scanType === "all" ? undefined : scanType);
    if (scanCounty === "all") {
      toast.error("Please select a county to scan");
      return;
    }
    setScanning(true);
    const typeLabel = targetType ? LOCATION_TYPES.find(t => t.value === targetType)?.label || targetType : "all locations";
    setScanProgress(`Discovering ${typeLabel} in ${scanCounty}...`);
    try {
      const { data, error } = await supabase.functions.invoke("discover-locations", {
        body: { county: scanCounty, locationType: targetType },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Found ${data.count} locations in ${scanCounty}!`);
        await fetchLocations();
      } else {
        toast.error(data?.error || "Scan failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Scan failed");
    } finally {
      setScanning(false);
      setScanProgress("");
    }
  };

  const runFullTerritoryScan = async () => {
    setScanning(true);
    let totalFound = 0;
    for (const county of COUNTIES) {
      setScanProgress(`Scanning ${county}...`);
      try {
        const { data } = await supabase.functions.invoke("discover-locations", {
          body: { county },
        });
        if (data?.success) totalFound += data.count || 0;
      } catch (e) {
        console.error(`Error scanning ${county}:`, e);
      }
    }
    toast.success(`Full scan complete! Found ${totalFound} locations`);
    await fetchLocations();
    setScanning(false);
    setScanProgress("");
  };

  const filtered = locations.filter(loc => {
    if (filterType !== "all" && loc.location_type !== filterType) return false;
    if (filterCounty !== "all" && loc.county !== filterCounty) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return loc.name.toLowerCase().includes(q) ||
        loc.town.toLowerCase().includes(q) ||
        loc.key_tenants?.some(t => t.toLowerCase().includes(q)) ||
        loc.opportunity_notes?.toLowerCase().includes(q);
    }
    return true;
  });

  const typeCounts = LOCATION_TYPES.slice(1).map(t => ({
    ...t,
    count: locations.filter(l => l.location_type === t.value).length,
  }));
  const jewelleryCount = locations.filter(l => l.has_jewellery_stores).length;
  const giftCount = locations.filter(l => l.has_gift_stores).length;
  const uniqueCounties = new Set(locations.map(l => l.county)).size;

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
          <p className="section-header mb-2">Location Intelligence</p>
          <h1 className="page-title">Retail Locations & Footfall</h1>
          <p className="page-subtitle">Discover retail parks, shopping centres, high streets & garden centres across your territory</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${scanning ? 'bg-warning' : 'bg-success'} animate-pulse`} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {scanning ? scanProgress || "Scanning..." : "Ready"}
          </span>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-foreground">{locations.length}</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-champagne text-gold-dark inline-block mt-1">Total Locations</span>
        </div>
        {typeCounts.map(tc => (
          <div key={tc.value} className="stat-card text-center">
            <p className="text-2xl font-display font-bold text-foreground">{tc.count}</p>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground inline-block mt-1">{tc.label}</span>
          </div>
        ))}
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-foreground">{uniqueCounties}</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success inline-block mt-1">Counties Covered</span>
        </div>
      </div>

      {/* Scan Controls */}
      <div className="card-premium p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={scanCounty} onValueChange={setScanCounty}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="Select County" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Select County...</SelectItem>
              {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={scanType} onValueChange={setScanType}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border/30" />

          <Button onClick={() => runScan()} disabled={scanning || scanCounty === "all"} className="gold-gradient text-sidebar-background text-xs h-8 px-4">
            {scanning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Radar className="w-3.5 h-3.5 mr-1.5" />}
            Scan County
          </Button>

          <Button onClick={runFullTerritoryScan} disabled={scanning} variant="outline" className="text-xs h-8 px-4 border-gold/30 text-gold-dark hover:bg-champagne/30">
            {scanning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 mr-1.5" />}
            Full Territory Scan
          </Button>
        </div>
        {scanCounty === "all" && (
          <p className="text-[10px] text-muted-foreground mt-2">Select a county to discover retail locations, or run a full territory scan</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {LOCATION_TYPES.map(t => (
          <button key={t.value} onClick={() => setFilterType(t.value)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all flex items-center gap-1.5 ${filterType === t.value ? 'bg-card border-gold/30 text-foreground shadow-sm' : 'border-border/20 text-muted-foreground hover:bg-card'}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label} {t.value === "all" ? `(${locations.length})` : `(${locations.filter(l => l.location_type === t.value).length})`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <Select value={filterCounty} onValueChange={setFilterCounty}>
            <SelectTrigger className="w-[160px] h-8 text-xs bg-cream/30 border-border/30">
              <SelectValue placeholder="All Counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Search locations, tenants..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-xs bg-cream/30 border-border/30"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">
            {locations.length === 0 ? "No locations discovered yet" : "No locations match your filters"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Select a county and click "Scan County" to discover retail parks, shopping centres, and high streets
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(loc => (
            <LocationCard key={loc.id} loc={loc} />
          ))}
        </div>
      )}
    </div>
  );
}
