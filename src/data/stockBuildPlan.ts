// Stock Build Planner — data layer.
// Pure types, seed values from Emma's spreadsheet, derivation logic, and
// localStorage persistence. Kept independent of the existing salesForecast
// (different shape: calendar year, single-brand wholesale figures).

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
export type MonthKey = typeof MONTHS[number];

export interface MonthlyRow {
  month: MonthKey;
  typicalPhasingPct: number;
  actual2025: number;
  actual2026: number | null;
}

export interface CategorySplits {
  fashion: number;
  fashionBases: number;
  charms: number;
}

export interface ScenarioInputs {
  growthAmbitionPct: number;
  stockBuildAllocationPct: number;
  categorySplits: CategorySplits;
}

export interface BudgetOutputs {
  octJanSpend: number;
  expectedSpend: number;
  stockBuildBudget: number;
  fashionBudget: number;
  fashionBasesBudget: number;
  charmBudget: number;
  categorySum: number;
  categorySumValid: boolean;
}

export interface PlanState {
  inputs: ScenarioInputs;
  monthly: MonthlyRow[];
  savedAt?: string;
}

export const DEFAULT_INPUTS: ScenarioInputs = {
  growthAmbitionPct: 35,
  stockBuildAllocationPct: 70,
  categorySplits: { fashion: 5, fashionBases: 10, charms: 80 },
};

export const SEED_MONTHLY: MonthlyRow[] = [
  { month: 'Jan', typicalPhasingPct: 6.1, actual2025: 1663, actual2026: 2340 },
  { month: 'Feb', typicalPhasingPct: 8.1, actual2025: 3405, actual2026: 3968 },
  { month: 'Mar', typicalPhasingPct: 4.4, actual2025: 1196, actual2026: 4685 },
  { month: 'Apr', typicalPhasingPct: 5.5, actual2025: 1331, actual2026: 987 },
  { month: 'May', typicalPhasingPct: 4.4, actual2025: 762, actual2026: null },
  { month: 'Jun', typicalPhasingPct: 6.0, actual2025: 814, actual2026: null },
  { month: 'Jul', typicalPhasingPct: 10.9, actual2025: 351, actual2026: null },
  { month: 'Aug', typicalPhasingPct: 5.7, actual2025: 1106, actual2026: null },
  { month: 'Sep', typicalPhasingPct: 23.7, actual2025: 5225, actual2026: null },
  { month: 'Oct', typicalPhasingPct: 12.3, actual2025: 2959, actual2026: null },
  { month: 'Nov', typicalPhasingPct: 8.3, actual2025: 2630, actual2026: null },
  { month: 'Dec', typicalPhasingPct: 4.6, actual2025: 3507, actual2026: null },
];

export const SCENARIO_PRESETS = [
  { key: 'conservative', label: 'Conservative', growthAmbitionPct: 20 },
  { key: 'target', label: 'Target', growthAmbitionPct: 35 },
  { key: 'stretch', label: 'Stretch', growthAmbitionPct: 50 },
] as const;

const STORAGE_KEY = 'nomination.stock-build-plan.v1';

const monthAt = (rows: MonthlyRow[], month: MonthKey) => rows.find(r => r.month === month);

export function computeBudget(monthly: MonthlyRow[], inputs: ScenarioInputs): BudgetOutputs {
  const oct = monthAt(monthly, 'Oct')?.actual2025 ?? 0;
  const nov = monthAt(monthly, 'Nov')?.actual2025 ?? 0;
  const dec = monthAt(monthly, 'Dec')?.actual2025 ?? 0;
  const jan26 = monthAt(monthly, 'Jan')?.actual2026 ?? 0;

  const octJanSpend = oct + nov + dec + jan26;
  const expectedSpend = octJanSpend * (1 + inputs.growthAmbitionPct / 100);
  const stockBuildBudget = expectedSpend * (inputs.stockBuildAllocationPct / 100);

  const { fashion, fashionBases, charms } = inputs.categorySplits;
  const categorySum = fashion + fashionBases + charms;

  return {
    octJanSpend,
    expectedSpend,
    stockBuildBudget,
    fashionBudget: stockBuildBudget * (fashion / 100),
    fashionBasesBudget: stockBuildBudget * (fashionBases / 100),
    charmBudget: stockBuildBudget * (charms / 100),
    categorySum,
    // Splits may intentionally under-allocate (e.g. holding back contingency).
    // Over-allocation past 100% is the only hard error.
    categorySumValid: categorySum <= 100.5,
  };
}

export interface CumulativeRow {
  month: MonthKey;
  typicalPhasingPct: number;
  actual2025: number | null;
  actual2026: number | null;
  yoyPct: number | null;
  cumulative2025: number;
  cumulative2026: number | null;
}

export function buildCumulative(monthly: MonthlyRow[]): CumulativeRow[] {
  let c25 = 0;
  let c26 = 0;
  let any26 = false;
  return monthly.map(row => {
    c25 += row.actual2025;
    if (row.actual2026 != null) {
      c26 += row.actual2026;
      any26 = true;
    }
    const yoyPct =
      row.actual2026 != null && row.actual2025 > 0
        ? ((row.actual2026 - row.actual2025) / row.actual2025) * 100
        : null;
    return {
      month: row.month,
      typicalPhasingPct: row.typicalPhasingPct,
      actual2025: row.actual2025,
      actual2026: row.actual2026,
      yoyPct,
      cumulative2025: c25,
      cumulative2026: row.actual2026 != null || any26 ? c26 : null,
    };
  });
}

const isMonthlyRow = (v: unknown): v is MonthlyRow =>
  !!v && typeof v === 'object'
  && typeof (v as MonthlyRow).month === 'string'
  && (MONTHS as readonly string[]).includes((v as MonthlyRow).month)
  && typeof (v as MonthlyRow).typicalPhasingPct === 'number'
  && typeof (v as MonthlyRow).actual2025 === 'number'
  && (
    (v as MonthlyRow).actual2026 === null
    || typeof (v as MonthlyRow).actual2026 === 'number'
  );

const isPlanState = (v: unknown): v is PlanState => {
  if (!v || typeof v !== 'object') return false;
  const p = v as PlanState;
  if (!p.inputs || typeof p.inputs !== 'object') return false;
  if (typeof p.inputs.growthAmbitionPct !== 'number') return false;
  if (typeof p.inputs.stockBuildAllocationPct !== 'number') return false;
  const s = p.inputs.categorySplits;
  if (!s || typeof s.fashion !== 'number' || typeof s.fashionBases !== 'number' || typeof s.charms !== 'number') return false;
  if (!Array.isArray(p.monthly) || p.monthly.length !== 12) return false;
  return p.monthly.every(isMonthlyRow);
};

export function loadPlan(): PlanState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPlanState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function savePlan(state: Omit<PlanState, 'savedAt'>): PlanState | null {
  if (typeof window === 'undefined') return null;
  const payload: PlanState = { ...state, savedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function clearPlan(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const formatCurrency = (n: number): string =>
  `£${Math.round(n).toLocaleString('en-GB')}`;

export const formatCurrencyCompact = (n: number): string => {
  if (Math.abs(n) >= 1000) return `£${(n / 1000).toFixed(1)}k`;
  return `£${Math.round(n).toLocaleString('en-GB')}`;
};
