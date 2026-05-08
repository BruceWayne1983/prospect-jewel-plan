import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_INPUTS,
  SEED_MONTHLY,
  buildCumulative,
  clearPlan,
  computeBudget,
  loadPlan,
  savePlan,
  type MonthlyRow,
  type ScenarioInputs,
} from "@/data/stockBuildPlan";
import { BudgetKpiTiles } from "@/components/planner/BudgetKpiTiles";
import { BudgetInputsPanel } from "@/components/planner/BudgetInputsPanel";
import { BudgetBreakdownCard } from "@/components/planner/BudgetBreakdownCard";
import { MonthlyComboChart } from "@/components/planner/MonthlyComboChart";
import { CumulativeYoYChart } from "@/components/planner/CumulativeYoYChart";
import { SensitivityBarChart } from "@/components/planner/SensitivityBarChart";
import { MonthlyDataTable } from "@/components/planner/MonthlyDataTable";

const formatSavedAt = (iso?: string) => {
  if (!iso) return "Saved locally";
  try {
    const d = new Date(iso);
    return `Saved ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "Saved locally";
  }
};

export default function StockBuildPlanner() {
  const initial = useMemo(() => loadPlan(), []);
  const [inputs, setInputs] = useState<ScenarioInputs>(initial?.inputs ?? DEFAULT_INPUTS);
  const [monthly, setMonthly] = useState<MonthlyRow[]>(initial?.monthly ?? SEED_MONTHLY);
  const [savedAt, setSavedAt] = useState<string | undefined>(initial?.savedAt);

  const outputs = useMemo(() => computeBudget(monthly, inputs), [monthly, inputs]);
  const cumulative = useMemo(() => buildCumulative(monthly), [monthly]);

  useEffect(() => {
    const saved = savePlan({ inputs, monthly });
    if (saved) setSavedAt(saved.savedAt);
    else toast.error("Couldn't save your plan to this browser.");
  }, [inputs, monthly]);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setMonthly(SEED_MONTHLY);
    clearPlan();
    setSavedAt(undefined);
    toast.success("Plan reset to defaults");
  };

  return (
    <div className="page-container">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="section-header mb-2">Planning</p>
          <h1 className="page-title">Stock Build Planner</h1>
          <p className="page-subtitle">
            Plan the annual stock build order budget by category and growth scenario
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream/50 border border-border/40">
          <Save className="w-3 h-3 text-gold" strokeWidth={1.75} />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {formatSavedAt(savedAt)}
          </span>
        </div>
      </div>
      <div className="divider-gold" />

      <BudgetKpiTiles
        outputs={outputs}
        growthAmbitionPct={inputs.growthAmbitionPct}
        allocationPct={inputs.stockBuildAllocationPct}
        charmsPct={inputs.categorySplits.charms}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BudgetInputsPanel
            inputs={inputs}
            categorySum={outputs.categorySum}
            categorySumValid={outputs.categorySumValid}
            onChange={setInputs}
            onReset={handleReset}
          />
        </div>
        <div className="lg:col-span-2">
          <BudgetBreakdownCard outputs={outputs} />
        </div>
      </div>

      <MonthlyComboChart monthly={monthly} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CumulativeYoYChart cumulative={cumulative} />
        <SensitivityBarChart monthly={monthly} inputs={inputs} />
      </div>

      <MonthlyDataTable monthly={monthly} onChange={setMonthly} />
    </div>
  );
}
