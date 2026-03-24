import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertOctagon, Clock, TrendingDown, ArrowUpRight } from "lucide-react";
import type { Retailer } from "@/hooks/useRetailers";

export interface AccountAlert {
  retailerId: string;
  retailerName: string;
  town: string;
  type: "zero_orders" | "sharp_decline" | "critical_decline" | "overdue_visit";
  label: string;
  severity: "critical" | "high" | "medium";
}

export function computeAlerts(retailers: Retailer[], calendarEvents?: any[]): AccountAlert[] {
  const alerts: AccountAlert[] = [];
  const now = new Date();
  const approved = retailers.filter(r => r.pipeline_stage === "approved" || r.pipeline_stage === "retention_risk");

  for (const r of approved) {
    const billing2025 = parseFloat((r as any).billing_2025_full_year) || 0;
    const billing2026YTD = parseFloat((r as any).billing_2026_ytd) || 0;
    const monthsElapsed = now.getMonth() + (now.getDate() / 30);
    const annualisedRate = monthsElapsed > 0 ? billing2026YTD * (12 / monthsElapsed) : 0;

    // Zero orders alert
    if ((billing2026YTD === 0 || !(r as any).billing_2026_ytd) && billing2025 > 0 && now > new Date("2026-01-31")) {
      alerts.push({
        retailerId: r.id, retailerName: r.name, town: r.town,
        type: "zero_orders", label: "No orders yet in 2026", severity: "critical",
      });
    }

    // Critical decline (50%+)
    if (billing2025 > 0 && billing2026YTD > 0 && annualisedRate < billing2025 * 0.5) {
      alerts.push({
        retailerId: r.id, retailerName: r.name, town: r.town,
        type: "critical_decline", label: "Critical — urgent attention needed", severity: "critical",
      });
    }
    // Sharp decline (30%+)
    else if (billing2025 > 0 && billing2026YTD > 0 && annualisedRate < billing2025 * 0.7) {
      alerts.push({
        retailerId: r.id, retailerName: r.name, town: r.town,
        type: "sharp_decline", label: "Significant YTD decline", severity: "high",
      });
    }

    // Overdue visit
    if (calendarEvents) {
      const recentVisit = calendarEvents.find(
        e => e.retailer_id === r.id && e.type === "visit" && 
        new Date(e.date) > new Date(now.getTime() - 90 * 86400000)
      );
      if (!recentVisit) {
        alerts.push({
          retailerId: r.id, retailerName: r.name, town: r.town,
          type: "overdue_visit", label: "No visit in 90+ days", severity: "medium",
        });
      }
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

interface AlertsSectionProps {
  alerts: AccountAlert[];
  title?: string;
  maxItems?: number;
}

export function AlertsSection({ alerts, title = "⚠️ Accounts Needing Attention", maxItems }: AlertsSectionProps) {
  const navigate = useNavigate();
  const displayed = maxItems ? alerts.slice(0, maxItems) : alerts;

  if (alerts.length === 0) return null;

  const getAlertIcon = (type: AccountAlert["type"]) => {
    switch (type) {
      case "critical_decline": return <AlertOctagon className="w-4 h-4 text-destructive" />;
      case "zero_orders": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "sharp_decline": return <TrendingDown className="w-4 h-4 text-warning" />;
      case "overdue_visit": return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  const getSeverityBg = (severity: AccountAlert["severity"]) => {
    switch (severity) {
      case "critical": return "bg-destructive/5 border-destructive/20";
      case "high": return "bg-warning/5 border-warning/20";
      case "medium": return "bg-muted/50 border-border/20";
    }
  };

  return (
    <div className="card-premium p-6 border-destructive/20 bg-destructive/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">{title}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="space-y-2">
        {displayed.map((alert, i) => (
          <div
            key={`${alert.retailerId}-${alert.type}-${i}`}
            onClick={() => navigate(`/retailer/${alert.retailerId}`)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${getSeverityBg(alert.severity)}`}
          >
            {getAlertIcon(alert.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{alert.retailerName}</p>
              <p className="text-[10px] text-muted-foreground">{alert.town}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              alert.severity === "critical" ? "bg-destructive/10 text-destructive" :
              alert.severity === "high" ? "bg-warning/10 text-warning" :
              "bg-muted text-muted-foreground"
            }`}>{alert.label}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
          </div>
        ))}
      </div>
      {maxItems && alerts.length > maxItems && (
        <button onClick={() => navigate("/accounts")} className="text-xs text-gold hover:text-gold-dark mt-3 flex items-center gap-1 font-medium">
          View all {alerts.length} alerts <ArrowUpRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
