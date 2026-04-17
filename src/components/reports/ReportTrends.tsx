import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import { TrendingUp, TrendingDown, Minus, GitCompare, Clock, BarChart3, Users, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { normaliseAccountName } from "@/utils/accountNames";

interface ReportRecord {
  id: string;
  report_type: string;
  report_date: string | null;
  period_start: string | null;
  period_end: string | null;
  territory_total_cy: number | null;
  territory_total_py1: number | null;
  ai_summary: string | null;
  parsed_data: any;
  status: string;
  created_at: string;
  file_name: string;
}

interface ReportTrendsProps {
  reports: ReportRecord[];
}

const TYPE_COLORS: Record<string, string> = {
  ord015: "#3b82f6",
  fat017: "#10b981",
  fat012: "#f59e0b",
  fat013: "#ef4444",
  brioso_summary: "#8b5cf6",
  other: "#6b7280",
};

const TYPE_LABELS: Record<string, string> = {
  ord015: "ORD015 — Orders",
  fat017: "FAT017 — Billing",
  fat012: "FAT012 — Products",
  fat013: "FAT013 — YTD vs Full Year",
  brioso_summary: "Brioso Summary",
  other: "Other",
};

function formatCurrency(v: number): string {
  if (Math.abs(v) >= 1000000) return `£${(v / 1000000).toFixed(2)}m`;
  if (Math.abs(v) >= 1000) return `£${(v / 1000).toFixed(0)}k`;
  return `£${v.toLocaleString()}`;
}

function formatFullCurrency(v: number): string {
  return `£${Math.round(v).toLocaleString()}`;
}

function getReportDate(r: ReportRecord): string | null {
  return r.report_date || r.period_end || null;
}

function getReportDateObj(r: ReportRecord): Date | null {
  const d = getReportDate(r);
  if (!d) return null;
  try { return parseISO(d); } catch { return null; }
}

export default function ReportTrends({ reports }: ReportTrendsProps) {
  const analysedReports = reports.filter(r => r.status === "analysed" && (r.territory_total_cy || r.parsed_data));

  if (analysedReports.length < 2) {
    const message = analysedReports.length === 0
      ? "Upload your first report to start seeing insights"
      : `Upload one more report to see trends over time — you've got ${analysedReports.length} analysed`;
    const sub = analysedReports.length === 0
      ? "I'll translate it into plain English and start building your trend view."
      : "Trends compare reports against each other, so we need at least two.";
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TimelineView reports={analysedReports} />
      <ReconciliationView reports={analysedReports} />
      <TerritoryTrendChart reports={analysedReports} />
      <AccountTrajectory reports={analysedReports} />
    </div>
  );
}

/* ─── Timeline ─── */
function TimelineView({ reports }: { reports: ReportRecord[] }) {
  const sorted = useMemo(() =>
    [...reports]
      .map(r => ({ ...r, _date: getReportDateObj(r) }))
      .filter(r => r._date)
      .sort((a, b) => a._date!.getTime() - b._date!.getTime()),
    [reports]
  );

  // Detect gaps — expected monthly reports
  const gaps = useMemo(() => {
    const gapList: string[] = [];
    const fatReports = sorted.filter(r => r.report_type.startsWith("fat"));
    for (let i = 1; i < fatReports.length; i++) {
      const prev = fatReports[i - 1]._date!;
      const curr = fatReports[i]._date!;
      const dayDiff = differenceInDays(curr, prev);
      if (dayDiff > 45) {
        gapList.push(`Gap between ${format(prev, "MMM yyyy")} and ${format(curr, "MMM yyyy")} — you may be missing a billing report`);
      }
    }
    return gapList;
  }, [sorted]);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Report Timeline</CardTitle>
        </div>
        <CardDescription className="text-xs">All your uploaded reports in chronological order</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Colour legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {Object.entries(TYPE_COLORS).filter(([k]) => sorted.some(r => r.report_type === k)).map(([k, color]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{TYPE_LABELS[k] || k}</span>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-3">
            {sorted.map((r, i) => {
              const cy = Number(r.territory_total_cy) || 0;
              const py1 = Number(r.territory_total_py1) || 0;
              const changePct = py1 > 0 ? ((cy - py1) / py1 * 100) : 0;

              return (
                <div key={r.id} className="relative pl-8">
                  <div
                    className="absolute left-1.5 top-2 h-3 w-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: TYPE_COLORS[r.report_type] || "#6b7280" }}
                  />
                  <div className="p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{format(r._date!, "d MMM yyyy")}</span>
                          <Badge variant="outline" className="text-[9px]" style={{ borderColor: TYPE_COLORS[r.report_type], color: TYPE_COLORS[r.report_type] }}>
                            {r.report_type.toUpperCase()}
                          </Badge>
                        </div>
                        {r.period_start && r.period_end && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Period: {format(parseISO(r.period_start), "MMM")} — {format(parseISO(r.period_end), "MMM yyyy")}
                          </p>
                        )}
                      </div>
                      {cy > 0 && (
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-foreground">{formatCurrency(cy)}</p>
                          {py1 > 0 && (
                            <p className={cn("text-[10px]", changePct >= 0 ? "text-emerald-600" : "text-destructive")}>
                              {changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}% vs PY
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="mt-4 space-y-2">
            {gaps.map((g, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                <p className="text-[10px] text-destructive">{g}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Orders vs Billing Reconciliation ─── */
function ReconciliationView({ reports }: { reports: ReportRecord[] }) {
  const orderReports = reports.filter(r => r.report_type === "ord015" && r.territory_total_cy);
  const billingReports = reports.filter(r => ["fat017", "fat012"].includes(r.report_type) && r.territory_total_cy);

  if (orderReports.length === 0 || billingReports.length === 0) return null;

  // Use the latest of each
  const latestOrders = [...orderReports].sort((a, b) => {
    const da = getReportDateObj(a)?.getTime() || 0;
    const db = getReportDateObj(b)?.getTime() || 0;
    return db - da;
  })[0];

  const latestBilling = [...billingReports].sort((a, b) => {
    const da = getReportDateObj(a)?.getTime() || 0;
    const db = getReportDateObj(b)?.getTime() || 0;
    return db - da;
  })[0];

  const orderTotal = Number(latestOrders.territory_total_cy) || 0;
  const billingTotal = Number(latestBilling.territory_total_cy) || 0;
  const pipelineGap = orderTotal - billingTotal;

  if (pipelineGap <= 0) return null;

  const orderDate = getReportDateObj(latestOrders);
  const billingDate = getReportDateObj(latestBilling);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Orders vs Billing Reconciliation</CardTitle>
        </div>
        <CardDescription className="text-xs">Comparing your latest order report with your latest billing report</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-blue-50/60 border border-blue-200/40">
            <p className="text-lg font-bold text-blue-700">{formatCurrency(orderTotal)}</p>
            <p className="text-[10px] text-blue-600/80">Orders placed (ORD015)</p>
            {orderDate && <p className="text-[9px] text-muted-foreground mt-0.5">as of {format(orderDate, "d MMM")}</p>}
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/40">
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(billingTotal)}</p>
            <p className="text-[10px] text-emerald-600/80">Billed/invoiced (FAT017)</p>
            {billingDate && <p className="text-[9px] text-muted-foreground mt-0.5">as of {format(billingDate, "d MMM")}</p>}
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-lg font-bold text-primary">{formatCurrency(pipelineGap)}</p>
            <p className="text-[10px] text-primary/80">Pipeline gap</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">ordered, not shipped</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          You have <span className="font-semibold text-foreground">{formatFullCurrency(pipelineGap)}</span> of confirmed orders waiting to be invoiced. Billing always lags orders by 2-6 weeks.
        </p>

        {/* Bar chart comparison */}
        <ChartContainer config={{
          orders: { label: "Orders", color: "#3b82f6" },
          billing: { label: "Billing", color: "#10b981" },
        }} className="h-[120px]">
          <BarChart data={[{ name: "Territory", orders: orderTotal, billing: billingTotal }]} layout="vertical">
            <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} className="text-[9px]" />
            <YAxis type="category" dataKey="name" width={60} className="text-[9px]" />
            <Bar dataKey="orders" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Orders" />
            <Bar dataKey="billing" fill="#10b981" radius={[0, 4, 4, 0]} name="Billing" />
            <ChartTooltip content={<ChartTooltipContent />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ─── Territory Trend Line Chart ─── */
function TerritoryTrendChart({ reports }: { reports: ReportRecord[] }) {
  const trendData = useMemo(() => {
    const orderPoints = reports
      .filter(r => r.report_type === "ord015" && r.territory_total_cy)
      .map(r => ({
        date: getReportDate(r),
        dateObj: getReportDateObj(r),
        orders: Number(r.territory_total_cy) || 0,
        orders_py1: Number(r.territory_total_py1) || 0,
      }))
      .filter(r => r.dateObj)
      .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());

    const billingPoints = reports
      .filter(r => ["fat017", "fat012"].includes(r.report_type) && r.territory_total_cy)
      .map(r => ({
        date: getReportDate(r),
        dateObj: getReportDateObj(r),
        billing: Number(r.territory_total_cy) || 0,
        billing_py1: Number(r.territory_total_py1) || 0,
      }))
      .filter(r => r.dateObj)
      .sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());

    // Merge by date label
    const map = new Map<string, any>();
    for (const p of orderPoints) {
      const key = format(p.dateObj!, "d MMM");
      map.set(key, { ...map.get(key), label: key, orders: p.orders, orders_py1: p.orders_py1 });
    }
    for (const p of billingPoints) {
      const key = format(p.dateObj!, "d MMM");
      map.set(key, { ...map.get(key), label: key, billing: p.billing, billing_py1: p.billing_py1 });
    }

    return Array.from(map.values()).sort((a, b) => {
      const da = orderPoints.find(p => format(p.dateObj!, "d MMM") === a.label)?.dateObj?.getTime() ||
                 billingPoints.find(p => format(p.dateObj!, "d MMM") === a.label)?.dateObj?.getTime() || 0;
      const db = orderPoints.find(p => format(p.dateObj!, "d MMM") === b.label)?.dateObj?.getTime() ||
                 billingPoints.find(p => format(p.dateObj!, "d MMM") === b.label)?.dateObj?.getTime() || 0;
      return da - db;
    });
  }, [reports]);

  if (trendData.length < 2) return null;

  const hasOrders = trendData.some(d => d.orders);
  const hasBilling = trendData.some(d => d.billing);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Territory Performance Over Time</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {hasOrders && hasBilling ? "Orders and billing trends from your uploaded reports" :
           hasOrders ? "Order trends from your ORD015 reports" : "Billing trends from your FAT reports"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ChartContainer
          config={{
            orders: { label: "Orders (CY)", color: "#3b82f6" },
            billing: { label: "Billing (CY)", color: "#10b981" },
            orders_py1: { label: "Orders (PY)", color: "#93c5fd" },
            billing_py1: { label: "Billing (PY)", color: "#6ee7b7" },
          }}
          className="h-[250px]"
        >
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
            <XAxis dataKey="label" className="text-[9px]" />
            <YAxis tickFormatter={(v) => formatCurrency(v)} className="text-[9px]" width={60} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {hasOrders && <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Orders (CY)" />}
            {hasOrders && <Line type="monotone" dataKey="orders_py1" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} name="Orders (PY)" />}
            {hasBilling && <Line type="monotone" dataKey="billing" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Billing (CY)" />}
            {hasBilling && <Line type="monotone" dataKey="billing_py1" stroke="#6ee7b7" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} name="Billing (PY)" />}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ─── Account-Level Trajectory ─── */
function AccountTrajectory({ reports }: { reports: ReportRecord[] }) {
  const [showAll, setShowAll] = useState(false);

  const accountData = useMemo(() => {
    // Collect account data across all reports
    const accountMap = new Map<string, { name: string; town?: string; entries: { reportDate: string; reportType: string; cy: number; py1: number }[] }>();

    for (const r of reports) {
      const data = r.parsed_data;
      if (!data) continue;
      const reportDate = getReportDate(r) || r.created_at;

      const allAccounts = [
        ...(data.accounts_growing || []),
        ...(data.accounts_declining || []),
      ];

      for (const acc of allAccounts) {
        const key = normaliseAccountName(acc.name || "");
        if (!key) continue;
        // Keep original display name from the FIRST sighting; normalised key
        // groups the variants together.
        const existing = accountMap.get(key) || { name: acc.name, town: acc.town, entries: [] };
        existing.entries.push({
          reportDate,
          reportType: r.report_type,
          cy: acc.cy || 0,
          py1: acc.py1 || 0,
        });
        accountMap.set(key, existing);
      }
    }

    // Calculate trajectory for accounts with 2+ data points
    return Array.from(accountMap.values())
      .filter(a => a.entries.length >= 1)
      .map(a => {
        const sorted = [...a.entries].sort((x, y) => x.reportDate.localeCompare(y.reportDate));
        const latest = sorted[sorted.length - 1];
        const first = sorted[0];
        const changePct = latest.py1 > 0 ? ((latest.cy - latest.py1) / latest.py1 * 100) : 0;

        let trajectory: "improving" | "stable" | "declining" | "new" = "stable";
        if (sorted.length >= 2) {
          const firstChange = first.py1 > 0 ? ((first.cy - first.py1) / first.py1 * 100) : 0;
          const latestChange = changePct;
          if (latestChange > firstChange + 5) trajectory = "improving";
          else if (latestChange < firstChange - 5) trajectory = "declining";
        } else if (latest.py1 === 0 && latest.cy > 0) {
          trajectory = "new";
        }

        // Flag if declined 3+ consecutive reports
        let consecutiveDeclines = 0;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].cy < sorted[i - 1].cy) consecutiveDeclines++;
          else consecutiveDeclines = 0;
        }

        return {
          name: a.name,
          town: a.town,
          dataPoints: sorted.length,
          latestCY: latest.cy,
          changePct,
          trajectory,
          consecutiveDeclines,
        };
      })
      .sort((a, b) => Math.abs(b.latestCY) - Math.abs(a.latestCY));
  }, [reports]);

  if (accountData.length === 0) return null;

  const trajectoryConfig = {
    improving: { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "Improving", color: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-200/40" },
    stable: { icon: <Minus className="h-3.5 w-3.5" />, label: "Stable", color: "text-muted-foreground", bg: "bg-muted/30 border-border/50" },
    declining: { icon: <TrendingDown className="h-3.5 w-3.5" />, label: "Declining", color: "text-destructive", bg: "bg-red-50/60 border-red-200/40" },
    new: { icon: <TrendingUp className="h-3.5 w-3.5" />, label: "New", color: "text-blue-600", bg: "bg-blue-50/60 border-blue-200/40" },
  };

  const improving = accountData.filter(a => a.trajectory === "improving").length;
  const declining = accountData.filter(a => a.trajectory === "declining").length;
  const stable = accountData.filter(a => a.trajectory === "stable").length;
  const newAccounts = accountData.filter(a => a.trajectory === "new").length;

  const display = showAll ? accountData : accountData.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Account Trajectories</CardTitle>
        </div>
        <CardDescription className="text-xs">How each account is trending across your uploaded reports</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {improving > 0 && <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">↑ {improving} improving</Badge>}
          {stable > 0 && <Badge variant="outline" className="text-muted-foreground text-[10px]">→ {stable} stable</Badge>}
          {declining > 0 && <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">↓ {declining} declining</Badge>}
          {newAccounts > 0 && <Badge variant="outline" className="text-blue-600 border-blue-300 text-[10px]">✦ {newAccounts} new</Badge>}
        </div>

        {/* Account list */}
        <div className="space-y-2">
          {display.map((a, i) => {
            const config = trajectoryConfig[a.trajectory];
            return (
              <div key={i} className={cn("flex items-center justify-between p-2.5 rounded-lg border", config.bg)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{a.name}</p>
                    <div className={cn("flex items-center gap-0.5", config.color)}>
                      {config.icon}
                      <span className="text-[9px] font-medium">{config.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.town && <p className="text-[10px] text-muted-foreground">{a.town}</p>}
                    <p className="text-[10px] text-muted-foreground">{a.dataPoints} report{a.dataPoints > 1 ? "s" : ""}</p>
                  </div>
                  {a.consecutiveDeclines >= 3 && (
                    <p className="text-[10px] text-destructive mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Declined for {a.consecutiveDeclines} consecutive reports
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(a.latestCY)}</p>
                  {a.changePct !== 0 && (
                    <p className={cn("text-[10px]", a.changePct >= 0 ? "text-emerald-600" : "text-destructive")}>
                      {a.changePct >= 0 ? "+" : ""}{a.changePct.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {accountData.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-3 text-xs text-primary hover:text-primary/80 text-center"
          >
            {showAll ? "Show top 10" : `Show all ${accountData.length} accounts`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
