import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, ArrowUpRight, AlertTriangle, Sparkles, Clock, RefreshCw, Activity, Calendar, Trash2 } from "lucide-react";
import { QuickBookButton } from "@/components/calendar/EventBooker";
import { Retailer, getOutreach, getActivity, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";
import {
  getAccountHealth, getHealthColor, getHealthBg, getHealthLabel,
  getEngagementColor, getReorderLabel, getReorderColor,
} from "@/utils/accountHealth";

interface AccountCardProps {
  retailer: Retailer;
  onRemove?: (id: string, name: string) => void;
}

export function AccountCard({ retailer: r, onRemove }: AccountCardProps) {
  const navigate = useNavigate();
  const outreach = getOutreach(r);
  const activity = getActivity(r);
  const pred = getPerformancePrediction(r);
  const ai = getAIIntelligence(r);
  const risks = r.risk_flags ?? [];
  const hasAI = ai.summary && ai.lastAnalysed !== "Not yet analysed";
  const health = getAccountHealth(r);

  return (
    <div
      onClick={() => navigate(`/retailer/${r.id}`)}
      className="card-premium p-5 cursor-pointer group hover:border-gold/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-gold-dark transition-colors truncate">
              {r.name}
            </h3>
            {hasAI ? (
              <Sparkles className="w-3 h-3 text-gold flex-shrink-0" />
            ) : (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                No AI
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground truncate">
              {r.town}, {r.county}
            </p>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-gold transition-colors flex-shrink-0" />
      </div>

      {/* Health Status Bar */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-lg mb-3 ${getHealthBg(health.status)}`}>
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${getHealthColor(health.status)}`} />
          <span className={`text-[10px] font-semibold ${getHealthColor(health.status)}`}>
            {getHealthLabel(health.status)}
          </span>
          <span className="text-[10px] text-muted-foreground">({health.score})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Engagement dots */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getEngagementColor(health.engagementLevel)}`} />
            <span className="text-[8px] text-muted-foreground capitalize">{health.engagementLevel}</span>
          </div>
        </div>
      </div>

      <div className="divider-gold opacity-30 mb-3" />

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <span
            className={`text-sm font-display font-bold ${
              (r.fit_score ?? 0) >= 85
                ? "score-excellent"
                : (r.fit_score ?? 0) >= 70
                ? "score-good"
                : "score-moderate"
            }`}
          >
            {r.fit_score ?? 0}%
          </span>
          <p className="text-[8px] text-muted-foreground uppercase">Fit</p>
        </div>
        <div className="text-center">
          <span className="text-sm font-display font-bold text-foreground">
            {r.priority_score ?? 0}
          </span>
          <p className="text-[8px] text-muted-foreground uppercase">Priority</p>
        </div>
        <div className="text-center">
          <span className="text-sm font-display font-bold text-foreground">
            {pred.predictedAnnualValue}
          </span>
          <p className="text-[8px] text-muted-foreground uppercase">Annual</p>
        </div>
      </div>

      {/* Reorder & Contact Row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-muted/30 rounded-lg px-2.5 py-2 text-center">
          <RefreshCw className={`w-3 h-3 mx-auto mb-0.5 ${getReorderColor(health.reorderStatus)}`} />
          <p className={`text-[10px] font-semibold ${getReorderColor(health.reorderStatus)}`}>
            {getReorderLabel(health.reorderStatus)}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase">Reorder</p>
        </div>
        <div className="bg-muted/30 rounded-lg px-2.5 py-2 text-center">
          <Clock className="w-3 h-3 mx-auto mb-0.5 text-muted-foreground" />
          <p className="text-[10px] font-semibold text-foreground">
            {health.daysSinceContact !== null ? `${health.daysSinceContact}d ago` : "No data"}
          </p>
          <p className="text-[8px] text-muted-foreground uppercase">Last Contact</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="badge-category text-[9px]">
          {r.category.replace(/_/g, " ")}
        </span>
        {r.store_positioning && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {r.store_positioning.replace("_", " ")}
          </span>
        )}
        {activity.meetingScheduled && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-champagne text-gold-dark font-medium">
            Meeting
          </span>
        )}
        {health.nextActionDate && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-info-light text-info font-medium">
            Next: {health.nextActionDate}
          </span>
        )}
      </div>

      {/* Contact & Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {outreach.contactName && (
            <span className="truncate">{outreach.contactName}</span>
          )}
          {r.phone && <Phone className="w-3 h-3 flex-shrink-0" />}
          {r.email && <Mail className="w-3 h-3 flex-shrink-0" />}
          {r.website && <Globe className="w-3 h-3 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <QuickBookButton retailerId={r.id} retailerName={r.name} town={r.town} defaultType="visit" variant="icon" />
          <QuickBookButton retailerId={r.id} retailerName={r.name} town={r.town} defaultType="call" variant="icon" />
        </div>
      </div>

      {/* AI Summary snippet */}
      {ai.summary && (
        <p className="text-[10px] text-muted-foreground/80 mt-2 line-clamp-2 italic">
          {ai.summary}
        </p>
      )}

      {/* Risk / Health flags */}
      {health.flags.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
          <span className="text-[9px] text-warning truncate">{health.flags[0]}</span>
          {health.flags.length > 1 && (
            <span className="text-[8px] text-warning/70">+{health.flags.length - 1}</span>
          )}
        </div>
      )}
    </div>
  );
}
