import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { CumulativeRow } from "@/data/stockBuildPlan";
import { formatCurrency } from "@/data/stockBuildPlan";

interface Props {
  cumulative: CumulativeRow[];
}

export function CumulativeYoYChart({ cumulative }: Props) {
  const lastWith2026 = [...cumulative].reverse().find(r => r.cumulative2026 != null);
  const ytdDelta =
    lastWith2026 && lastWith2026.cumulative2026 != null
      ? lastWith2026.cumulative2026 - lastWith2026.cumulative2025
      : 0;
  const ytdPct =
    lastWith2026 && lastWith2026.cumulative2025 > 0 && lastWith2026.cumulative2026 != null
      ? ((lastWith2026.cumulative2026 - lastWith2026.cumulative2025) / lastWith2026.cumulative2025) * 100
      : 0;

  const data = cumulative.map(r => ({
    month: r.month,
    "2025": r.cumulative2025,
    "2026": r.cumulative2026,
  }));

  const positive = ytdDelta >= 0;

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">Cumulative YTD</h3>
        </div>
        {lastWith2026 && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              YTD through {lastWith2026.month}
            </p>
            <p className={`text-sm font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? "+" : ""}
              {formatCurrency(ytdDelta)} · {positive ? "+" : ""}
              {ytdPct.toFixed(0)}% vs 2025
            </p>
          </div>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(34 18% 89%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }} />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }}
              tickFormatter={v => `£${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => formatCurrency(v)}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid hsl(34 18% 89%)",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="2025"
              stroke="hsl(34 52% 50%)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="2026"
              stroke="hsl(152 40% 38%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
