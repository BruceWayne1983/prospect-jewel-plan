import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Gift, Tag, ShoppingBag, Calendar, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Loader2,
  Megaphone, Percent
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Retailer = Tables<"retailers">;

interface Promotion {
  id: string;
  name: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  mechanic: string;
  funding: string;
  deadline: string;
  status: "upcoming" | "active" | "completed";
  category: "gwp" | "discount" | "sale" | "tbc";
}

const PROMO_CALENDAR_2026: Promotion[] = [
  {
    id: "mothers-day-2026",
    name: "Mother's Day — Gift With Purchase",
    dateRange: "19 Feb – 16 Mar 2026",
    startDate: "2026-02-19",
    endDate: "2026-03-16",
    mechanic: "Spend £69 on Nomination → FREE Phone Pouch (Wholesale: £3.80, RRP: £15.99)",
    funding: "£1 per promo transaction — Results report required",
    deadline: "27 March 2026",
    status: "active",
    category: "gwp",
  },
  {
    id: "shopping-spree-2026",
    name: "Shopping Spree (TBC)",
    dateRange: "4 – 22 Jun 2026",
    startDate: "2026-06-04",
    endDate: "2026-06-22",
    mechanic: "Spend £59 → £10 off · Spend £99 → £20 off · Spend £159 → £30 off",
    funding: "£2/£4/£6 per transaction tier — Results report required",
    deadline: "3 July 2026",
    status: "upcoming",
    category: "discount",
  },
  {
    id: "summer-sale-2026",
    name: "Summer Sale",
    dateRange: "1 – 27 Jul 2026",
    startDate: "2026-07-01",
    endDate: "2026-07-27",
    mechanic: "30% or 50% off selected items — Sale list provided by Nomination",
    funding: "No funding",
    deadline: "—",
    status: "upcoming",
    category: "sale",
  },
  {
    id: "october-promo-2026",
    name: "October Promotion (TBC)",
    dateRange: "8 – 26 Oct 2026",
    startDate: "2026-10-08",
    endDate: "2026-10-26",
    mechanic: "To be confirmed",
    funding: "To be confirmed",
    deadline: "TBC",
    status: "upcoming",
    category: "tbc",
  },
  {
    id: "black-friday-2026",
    name: "Black Friday",
    dateRange: "5 – 30 Nov 2026",
    startDate: "2026-11-05",
    endDate: "2026-11-30",
    mechanic: "Up to 50% off selected lines only — Sale list provided",
    funding: "No funding",
    deadline: "—",
    status: "upcoming",
    category: "sale",
  },
  {
    id: "winter-sale-2026",
    name: "Winter / Boxing Day Sale",
    dateRange: "26 Dec 2026 – 18 Jan 2027",
    startDate: "2026-12-26",
    endDate: "2027-01-18",
    mechanic: "30% or 50% off selected items — End date TBC",
    funding: "No funding",
    deadline: "—",
    status: "upcoming",
    category: "sale",
  },
];

const categoryConfig = {
  gwp: { label: "Gift With Purchase", icon: Gift, cls: "bg-champagne/40 text-gold-dark border-gold/20" },
  discount: { label: "Discount", icon: Percent, cls: "bg-success-light text-success border-success/20" },
  sale: { label: "Sale", icon: Tag, cls: "bg-warning-light text-warning border-warning/20" },
  tbc: { label: "TBC", icon: Calendar, cls: "bg-muted text-muted-foreground border-border/20" },
};

const statusConfig = {
  active: { label: "Active Now", cls: "bg-success text-white" },
  upcoming: { label: "Upcoming", cls: "bg-champagne/60 text-gold-dark" },
  completed: { label: "Completed", cls: "bg-muted text-muted-foreground" },
};

function getPromoStatus(promo: Promotion): Promotion["status"] {
  const now = new Date().toISOString().split("T")[0];
  if (now < promo.startDate) return "upcoming";
  if (now > promo.endDate) return "completed";
  return "active";
}

