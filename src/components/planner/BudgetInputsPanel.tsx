import { RotateCcw, Sliders } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  SCENARIO_PRESETS,
  type ScenarioInputs,
  type CategorySplits,
} from "@/data/stockBuildPlan";

interface Props {
  inputs: ScenarioInputs;
  categorySum: number;
  categorySumValid: boolean;
  onChange: (next: ScenarioInputs) => void;
  onReset: () => void;
}

const clamp = (n: number, min: number, max: number) =>
  Number.isFinite(n) ? Math.min(Math.max(n, min), max) : min;

export function BudgetInputsPanel({ inputs, categorySum, categorySumValid, onChange, onReset }: Props) {
  const setGrowth = (v: number) =>
    onChange({ ...inputs, growthAmbitionPct: clamp(v, 0, 200) });
  const setAllocation = (v: number) =>
    onChange({ ...inputs, stockBuildAllocationPct: clamp(v, 0, 100) });
  const setSplit = (key: keyof CategorySplits, v: number) =>
    onChange({
      ...inputs,
      categorySplits: { ...inputs.categorySplits, [key]: clamp(v, 0, 100) },
    });

  const activePreset = SCENARIO_PRESETS.find(p => p.growthAmbitionPct === inputs.growthAmbitionPct);

  return (
    <div className="card-premium p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">Scenario Inputs</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3 h-3 mr-1.5" strokeWidth={1.75} />
          Reset
        </Button>
      </div>

      <div className="flex gap-1.5 mb-5">
        {SCENARIO_PRESETS.map(p => {
          const active = activePreset?.key === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setGrowth(p.growthAmbitionPct)}
              className={`flex-1 px-2.5 py-1.5 text-[11px] rounded-lg border transition-all ${
                active
                  ? "border-gold/40 bg-champagne/40 text-gold-dark font-semibold"
                  : "border-border/40 bg-cream/30 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {p.label}
              <span className="block text-[9px] opacity-70 mt-0.5">{p.growthAmbitionPct}% growth</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5 flex-1">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="growth-ambition" className="text-xs uppercase tracking-wider text-muted-foreground">
              Growth Ambition (incl. price increase)
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="growth-ambition"
                type="number"
                value={inputs.growthAmbitionPct}
                onChange={e => setGrowth(Number(e.target.value))}
                className="h-8 w-16 text-right text-sm"
                min={0}
                max={200}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[inputs.growthAmbitionPct]}
            onValueChange={v => setGrowth(v[0])}
            min={0}
            max={100}
            step={1}
          />
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            Year-on-year uplift Emma expects to land, with ~15% price increase factored in.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="allocation" className="text-xs uppercase tracking-wider text-muted-foreground">
              % to Stock Build Order
            </Label>
            <div className="flex items-center gap-1.5">
              <Input
                id="allocation"
                type="number"
                value={inputs.stockBuildAllocationPct}
                onChange={e => setAllocation(Number(e.target.value))}
                className="h-8 w-16 text-right text-sm"
                min={0}
                max={100}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <Slider
            value={[inputs.stockBuildAllocationPct]}
            onValueChange={v => setAllocation(v[0])}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            Share of expected spend committed up-front to the stock build order.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category Split</Label>
            <span
              className={`text-[10px] font-medium ${
                categorySumValid ? "text-muted-foreground" : "text-destructive"
              }`}
            >
              Sum: {categorySum}%
              {categorySum < 100 && categorySumValid && (
                <span className="text-muted-foreground/60"> · {(100 - categorySum).toFixed(0)}% unallocated</span>
              )}
            </span>
          </div>
          <div className="space-y-2.5">
            {(
              [
                { key: "fashion" as const, label: "Fashion" },
                { key: "fashionBases" as const, label: "Fashion Bases" },
                { key: "charms" as const, label: "Charms" },
              ]
            ).map(row => (
              <div key={row.key} className="flex items-center gap-3">
                <span className="text-[12px] text-foreground w-28">{row.label}</span>
                <Slider
                  value={[inputs.categorySplits[row.key]]}
                  onValueChange={v => setSplit(row.key, v[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={inputs.categorySplits[row.key]}
                  onChange={e => setSplit(row.key, Number(e.target.value))}
                  className="h-8 w-16 text-right text-sm"
                  min={0}
                  max={100}
                />
              </div>
            ))}
          </div>
          {!categorySumValid && (
            <p className="text-[11px] text-destructive mt-2">
              Categories total more than 100% — reduce one of the splits.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
