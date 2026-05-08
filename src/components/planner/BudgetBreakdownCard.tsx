import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieIcon, AlertTriangle } from "lucide-react";
import type { BudgetOutputs } from "@/data/stockBuildPlan";
import { formatCurrency } from "@/data/stockBuildPlan";

interface Props {
  outputs: BudgetOutputs;
}

const COLORS = {
  charms: "hsl(34 52% 50%)",
  fashionBases: "hsl(38 38% 70%)",
  fashion: "hsl(32 48% 38%)",
  unallocated: "hsl(34 18% 89%)",
};

export function BudgetBreakdownCard({ outputs }: Props) {
  const unallocatedPct = Math.max(0, 100 - outputs.categorySum);
  const unallocatedAmount = outputs.stockBuildBudget * (unallocatedPct / 100);

  const data = [
    { name: "Charms", value: outputs.charmBudget, color: COLORS.charms },
    { name: "Fashion Bases", value: outputs.fashionBasesBudget, color: COLORS.fashionBases },
    { name: "Fashion", value: outputs.fashionBudget, color: COLORS.fashion },
    ...(unallocatedAmount > 0
      ? [{ name: "Unallocated", value: unallocatedAmount, color: COLORS.unallocated }]
      : []),
  ].filter(d => d.value > 0);

  return (
    <div className="card-premium p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <PieIcon className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">Budget Allocation</h3>
        </div>
        {!outputs.categorySumValid && (
          <span className="flex items-center gap-1.5 text-[10px] text-destructive">
            <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
            Splits over 100%
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
        <div className="sm:col-span-2 relative h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={2}
                stroke="hsl(40 30% 99%)"
                strokeWidth={2}
              >
                {data.map(d => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(34 18% 89%)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Stock Build</p>
            <p className="text-xl font-display font-bold text-foreground">
              {formatCurrency(outputs.stockBuildBudget)}
            </p>
          </div>
        </div>

        <div className="sm:col-span-3 space-y-2.5">
          {[
            { label: "Charms", amount: outputs.charmBudget, color: COLORS.charms, accent: true },
            { label: "Fashion Bases", amount: outputs.fashionBasesBudget, color: COLORS.fashionBases },
            { label: "Fashion", amount: outputs.fashionBudget, color: COLORS.fashion },
            ...(unallocatedAmount > 0
              ? [{ label: "Unallocated", amount: unallocatedAmount, color: COLORS.unallocated }]
              : []),
          ].map(row => (
            <div
              key={row.label}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
                row.accent ? "border-gold/30 bg-champagne/20" : "border-border/30 bg-cream/30"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: row.color }}
                  aria-hidden
                />
                <span className="text-sm font-medium text-foreground">{row.label}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-display font-semibold text-foreground">
                  {formatCurrency(row.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {outputs.stockBuildBudget > 0
                    ? `${((row.amount / outputs.stockBuildBudget) * 100).toFixed(0)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
