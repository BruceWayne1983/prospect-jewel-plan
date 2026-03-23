import { useNavigate } from "react-router-dom";
import { MapPin, Phone, Mail, Globe, ArrowUpRight, AlertTriangle, Sparkles, Clock } from "lucide-react";
import { Retailer, getOutreach, getActivity, getPerformancePrediction, getAIIntelligence } from "@/hooks/useRetailers";
import { format } from "date-fns";

interface AccountCardProps {
  retailer: Retailer;
}

export function AccountCard({ retailer: r }: AccountCardProps) {
  const navigate = useNavigate();
  const outreach = getOutreach(r);
  const activity = getActivity(r);
  const pred = getPerformancePrediction(r);
  const ai = getAIIntelligence(r);
  const risks = r.risk_flags ?? [];
  const hasAI = ai.summary && ai.lastAnalysed !== "Not yet analysed";

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
      </div>

      {/* Last Contact & Next Action */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
        {activity.lastContactDate && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>Last: {activity.lastContactDate}</span>
          </div>
        )}
        {activity.nextActionDate && (
          <span className="text-gold-dark font-medium">
            Next: {activity.nextActionDate}
          </span>
        )}
      </div>

      {/* Contact quick-view */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {outreach.contactName && (
          <span className="truncate">{outreach.contactName}</span>
        )}
        {r.phone && <Phone className="w-3 h-3 flex-shrink-0" />}
        {r.email && <Mail className="w-3 h-3 flex-shrink-0" />}
        {r.website && <Globe className="w-3 h-3 flex-shrink-0" />}
      </div>

      {/* AI Summary snippet */}
      {ai.summary && (
        <p className="text-[10px] text-muted-foreground/80 mt-2 line-clamp-2 italic">
          {ai.summary}
        </p>
      )}

      {/* Risk flags */}
      {risks.length > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-warning flex-shrink-0" />
          <span className="text-[9px] text-warning truncate">{risks[0]}</span>
          {risks.length > 1 && (
            <span className="text-[8px] text-warning/70">+{risks.length - 1}</span>
          )}
        </div>
      )}
    </div>
  );
}
