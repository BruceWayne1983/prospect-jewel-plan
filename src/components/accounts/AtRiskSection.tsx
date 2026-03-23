import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Retailer } from "@/hooks/useRetailers";

interface AtRiskSectionProps {
  retailers: Retailer[];
}

export function AtRiskSection({ retailers }: AtRiskSectionProps) {
  const navigate = useNavigate();
  const atRisk = retailers.filter((r) => (r.risk_flags ?? []).length > 0);

  if (atRisk.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">
          Accounts Needing Attention ({atRisk.length})
        </h3>
      </div>
      <div className="space-y-2">
        {atRisk.slice(0, 5).map((r) => (
          <div
            key={r.id}
            onClick={() => navigate(`/retailer/${r.id}`)}
            className="flex items-center justify-between p-2.5 rounded-lg bg-background/80 hover:bg-background cursor-pointer transition-colors group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate group-hover:text-gold-dark transition-colors">
                {r.name}
              </p>
              <p className="text-[10px] text-warning truncate">
                {(r.risk_flags ?? [])[0]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                {r.town}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-gold flex-shrink-0" />
            </div>
          </div>
        ))}
        {atRisk.length > 5 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{atRisk.length - 5} more flagged accounts
          </p>
        )}
      </div>
    </div>
  );
}
