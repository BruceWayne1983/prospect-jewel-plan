import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Upload, FileText, Loader2, Sparkles, Trash2, Tag, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const REPORT_TYPES = [
  { value: "ord015", label: "ORD015 — Order Comparison", desc: "Shows orders placed. This is your REAL performance.", icon: "📊" },
  { value: "fat017", label: "FAT017 — Monthly Billing", desc: "Shows invoiced sales. Lags behind orders.", icon: "💷" },
  { value: "fat012", label: "FAT012 — Product Breakdown", desc: "Shows what products each account bought.", icon: "📦" },
  { value: "fat013", label: "FAT013 — YTD vs Full Year", desc: "⚠️ Compares 3 months vs 12 months. Use with caution.", icon: "⚠️" },
  { value: "brioso_summary", label: "Brioso Summary", desc: "Monthly workbook from Jude with back orders and annual data.", icon: "📋" },
  { value: "other", label: "Other", desc: "Any other report type.", icon: "📄" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  uploaded: { label: "Uploaded", color: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
  processing: { label: "Translating...", color: "bg-primary/20 text-primary", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  analysed: { label: "Analysed", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  error: { label: "Error", color: "bg-destructive/20 text-destructive", icon: <AlertTriangle className="h-3 w-3" /> },
};

export default function MyReports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState("");
  const [reportDate, setReportDate] = useState<Date>();
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["sales-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analyseMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase.functions.invoke("analyse-report", {
        body: { reportId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-reports"] });
      toast({ title: "Report translated!", description: "Your plain English summary is ready." });
    },
    onError: (err: any) => {
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (report: any) => {
      await supabase.storage.from("data-hub").remove([report.file_path]);
      const { error } = await supabase.from("sales_reports").delete().eq("id", report.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-reports"] });
      toast({ title: "Report deleted" });
    },
  });

  const handleUpload = async () => {
    if (!file || !reportType) {
      toast({ title: "Missing fields", description: "Please select a report type and file.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/reports/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("data-hub").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: report, error: insertError } = await supabase.from("sales_reports").insert({
        user_id: user.id,
        report_type: reportType,
        report_date: reportDate ? format(reportDate, "yyyy-MM-dd") : null,
        period_start: periodStart ? format(periodStart, "yyyy-MM-dd") : null,
        period_end: periodEnd ? format(periodEnd, "yyyy-MM-dd") : null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type || null,
        status: "uploaded",
      }).select().single();
      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["sales-reports"] });
      toast({ title: "Report uploaded!", description: "Starting translation..." });

      // Reset form
      setFile(null);
      setReportType("");
      setReportDate(undefined);
      setPeriodStart(undefined);
      setPeriodEnd(undefined);

      // Auto-analyse
      analyseMutation.mutate(report.id);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const selectedType = REPORT_TYPES.find(t => t.value === reportType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Reports</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload your sales reports and I'll translate them into plain English for you.</p>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Report</TabsTrigger>
          <TabsTrigger value="history">Report History ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Report Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. What type of report is this?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {REPORT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-all",
                      reportType === type.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{type.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{type.label.split(" — ")[0]}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{type.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {reportType === "fat013" && (
                <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800">This report compares your 3 months against a full year. The percentages are not meaningful. I'll extract the useful numbers but flag the misleading comparisons.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. When is this report from?</CardTitle>
              <CardDescription className="text-xs">The date on the report, and the period it covers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DatePicker label="Report date" date={reportDate} onSelect={setReportDate} placeholder="Date on the report" />
                <DatePicker label="Period from" date={periodStart} onSelect={setPeriodStart} placeholder="Start of period" />
                <DatePicker label="Period to" date={periodEnd} onSelect={setPeriodEnd} placeholder="End of period" />
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">3. Upload your report</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                  file && "border-primary/50 bg-primary/5"
                )}
                onClick={() => document.getElementById("report-file-input")?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setFile(null); }}>Change</Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Drop your PDF or Excel file here, or tap to browse</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PDF, XLSX, XLS supported</p>
                  </div>
                )}
                <input
                  id="report-file-input"
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button
                className="w-full mt-4"
                size="lg"
                disabled={!file || !reportType || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Upload & Translate</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Upload your first report to get started.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">I'll translate it into plain English for you.</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((report: any) => {
              const typeInfo = REPORT_TYPES.find(t => t.value === report.report_type);
              const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.uploaded;
              return (
                <Card key={report.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl mt-0.5">{typeInfo?.icon || "📄"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{report.file_name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{typeInfo?.label.split(" — ")[0] || report.report_type}</Badge>
                            {report.report_date && (
                              <span className="text-[10px] text-muted-foreground">Report: {format(new Date(report.report_date), "d MMM yyyy")}</span>
                            )}
                            {report.period_start && report.period_end && (
                              <span className="text-[10px] text-muted-foreground">
                                Period: {format(new Date(report.period_start), "MMM yyyy")} — {format(new Date(report.period_end), "MMM yyyy")}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", status.color)}>
                              {status.icon}{status.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">Uploaded {format(new Date(report.created_at), "d MMM yyyy 'at' HH:mm")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {report.status === "uploaded" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyseMutation.mutate(report.id)}
                            disabled={analyseMutation.isPending}
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />Translate
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(report)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* AI Summary */}
                    {report.ai_summary && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">What this report actually says</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.ai_summary}</p>
                      </div>
                    )}

                    {/* Territory totals */}
                    {(report.territory_total_cy || report.territory_total_py1) && (
                      <div className="mt-2 flex items-center gap-4">
                        {report.territory_total_cy && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">This year: </span>
                            <span className="font-semibold text-foreground">£{Number(report.territory_total_cy).toLocaleString()}</span>
                          </div>
                        )}
                        {report.territory_total_py1 && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Same period last year: </span>
                            <span className="font-semibold text-foreground">£{Number(report.territory_total_py1).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DatePicker({ label, date, onSelect, placeholder }: { label: string; date?: Date; onSelect: (d?: Date) => void; placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal text-sm", !date && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {date ? format(date, "d MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={(d) => onSelect(d || undefined)} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}
