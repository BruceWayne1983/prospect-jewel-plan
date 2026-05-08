import {
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Zap } from "lucide-react";
import {
  computeBudget,
  formatCurrency,
  type MonthlyRow,
  type ScenarioInputs,
} from "@/data/stockBuildPlan";

interface Props {
  monthly: MonthlyRow[];
  inputs: ScenarioInputs;
}

const SCENARIOS = [
  { label: "20%", growth: 20 },
  { label: "35%", growth: 35 },
  { label: "50%", growth: 50 },
  { label: "75%", growth: 75 },
];

export function SensitivityBarChart({ monthly, inputs }: Props) {
  const data = SCENARIOS.map(s => {
    const out = computeBudget(monthly, { ...inputs, growthAmbitionPct: s.growth });
    return {
      label: s.label,
      growth: s.growth,
      charm: Math.round(out.charmBudget),
      stockBuild: Math.round(out.stockBuildBudget),
    };
  });

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">
            Charm Budget Sensitivity
          </h3>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          By growth ambition
        </p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(34 18% 89%)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }}
              tickFormatter={v => `£${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number, name) =>
                name === "charm" ? [formatCurrency(v), "Charm Budget"] : [formatCurrency(v), name]
              }
              labelFormatter={(l, p) => `Growth ambition: ${p?.[0]?.payload.label}`}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(34 18% 89%)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="charm" radius={[6, 6, 0, 0]}>
              {data.map(d => (
                <Cell
                  key={d.label}
                  fill={d.growth === inputs.growthAmbitionPct ? "hsl(34 52% 50%)" : "hsl(34 52% 50% / 0.3)"}
                  stroke={d.growth === inputs.growthAmbitionPct ? "hsl(32 48% 38%)" : "hsl(34 52% 50% / 0.5)"}
                />
              ))}
              <LabelList
                dataKey="charm"
                position="top"
                formatter={(v: number) => formatCurrency(v)}
                style={{ fontSize: 10, fill: "hsl(25 15% 12%)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Highlighted bar matches your current growth ambition ({inputs.growthAmbitionPct}%).
      </p>
    </div>
  );
}
