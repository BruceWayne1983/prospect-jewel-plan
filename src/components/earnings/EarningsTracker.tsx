import { useState, useMemo } from "react";
import { PoundSterling, TrendingUp, Target, Award, Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import type { Retailer } from "@/hooks/useRetailers";

interface EarningsTrackerProps {
  retailers: Retailer[];
  compact?: boolean;
}

export function EarningsTracker({ retailers, compact = false }: EarningsTrackerProps) {
  const [targetTotal, setTargetTotal] = useState(70000);

  const approvedAccounts = useMemo(() => retailers.filter(r => r.pipeline_stage === "approved"), [retailers]);

  // Count new accounts opened in 2026 (pipeline_stage = approved, created_at in 2026)
  const newAccountsThisYear = useMemo(() => {
    return approvedAccounts.filter(r => {
      const created = new Date(r.created_at);
      return created.getFullYear() === 2026;
    }).length;
  }, [approvedAccounts]);

  const bonusesEarned = newAccountsThisYear * 1000;

  // Billing calculations
  const totalBilling2025 = useMemo(() => {
    return approvedAccounts.reduce((sum, r: any) => sum + (parseFloat(r.billing_2025_full_year) || 0), 0);
  }, [approvedAccounts]);

  const totalBilling2026YTD = useMemo(() => {
    return approvedAccounts.reduce((sum, r: any) => sum + (parseFloat(r.billing_2026_ytd) || 0), 0);
  }, [approvedAccounts]);

  // Annualise 2026 YTD
  const now = new Date();
  const monthsElapsed = now.getMonth() + (now.getDate() / 30);
  const projected2026 = monthsElapsed > 0 ? totalBilling2026YTD * (12 / monthsElapsed) : 0;
  const portfolioGrowth = projected2026 - totalBilling2025;
  const growthCommission = portfolioGrowth > 0 ? portfolioGrowth * 0.04 : 0;

  const baseRetainer = 48000;
  const totalProjectedEarnings = baseRetainer + bonusesEarned + growthCommission;

  // Progress through year
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const yearProgress = (dayOfYear / 365) * 100;
  const earningsProgress = targetTotal > 0 ? (totalProjectedEarnings / targetTotal) * 100 : 0;

  // Reverse calculator
  const growthNeeded = targetTotal > baseRetainer + bonusesEarned
    ? (targetTotal - baseRetainer - bonusesEarned) / 0.04
    : 0;

  const formatCurrency = (v: number) => `£${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

  if (compact) {
    return (
      <div className="card-premium p-5 border-gold/20 bg-champagne/5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <PoundSterling className="w-4 h-4" style={{ color: "hsl(var(--sidebar-background))" }} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">My Earnings</h3>
            <p className="text-[10px] text-muted-foreground">Projected 2026 total compensation</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
            <p className="text-xl font-display font-bold text-foreground">{formatCurrency(totalProjectedEarnings)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Total Projected</p>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
            <p className="text-xl font-display font-bold text-success">{formatCurrency(bonusesEarned)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{newAccountsThisYear} New Accts</p>
          </div>
          <div className="bg-background/60 rounded-lg p-3 text-center border border-border/20">
            <p className="text-xl font-display font-bold text-gold-dark">{formatCurrency(growthCommission)}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Commission</p>
          </div>
        </div>
        {/* Progress bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Year progress</span>
              <span>{yearProgress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${yearProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Earnings vs target ({formatCurrency(targetTotal)})</span>
              <span>{Math.min(earningsProgress, 100).toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${earningsProgress >= yearProgress ? 'bg-success' : 'bg-warning'}`} style={{ width: `${Math.min(earningsProgress, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full view for Reports page
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Base Retainer", value: formatCurrency(baseRetainer), icon: PoundSterling, sub: "£4,000/month" },
          { label: "New Account Bonuses", value: formatCurrency(bonusesEarned), icon: Award, sub: `${newAccountsThisYear} new accounts × £1,000` },
          { label: "Growth Commission", value: formatCurrency(growthCommission), icon: TrendingUp, sub: `4% of ${formatCurrency(Math.max(portfolioGrowth, 0))} growth` },
          { label: "Total Projected", value: formatCurrency(totalProjectedEarnings), icon: Target, sub: "2026 full year" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted mb-3">
              <s.icon className="w-4 h-4 text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground tracking-tight">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</p>
            <p className="text-[9px] text-muted-foreground/70 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Billing breakdown */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Portfolio Billing</h3>
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-cream/50 rounded-lg p-4 text-center border border-border/15">
            <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(totalBilling2025)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">2025 Full Year</p>
          </div>
          <div className="bg-cream/50 rounded-lg p-4 text-center border border-border/15">
            <p className="text-2xl font-display font-bold text-foreground">{formatCurrency(totalBilling2026YTD)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">2026 YTD</p>
          </div>
          <div className="bg-champagne/20 rounded-lg p-4 text-center border border-gold/20">
            <p className="text-2xl font-display font-bold shimmer-gold">{formatCurrency(projected2026)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">2026 Projected</p>
          </div>
        </div>
        {totalBilling2025 > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className={`w-4 h-4 ${portfolioGrowth >= 0 ? 'text-success' : 'text-destructive'}`} />
            <span className={`font-display font-bold ${portfolioGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
              {portfolioGrowth >= 0 ? '+' : ''}{((portfolioGrowth / totalBilling2025) * 100).toFixed(1)}%
            </span>
            <span className="text-muted-foreground">projected YoY growth</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-display font-semibold text-foreground mb-4">Progress Tracking</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Year progress</span>
              <span>{yearProgress.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${yearProgress}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Earnings vs target ({formatCurrency(targetTotal)})</span>
              <span className={earningsProgress >= yearProgress ? 'text-success font-medium' : 'text-warning font-medium'}>
                {Math.min(earningsProgress, 100).toFixed(0)}% — {earningsProgress >= yearProgress ? 'On track ✓' : 'Behind target'}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden relative">
              <div className={`h-full rounded-full transition-all ${earningsProgress >= yearProgress ? 'bg-success' : 'bg-warning'}`} style={{ width: `${Math.min(earningsProgress, 100)}%` }} />
              <div className="absolute top-0 h-full w-0.5 bg-foreground/40" style={{ left: `${yearProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Reverse calculator */}
      <div className="card-premium p-6 border-gold/20">
        <div className="flex items-center gap-2.5 mb-4">
          <Calculator className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-lg font-display font-semibold text-foreground">Earnings Calculator</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Set your target total earnings to see the portfolio growth needed:</p>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-muted-foreground w-20">Target:</span>
          <Slider
            value={[targetTotal]}
            onValueChange={([v]) => setTargetTotal(v)}
            min={48000}
            max={120000}
            step={1000}
            className="flex-1"
          />
          <Input
            type="number"
            value={targetTotal}
            onChange={e => setTargetTotal(parseInt(e.target.value) || 48000)}
            className="w-28 h-9 text-sm text-right"
          />
        </div>
        <div className="bg-champagne/20 rounded-lg p-4 border border-gold/15">
          <p className="text-sm text-foreground">
            To earn <strong className="shimmer-gold">{formatCurrency(targetTotal)}</strong> this year, you need{' '}
            <strong className="text-foreground">{formatCurrency(growthNeeded)}</strong> in portfolio growth
            {totalBilling2025 > 0 && <span className="text-muted-foreground"> ({((growthNeeded / totalBilling2025) * 100).toFixed(1)}% increase)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
