import { Wallet, TrendingUp, PackageOpen, Gem } from "lucide-react";
import type { BudgetOutputs } from "@/data/stockBuildPlan";
import { formatCurrency } from "@/data/stockBuildPlan";

interface Props {
  outputs: BudgetOutputs;
  growthAmbitionPct: number;
  allocationPct: number;
  charmsPct: number;
}

export function BudgetKpiTiles({ outputs, growthAmbitionPct, allocationPct, charmsPct }: Props) {
  const tiles = [
    {
      icon: Wallet,
      label: "Oct–Jan Spend",
      value: formatCurrency(outputs.octJanSpend),
      sub: "2025/26 baseline",
    },
    {
      icon: TrendingUp,
      label: "Expected Spend",
      value: formatCurrency(outputs.expectedSpend),
      sub: `+${growthAmbitionPct}% growth ambition`,
    },
    {
      icon: PackageOpen,
      label: "Stock Build Budget",
      value: formatCurrency(outputs.stockBuildBudget),
      sub: `${allocationPct}% of expected spend`,
    },
    {
      icon: Gem,
      label: "Charm Budget",
      value: formatCurrency(outputs.charmBudget),
      sub: `${charmsPct}% of stock build`,
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {tiles.map(t => (
        <div
          key={t.label}
          className={`stat-card ${t.accent ? "border-gold/30 bg-champagne/20" : ""}`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
              t.accent ? "gold-gradient" : "bg-muted"
            }`}
          >
            <t.icon
              className={`w-4 h-4 ${t.accent ? "text-card" : "text-muted-foreground"}`}
              strokeWidth={1.5}
            />
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{t.value}</p>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t.label}</p>
          <p className="text-[9px] text-muted-foreground/60">{t.sub}</p>
        </div>
      ))}
    </div>
  );
}