export default function PromotionsTracker() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("retailers")
      .select("*")
      .in("pipeline_stage", ["approved", "retention_risk"])
      .order("name")
      .then(({ data }) => {
        setRetailers(data ?? []);
        setLoading(false);
      });
  }, []);

  const promos = useMemo(
    () => PROMO_CALENDAR_2026.map((p) => ({ ...p, status: getPromoStatus(p) })),
    []
  );

  const activePromos = promos.filter((p) => p.status === "active");
  const upcomingPromos = promos.filter((p) => p.status === "upcoming");
  const completedPromos = promos.filter((p) => p.status === "completed");

  // Cross-reference: which accounts are performing well vs struggling
  const accountInsights = useMemo(() => {
    if (!retailers.length) return { strong: [], declining: [], noData: [] };

    const strong: Retailer[] = [];
    const declining: Retailer[] = [];
    const noData: Retailer[] = [];

    retailers.forEach((r) => {
      const b24 = r.billing_2024_full_year ?? 0;
      const b25 = r.billing_2025_full_year ?? 0;
      const b26 = r.billing_2026_ytd ?? 0;

      if (!b24 && !b25 && !b26) {
        noData.push(r);
        return;
      }

      // YoY growth check
      if (b25 > 0 && b24 > 0) {
        const growth = ((b25 - b24) / b24) * 100;
        if (growth >= 0) {
          strong.push(r);
        } else {
          declining.push(r);
        }
      } else if (b26 > 0) {
        strong.push(r);
      } else {
        noData.push(r);
      }
    });

    return { strong, declining, noData };
  }, [retailers]);

  const totalAccounts = retailers.length;
  const totalBilling2025 = retailers.reduce((s, r) => s + (r.billing_2025_full_year ?? 0), 0);
  const totalBilling2026 = retailers.reduce((s, r) => s + (r.billing_2026_ytd ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Promos", value: activePromos.length.toString(), icon: Megaphone, highlight: true },
          { label: "Current Accounts", value: totalAccounts.toString(), icon: ShoppingBag, highlight: false },
          { label: "2025 Total Billing", value: `£${(totalBilling2025 / 1000).toFixed(1)}k`, icon: TrendingUp, highlight: false },
          { label: "2026 YTD Billing", value: `£${(totalBilling2026 / 1000).toFixed(1)}k`, icon: TrendingUp, highlight: false },
        ].map((s) => (
          <div key={s.label} className={`stat-card ${s.highlight ? "bg-champagne/20 border-gold/30" : ""}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.highlight ? "gold-gradient" : "bg-muted"}`}>
              <s.icon className={`w-4 h-4 ${s.highlight ? "text-card" : "text-muted-foreground"}`} strokeWidth={1.5} />
            </div>
            <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active Promotions */}
      {activePromos.length > 0 && (
        <div className="card-premium p-5 border-gold/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-card" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Active Promotions</h3>
              <p className="text-[10px] text-muted-foreground">Currently running — ensure retailers are participating</p>
            </div>
          </div>
          {activePromos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} expanded={expandedPromo === promo.id}
              onToggle={() => setExpandedPromo(expandedPromo === promo.id ? null : promo.id)}
              retailers={retailers} insights={accountInsights} />
          ))}
        </div>
      )}

      {/* Upcoming Promotions */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">2026 Promo Calendar</h3>
            <p className="text-[10px] text-muted-foreground">Upcoming campaigns — plan retailer outreach ahead</p>
          </div>
        </div>
        <div className="space-y-3">
          {upcomingPromos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} expanded={expandedPromo === promo.id}
              onToggle={() => setExpandedPromo(expandedPromo === promo.id ? null : promo.id)}
              retailers={retailers} insights={accountInsights} />
          ))}
        </div>
      </div>

      {/* Account Performance Cross-Reference */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Account Performance vs Promotions</h3>
            <p className="text-[10px] text-muted-foreground">Cross-reference billing data with promotional periods</p>
          </div>
        </div>

        {/* Strong Performers */}
        {accountInsights.strong.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <p className="text-xs font-semibold text-success">Strong Performers ({accountInsights.strong.length})</p>
              <p className="text-[10px] text-muted-foreground">— prioritise for promo participation</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {accountInsights.strong.slice(0, 6).map((r) => (
                <RetailerPromoRow key={r.id} retailer={r} />
              ))}
            </div>
            {accountInsights.strong.length > 6 && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">+ {accountInsights.strong.length - 6} more strong performers</p>
            )}
          </div>
        )}

        {/* Declining */}
        {accountInsights.declining.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              <p className="text-xs font-semibold text-warning">Declining Accounts ({accountInsights.declining.length})</p>
              <p className="text-[10px] text-muted-foreground">— promos could re-engage these retailers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {accountInsights.declining.map((r) => (
                <RetailerPromoRow key={r.id} retailer={r} showWarning />
              ))}
            </div>
          </div>
        )}

        {/* No Data */}
        {accountInsights.noData.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">No Billing Data ({accountInsights.noData.length})</p>
            </div>
            <p className="text-[10px] text-muted-foreground">These accounts have no billing records — update via Account Planner before promos launch.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ───────────────────────────── */

function PromoCard({
  promo, expanded, onToggle, retailers, insights,
}: {
  promo: Promotion;
  expanded: boolean;
  onToggle: () => void;
  retailers: Retailer[];
  insights: { strong: Retailer[]; declining: Retailer[]; noData: Retailer[] };
}) {
  const cat = categoryConfig[promo.category];
  const st = statusConfig[promo.status];

  return (
    <div className={`rounded-xl border ${promo.status === "active" ? "border-gold/30 bg-champagne/10" : "border-border/15"} overflow-hidden mb-2`}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-champagne/10 transition-colors">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${cat.cls}`}>
          <cat.icon className="w-4 h-4" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground truncate">{promo.name}</p>
            <Badge className={`text-[8px] ${st.cls} border-0`}>{st.label}</Badge>
          </div>
          <p className="text-[11px] text-muted-foreground">{promo.dateRange}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/10 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-cream/30 border border-border/10">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mechanic</p>
              <p className="text-[11px] text-foreground/80">{promo.mechanic}</p>
            </div>
            <div className="p-3 rounded-lg bg-cream/30 border border-border/10">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Funding</p>
              <p className="text-[11px] text-foreground/80">{promo.funding}</p>
            </div>
            <div className="p-3 rounded-lg bg-cream/30 border border-border/10">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Report Deadline</p>
              <p className="text-[11px] text-foreground/80 font-medium">{promo.deadline}</p>
            </div>
          </div>

          {/* Account cross-reference */}
          <div className="p-3 rounded-lg bg-champagne/15 border border-gold/10">
            <p className="text-[9px] font-semibold text-gold-dark uppercase tracking-wider mb-2">Account Readiness</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-success">{insights.strong.length}</p>
                <p className="text-[9px] text-muted-foreground">Ready to participate</p>
              </div>
              <div>
                <p className="text-lg font-bold text-warning">{insights.declining.length}</p>
                <p className="text-[9px] text-muted-foreground">Need re-engagement</p>
              </div>
              <div>
                <p className="text-lg font-bold text-muted-foreground">{insights.noData.length}</p>
                <p className="text-[9px] text-muted-foreground">No billing data</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RetailerPromoRow({ retailer, showWarning }: { retailer: Retailer; showWarning?: boolean }) {
  const b24 = retailer.billing_2024_full_year ?? 0;
  const b25 = retailer.billing_2025_full_year ?? 0;
  const b26 = retailer.billing_2026_ytd ?? 0;
  const yoyChange = b24 > 0 && b25 > 0 ? ((b25 - b24) / b24) * 100 : null;

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${showWarning ? "border-warning/20 bg-warning-light/30" : "border-border/10 bg-cream/20"}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{retailer.name}</p>
        <p className="text-[10px] text-muted-foreground">{retailer.town}, {retailer.county}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {b25 > 0 && <span className="text-[10px] text-muted-foreground">2025: £{b25.toLocaleString()}</span>}
          {yoyChange !== null && (
            <Badge variant="secondary" className={`text-[8px] ${yoyChange >= 0 ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}>
              {yoyChange >= 0 ? "+" : ""}{yoyChange.toFixed(0)}%
            </Badge>
          )}
        </div>
        {b26 > 0 && <p className="text-[9px] text-muted-foreground">2026 YTD: £{b26.toLocaleString()}</p>}
      </div>
    </div>
  );
}
