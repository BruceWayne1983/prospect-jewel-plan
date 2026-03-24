import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Upload, Loader2, Trash2, FileText, Image as ImageIcon, BookOpen, Palette, Sparkles,
  Tag, Eye, Download, Search, FolderOpen, Package, ChevronDown, ChevronUp, Star, ShoppingBag, ScrollText
} from "lucide-react";
import BrandGuidelinesReview from "@/components/brand/BrandGuidelinesReview";
import NewComposableBaseGuide from "@/components/brand/NewComposableBaseGuide";
import RetailerPoliciesGuide from "@/components/brand/RetailerPoliciesGuide";
import StaffTrainingGuide from "@/components/brand/StaffTrainingGuide";
import MarketingPromotionsGuide from "@/components/brand/MarketingPromotionsGuide";

const CATEGORIES = [
  { value: "imagery", label: "Imagery & Photography", icon: ImageIcon },
  { value: "catalogue", label: "Catalogues & Lookbooks", icon: BookOpen },
  { value: "guidelines", label: "Brand Guidelines", icon: Palette },
  { value: "price_list", label: "Price Lists", icon: Tag },
  { value: "marketing", label: "Marketing Materials", icon: Star },
  { value: "product_sheets", label: "Product Sheets", icon: Package },
  { value: "presentations", label: "Presentations", icon: FileText },
  { value: "general", label: "General", icon: FolderOpen },
];

