import { useState } from "react";
import { PoundSterling, Save, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import type { Retailer } from "@/hooks/useRetailers";

interface BillingPanelProps {
  retailer: Retailer;
  onUpdate: () => void;
}

export function BillingPanel({ retailer: r, onUpdate }: BillingPanelProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    billing_2024: (r as any).billing_2024_full_year?.toString() || "",
    billing_2025: (r as any).billing_2025_full_year?.toString() || "",
    billing_2026: (r as any).billing_2026_ytd?.toString() || "",
  });

  const b2024 = parseFloat((r as any).billing_2024_full_year) || 0;
  const b2025 = parseFloat((r as any).billing_2025_full_year) || 0;
  const b2026ytd = parseFloat((r as any).billing_2026_ytd) || 0;

  const now = new Date();
  const monthsElapsed = now.getMonth() + (now.getDate() / 30);
  const projected2026 = monthsElapsed > 0 ? b2026ytd * (12 / monthsElapsed) : 0;

  const yoyChange2425 = b2024 > 0 ? ((b2025 - b2024) / b2024) * 100 : null;
  const yoyChange2526 = b2025 > 0 ? ((projected2026 - b2025) / b2025) * 100 : null;

  const chartData = [
    { year: "2024", value: b2024 },
    { year: "2025", value: b2025 },
    { year: "2026 (proj)", value: projected2026 },
  ];

  const formatCurrency = (v: number) => v > 0 ? `£${v.toLocaleString("en-GB", { maximumFractionDigits: 0 })}` : "—";

  const save = async () => {
    setSaving(true);
    const updates: Record<string, any> = {
      billing_last_updated: new Date().toISOString(),
    };
    if (form.billing_2024) updates.billing_2024_full_year = parseFloat(form.billing_2024);
    else updates.billing_2024_full_year = null;
    if (form.billing_2025) updates.billing_2025_full_year = parseFloat(form.billing_2025);
    else updates.billing_2025_full_year = null;
    if (form.billing_2026) updates.billing_2026_ytd = parseFloat(form.billing_2026);
    else updates.billing_2026_ytd = null;

    const { error } = await supabase.from("retailers").update(updates as any).eq("id", r.id);
    if (error) { toast.error("Failed to save billing data"); }
    else { toast.success("Billing data updated"); setEditing(false); onUpdate(); }
    setSaving(false);
  };

  const ChangeIndicator = ({ value }: { value: number | null }) => {
    if (value === null) return <span className="text-[10px] text-muted-foreground">—</span>;
    const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
    const color = value > 0 ? "text-success" : value < -10 ? "text-destructive" : "text-warning";
    return (
      <span className={`flex items-center gap-1 text-xs font-display font-bold ${color}`}>
        <Icon className="w-3 h-3" /> {value > 0 ? "+" : ""}{value.toFixed(1)}%
      </span>
    );
  };

  const hasBillingData = b2024 > 0 || b2025 > 0 || b2026ytd > 0;

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <PoundSterling className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <h3 className="text-base font-display font-semibold text-foreground">Billing Performance</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => editing ? save() : setEditing(true)} disabled={saving}
          className="text-[10px] h-7 px-3 text-gold-dark">
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : editing ? <Save className="w-3 h-3 mr-1" /> : null}
          {saving ? "Saving..." : editing ? "Save" : hasBillingData ? "Edit" : "+ Add Billing Data"}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32">2024 Full Year (£)</span>
            <Input value={form.billing_2024} onChange={e => setForm(f => ({ ...f, billing_2024: e.target.value }))} type="number" placeholder="0" className="h-8 text-xs w-36" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32">2025 Full Year (£)</span>
            <Input value={form.billing_2025} onChange={e => setForm(f => ({ ...f, billing_2025: e.target.value }))} type="number" placeholder="0" className="h-8 text-xs w-36" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32">2026 YTD (£)</span>
            <Input value={form.billing_2026} onChange={e => setForm(f => ({ ...f, billing_2026: e.target.value }))} type="number" placeholder="0" className="h-8 text-xs w-36" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={save} disabled={saving} className="text-[10px] h-7 px-3 gold-gradient text-sidebar-background">Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="text-[10px] h-7 px-3">Cancel</Button>
          </div>
        </div>
      ) : hasBillingData ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-cream/50 rounded-lg border border-border/15">
              <p className="text-lg font-display font-bold text-foreground">{formatCurrency(b2024)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">2024</p>
            </div>
            <div className="text-center p-3 bg-cream/50 rounded-lg border border-border/15">
              <p className="text-lg font-display font-bold text-foreground">{formatCurrency(b2025)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">2025</p>
              <ChangeIndicator value={yoyChange2425} />
            </div>
            <div className="text-center p-3 bg-cream/50 rounded-lg border border-border/15">
              <p className="text-lg font-display font-bold text-foreground">{formatCurrency(b2026ytd)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">2026 YTD</p>
            </div>
            <div className="text-center p-3 bg-champagne/20 rounded-lg border border-gold/20">
              <p className="text-lg font-display font-bold shimmer-gold">{formatCurrency(projected2026)}</p>
              <p className="text-[9px] text-muted-foreground uppercase">2026 Proj.</p>
              <ChangeIndicator value={yoyChange2526} />
            </div>
          </div>

          {/* Sparkline */}
          {(b2024 > 0 || b2025 > 0) && (
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="30%">
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={i === 2 ? "hsl(34, 52%, 50%)" : "hsl(34, 30%, 75%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {(r as any).billing_last_updated && (
            <p className="text-[9px] text-muted-foreground">Last updated: {new Date((r as any).billing_last_updated).toLocaleDateString("en-GB")}</p>
          )}
        </div>
      ) : (
        <div className="text-center py-6 bg-cream/30 rounded-lg border border-border/10">
          <PoundSterling className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No billing data yet — click "+ Add Billing Data" to enter figures</p>
        </div>
      )}
    </div>
  );
}
