import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, TrendingDown, XCircle, PieChart, Shield, AlertTriangle, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { calculateAnnualisedRate } from "@/utils/annualisation";

interface AccountEntry {
  name: string;
  town?: string;
  cy: number;
  py1: number;
  change_pct: number;
  context?: string;
}

interface ClosedAccount {
  name: string;
  town?: string;
  py1_value: number;
}

interface CategoryEntry {
  category_raw: string;
  category_en: string;
  cy: number;
  py1: number;
}

interface ParsedData {
  territory_total_cy?: number;
  territory_total_py1?: number;
  territory_total_full_py1?: number;
  fair_change_pct?: number;
  adjusted_territory_change_pct?: number;
  accounts_growing?: AccountEntry[];
  accounts_declining?: AccountEntry[];
  closed_accounts?: ClosedAccount[];
  category_breakdown?: CategoryEntry[];
}

interface ReportInsightsProps {
  report: {
    id: string;
    report_type: string;
    ai_summary: string | null;
    parsed_data: ParsedData | null;
    territory_total_cy: number | null;
    territory_total_py1: number | null;
    period_start: string | null;
    period_end: string | null;
  };
}

const CATEGORY_TRANSLATIONS: Record<string, { en: string; desc: string; icon: string }> = {
  "1-COMPOSABLE": { en: "Composable® Bracelets & Decorated Links", desc: "The core product — charm bracelets and individual links", icon: "💎" },
  "2-FASHION": { en: "Fashion Jewellery Collection", desc: "Rings, necklaces, earrings — strategically important growth area", icon: "✨" },
  "3-RICAVI ACCESSORI": { en: "Accessories", desc: "Display stands, packaging, POS materials", icon: "🎁" },
  ".-ALTRO": { en: "Returns & Credit Adjustments", desc: "NOT sales. Negative numbers here are completely normal.", icon: "↩️" },
};

function formatCurrency(v: number): string {
  if (Math.abs(v) >= 1000) return `£${(v / 1000).toFixed(1)}k`;
  return `£${v.toLocaleString()}`;
}

function formatFullCurrency(v: number): string {
  return `£${Math.round(v).toLocaleString()}`;
}

function calcTerritoryScore(data: ParsedData): { score: number; breakdown: { label: string; value: number; weight: number }[] } {
  const growing = data.accounts_growing?.length || 0;
  const declining = data.accounts_declining?.length || 0;
  const total = growing + declining;

  // % of active accounts growing (weight: 40%)
  const growthRatio = total > 0 ? (growing / total) * 100 : 50;

  // Like-for-like growth rate (weight: 30%) — map -20%..+20% to 0..100
  const fairChange = data.adjusted_territory_change_pct ?? data.fair_change_pct ?? 0;
  const growthScore = Math.max(0, Math.min(100, 50 + fairChange * 2.5));

  // Growth diversity — not relying on 1-2 accounts (weight: 20%)
  const diversityScore = growing >= 5 ? 100 : growing >= 3 ? 75 : growing >= 1 ? 50 : 0;

  // Fashion growth (weight: 10%)
  const fashion = data.category_breakdown?.find(c => c.category_raw?.includes("FASHION") || c.category_en?.toLowerCase().includes("fashion"));
  const fashionScore = fashion && fashion.py1 > 0 ? (fashion.cy > fashion.py1 ? 100 : fashion.cy / fashion.py1 * 100) : 50;

  const breakdown = [
    { label: "Accounts growing", value: Math.round(growthRatio), weight: 40 },
    { label: "Like-for-like growth", value: Math.round(growthScore), weight: 30 },
    { label: "Growth diversity", value: Math.round(diversityScore), weight: 20 },
    { label: "Fashion collection", value: Math.round(fashionScore), weight: 10 },
  ];

  const score = Math.round(breakdown.reduce((sum, b) => sum + b.value * b.weight / 100, 0));
  return { score, breakdown };
}

