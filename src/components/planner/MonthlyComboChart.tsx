import {
  ComposedChart,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { MonthlyRow } from "@/data/stockBuildPlan";
import { formatCurrency } from "@/data/stockBuildPlan";

interface Props {
  monthly: MonthlyRow[];
}

export function MonthlyComboChart({ monthly }: Props) {
  const data = monthly.map(r => ({
    month: r.month,
    "2025": r.actual2025,
    "2026": r.actual2026,
    Phasing: r.typicalPhasingPct,
  }));

  return (
    <div className="card-premium p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <BarChart3 className="w-5 h-5 text-gold" strokeWidth={1.5} />
        <h3 className="text-lg font-display font-semibold text-foreground">
          Monthly Wholesale — 2025 vs 2026
        </h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(34 18% 89%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }}
              tickFormatter={v => `£${(v / 1000).toFixed(1)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }}
              tickFormatter={v => `${v}%`}
              domain={[0, "dataMax + 5"]}
            />
            <Tooltip
              formatter={(v: number, name) =>
                name === "Phasing" ? [`${v.toFixed(1)}%`, "Typical phasing"] : [formatCurrency(v), name]
              }
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(34 18% 89%)",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar
              yAxisId="left"
              dataKey="2025"
              fill="hsl(34 52% 50% / 0.5)"
              stroke="hsl(34 52% 50%)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="2026"
              fill="hsl(152 40% 38% / 0.4)"
              stroke="hsl(152 40% 38%)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Phasing"
              stroke="hsl(32 48% 38%)"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(32 48% 38%)" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