interface BrandAsset {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  category: string;
  description: string | null;
  ai_summary: string | null;
  ai_extracted_data: Record<string, any> | null;
  tags: string[] | null;
  created_at: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AssetCard({ asset, onDelete, onAnalyse, analysing }: {
  asset: BrandAsset;
  onDelete: (a: BrandAsset) => void;
  onAnalyse: (a: BrandAsset) => void;
  analysing: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const isImage = asset.file_type?.startsWith("image/");
  const extracted = asset.ai_extracted_data as Record<string, any> | null;
  const catIcon = CATEGORIES.find(c => c.value === asset.category);
  const CatIcon = catIcon?.icon || FolderOpen;

  const getDownloadUrl = async () => {
    const { data } = await supabase.storage.from("brand-assets").createSignedUrl(asset.file_path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center flex-shrink-0">
            {isImage ? <ImageIcon className="w-5 h-5 text-gold" strokeWidth={1.5} /> : <CatIcon className="w-5 h-5 text-gold" strokeWidth={1.5} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{asset.file_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{formatFileSize(asset.file_size)}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-champagne/40 text-gold-dark font-medium">{catIcon?.label || asset.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={getDownloadUrl}>
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => onAnalyse(asset)}
            disabled={analysing === asset.id}
          >
            {analysing === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" /> : <Sparkles className="w-3.5 h-3.5 text-gold" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(asset)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive/60 hover:text-destructive" />
          </Button>
        </div>
      </div>

      {asset.ai_summary && (
        <div className="bg-cream/40 rounded-lg p-3 border border-gold/10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3 h-3 text-gold" />
            <span className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider">AI Analysis</span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{asset.ai_summary}</p>

          {extracted && (
            <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 mt-2 text-[10px] text-gold-dark hover:text-gold font-medium">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Hide details" : "Show extracted intelligence"}
            </button>
          )}

          {expanded && extracted && (
            <div className="mt-3 space-y-3 border-t border-gold/10 pt-3">
              {extracted.selling_points?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Selling Points</p>
                  <ul className="space-y-1">
                    {(extracted.selling_points as string[]).map((sp, i) => (
                      <li key={i} className="text-[11px] text-foreground/70 flex items-start gap-1.5">
                        <ShoppingBag className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                        {sp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {extracted.brand_values?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Brand Values</p>
                  <div className="flex flex-wrap gap-1">
                    {(extracted.brand_values as string[]).map((v, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px] bg-champagne/30 text-gold-dark border-gold/10">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {extracted.key_products?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Key Products</p>
                  <div className="space-y-1">
                    {(extracted.key_products as any[]).map((p, i) => (
                      <div key={i} className="text-[11px] text-foreground/70">
                        <span className="font-medium">{p.name}</span>
                        {p.collection && <span className="text-muted-foreground"> · {p.collection}</span>}
                        {p.price_range && <span className="text-gold-dark"> · {p.price_range}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extracted.price_positioning && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Price Positioning</p>
                  <p className="text-[11px] text-foreground/70">{extracted.price_positioning}</p>
                </div>
              )}

              {extracted.retailer_pitch_notes && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Retailer Pitch Notes</p>
                  <p className="text-[11px] text-foreground/70">{extracted.retailer_pitch_notes}</p>
                </div>
              )}

              {extracted.target_audience && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Target Audience</p>
                  <p className="text-[11px] text-foreground/70">{extracted.target_audience}</p>
                </div>
              )}

              {extracted.seasonal_relevance && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-1">Seasonal Relevance</p>
                  <p className="text-[11px] text-foreground/70">{extracted.seasonal_relevance}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {asset.tags && asset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((t, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrandHub() {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [mainTab, setMainTab] = useState("assets");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("brand_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error(error); toast.error("Failed to load brand assets"); }
    setAssets((data as any as BrandAsset[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in"); return; }

      let uploadCount = 0;
      for (const file of Array.from(files)) {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 20MB limit`);
          continue;
        }
        const ext = file.name.split(".").pop() || "bin";
        const storagePath = `${user.id}/${uploadCategory}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from("brand-assets").upload(storagePath, file);
        if (uploadErr) { toast.error(`Failed to upload ${file.name}`); continue; }

        const { error: insertErr } = await supabase.from("brand_assets").insert({
          user_id: user.id,
          file_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          file_type: file.type,
          category: uploadCategory,
        } as any);
        if (insertErr) { console.error(insertErr); continue; }
        uploadCount++;
      }
      if (uploadCount > 0) {
        toast.success(`${uploadCount} file${uploadCount > 1 ? "s" : ""} uploaded`);
        await fetchAssets();
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (asset: BrandAsset) => {
    await supabase.storage.from("brand-assets").remove([asset.file_path]);
    await supabase.from("brand_assets").delete().eq("id", asset.id);
    setAssets(prev => prev.filter(a => a.id !== asset.id));
    toast.success("Asset deleted");
  };

  const handleAnalyse = async (asset: BrandAsset) => {
    setAnalysing(asset.id);
    try {
      const { data, error } = await supabase.functions.invoke("analyse-brand-asset", {
        body: { assetId: asset.id, fileName: asset.file_name, category: asset.category, fileType: asset.file_type },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("AI analysis complete");
        await fetchAssets();
      } else {
        toast.error(data?.error || "Analysis failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalysing(null);
    }
  };

  const filteredAssets = assets.filter(a => {
    if (activeTab !== "all" && a.category !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.file_name.toLowerCase().includes(q) ||
        a.ai_summary?.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const categoryCounts = CATEGORIES.map(c => ({
    ...c,
    count: assets.filter(a => a.category === c.value).length,
  }));
  const analysedCount = assets.filter(a => a.ai_summary).length;

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
          <p className="section-header mb-2">Brand Intelligence</p>
          <h1 className="page-title">Nomination Brand Hub</h1>
          <p className="page-subtitle">Upload brand assets, catalogues & guidelines — AI extracts intelligence to power your sales engines</p>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-foreground">{assets.length}</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-champagne text-gold-dark inline-block mt-1">Total Assets</span>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-foreground">{analysedCount}</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-success-light text-success inline-block mt-1">AI Analysed</span>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-foreground">{assets.length - analysedCount}</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-warning-light text-warning inline-block mt-1">Pending Analysis</span>
        </div>
        <div className="stat-card text-center">
          <p className="text-2xl font-display font-bold text-foreground">{categoryCounts.filter(c => c.count > 0).length}</p>
          <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground inline-block mt-1">Categories Used</span>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="bg-card border border-border/20 p-1 h-auto">
          <TabsTrigger value="assets" className="text-xs px-4 py-2 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            Brand Assets
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="text-xs px-4 py-2 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark gap-1.5">
            <ScrollText className="w-3.5 h-3.5" />
            Brand Guidelines & Scoring
          </TabsTrigger>
          <TabsTrigger value="composable" className="text-xs px-4 py-2 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            New Composable™ Base
          </TabsTrigger>
          <TabsTrigger value="policies" className="text-xs px-4 py-2 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Retailer Policies
          </TabsTrigger>
          <TabsTrigger value="training" className="text-xs px-4 py-2 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark gap-1.5">
            <Star className="w-3.5 h-3.5" />
            Staff Training
          </TabsTrigger>
          <TabsTrigger value="marketing" className="text-xs px-4 py-2 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Marketing & POS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4 space-y-4">
          {/* Upload Controls */}
          <div className="card-premium p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-[220px] h-8 text-xs bg-cream/30 border-border/30">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <c.icon className="w-3.5 h-3.5" />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.docx,.xlsx,.pptx,.doc,.xls,.ppt,.csv,.txt"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gold-gradient text-sidebar-background text-xs h-8 px-4"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                {uploading ? "Uploading..." : "Upload Files"}
              </Button>

              <div className="h-6 w-px bg-border/30" />

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                <Input
                  placeholder="Search assets, tags, AI summaries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-xs bg-cream/30 border-border/30"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs + Assets */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card border border-border/20 p-1 h-auto flex-wrap">
              <TabsTrigger value="all" className="text-[11px] px-3 py-1.5 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
                All ({assets.length})
              </TabsTrigger>
              {categoryCounts.filter(c => c.count > 0).map(c => (
                <TabsTrigger key={c.value} value={c.value} className="text-[11px] px-3 py-1.5 data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
                  {c.label} ({c.count})
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {filteredAssets.length === 0 ? (
                <div className="card-premium p-12 text-center">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {searchQuery ? "No assets match your search" : "No assets uploaded yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Upload catalogues, imagery, price lists and brand guidelines to power the AI engines
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAssets.map(asset => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDelete={handleDelete}
                      onAnalyse={handleAnalyse}
                      analysing={analysing}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="guidelines" className="mt-4">
          <BrandGuidelinesReview />
        </TabsContent>

        <TabsContent value="composable" className="mt-4">
          <NewComposableBaseGuide />
        </TabsContent>

        <TabsContent value="policies" className="mt-4">
          <RetailerPoliciesGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}
