import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Trash2, Loader2, Sparkles, Download, FolderOpen, BarChart3, BookOpen, ShoppingBag, Trophy, Megaphone, File } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "sales_data", label: "Sales Data", icon: BarChart3, color: "text-info" },
  { value: "historical_data", label: "Historical Data", icon: BookOpen, color: "text-muted-foreground" },
  { value: "current_accounts", label: "Current Accounts", icon: ShoppingBag, color: "text-success" },
  { value: "performance", label: "Sales Performance", icon: Trophy, color: "text-warning" },
  { value: "promotions", label: "Promotions", icon: Megaphone, color: "text-gold" },
  { value: "brand_guidelines", label: "Brand Guidelines", icon: FileText, color: "text-primary" },
  { value: "other", label: "Other", icon: File, color: "text-muted-foreground" },
];

type UploadedFile = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  category: string;
  description: string | null;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function CategoryIcon({ category }: { category: string }) {
  const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[6];
  const Icon = cat.icon;
  return <Icon className={`w-4 h-4 ${cat.color}`} strokeWidth={1.5} />;
}

export default function DataHub() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("sales_data");
  const [description, setDescription] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("uploaded_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
      toast.error("Failed to load files");
    } else {
      setFiles((data as UploadedFile[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in"); return; }

    setUploading(true);
    let uploaded = 0;

    for (const file of Array.from(selectedFiles)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 20MB)`);
        continue;
      }

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("data-hub")
        .upload(filePath, file);

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { error: insertErr } = await supabase.from("uploaded_files").insert({
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        category: selectedCategory,
        description: description || null,
      });

      if (insertErr) {
        console.error("Insert error:", insertErr);
        toast.error(`Failed to save ${file.name} metadata`);
        continue;
      }

      uploaded++;
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} file(s) uploaded!`);
      setDescription("");
      await fetchFiles();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteFile = async (file: UploadedFile) => {
    const { error: storageErr } = await supabase.storage.from("data-hub").remove([file.file_path]);
    if (storageErr) { toast.error("Failed to delete file"); return; }

    await supabase.from("uploaded_files").delete().eq("id", file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
    toast.success("File deleted");
  };

  const downloadFile = async (file: UploadedFile) => {
    const { data, error } = await supabase.storage.from("data-hub").download(file.file_path);
    if (error || !data) { toast.error("Download failed"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const analyseFile = async (fileId: string) => {
    setAnalysing(fileId);
    try {
      const { data, error } = await supabase.functions.invoke("analyse-file", {
        body: { fileId },
      });
      if (error) throw error;
      if (data?.success) {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, ai_summary: data.summary } : f));
        setExpandedFile(fileId);
        toast.success("Analysis complete!");
      } else {
        toast.error(data?.error || "Analysis failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setAnalysing(null);
    }
  };

  const filtered = filterCat === "all" ? files : files.filter(f => f.category === filterCat);

  const catCounts = CATEGORIES.map(c => ({
    ...c,
    count: files.filter(f => f.category === c.value).length,
  }));

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
          <p className="section-header mb-2">Resources</p>
          <h1 className="page-title">Data Hub</h1>
          <p className="page-subtitle">Upload sales data, brand guidelines, performance reports and more</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-foreground">{files.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Files Uploaded</p>
        </div>
      </div>
      <div className="divider-gold" />

      {/* Upload Section */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Upload className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">Upload Files</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="section-header text-[9px] mb-1 block">Category</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-8 text-xs bg-cream/30 border-border/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="section-header text-[9px] mb-1 block">Description (optional)</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Q1 2026 South West sales figures..."
              className="text-xs min-h-[32px] h-8 bg-cream/30 border-border/30 py-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleUpload}
            className="hidden"
            accept=".csv,.xlsx,.xls,.json,.txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.md"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gold-gradient text-sidebar-background text-xs"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
            {uploading ? "Uploading..." : "Choose Files"}
          </Button>
          <span className="text-[10px] text-muted-foreground">CSV, Excel, PDF, Word, images, text — max 20MB each</span>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-7 gap-3">
        {catCounts.map(c => (
          <button
            key={c.value}
            onClick={() => setFilterCat(filterCat === c.value ? "all" : c.value)}
            className={`stat-card text-center cursor-pointer transition-all ${filterCat === c.value ? 'border-gold/30 shadow-sm' : ''}`}
          >
            <c.icon className={`w-5 h-5 ${c.color} mx-auto mb-1`} strokeWidth={1.5} />
            <p className="text-lg font-display font-bold text-foreground">{c.count}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
          </button>
        ))}
      </div>

      {/* File List */}
      {filtered.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-base font-display font-semibold text-foreground mb-2">
            {files.length === 0 ? "No files uploaded yet" : "No files in this category"}
          </h3>
          <p className="text-sm text-muted-foreground">Upload sales data, brand guidelines, or performance reports above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(file => (
            <div key={file.id} className="card-premium p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CategoryIcon category={file.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{file.file_name}</p>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                        {CATEGORIES.find(c => c.value === file.category)?.label || file.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{formatBytes(file.file_size)}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(file.created_at).toLocaleDateString()}</span>
                      {file.description && <span className="text-[10px] text-muted-foreground italic truncate">{file.description}</span>}
                      {file.ai_summary && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-champagne text-gold-dark flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Analysed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyseFile(file.id)}
                    disabled={analysing === file.id}
                    className="text-[10px] h-7 px-2 border-gold/30 text-gold-dark hover:bg-champagne/30"
                  >
                    {analysing === file.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    {file.ai_summary ? "Re-analyse" : "Analyse"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadFile(file)} className="text-[10px] h-7 px-2 border-border/40">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteFile(file)} className="text-[10px] h-7 px-2 text-muted-foreground/50 hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* AI Summary expandable */}
              {file.ai_summary && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedFile(expandedFile === file.id ? null : file.id)}
                    className="text-[10px] text-gold-dark hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {expandedFile === file.id ? "Hide analysis" : "View analysis"}
                  </button>
                  {expandedFile === file.id && (
                    <div className="mt-2 bg-champagne/10 rounded-lg p-4 border border-gold/10">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{file.ai_summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
