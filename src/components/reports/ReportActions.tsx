import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { Bell, FileText, Mail, Copy, Check, AlertTriangle, Calendar, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

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

interface ReportActionsProps {
  reports: ReportRecord[];
}

function formatCurrency(v: number): string {
  return `£${Math.round(v).toLocaleString()}`;
}

function getReportDate(r: ReportRecord): string | null {
  return r.report_date || r.period_end || null;
}

/* ════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════ */
export default function ReportActions({ reports }: ReportActionsProps) {
  return (
    <div className="space-y-6">
      <ReportReminders reports={reports} />
      <StateOfPlayGenerator reports={reports} />
      <TalkToJudeDrafter reports={reports} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   1. REPORT REMINDERS
   ════════════════════════════════════════════════════════════════ */

interface Reminder {
  type: string;
  label: string;
  message: string;
  urgency: "info" | "warning" | "overdue";
}

const REPORT_SCHEDULE = [
  { type: "ord015", label: "ORD015 — Order Comparison", frequency: "Every 2 weeks", description: "Pull from Nomination on-demand" },
  { type: "fat017", label: "FAT017 — Monthly Billing", frequency: "~5th of month", description: "Request from Nomination/Jude" },
  { type: "fat012", label: "FAT012 — Product Breakdown", frequency: "~5th of month", description: "Same timing as FAT017" },
  { type: "fat013", label: "FAT013 — YTD vs Full Year", frequency: "~5th of month", description: "Available but ⚠️ misleading percentages" },
  { type: "brioso_summary", label: "Brioso Summary", frequency: "Monthly from Jude", description: "Request if not received" },
];

function ReportReminders({ reports }: { reports: ReportRecord[] }) {
  const reminders = useMemo(() => {
    const now = new Date();
    const results: Reminder[] = [];

    const latestByType = new Map<string, Date>();
    for (const r of reports) {
      const d = getReportDate(r);
      if (!d) continue;
      try {
        const date = parseISO(d);
        const existing = latestByType.get(r.report_type);
        if (!existing || date > existing) latestByType.set(r.report_type, date);
      } catch {}
    }

    // ORD015 — every 2 weeks
    const lastOrd = latestByType.get("ord015");
    if (!lastOrd) {
      results.push({ type: "ord015", label: "ORD015", message: "You haven't uploaded an ORD015 yet. This is your REAL performance report — pull one from Nomination.", urgency: "warning" });
    } else if (differenceInDays(now, lastOrd) > 14) {
      results.push({ type: "ord015", label: "ORD015", message: `It's been ${differenceInDays(now, lastOrd)} days since your last ORD015 (${format(lastOrd, "d MMM")}). Want to pull a fresh one?`, urgency: differenceInDays(now, lastOrd) > 21 ? "overdue" : "info" });
    }

    // FAT reports — monthly, ~5th of month
    for (const fatType of ["fat017", "fat012"] as const) {
      const last = latestByType.get(fatType);
      const label = fatType.toUpperCase();
      if (!last) {
        results.push({ type: fatType, label, message: `No ${label} uploaded yet. Ask Jude or Nomination for your latest billing report.`, urgency: "warning" });
      } else if (differenceInDays(now, last) > 35) {
        results.push({ type: fatType, label, message: `${label} is ${differenceInDays(now, last)} days old (${format(last, "d MMM")}). The next month's report should be available.`, urgency: differenceInDays(now, last) > 45 ? "overdue" : "info" });
      }
    }

    // Brioso Summary — monthly
    const lastBrioso = latestByType.get("brioso_summary");
    if (!lastBrioso) {
      results.push({ type: "brioso_summary", label: "Brioso Summary", message: "No Brioso Summary uploaded. Request the monthly workbook from Jude.", urgency: "warning" });
    } else if (differenceInDays(now, lastBrioso) > 35) {
      results.push({ type: "brioso_summary", label: "Brioso Summary", message: `Brioso Summary is ${differenceInDays(now, lastBrioso)} days old. Monthly workbook from Jude should be due.`, urgency: "info" });
    }

    // Gap detection — FAT series
    const fatReports = reports
      .filter(r => r.report_type === "fat017" && r.period_end)
      .sort((a, b) => (a.period_end || "").localeCompare(b.period_end || ""));
    for (let i = 1; i < fatReports.length; i++) {
      const prev = parseISO(fatReports[i - 1].period_end!);
      const curr = parseISO(fatReports[i].period_end!);
      if (differenceInDays(curr, prev) > 45) {
        const gapStart = format(addDays(prev, 1), "MMM yyyy");
        const gapEnd = format(addDays(curr, -1), "MMM yyyy");
        results.push({ type: "gap", label: "Missing Report", message: `Gap detected: you're missing billing data between ${gapStart} and ${gapEnd}. This creates a hole in your trend data.`, urgency: "warning" });
      }
    }

    return results;
  }, [reports]);

  const urgencyConfig = {
    info: { bg: "bg-muted/50 border-border/60", icon: <Bell className="h-4 w-4 text-muted-foreground" /> },
    warning: { bg: "bg-primary/5 border-primary/20", icon: <AlertTriangle className="h-4 w-4 text-primary" /> },
    overdue: { bg: "bg-destructive/5 border-destructive/20", icon: <AlertTriangle className="h-4 w-4 text-destructive" /> },
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Reports Due</CardTitle>
          {reminders.length > 0 && <Badge variant="secondary" className="text-[10px]">{reminders.length}</Badge>}
        </div>
        <CardDescription className="text-xs">Based on the expected report schedule and your upload history</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {reminders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">All reports are up to date! 🎉</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r, i) => {
              const config = urgencyConfig[r.urgency];
              return (
                <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", config.bg)}>
                  {config.icon}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule reference */}
        <details className="mt-4">
          <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">View expected report schedule</summary>
          <div className="mt-2 space-y-1.5">
            {REPORT_SCHEDULE.map(s => (
              <div key={s.type} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-muted/30">
                <span className="text-foreground font-medium">{s.label}</span>
                <span className="text-muted-foreground">{s.frequency}</span>
              </div>
            ))}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════
   2. STATE OF PLAY GENERATOR
   ════════════════════════════════════════════════════════════════ */
function StateOfPlayGenerator({ reports }: { reports: ReportRecord[] }) {
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analysedReports = reports.filter(r => r.status === "analysed");
  const latestOrder = [...analysedReports].filter(r => r.report_type === "ord015").sort((a, b) => (b.report_date || b.created_at).localeCompare(a.report_date || a.created_at))[0];
  const latestBilling = [...analysedReports].filter(r => ["fat017", "fat012"].includes(r.report_type)).sort((a, b) => (b.report_date || b.created_at).localeCompare(a.report_date || a.created_at))[0];

  const canGenerate = latestOrder || latestBilling;

  const generateReport = () => {
    const source = latestOrder || latestBilling;
    if (!source) return;

    const data = source.parsed_data || {};
    const cy = Number(source.territory_total_cy) || 0;
    const py1 = Number(source.territory_total_py1) || 0;
    const fairChange = data.fair_change_pct ?? (py1 > 0 ? ((cy - py1) / py1 * 100) : 0);
    const closedPY1 = (data.closed_accounts || []).reduce((s: number, a: any) => s + (a.py1_value || 0), 0);
    const adjustedPY1 = py1 - closedPY1;
    const adjustedChange = adjustedPY1 > 0 ? ((cy - adjustedPY1) / adjustedPY1 * 100) : fairChange;

    const growing = data.accounts_growing || [];
    const declining = data.accounts_declining || [];
    const closed = data.closed_accounts || [];

    const orderTotal = latestOrder ? Number(latestOrder.territory_total_cy) || 0 : 0;
    const billingTotal = latestBilling ? Number(latestBilling.territory_total_cy) || 0 : 0;
    const pipeline = orderTotal > billingTotal ? orderTotal - billingTotal : 0;

    const now = new Date();
    const daysSoFar = Math.max(1, Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000));
    const annualised = cy > 0 ? (cy / daysSoFar) * 365 : 0;

    // Quarter context
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const seasonalPct: Record<number, string> = { 1: "26.6%", 2: "12.2%", 3: "39.6%", 4: "21.7%" };

    // Territory score
    const totalAccounts = growing.length + declining.length;
    const growthRatio = totalAccounts > 0 ? (growing.length / totalAccounts) * 100 : 50;
    const growthScore = Math.max(0, Math.min(100, 50 + adjustedChange * 2.5));
    const diversityScore = growing.length >= 5 ? 100 : growing.length >= 3 ? 75 : growing.length >= 1 ? 50 : 0;
    const territoryScore = Math.round(growthRatio * 0.4 + growthScore * 0.3 + diversityScore * 0.2 + 50 * 0.1);

    const top5Growing = [...growing].sort((a: any, b: any) => (b.cy - b.py1) - (a.cy - a.py1)).slice(0, 5);
    const top3Watch = [...declining].sort((a: any, b: any) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 3);

    let report = `TERRITORY STATE OF PLAY — ${format(now, "d MMMM yyyy")}\n`;
    report += `${"═".repeat(50)}\n\n`;

    // Executive Summary
    report += `EXECUTIVE SUMMARY\n`;
    report += `My territory has ${source.report_type === "ord015" ? "placed" : "billed"} ${formatCurrency(cy)} year-to-date`;
    if (py1 > 0) {
      report += `, which is ${fairChange >= 0 ? "up" : "down"} ${Math.abs(fairChange).toFixed(1)}% on the same period last year`;
      if (closedPY1 > 0) {
        report += `. Adjusting for ${closed.length} permanently closed account${closed.length > 1 ? "s" : ""} (${formatCurrency(closedPY1)} in prior year), like-for-like performance is ${adjustedChange >= 0 ? "up" : "down"} ${Math.abs(adjustedChange).toFixed(1)}%`;
      }
    }
    report += `.\n`;
    if (annualised > 0) report += `At current run rate, the territory would finish the year at approximately ${formatCurrency(annualised)}.\n`;
    report += `\n`;

    // Territory headline
    if (orderTotal > 0 && billingTotal > 0) {
      report += `ORDERS vs BILLING\n`;
      report += `• Orders placed (ORD015): ${formatCurrency(orderTotal)}\n`;
      report += `• Billed/invoiced (FAT017): ${formatCurrency(billingTotal)}\n`;
      if (pipeline > 0) report += `• Pipeline (ordered, not yet shipped): ${formatCurrency(pipeline)}\n`;
      report += `\n`;
    }

    // Top growing
    if (top5Growing.length > 0) {
      report += `TOP ${top5Growing.length} GROWING ACCOUNTS\n`;
      top5Growing.forEach((a: any, i: number) => {
        const diff = a.cy - a.py1;
        report += `${i + 1}. ${a.name}${a.town ? `, ${a.town}` : ""} — ${formatCurrency(a.cy)} (+${a.change_pct?.toFixed(1)}%, +${formatCurrency(diff)})\n`;
      });
      report += `\n`;
    }

    // Accounts to watch
    if (top3Watch.length > 0) {
      report += `ACCOUNTS TO WATCH\n`;
      top3Watch.forEach((a: any, i: number) => {
        report += `${i + 1}. ${a.name}${a.town ? `, ${a.town}` : ""} — ${formatCurrency(a.cy)} (${a.change_pct?.toFixed(1)}%)`;
        if (a.context) report += ` — ${a.context}`;
        report += `\n`;
      });
      report += `\n`;
    }

    // Seasonal context
    report += `SEASONAL CONTEXT\n`;
    report += `We are currently in Q${quarter}, which historically represents ${seasonalPct[quarter]} of annual territory sales. `;
    if (quarter === 2) report += `Lower monthly figures in April–June are expected and normal. `;
    if (quarter === 3) report += `This is the critical quarter — September alone typically accounts for ~26% of the year. `;
    report += `\n\n`;

    // Timing factors
    report += `KNOWN TIMING FACTORS (2026)\n`;
    report += `• SS26 Composable collection: shipping delayed to end April (all agents nationally)\n`;
    report += `• February 2026 promotion: cancelled by Nomination\n`;
    report += `• New Composable base price increase: £13 → £22 from 1 April 2026\n`;
    report += `• Style Icon mandatory on all Composable Bracelets from 1 April 2026\n`;
    if (closedPY1 > 0) report += `• Closed accounts removed from comparison: ${formatCurrency(closedPY1)} in prior year base\n`;
    report += `\n`;

    // Territory score
    report += `TERRITORY SCORE: ${territoryScore}/100\n`;
    report += territoryScore >= 70 ? `Performance is strong.\n` : territoryScore >= 50 ? `Performance is steady — room for growth.\n` : `Attention needed — focus on key accounts.\n`;
    report += `\n`;

    // Next steps
    report += `NEXT STEPS & FOCUS AREAS\n`;
    if (top3Watch.length > 0) report += `• Schedule visits to: ${top3Watch.map((a: any) => a.name).join(", ")}\n`;
    if (growing.length > 0) report += `• Nurture growing accounts — ${growing.length} currently trending up\n`;
    report += `• Pull fresh ORD015 to track April order intake\n`;
    report += `• Request May FAT017 when available (~5th June)\n`;

    setGenerated(report);
  };

  const handleCopy = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">State of Play Report</CardTitle>
        </div>
        <CardDescription className="text-xs">Generate a comprehensive plain-English territory review you can read, share with Jude, or use in performance reviews.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!generated ? (
          <div className="text-center py-4">
            <Button onClick={generateReport} disabled={!canGenerate}>
              <FileText className="h-4 w-4 mr-2" />Generate State of Play
            </Button>
            {!canGenerate && <p className="text-[10px] text-muted-foreground mt-2">Upload and analyse at least one report first.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Generated</Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setGenerated(null)}>Regenerate</Button>
              </div>
            </div>
            <Textarea value={generated} readOnly className="min-h-[400px] text-xs font-mono leading-relaxed" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. TALK TO JUDE — EMAIL DRAFTER
   ════════════════════════════════════════════════════════════════ */
function TalkToJudeDrafter({ reports }: { reports: ReportRecord[] }) {
  const { toast } = useToast();
  const [version, setVersion] = useState<"proactive" | "defending" | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  const analysedReports = reports.filter(r => r.status === "analysed");
  const latest = [...analysedReports].sort((a, b) => (b.report_date || b.created_at).localeCompare(a.report_date || a.created_at))[0];
  const canDraft = !!latest;

  const generateDraft = (type: "proactive" | "defending") => {
    if (!latest) return;
    setVersion(type);

    const data = latest.parsed_data || {};
    const cy = Number(latest.territory_total_cy) || 0;
    const py1 = Number(latest.territory_total_py1) || 0;
    const fairChange = data.fair_change_pct ?? (py1 > 0 ? ((cy - py1) / py1 * 100) : 0);
    const closedPY1 = (data.closed_accounts || []).reduce((s: number, a: any) => s + (a.py1_value || 0), 0);
    const adjustedPY1 = py1 - closedPY1;
    const adjustedChange = adjustedPY1 > 0 ? ((cy - adjustedPY1) / adjustedPY1 * 100) : fairChange;

    const growing = data.accounts_growing || [];
    const declining = data.accounts_declining || [];
    const closed = data.closed_accounts || [];

    const top3Growing = [...growing].sort((a: any, b: any) => (b.cy - b.py1) - (a.cy - a.py1)).slice(0, 3);
    const top2Watch = [...declining].sort((a: any, b: any) => Math.abs(b.change_pct) - Math.abs(a.change_pct)).slice(0, 2);

    const now = new Date();
    const daysSoFar = Math.max(1, Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000));
    const annualised = cy > 0 ? (cy / daysSoFar) * 365 : 0;

    if (type === "proactive") {
      let email = `Hi Jude,\n\n`;
      email += `Hope you're well! Just wanted to give you a quick update on how the territory is looking.\n\n`;

      if (cy > 0) email += `Year-to-date we're at ${formatCurrency(cy)}`;
      if (fairChange >= 0 && py1 > 0) {
        email += `, which is up ${fairChange.toFixed(1)}% on the same period last year. `;
      } else if (py1 > 0) {
        email += `. On a like-for-like basis we're ${Math.abs(fairChange).toFixed(1)}% behind the same period, but there's good context behind that. `;
      }
      email += `\n\n`;

      if (top3Growing.length > 0) {
        email += `Some highlights:\n`;
        top3Growing.forEach((a: any) => {
          email += `• ${a.name}${a.town ? ` (${a.town})` : ""} — ${formatCurrency(a.cy)}, up ${a.change_pct?.toFixed(0)}%\n`;
        });
        email += `\n`;
      }

      if (growing.length > 0) email += `Overall, ${growing.length} accounts are growing which is encouraging.\n\n`;

      if (top2Watch.length > 0) {
        email += `Keeping an eye on:\n`;
        top2Watch.forEach((a: any) => {
          email += `• ${a.name} — down ${Math.abs(a.change_pct)?.toFixed(0)}%`;
          if (a.context) email += ` (${a.context})`;
          email += `\n`;
        });
        email += `I've got visits planned to check in with both.\n\n`;
      }

      if (annualised > 0) email += `My feeling is the territory is on track — at current pace we'd finish around ${formatCurrency(annualised)} for the year.\n\n`;

      email += `Let me know if you'd like to catch up about anything.\n\n`;
      email += `Kind regards,\nEmma-Louise xx`;

      setDraft(email);
    } else {
      // Defending version
      let email = `Hi Jude,\n\n`;
      email += `I've been looking at the latest numbers and wanted to put some context around them before we chat.\n\n`;

      if (cy > 0 && py1 > 0) {
        email += `The headline shows the territory at ${formatCurrency(cy)}, which on paper is ${Math.abs(fairChange).toFixed(1)}% ${fairChange >= 0 ? "up" : "down"} on last year. `;
        email += `However, there are some important factors:\n\n`;
      }

      // Context factors
      if (closedPY1 > 0) {
        email += `1. **Closed accounts** — ${closed.length} account${closed.length > 1 ? "s" : ""} in the prior year base (${formatCurrency(closedPY1)}) ${closed.length > 1 ? "are" : "is"} permanently closed. `;
        email += `Removing ${closed.length > 1 ? "these" : "this"} brings the like-for-like comparison to ${adjustedChange >= 0 ? "+" : ""}${adjustedChange.toFixed(1)}%.\n\n`;
      }

      email += `2. **SS26 Composable delays** — the new collection shipping was pushed to end of April across all agents nationally. This affects billing figures for Q1.\n\n`;
      email += `3. **February promotion cancelled** — normally this drives strong sell-through which feeds into March/April reorders.\n\n`;

      // The positive story
      if (top3Growing.length > 0) {
        email += `On the positive side, ${growing.length} account${growing.length > 1 ? "s are" : " is"} growing:\n`;
        top3Growing.forEach((a: any) => {
          email += `• ${a.name}${a.town ? ` (${a.town})` : ""} — up ${a.change_pct?.toFixed(0)}% to ${formatCurrency(a.cy)}\n`;
        });
        email += `\n`;
      }

      if (annualised > 0) {
        email += `At current trajectory, the territory is on pace for approximately ${formatCurrency(annualised)} for the full year.\n\n`;
      }

      email += `My plan for the next few weeks:\n`;
      if (top2Watch.length > 0) {
        email += `• Visit ${top2Watch.map((a: any) => a.name).join(" and ")} to understand the decline and work on recovery\n`;
      }
      email += `• Focus on SS26 Composable placement now that stock is arriving\n`;
      email += `• Push Fashion collection with accounts who haven't tried it yet\n\n`;

      email += `Happy to go through the numbers in more detail when we next speak.\n\n`;
      email += `Kind regards,\nEmma-Louise xx`;

      setDraft(email);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    toast({ title: "Email copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Talk to Jude</CardTitle>
        </div>
        <CardDescription className="text-xs">Draft a professional email to share with your boss. Edit before sending — it's your email, your voice.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!version ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => generateDraft("proactive")}
              disabled={!canDraft}
              className={cn(
                "p-4 rounded-lg border text-left transition-all",
                canDraft ? "hover:border-primary/40 hover:bg-primary/5 cursor-pointer" : "opacity-50 cursor-not-allowed",
                "border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-foreground">Proactive Update</span>
              </div>
              <p className="text-[11px] text-muted-foreground">When things are going well — lead with growth, mention pipeline, end with planned actions.</p>
            </button>
            <button
              onClick={() => generateDraft("defending")}
              disabled={!canDraft}
              className={cn(
                "p-4 rounded-lg border text-left transition-all",
                canDraft ? "hover:border-primary/40 hover:bg-primary/5 cursor-pointer" : "opacity-50 cursor-not-allowed",
                "border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Defending the Numbers</span>
              </div>
              <p className="text-[11px] text-muted-foreground">When the headline looks bad — contextualise with closures, timing, and delays, then present the real picture.</p>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px]">
                {version === "proactive" ? "✨ Proactive Update" : "🛡️ Defending the Numbers"}
              </Badge>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setVersion(null); setDraft(""); }}>Try other version</Button>
              </div>
            </div>
            <Textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              className="min-h-[350px] text-sm leading-relaxed"
              placeholder="Your email will appear here..."
            />
            <p className="text-[10px] text-muted-foreground text-center italic">Edit this to match your voice before sending. It's your email — make it yours.</p>
          </div>
        )}
        {!canDraft && !version && <p className="text-[10px] text-muted-foreground mt-2 text-center">Upload and analyse at least one report to draft an email.</p>}
      </CardContent>
    </Card>
  );
}
