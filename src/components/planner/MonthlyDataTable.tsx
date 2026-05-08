import { useState } from "react";
import { Table2, Pencil, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import {
  buildCumulative,
  formatCurrency,
  type MonthlyRow,
  type MonthKey,
} from "@/data/stockBuildPlan";

interface Props {
  monthly: MonthlyRow[];
  onChange: (next: MonthlyRow[]) => void;
}

const parseNumber = (raw: string): number | null => {
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export function MonthlyDataTable({ monthly, onChange }: Props) {
  const [editPhasing, setEditPhasing] = useState(false);
  const cumulative = buildCumulative(monthly);

  const update = (month: MonthKey, patch: Partial<MonthlyRow>) =>
    onChange(monthly.map(r => (r.month === month ? { ...r, ...patch } : r)));

  const total25 = monthly.reduce((s, r) => s + r.actual2025, 0);
  const total26 = monthly.reduce((s, r) => s + (r.actual2026 ?? 0), 0);
  const phasingTotal = monthly.reduce((s, r) => s + r.typicalPhasingPct, 0);

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Table2 className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">
            Monthly Wholesale Data
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setEditPhasing(v => !v)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {editPhasing ? (
            <>
              <X className="w-3 h-3" strokeWidth={1.75} />
              Done editing phasing
            </>
          ) : (
            <>
              <Pencil className="w-3 h-3" strokeWidth={1.75} />
              Edit phasing
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="h-9 px-3 section-header text-[10px]">Month</TableHead>
              <TableHead className="h-9 px-3 section-header text-[10px] text-right">Phasing %</TableHead>
              <TableHead className="h-9 px-3 section-header text-[10px] text-right">2025 Actual</TableHead>
              <TableHead className="h-9 px-3 section-header text-[10px] text-right">2026 Actual</TableHead>
              <TableHead className="h-9 px-3 section-header text-[10px] text-right">YoY %</TableHead>
              <TableHead className="h-9 px-3 section-header text-[10px] text-right">Cum 2025</TableHead>
              <TableHead className="h-9 px-3 section-header text-[10px] text-right">Cum 2026</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cumulative.map(row => (
              <TableRow key={row.month} className="border-border/20 hover:bg-cream/30">
                <TableCell className="py-2 px-3 text-sm font-medium text-foreground">
                  {row.month}
                </TableCell>
                <TableCell className="py-2 px-3 text-right">
                  {editPhasing ? (
                    <Input
                      type="number"
                      step="0.1"
                      defaultValue={row.typicalPhasingPct}
                      onBlur={e =>
                        update(row.month, {
                          typicalPhasingPct: Number(e.target.value) || 0,
                        })
                      }
                      className="h-8 w-20 text-right text-sm ml-auto"
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {row.typicalPhasingPct.toFixed(1)}%
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-3 text-right">
                  <Input
                    type="number"
                    defaultValue={row.actual2025}
                    onBlur={e =>
                      update(row.month, {
                        actual2025: Number(e.target.value) || 0,
                      })
                    }
                    className="h-8 w-24 text-right text-sm ml-auto"
                  />
                </TableCell>
                <TableCell className="py-2 px-3 text-right">
                  <Input
                    type="number"
                    defaultValue={row.actual2026 ?? ""}
                    placeholder="—"
                    onBlur={e =>
                      update(row.month, {
                        actual2026: parseNumber(e.target.value),
                      })
                    }
                    className="h-8 w-24 text-right text-sm ml-auto"
                  />
                </TableCell>
                <TableCell className="py-2 px-3 text-right text-sm">
                  {row.yoyPct == null ? (
                    <span className="text-muted-foreground/40">—</span>
                  ) : (
                    <span className={row.yoyPct >= 0 ? "text-success" : "text-destructive"}>
                      {row.yoyPct >= 0 ? "+" : ""}
                      {row.yoyPct.toFixed(0)}%
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2 px-3 text-right text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(row.cumulative2025)}
                </TableCell>
                <TableCell className="py-2 px-3 text-right text-sm text-muted-foreground tabular-nums">
                  {row.cumulative2026 == null ? (
                    <span className="text-muted-foreground/40">—</span>
                  ) : (
                    formatCurrency(row.cumulative2026)
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-cream/40">
            <TableRow className="border-t border-border/40">
              <TableCell className="py-2 px-3 text-sm font-display font-semibold">Total</TableCell>
              <TableCell className="py-2 px-3 text-sm text-right font-medium">
                {phasingTotal.toFixed(1)}%
              </TableCell>
              <TableCell className="py-2 px-3 text-sm text-right font-medium tabular-nums">
                {formatCurrency(total25)}
              </TableCell>
              <TableCell className="py-2 px-3 text-sm text-right font-medium tabular-nums">
                {total26 > 0 ? formatCurrency(total26) : "—"}
              </TableCell>
              <TableCell className="py-2 px-3" />
              <TableCell className="py-2 px-3" />
              <TableCell className="py-2 px-3" />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <p className="text-[10px] text-muted-foreground/70 mt-3">
        Edits commit on blur. Leave 2026 blank for months without data — cumulative pauses there.
      </p>
    </div>
  );
}
