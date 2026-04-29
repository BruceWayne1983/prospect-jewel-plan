import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, ShieldCheck, ShieldAlert, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseCSV, findColumn, downloadCSV } from "@/utils/csv";

type Row = {
  name: string;
  town?: string;
  county?: string;
  category?: string;
  rawIndex: number;
};

type ResultStatus = "pending" | "running" | "verified" | "not_found" | "error" | "duplicate";

type RunResult = {
  row: Row;
  status: ResultStatus;
  message?: string;
  store?: any;
};

const TEMPLATE_ROWS: (string | number)[][] = [
  ["name", "town", "county", "category"],
  ["The Silver Shop of Bath", "Bath", "Somerset", "jeweller"],
  ["Sample Boutique", "Wells", "Somerset", "fashion_boutique"],
];

export function MyContactsUpload({ onComplete }: { onComplete?: () => void }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const stopRef = useRef<boolean>(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [results, setResults] = useState<RunResult[]>([]);
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [filename, setFilename] = useState<string>("");

  const MAX_ROWS = 2000;
  const WARN_ROWS = 500;

  const reset = () => {
    setRows([]);
    setResults([]);
    setProgress({ done: 0, total: 0 });
    setFilename("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setFilename(file.name);
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      toast.error("File looks empty. Need at least a header row + 1 contact.");
      return;
    }
    const headers = parsed[0];
    const nameIdx = findColumn(headers, ["name", "store name", "business name", "company", "retailer"]);
    if (nameIdx === -1) {
      toast.error("Could not find a 'name' column. Required headers: name (town, county, category optional).");
      return;
    }
    const townIdx = findColumn(headers, ["town", "city", "location"]);
    const countyIdx = findColumn(headers, ["county", "region", "area"]);
    const categoryIdx = findColumn(headers, ["category", "type", "store type"]);

    const parsedRows: Row[] = parsed.slice(1).map((r, i) => ({
      name: (r[nameIdx] ?? "").trim(),
      town: townIdx >= 0 ? (r[townIdx] ?? "").trim() : undefined,
      county: countyIdx >= 0 ? (r[countyIdx] ?? "").trim() : undefined,
      category: categoryIdx >= 0 ? (r[categoryIdx] ?? "").trim() : undefined,
      rawIndex: i + 2,
    })).filter(r => r.name.length >= 2);

    if (parsedRows.length === 0) {
      toast.error("No valid rows with a name found.");
      return;
    }
    if (parsedRows.length > MAX_ROWS) {
      toast.error(`File has ${parsedRows.length} rows — please split into files of ${MAX_ROWS} or fewer and re-upload.`);
      return;
    }
    if (parsedRows.length > WARN_ROWS) {
      const mins = Math.ceil((parsedRows.length * 0.6) / 60);
      const ok = window.confirm(`This file has ${parsedRows.length} contacts. Verification will take roughly ${mins} minute${mins === 1 ? "" : "s"} and will use AI credits. Continue?`);
      if (!ok) return;
    }
    setRows(parsedRows);
    setResults(parsedRows.map(row => ({ row, status: "pending" })));
    toast.success(`Loaded ${parsedRows.length} contacts. Click "Run AI Verification" to start.`);
  };

  const runAll = async () => {
    if (rows.length === 0) return;
    setRunning(true);
    setStopping(false);
    stopRef.current = false;
    setProgress({ done: 0, total: rows.length });

    let stoppedAt = -1;
    for (let i = 0; i < rows.length; i++) {
      if (stopRef.current) { stoppedAt = i; break; }
      const row = rows[i];
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: "running" } : r));

      try {
        const { data, error } = await supabase.functions.invoke("search-store", {
          body: {
            storeName: row.name,
            town: row.town || undefined,
            category: row.category && row.category !== "all" ? row.category : undefined,
            source: "uploaded",
          },
        });
        if (error) throw error;

        if (data?.found && data?.store) {
          const status: ResultStatus = data.alreadyExists ? "duplicate" : "verified";
          const dupMsg = data.existsAs === "retailer"
            ? "Already in current accounts"
            : (data.marked ? "Already discovered — marked as Uploaded" : "Already in prospects");
          setResults(prev => prev.map((r, idx) => idx === i ? {
            ...r,
            status,
            message: data.alreadyExists ? dupMsg : "Saved to prospects (Uploaded)",
            store: data.store,
          } : r));
        } else {
          setResults(prev => prev.map((r, idx) => idx === i ? {
            ...r,
            status: "not_found",
            message: data?.message || "No verified web record found",
          } : r));
        }
      } catch (err: any) {
        setResults(prev => prev.map((r, idx) => idx === i ? {
          ...r,
          status: "error",
          message: err?.message || "Verification failed",
        } : r));
      }

      setProgress({ done: i + 1, total: rows.length });
      // small delay to be polite to the upstream APIs
      await new Promise(r => setTimeout(r, 600));
    }

    setRunning(false);
    setStopping(false);
    onComplete?.();
    if (stoppedAt >= 0) {
      toast.message(`Verification stopped at ${stoppedAt}/${rows.length}.`);
    } else {
      toast.success("Verification finished.");
    }
  };

  const downloadResults = () => {
    const header = ["name", "town", "county", "status", "message", "verified_name", "verified_town", "verified_phone", "verified_email", "verified_website", "fit_score"];
    const data = results.map(r => [
      r.row.name,
      r.row.town ?? "",
      r.row.county ?? "",
      r.status,
      r.message ?? "",
      r.store?.name ?? "",
      r.store?.town ?? "",
      r.store?.phone ?? "",
      r.store?.email ?? "",
      r.store?.website ?? "",
      r.store?.predicted_fit_score ?? "",
    ]);
    downloadCSV(`my-contacts-results-${Date.now()}.csv`, [header, ...data]);
  };

  const downloadTemplate = () => downloadCSV("contacts-template.csv", TEMPLATE_ROWS);

  const stats = {
    verified: results.filter(r => r.status === "verified").length,
    duplicate: results.filter(r => r.status === "duplicate").length,
    notFound: results.filter(r => r.status === "not_found").length,
    error: results.filter(r => r.status === "error").length,
  };

  return (
    <div className="card-premium p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-semibold text-foreground">Upload Your Own Contacts</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Upload a CSV of your existing contacts and Emma's AI will verify each one against the live web — confirming the business exists, pulling phone/email/website, and saving as prospects.
          </p>
        </div>
        <Button onClick={downloadTemplate} variant="outline" size="sm" className="text-[10px] h-7 px-2">
          <Download className="w-3 h-3 mr-1" /> CSV template
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={running}
          variant="outline"
          className="text-xs h-8 px-4 border-gold/30 text-gold-dark hover:bg-champagne/30"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {filename ? `Replace file (${filename})` : "Choose CSV..."}
        </Button>

        {rows.length > 0 && !running && (
          <Button onClick={runAll} className="gold-gradient text-sidebar-background text-xs h-8 px-4">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Run AI Verification ({rows.length})
          </Button>
        )}

        {running && (
          <>
            <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Verifying {progress.done}/{progress.total}...
            </span>
            <Button
              onClick={() => { stopRef.current = true; setStopping(true); }}
              disabled={stopping}
              variant="outline"
              size="sm"
              className="text-[10px] h-7 px-2"
            >
              {stopping ? "Stopping..." : "Stop"}
            </Button>
          </>
        )}

        {results.length > 0 && !running && (
          <>
            <Button onClick={downloadResults} variant="outline" size="sm" className="text-[10px] h-7 px-2">
              <Download className="w-3 h-3 mr-1" /> Download results
            </Button>
            <Button onClick={reset} variant="ghost" size="sm" className="text-[10px] h-7 px-2 text-muted-foreground">
              Clear
            </Button>
          </>
        )}
      </div>

      {results.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-success-light text-success font-medium">{stats.verified} verified</span>
            <span className="px-2 py-0.5 rounded-full bg-info-light text-info font-medium">{stats.duplicate} already on file</span>
            <span className="px-2 py-0.5 rounded-full bg-warning-light text-warning font-medium">{stats.notFound} not found</span>
            {stats.error > 0 && <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">{stats.error} errors</span>}
          </div>

          <div className="max-h-[320px] overflow-y-auto border border-border/30 rounded-md divide-y divide-border/20">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2 text-[11px]">
                <div className="mt-0.5">
                  {r.status === "pending" && <span className="w-3 h-3 rounded-full bg-muted inline-block" />}
                  {r.status === "running" && <Loader2 className="w-3 h-3 animate-spin text-info" />}
                  {r.status === "verified" && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                  {r.status === "duplicate" && <ShieldCheck className="w-3.5 h-3.5 text-info" />}
                  {r.status === "not_found" && <ShieldAlert className="w-3.5 h-3.5 text-warning" />}
                  {r.status === "error" && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">{r.row.name}</span>
                    {r.row.town && <span className="text-muted-foreground">{r.row.town}</span>}
                    {r.store?.predicted_fit_score != null && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-champagne/40 text-gold-dark font-medium">Fit {r.store.predicted_fit_score}</span>
                    )}
                  </div>
                  {r.message && <p className="text-muted-foreground mt-0.5">{r.message}</p>}
                  {r.store && (r.store.phone || r.store.email || r.store.website) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {[r.store.phone, r.store.email, r.store.website].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
