import { Activity, Heart, RefreshCw, Clock } from "lucide-react";
import { Retailer } from "@/hooks/useRetailers";
import {
  getAccountHealth, getHealthColor, getHealthLabel,
  getReorderLabel, getReorderColor,
} from "@/utils/accountHealth";

interface HealthSummaryProps {
  retailers: Retailer[];
}

export function AccountHealthSummary({ retailers }: HealthSummaryProps) {
  if (retailers.length === 0) return null;

  const healths = retailers.map((r) => ({
    retailer: r,
    health: getAccountHealth(r),
  }));

  const excellent = healths.filter((h) => h.health.status === "excellent").length;
  const good = healths.filter((h) => h.health.status === "good").length;
  const attention = healths.filter((h) => h.health.status === "needs_attention").length;
  const atRisk = healths.filter((h) => h.health.status === "at_risk").length;
  const avgScore = Math.round(healths.reduce((s, h) => s + h.health.score, 0) / healths.length);

  const highEngagement = healths.filter((h) => h.health.engagementLevel === "high").length;
  const noEngagement = healths.filter((h) => h.health.engagementLevel === "none").length;

  const onTrack = healths.filter((h) => h.health.reorderStatus === "on_track").length;
  const dueSoon = healths.filter((h) => h.health.reorderStatus === "due_soon").length;
  const overdue = healths.filter((h) => h.health.reorderStatus === "overdue").length;

  const overdue30 = healths.filter((h) => h.health.daysSinceContact !== null && h.health.daysSinceContact > 30).length;

  return (
    <div className="card-premium p-5 border-gold/15">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-4 h-4 text-gold" strokeWidth={1.5} />
        <h3 className="text-sm font-display font-semibold text-foreground">Account Health Overview</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Avg Score: <span className="font-semibold text-foreground">{avgScore}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Health Distribution */}
        <div className="bg-muted/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Health</p>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Excellent", count: excellent, color: "bg-success" },
              { label: "Good", count: good, color: "bg-gold" },
              { label: "Needs Attention", count: attention, color: "bg-warning" },
              { label: "At Risk", count: atRisk, color: "bg-destructive" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${row.color} flex-shrink-0`} />
                <span className="text-[10px] text-muted-foreground flex-1">{row.label}</span>
                <span className="text-[10px] font-semibold text-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement */}
        <div className="bg-muted/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Engagement</p>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-lg font-display font-bold text-foreground">{highEngagement}</p>
              <p className="text-[9px] text-muted-foreground">Highly engaged</p>
            </div>
            <div>
              <p className="text-lg font-display font-bold text-warning">{noEngagement}</p>
              <p className="text-[9px] text-muted-foreground">No engagement</p>
            </div>
            {overdue30 > 0 && (
              <p className="text-[9px] text-destructive font-medium">{overdue30} not contacted in 30+ days</p>
            )}
          </div>
        </div>

        {/* Reorder Tracking */}
        <div className="bg-muted/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Reorders</p>
          </div>
          <div className="space-y-1.5">
            {[
              { label: "On Track", count: onTrack, color: "text-success" },
              { label: "Due Soon", count: dueSoon, color: "text-warning" },
              { label: "Overdue", count: overdue, color: "text-destructive" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className={`text-[10px] font-medium ${row.color}`}>{row.label}</span>
                <span className="text-sm font-display font-bold text-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health Score Bar */}
        <div className="bg-muted/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Heart className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Portfolio</p>
          </div>
          <div className="flex flex-col items-center justify-center h-[calc(100%-24px)]">
            <p className="text-3xl font-display font-bold text-foreground">{avgScore}</p>
            <p className="text-[9px] text-muted-foreground">Avg Health Score</p>
            <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${avgScore >= 80 ? "bg-success" : avgScore >= 60 ? "bg-gold" : avgScore >= 40 ? "bg-warning" : "bg-destructive"}`}
                style={{ width: `${avgScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
