import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRetailers } from "@/hooks/useRetailers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ClipboardCheck, Send, Download, TrendingUp, TrendingDown, Users, Phone,
  MapPin, AlertTriangle, Target, CalendarDays, Loader2, Eye, EyeOff, Mail,
  ChevronDown, ChevronUp, Star, BarChart3
} from "lucide-react";
import { toast } from "sonner";

interface CalendarEvent {
  id: string; title: string; date: string; time: string | null;
  type: string; retailer_id: string | null; retailer_name: string | null;
  town: string | null; notes: string | null; completed: boolean;
}

interface ActivityEntry {
  id: string; action: string; retailer_id: string | null;
  details: any; created_at: string;
}

interface ReportSection {
  id: string; label: string; icon: typeof ClipboardCheck;
  enabled: boolean; description: string;
}

const PIPELINE_LABELS: Record<string, string> = {
  new_lead: "New Lead", research_needed: "Research Needed", qualified: "Qualified",
  priority_outreach: "Priority Outreach", contacted: "Contacted",
  follow_up_needed: "Follow Up Needed", meeting_booked: "Meeting Booked",
  under_review: "Under Review", approved: "Approved", rejected: "Rejected",
  retention_risk: "Retention Risk",
};

export default function WeeklyReview() {
  const { retailers, loading: retailersLoading } = useRetailers();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalNote, setPersonalNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const [sections, setSections] = useState<ReportSection[]>([
    { id: "kpi_summary", label: "KPI Summary", icon: BarChart3, enabled: true, description: "Pipeline counts, total billing, key metrics" },
    { id: "pipeline_movement", label: "Pipeline Movement", icon: TrendingUp, enabled: true, description: "Stage changes, new leads, progressions this week" },
    { id: "billing_performance", label: "Billing & Performance", icon: Star, enabled: true, description: "Top performers, declining accounts, YoY trends" },
    { id: "activity_log", label: "Activity Summary", icon: ClipboardCheck, enabled: true, description: "Calls, visits, meetings, follow-ups completed" },
    { id: "at_risk", label: "At-Risk Accounts", icon: AlertTriangle, enabled: true, description: "Accounts with risk flags or declining billing" },
    { id: "next_week_plan", label: "Next Week Plan", icon: CalendarDays, enabled: true, description: "Scheduled events, priority actions for next week" },
    { id: "top_prospects", label: "Top Prospects", icon: Target, enabled: false, description: "Highest-scoring uncontacted prospects" },
    { id: "personal_note", label: "Personal Notes", icon: Mail, enabled: true, description: "Your custom notes and commentary" },
  ]);

  useEffect(() => {
    Promise.all([
      supabase.from("calendar_events").select("*").order("date", { ascending: true }),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
    ]).then(([evRes, actRes]) => {
      setEvents(evRes.data ?? []);
      setActivities(actRes.data ?? []);
      setLoading(false);
    });
  }, []);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() + mondayOffset);
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  const nextMonday = new Date(thisSunday);
  nextMonday.setDate(thisSunday.getDate() + 1);
  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const fmtDisplay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const thisWeekEvents = useMemo(() => events.filter(e => e.date >= fmt(thisMonday) && e.date <= fmt(thisSunday)), [events]);
  const nextWeekEvents = useMemo(() => events.filter(e => e.date >= fmt(nextMonday) && e.date <= fmt(nextSunday)), [events]);

  const stats = useMemo(() => {
    const pipelineCounts: Record<string, number> = {};
    let totalBilling2025 = 0, totalBilling2026 = 0, atRiskCount = 0;
    const topPerformers: typeof retailers = [];
    const declining: typeof retailers = [];

    retailers.forEach(r => {
      pipelineCounts[r.pipeline_stage] = (pipelineCounts[r.pipeline_stage] || 0) + 1;
      const b25 = Number(r.billing_2025_full_year) || 0;
      const b26 = Number(r.billing_2026_ytd) || 0;
      const b24 = Number(r.billing_2024_full_year) || 0;
      totalBilling2025 += b25;
      totalBilling2026 += b26;
      if (r.risk_flags && r.risk_flags.length > 0) atRiskCount++;
      if (b25 > 2000) topPerformers.push(r);
      if (b24 > 0 && b25 > 0 && b25 < b24 * 0.8) declining.push(r);
    });

    topPerformers.sort((a, b) => (Number(b.billing_2025_full_year) || 0) - (Number(a.billing_2025_full_year) || 0));

    return {
      pipelineCounts, totalBilling2025, totalBilling2026, atRiskCount,
      topPerformers: topPerformers.slice(0, 10), declining: declining.slice(0, 10),
      totalAccounts: retailers.length,
      meetingsThisWeek: thisWeekEvents.filter(e => e.type === "meeting").length,
      callsThisWeek: thisWeekEvents.filter(e => e.type === "call").length,
      visitsThisWeek: thisWeekEvents.filter(e => e.type === "visit").length,
    };
  }, [retailers, thisWeekEvents]);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const isEnabled = (id: string) => sections.find(s => s.id === id)?.enabled ?? false;

  const handleGeneratePDF = async () => {
    setGenerating(true);
    toast.info("Generating PDF report...");
    // Build report data
    const enabledSections = sections.filter(s => s.enabled).map(s => s.id);
    const reportData = {
      weekOf: fmtDisplay(thisMonday) + " – " + fmtDisplay(thisSunday),
      nextWeekOf: fmtDisplay(nextMonday) + " – " + fmtDisplay(nextSunday),
      enabledSections,
      stats,
      thisWeekEvents: thisWeekEvents.map(e => ({ title: e.title, date: e.date, type: e.type, retailer_name: e.retailer_name, town: e.town, completed: e.completed })),
      nextWeekEvents: nextWeekEvents.map(e => ({ title: e.title, date: e.date, type: e.type, retailer_name: e.retailer_name, town: e.town })),
      topPerformers: stats.topPerformers.map(r => ({ name: r.name, town: r.town, billing2025: r.billing_2025_full_year, billing2024: r.billing_2024_full_year })),
      declining: stats.declining.map(r => ({ name: r.name, town: r.town, billing2025: r.billing_2025_full_year, billing2024: r.billing_2024_full_year })),
      atRiskAccounts: retailers.filter(r => r.risk_flags && r.risk_flags.length > 0).map(r => ({ name: r.name, town: r.town, flags: r.risk_flags })),
      pipelineCounts: stats.pipelineCounts,
      personalNote,
    };

    // Create a printable HTML report and trigger download
    const html = buildReportHTML(reportData);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Weekly_Review_${fmt(thisMonday)}.html`;
    a.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
    toast.success("Report downloaded — open in browser and print to PDF");
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) { toast.error("Please enter a recipient email"); return; }
    setSending(true);
    toast.info("Preparing report to send...");
    // For now we'll copy to clipboard as formatted text
    const enabledSections = sections.filter(s => s.enabled).map(s => s.id);
    let body = `Weekly Review: ${fmtDisplay(thisMonday)} – ${fmtDisplay(thisSunday)}\n\n`;

    if (enabledSections.includes("kpi_summary")) {
      body += `📊 KPI SUMMARY\n`;
      body += `Total Accounts: ${stats.totalAccounts}\n`;
      body += `2025 Billing: £${stats.totalBilling2025.toLocaleString()}\n`;
      body += `2026 YTD: £${stats.totalBilling2026.toLocaleString()}\n`;
      body += `At Risk: ${stats.atRiskCount}\n\n`;
    }
    if (enabledSections.includes("activity_log")) {
      body += `📋 THIS WEEK'S ACTIVITY\n`;
      body += `Meetings: ${stats.meetingsThisWeek} | Calls: ${stats.callsThisWeek} | Visits: ${stats.visitsThisWeek}\n\n`;
    }
    if (enabledSections.includes("billing_performance")) {
      body += `⭐ TOP PERFORMERS\n`;
      stats.topPerformers.slice(0, 5).forEach(r => {
        body += `• ${r.name} (${r.town}) — £${Number(r.billing_2025_full_year || 0).toLocaleString()}\n`;
      });
      body += `\n`;
    }
    if (enabledSections.includes("at_risk") && stats.atRiskCount > 0) {
      body += `⚠️ AT-RISK ACCOUNTS\n`;
      retailers.filter(r => r.risk_flags && r.risk_flags.length > 0).slice(0, 5).forEach(r => {
        body += `• ${r.name} — ${(r.risk_flags || []).join(", ")}\n`;
      });
      body += `\n`;
    }
    if (enabledSections.includes("next_week_plan")) {
      body += `📅 NEXT WEEK PLAN\n`;
      nextWeekEvents.forEach(e => {
        body += `• ${e.date} — ${e.title}${e.retailer_name ? ` (${e.retailer_name})` : ""}\n`;
      });
      if (nextWeekEvents.length === 0) body += `No events scheduled yet.\n`;
      body += `\n`;
    }
    if (enabledSections.includes("personal_note") && personalNote) {
      body += `📝 NOTES\n${personalNote}\n\n`;
    }

    // Open mailto link
    const subject = encodeURIComponent(`Weekly Review: ${fmtDisplay(thisMonday)} – ${fmtDisplay(thisSunday)}`);
    const mailBody = encodeURIComponent(body);
    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${mailBody}`, "_blank");

    setSending(false);
    toast.success("Email draft opened in your email client");
  };

  if (loading || retailersLoading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Review</p>
          <h1 className="page-title">Weekly Review & Actions</h1>
          <p className="page-subtitle">Week of {fmtDisplay(thisMonday)} – {fmtDisplay(thisSunday)} · Customise what to include and send to your manager</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGeneratePDF} disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-card border border-border/20 text-foreground text-xs font-medium hover:bg-champagne/20 transition-all">
            <Download className="w-3.5 h-3.5" />{generating ? "Generating..." : "Download Report"}
          </button>
          <button onClick={handleSendEmail} disabled={sending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg gold-gradient text-card text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
            <Send className="w-3.5 h-3.5" />{sending ? "Sending..." : "Send to Jude"}
          </button>
        </div>
      </div>
      <div className="divider-gold" />

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="bg-card border border-border/20 mb-6">
          <TabsTrigger value="review" className="text-xs data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
            <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />This Week Review
          </TabsTrigger>
          <TabsTrigger value="plan" className="text-xs data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />Next Week Plan
          </TabsTrigger>
          <TabsTrigger value="customise" className="text-xs data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
            <Eye className="w-3.5 h-3.5 mr-1.5" />Customise Report
          </TabsTrigger>
        </TabsList>

        {/* THIS WEEK REVIEW */}
        <TabsContent value="review" className="space-y-4">
          {/* KPI Cards */}
          {isEnabled("kpi_summary") && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Accounts", value: stats.totalAccounts.toString(), icon: Users, accent: true },
                { label: "2025 Billing", value: `£${(stats.totalBilling2025 / 1000).toFixed(0)}k`, icon: TrendingUp },
                { label: "2026 YTD", value: `£${(stats.totalBilling2026 / 1000).toFixed(0)}k`, icon: BarChart3 },
                { label: "At Risk", value: stats.atRiskCount.toString(), icon: AlertTriangle },
              ].map(s => (
                <div key={s.label} className={`stat-card ${s.accent ? 'bg-champagne/20 border-gold/30' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.accent ? 'gold-gradient' : 'bg-muted'}`}>
                    <s.icon className={`w-4 h-4 ${s.accent ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                  </div>
                  <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Activity Summary */}
          {isEnabled("activity_log") && (
            <Card className="border-border/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-gold" />Activity This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { label: "Meetings", value: stats.meetingsThisWeek, icon: Users },
                    { label: "Calls", value: stats.callsThisWeek, icon: Phone },
                    { label: "Visits", value: stats.visitsThisWeek, icon: MapPin },
                  ].map(a => (
                    <div key={a.label} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <a.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-bold text-foreground">{a.value}</p>
                        <p className="text-[10px] text-muted-foreground">{a.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {thisWeekEvents.length > 0 && (
                  <div className="space-y-1.5">
                    {thisWeekEvents.slice(0, 8).map(ev => (
                      <div key={ev.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[9px]">{ev.type}</Badge>
                          <span className="text-xs text-foreground">{ev.retailer_name || ev.title}</span>
                          {ev.town && <span className="text-[10px] text-muted-foreground">{ev.town}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{ev.date}</span>
                          {ev.completed && <Badge className="bg-success/20 text-success text-[8px]">Done</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pipeline Movement */}
          {isEnabled("pipeline_movement") && (
            <Card className="border-border/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gold" />Pipeline Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(stats.pipelineCounts).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border/10">
                      <span className="text-[10px] text-muted-foreground">{PIPELINE_LABELS[stage] || stage}</span>
                      <span className="text-sm font-bold text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Performance */}
          {isEnabled("billing_performance") && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.topPerformers.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-foreground">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.town}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">£{Number(r.billing_2025_full_year || 0).toLocaleString()}</p>
                        <p className="text-[9px] text-muted-foreground">2025</p>
                      </div>
                    </div>
                  ))}
                  {stats.topPerformers.length === 0 && <p className="text-xs text-muted-foreground italic">No billing data available</p>}
                </CardContent>
              </Card>

              <Card className="border-border/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-display flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />Declining Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats.declining.slice(0, 5).map(r => {
                    const b24 = Number(r.billing_2024_full_year) || 0;
                    const b25 = Number(r.billing_2025_full_year) || 0;
                    const change = b24 > 0 ? ((b25 - b24) / b24 * 100).toFixed(0) : "–";
                    return (
                      <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                        <div>
                          <p className="text-xs font-medium text-foreground">{r.name}</p>
                          <p className="text-[10px] text-muted-foreground">{r.town}</p>
                        </div>
                        <Badge variant="destructive" className="text-[9px]">{change}% YoY</Badge>
                      </div>
                    );
                  })}
                  {stats.declining.length === 0 && <p className="text-xs text-muted-foreground italic">No declining accounts detected</p>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* At Risk */}
          {isEnabled("at_risk") && stats.atRiskCount > 0 && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />At-Risk Accounts ({stats.atRiskCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {retailers.filter(r => r.risk_flags && r.risk_flags.length > 0).slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.town}, {r.county}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {(r.risk_flags || []).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[8px] border-destructive/30 text-destructive">{f}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Personal Note */}
          {isEnabled("personal_note") && (
            <Card className="border-border/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gold" />Personal Notes & Commentary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add your weekly commentary, wins, challenges, and anything you want Jude to know..."
                  value={personalNote}
                  onChange={e => setPersonalNote(e.target.value)}
                  className="min-h-[120px] text-xs border-border/20"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* NEXT WEEK PLAN */}
        <TabsContent value="plan" className="space-y-4">
          <Card className="border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gold" />
                Next Week: {fmtDisplay(nextMonday)} – {fmtDisplay(nextSunday)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextWeekEvents.length > 0 ? (
                <div className="space-y-2">
                  {nextWeekEvents.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/20 border border-border/10">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[9px]">{ev.type}</Badge>
                        <div>
                          <p className="text-xs font-medium text-foreground">{ev.retailer_name || ev.title}</p>
                          {ev.town && <p className="text-[10px] text-muted-foreground">{ev.town}</p>}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic text-center py-8">
                  No events scheduled for next week. Add events in the Sales Calendar to populate this section.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Priority targets for next week */}
          <Card className="border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Target className="w-4 h-4 text-gold" />Priority Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground mb-3">Accounts most ready for action based on pipeline stage and score</p>
              <div className="space-y-2">
                {retailers
                  .filter(r => ["priority_outreach", "follow_up_needed", "meeting_booked"].includes(r.pipeline_stage))
                  .slice(0, 6)
                  .map(r => (
                    <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/20 transition-colors">
                      <div>
                        <p className="text-xs font-medium text-foreground">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.town} · {PIPELINE_LABELS[r.pipeline_stage]}</p>
                      </div>
                      <Badge className="bg-champagne/30 text-gold-dark text-[9px]">Score: {r.priority_score ?? 0}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUSTOMISE */}
        <TabsContent value="customise" className="space-y-4">
          <Card className="border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display">Report Sections</CardTitle>
              <p className="text-[10px] text-muted-foreground">Toggle sections on/off to control what's included in the report sent to Jude</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.map(s => (
                <div key={s.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/10 border border-border/10">
                  <div className="flex items-center gap-3">
                    <s.icon className={`w-4 h-4 ${s.enabled ? 'text-gold' : 'text-muted-foreground/40'}`} />
                    <div>
                      <p className={`text-xs font-medium ${s.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.description}</p>
                    </div>
                  </div>
                  <Switch checked={s.enabled} onCheckedChange={() => toggleSection(s.id)} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Send className="w-4 h-4 text-gold" />Send Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 block">Recipient Email</label>
                <Input
                  type="email"
                  placeholder="jude@nomination.co.uk"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="text-xs border-border/20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function buildReportHTML(data: any): string {
  const enabled = (id: string) => data.enabledSections.includes(id);
  let sections = "";

  if (enabled("kpi_summary")) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#b8860b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:6px">📊 KPI Summary</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr><td style="padding:8px;background:#f9f6ef;border:1px solid #e8e4dc;font-size:13px"><strong>Total Accounts</strong></td><td style="padding:8px;border:1px solid #e8e4dc;font-size:13px">${data.stats.totalAccounts}</td></tr>
        <tr><td style="padding:8px;background:#f9f6ef;border:1px solid #e8e4dc;font-size:13px"><strong>2025 Billing</strong></td><td style="padding:8px;border:1px solid #e8e4dc;font-size:13px">£${data.stats.totalBilling2025.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;background:#f9f6ef;border:1px solid #e8e4dc;font-size:13px"><strong>2026 YTD</strong></td><td style="padding:8px;border:1px solid #e8e4dc;font-size:13px">£${data.stats.totalBilling2026.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;background:#f9f6ef;border:1px solid #e8e4dc;font-size:13px"><strong>At Risk</strong></td><td style="padding:8px;border:1px solid #e8e4dc;font-size:13px">${data.stats.atRiskCount}</td></tr>
      </table>
    </div>`;
  }

  if (enabled("activity_log")) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#b8860b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:6px">📋 Activity This Week</h2>
      <p style="font-size:13px;margin-top:8px">Meetings: ${data.stats.meetingsThisWeek} | Calls: ${data.stats.callsThisWeek} | Visits: ${data.stats.visitsThisWeek}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px">
        <tr style="background:#f9f6ef"><th style="padding:6px;border:1px solid #e8e4dc;text-align:left">Event</th><th style="padding:6px;border:1px solid #e8e4dc;text-align:left">Type</th><th style="padding:6px;border:1px solid #e8e4dc;text-align:left">Date</th><th style="padding:6px;border:1px solid #e8e4dc;text-align:left">Status</th></tr>
        ${data.thisWeekEvents.map((e: any) => `<tr><td style="padding:6px;border:1px solid #e8e4dc">${e.retailer_name || e.title}</td><td style="padding:6px;border:1px solid #e8e4dc">${e.type}</td><td style="padding:6px;border:1px solid #e8e4dc">${e.date}</td><td style="padding:6px;border:1px solid #e8e4dc">${e.completed ? '✅ Done' : '⏳ Pending'}</td></tr>`).join("")}
      </table>
    </div>`;
  }

  if (enabled("billing_performance")) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#b8860b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:6px">⭐ Top Performers</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px">
        <tr style="background:#f9f6ef"><th style="padding:6px;border:1px solid #e8e4dc;text-align:left">Account</th><th style="padding:6px;border:1px solid #e8e4dc;text-align:left">Town</th><th style="padding:6px;border:1px solid #e8e4dc;text-align:right">2025</th><th style="padding:6px;border:1px solid #e8e4dc;text-align:right">2024</th></tr>
        ${data.topPerformers.map((r: any) => `<tr><td style="padding:6px;border:1px solid #e8e4dc">${r.name}</td><td style="padding:6px;border:1px solid #e8e4dc">${r.town}</td><td style="padding:6px;border:1px solid #e8e4dc;text-align:right">£${Number(r.billing2025 || 0).toLocaleString()}</td><td style="padding:6px;border:1px solid #e8e4dc;text-align:right">£${Number(r.billing2024 || 0).toLocaleString()}</td></tr>`).join("")}
      </table>
    </div>`;
  }

  if (enabled("at_risk") && data.atRiskAccounts.length > 0) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#c0392b;font-size:16px;border-bottom:2px solid #c0392b;padding-bottom:6px">⚠️ At-Risk Accounts</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px">
        ${data.atRiskAccounts.map((r: any) => `<tr><td style="padding:6px;border:1px solid #e8e4dc">${r.name} (${r.town})</td><td style="padding:6px;border:1px solid #e8e4dc;color:#c0392b">${(r.flags || []).join(", ")}</td></tr>`).join("")}
      </table>
    </div>`;
  }

  if (enabled("next_week_plan")) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#b8860b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:6px">📅 Next Week Plan (${data.nextWeekOf})</h2>
      ${data.nextWeekEvents.length > 0 ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px">
        ${data.nextWeekEvents.map((e: any) => `<tr><td style="padding:6px;border:1px solid #e8e4dc">${e.date}</td><td style="padding:6px;border:1px solid #e8e4dc">${e.title}</td><td style="padding:6px;border:1px solid #e8e4dc">${e.retailer_name || ""}</td></tr>`).join("")}
      </table>` : `<p style="font-size:13px;color:#999;margin-top:8px">No events scheduled yet.</p>`}
    </div>`;
  }

  if (enabled("pipeline_movement")) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#b8860b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:6px">📊 Pipeline Breakdown</h2>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px">
        ${Object.entries(data.pipelineCounts).map(([stage, count]) => `<tr><td style="padding:6px;border:1px solid #e8e4dc">${stage.replace(/_/g, " ")}</td><td style="padding:6px;border:1px solid #e8e4dc;text-align:right;font-weight:bold">${count}</td></tr>`).join("")}
      </table>
    </div>`;
  }

  if (enabled("personal_note") && data.personalNote) {
    sections += `<div style="margin-bottom:24px">
      <h2 style="color:#b8860b;font-size:16px;border-bottom:2px solid #d4af37;padding-bottom:6px">📝 Notes from Emma</h2>
      <p style="font-size:13px;white-space:pre-wrap;background:#f9f6ef;padding:12px;border-radius:6px;margin-top:8px">${data.personalNote}</p>
    </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Weekly Review — ${data.weekOf}</title>
    <style>@media print{body{margin:0}}</style></head>
    <body style="font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:20px auto;padding:20px;color:#333">
      <div style="text-align:center;margin-bottom:30px;border-bottom:3px solid #d4af37;padding-bottom:16px">
        <h1 style="color:#b8860b;font-size:22px;margin:0">Nomination · Weekly Review</h1>
        <p style="font-size:14px;color:#666;margin:8px 0 0">Week of ${data.weekOf}</p>
        <p style="font-size:11px;color:#999;margin:4px 0 0">Emma-Louise Gregory · South West & Wales</p>
      </div>
      ${sections}
      <div style="text-align:center;margin-top:30px;padding-top:12px;border-top:1px solid #e8e4dc">
        <p style="font-size:10px;color:#999">Generated by Nomination AI Platform · ${new Date().toLocaleDateString("en-GB")}</p>
      </div>
    </body></html>`;
}