export default function ReportInsights({ report }: ReportInsightsProps) {
  const data = (report.parsed_data || {}) as ParsedData;
  const hasData = data.accounts_growing?.length || data.accounts_declining?.length || data.closed_accounts?.length || data.category_breakdown?.length;

  if (!hasData && !report.ai_summary) return null;

  const totalCY = data.territory_total_cy || Number(report.territory_total_cy) || 0;
  const totalPY1 = data.territory_total_py1 || Number(report.territory_total_py1) || 0;
  const totalFullPY1 = data.territory_total_full_py1 || 0;
  const closedPY1 = data.closed_accounts?.reduce((s, a) => s + (a.py1_value || 0), 0) || 0;
  const fairChange = data.fair_change_pct ?? (totalPY1 > 0 ? ((totalCY - totalPY1) / totalPY1 * 100) : 0);
  const adjustedChange = data.adjusted_territory_change_pct ?? (totalPY1 > closedPY1 && closedPY1 > 0 ? ((totalCY - (totalPY1 - closedPY1)) / (totalPY1 - closedPY1) * 100) : fairChange);

  const { score: territoryScore, breakdown: scoreBreakdown } = calcTerritoryScore(data);
  const scoreColor = territoryScore >= 70 ? "text-emerald-600" : territoryScore >= 50 ? "text-primary" : "text-destructive";
  const scoreBg = territoryScore >= 70 ? "bg-emerald-500" : territoryScore >= 50 ? "bg-primary" : "bg-destructive";

  const isUnfairReport = report.report_type === "fat013";
  const showUnfairSection = totalFullPY1 > 0 || isUnfairReport;

  // Annualised run rate — based on the report's actual reporting period
  const { rate: annualisedRate, isEstimate: annualisedIsEstimate } = calculateAnnualisedRate(
    totalCY,
    report.period_start,
    report.period_end
  );

  return (
    <div className="space-y-4 mt-4">
      {/* Hero Summary */}
      {report.ai_summary && (
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">What this report actually says</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.ai_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Territory headline */}
      {totalCY > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Your territory (this year)" value={formatFullCurrency(totalCY)} accent />
          {totalPY1 > 0 && <MetricCard label="Same period last year" value={formatFullCurrency(totalPY1)} />}
          <MetricCard
            label="Fair like-for-like"
            value={`${fairChange >= 0 ? "+" : ""}${fairChange.toFixed(1)}%`}
            valueColor={fairChange >= 0 ? "text-emerald-600" : "text-destructive"}
          />
          {closedPY1 > 0 && (
            <MetricCard
              label="Adjusted (excl. closures)"
              value={`${adjustedChange >= 0 ? "+" : ""}${adjustedChange.toFixed(1)}%`}
              valueColor={adjustedChange >= 0 ? "text-emerald-600" : "text-destructive"}
            />
          )}
        </div>
      )}

      {/* Territory Score */}
      {hasData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Your Territory Score</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", scoreColor)}>{territoryScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Progress value={territoryScore} className="h-2 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {scoreBreakdown.map(b => (
                <div key={b.label} className="text-center">
                  <p className="text-lg font-semibold text-foreground">{b.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{b.label}</p>
                  <p className="text-[9px] text-muted-foreground/60">{b.weight}% weight</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center italic">This score reflects your REAL performance — not the misleading headline in the raw report</p>
          </CardContent>
        </Card>
      )}

      {/* Winners */}
      {data.accounts_growing && data.accounts_growing.length > 0 && (
        <AccountSection
          title="Your Winners"
          subtitle={`${data.accounts_growing.length} of your active accounts are growing`}
          icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
          accounts={data.accounts_growing}
          variant="growing"
        />
      )}

      {/* Accounts to Watch */}
      {data.accounts_declining && data.accounts_declining.length > 0 && (
        <AccountSection
          title="Accounts to Watch"
          subtitle={`${data.accounts_declining.length} accounts need attention`}
          icon={<TrendingDown className="h-4 w-4 text-primary" />}
          accounts={data.accounts_declining}
          variant="declining"
        />
      )}

      {/* Closed Accounts */}
      {data.closed_accounts && data.closed_accounts.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Closed Accounts</CardTitle>
            </div>
            <CardDescription className="text-xs">These inflate your prior year comparison but you cannot sell to them.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-2">
              {data.closed_accounts.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50">
                  <div>
                    <p className="text-sm text-muted-foreground line-through">{a.name}</p>
                    {a.town && <p className="text-[10px] text-muted-foreground/60">{a.town}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Last year: {formatFullCurrency(a.py1_value)}</p>
                  </div>
                </div>
              ))}
              <div className="mt-2 p-2 rounded-lg bg-muted/20 text-center">
                <p className="text-xs text-muted-foreground">
                  Removing these accounts ({formatFullCurrency(closedPY1)} in prior year) adjusts your territory change from{" "}
                  <span className={cn("font-semibold", fairChange >= 0 ? "text-emerald-600" : "text-destructive")}>{fairChange >= 0 ? "+" : ""}{fairChange.toFixed(1)}%</span> to{" "}
                  <span className={cn("font-semibold", adjustedChange >= 0 ? "text-emerald-600" : "text-destructive")}>{adjustedChange >= 0 ? "+" : ""}{adjustedChange.toFixed(1)}%</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* The Unfair Comparison */}
      {showUnfairSection && totalCY > 0 && (
        <UnfairComparisonSection
          totalCY={totalCY}
          totalPY1={totalPY1}
          totalFullPY1={totalFullPY1}
          closedPY1={closedPY1}
          annualisedRate={annualisedRate}
          isUnfairReport={isUnfairReport}
          reportType={report.report_type}
        />
      )}

      {/* Category Breakdown */}
      {data.category_breakdown && data.category_breakdown.length > 0 && (
        <CategoryBreakdown categories={data.category_breakdown} />
      )}
    </div>
  );
}

function MetricCard({ label, value, accent, valueColor }: { label: string; value: string; accent?: boolean; valueColor?: string }) {
  return (
    <Card className={accent ? "border-primary/30 bg-primary/[0.03]" : ""}>
      <CardContent className="p-3 text-center">
        <p className={cn("text-lg font-bold", valueColor || (accent ? "text-primary" : "text-foreground"))}>{value}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}

function AccountSection({ title, subtitle, icon, accounts, variant }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accounts: AccountEntry[];
  variant: "growing" | "declining";
}) {
  const [expanded, setExpanded] = useState(false);
  const show = expanded ? accounts : accounts.slice(0, 5);
  const sorted = [...show].sort((a, b) => Math.abs(b.cy - b.py1) - Math.abs(a.cy - a.py1));

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-sm">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {sorted.map((a, i) => {
            const diff = a.cy - a.py1;
            const isPositive = variant === "growing";
            return (
              <div key={i} className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border",
                isPositive ? "bg-emerald-50/50 border-emerald-200/50" : "bg-primary/[0.03] border-primary/20"
              )}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  {a.town && <p className="text-[10px] text-muted-foreground">{a.town}</p>}
                  {a.context && (
                    <p className="text-[10px] text-muted-foreground/80 mt-0.5 italic">{a.context}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-foreground">{formatFullCurrency(a.cy)}</p>
                  <p className={cn("text-[10px] font-medium", isPositive ? "text-emerald-600" : "text-destructive")}>
                    {isPositive ? "+" : ""}{a.change_pct?.toFixed(1)}% ({isPositive ? "+" : ""}{formatCurrency(diff)})
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {accounts.length > 5 && (
          <button onClick={() => setExpanded(!expanded)} className="w-full mt-2 flex items-center justify-center gap-1 text-xs text-primary hover:text-primary/80">
            {expanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show all {accounts.length} accounts</>}
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function UnfairComparisonSection({ totalCY, totalPY1, totalFullPY1, closedPY1, annualisedRate, isUnfairReport, reportType }: {
  totalCY: number;
  totalPY1: number;
  totalFullPY1: number;
  closedPY1: number;
  annualisedRate: number;
  isUnfairReport: boolean;
  reportType: string;
}) {
  const fullYearToUse = totalFullPY1 || totalPY1 * 4; // rough estimate if no full year figure
  const unfairPct = fullYearToUse > 0 ? ((totalCY - fullYearToUse) / fullYearToUse * 100) : 0;

  const timingFactors = [
    { label: "SS26 Composable collection delayed to April (affects ALL agents nationally)", impact: null, checked: true },
    { label: "February 2026 promotion was cancelled by Nomination", impact: null, checked: true },
    ...(closedPY1 > 0 ? [{ label: `Closed accounts removed (${formatFullCurrency(closedPY1)} in prior year base)`, impact: closedPY1, checked: true }] : []),
    { label: "New Composable base price increase £13 → £22 from 1 April (may cause timing shifts)", impact: null, checked: true },
  ];

  return (
    <Card className="border-destructive/20">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-sm">The Unfair Comparison</CardTitle>
        </div>
        <CardDescription className="text-xs">Why the headline number looks worse than reality</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {isUnfairReport && (
          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
            <p className="text-xs text-destructive font-medium">⚠️ This FAT013 report compares your 3 months against a full year. The percentage changes are mathematically meaningless. Use ORD015 or FAT017 for real performance tracking.</p>
          </div>
        )}

        {/* Bar comparison */}
        <div className="space-y-2">
          <BarRow label="Your YTD" value={totalCY} maxValue={fullYearToUse} color="bg-primary" />
          {totalPY1 > 0 && totalPY1 !== totalCY && <BarRow label="Same period last year" value={totalPY1} maxValue={fullYearToUse} color="bg-muted-foreground/40" />}
          {fullYearToUse > totalPY1 && <BarRow label="Full year last year" value={fullYearToUse} maxValue={fullYearToUse} color="bg-muted-foreground/20" unfair />}
        </div>

        {/* Projected run rate */}
        {annualisedRate > 0 && (
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">At your current pace, you'd finish the year at</p>
            <p className="text-lg font-bold text-foreground">{formatFullCurrency(annualisedRate)}</p>
            {fullYearToUse > 0 && (
              <p className="text-[10px] text-muted-foreground">
                That's {((annualisedRate / fullYearToUse - 1) * 100).toFixed(0)}% {annualisedRate >= fullYearToUse ? "above" : "below"} last year's full year
              </p>
            )}
          </div>
        )}

        {/* Timing factors */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Known timing factors affecting your numbers:</p>
          {timingFactors.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-primary mt-0.5">☑</span>
              <span className="text-foreground">{f.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BarRow({ label, value, maxValue, color, unfair }: { label: string; value: number; maxValue: number; color: string; unfair?: boolean }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className={cn("text-[10px]", unfair ? "text-destructive/70 line-through" : "text-muted-foreground")}>{label}</span>
        <span className={cn("text-[10px] font-medium", unfair ? "text-destructive/70" : "text-foreground")}>{formatFullCurrency(value)}</span>
      </div>
      <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color, unfair && "opacity-40")} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories }: { categories: CategoryEntry[] }) {
  const salesCategories = categories.filter(c => !c.category_raw?.includes("ALTRO") && !c.category_en?.toLowerCase().includes("return"));
  const altroCategory = categories.find(c => c.category_raw?.includes("ALTRO") || c.category_en?.toLowerCase().includes("return"));
  const totalCY = salesCategories.reduce((s, c) => s + (c.cy || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Category Breakdown</CardTitle>
        </div>
        <CardDescription className="text-xs">What's selling across your territory</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {/* Visual pie-like bars */}
        {salesCategories.map((c, i) => {
          const trans = CATEGORY_TRANSLATIONS[c.category_raw] || { en: c.category_en || c.category_raw, desc: "", icon: "📊" };
          const share = totalCY > 0 ? (c.cy / totalCY * 100) : 0;
          const change = c.py1 > 0 ? ((c.cy - c.py1) / c.py1 * 100) : (c.cy > 0 ? 100 : 0);
          const colors = ["bg-primary", "bg-accent", "bg-muted-foreground/50"];

          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{trans.icon}</span>
                  <span className="text-xs font-medium text-foreground">{trans.en}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{formatFullCurrency(c.cy)}</span>
                  <span className={cn("text-[10px] font-medium", change >= 0 ? "text-emerald-600" : "text-destructive")}>
                    {change >= 0 ? "+" : ""}{change.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: `${share}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground">{trans.desc}</p>
                <p className="text-[9px] text-muted-foreground">{share.toFixed(0)}% of sales</p>
              </div>
            </div>
          );
        })}

        {/* ALTRO section */}
        {altroCategory && (
          <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">↩️</span>
              <span className="text-xs font-medium text-muted-foreground">Returns & Credit Adjustments</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatFullCurrency(Math.abs(altroCategory.cy))} in adjustments — <span className="italic">negative numbers here are completely normal</span>
            </p>
            {altroCategory.py1 > 0 && Math.abs(altroCategory.cy) > altroCategory.py1 * 1.5 && (
              <p className="text-[10px] text-destructive mt-1">⚠️ Returns are higher than usual — may indicate quality issues or over-ordering</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
