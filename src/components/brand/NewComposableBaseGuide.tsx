import { Badge } from "@/components/ui/badge";
import {
  Sparkles, AlertTriangle, CheckCircle, HelpCircle, Calculator, Ruler, ShoppingCart
} from "lucide-react";

const basePricing = [
  { colour: "Standard (Silver)", code: "530300 SI", rrp: "£22.00" },
  { colour: "Black", code: "530301 SI 002", rrp: "£35.00" },
  { colour: "Golden", code: "530301 SI 008", rrp: "£35.00" },
  { colour: "Rose", code: "530301 SI 011", rrp: "£35.00" },
  { colour: "Blue", code: "530301 SI 016", rrp: "£35.00" },
];

const sizingGuide = [
  { size: "Junior", links: 15 },
  { size: "Small", links: 17 },
  { size: "Medium", links: 19 },
  { size: "Large", links: 21 },
  { size: "Max", links: 23 },
];

const standardPricing = [
  { links: 14, price: "£22.00", extra: "—" },
  { links: 15, price: "£23.50", extra: "1 × £1.50" },
  { links: 16, price: "£25.00", extra: "2 × £1.50" },
  { links: 17, price: "£26.50", extra: "3 × £1.50" },
  { links: 18, price: "£28.00", extra: "4 × £1.50" },
];

const colouredPricing = [
  { links: 14, price: "£35.00", extra: "—" },
  { links: 15, price: "£37.50", extra: "1 × £2.50" },
  { links: 16, price: "£40.00", extra: "2 × £2.50" },
  { links: 17, price: "£42.50", extra: "3 × £2.50" },
  { links: 18, price: "£45.00", extra: "4 × £2.50" },
];

const buildingRules = [
  "Start with at least ONE precious/decorated link — that's what the customer chooses first",
  "Every sale must include a Composable™ Base (which now includes the Style Icon)",
  "The base cannot be sold without at least one decorated link in the same transaction",
  "Only ONE Style Icon per bracelet — do not add another",
  "If the bracelet is full of decorated links, remove plain component links to fit the Style Icon in",
  "Do NOT add the Style Icon to watch straps",
];

const faq = [
  { q: "When does this start?", a: "1st April 2026, globally." },
  { q: "Can we remove the Style Icon?", a: "No. It is a permanent part of the base." },
  { q: "Can we sell the Style Icon as a decorated link?", a: "No. It is part of the base, not a decorated link." },
  { q: "Can more than one Style Icon go on a bracelet?", a: "No. Only one Style Icon per bracelet." },
  { q: "Full bracelet — does the Style Icon still go on?", a: "Yes. Remove a plain component link to make space." },
  { q: "Does the Style Icon go on watch straps?", a: "No. Watch straps are excluded." },
  { q: "When must online listings be updated?", a: "By 1st April 2026 — same global launch date." },
  { q: "How much is the Style Icon to add to a full bracelet?", a: "£2.50 (Standard base £22 minus 13 × £1.50 component links = £19.50, remainder = £2.50)." },
  { q: "How to upgrade existing stock?", a: "Order Style Icon links (code 330199/02, wholesale £6.40) to add to existing bases. Order by 31st March 2026." },
];

const customerScripts = [
  { scenario: "Starting a bracelet", script: "\"Every bracelet starts with a precious link — that's what you choose first. We then add a Composable Base. You'll notice the Style Icon, the Nomination NN logo in silver. It's on every bracelet as a sign of Italian craftsmanship and quality.\"" },
  { scenario: "Price is different", script: "\"Nomination have upgraded the base to include their signature Style Icon link — the NN logo — built right in. The price reflects that upgrade. You're getting a more premium bracelet as a result.\"" },
  { scenario: "Full bracelet of decorated links", script: "\"We still need to include the Style Icon — Nomination require it on every bracelet from now on. We'll remove a plain link to make space — it sits beautifully alongside your decorated links.\"" },
  { scenario: "Can the Style Icon be removed?", script: "\"It's a permanent part of the base — think of it like a hallmark. It can't be removed or sold separately. It's there to guarantee your bracelet is a genuine Nomination piece.\"" },
];

export default function NewComposableBaseGuide() {
  return (
    <div className="space-y-6">
      {/* Style Icon Overview */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">New Composable™ Base — Style Icon (From 1st April 2026)</h3>
            <p className="text-[10px] text-muted-foreground">More Iconic, More Nomination — every bracelet now features the NN logo</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-champagne/20 border border-gold/15 mb-4">
          <p className="text-xs text-foreground/80 leading-relaxed">
            Nomination has upgraded the Composable™ Base with a new silver NN logo link — the <strong>Style Icon</strong>. 
            It is permanent, cannot be removed, and cannot be sold separately. Every bracelet sold from 1st April 2026 must include the Style Icon. 
            New product codes and prices are now in effect.
          </p>
        </div>

        {/* Building Rules */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-foreground mb-2">Building a Bracelet — The Rules</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {buildingRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
                {rule.startsWith("Do NOT") ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                )}
                <span className="text-[11px] text-foreground/80 leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Base Pricing */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Product Codes & Base Pricing</h3>
            <p className="text-[10px] text-muted-foreground">New codes effective 1st April 2026</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Base Colour</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Product Code</th>
                <th className="text-right py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">RRP</th>
              </tr>
            </thead>
            <tbody>
              {basePricing.map((item, i) => (
                <tr key={i} className="border-b border-border/5">
                  <td className="py-2 px-3 text-foreground/80">{item.colour}</td>
                  <td className="py-2 px-3 font-mono text-foreground/70">{item.code}</td>
                  <td className="py-2 px-3 text-right font-semibold text-gold-dark">{item.rrp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sizing & Pre-Sized Pricing */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Ruler className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Sizing Guide & Pre-Sized Pricing</h3>
            <p className="text-[10px] text-muted-foreground">Base starts with 14 links — add extra links to reach the right size</p>
          </div>
        </div>

        {/* Size Guide */}
        <div className="flex flex-wrap gap-2 mb-4">
          {sizingGuide.map((s, i) => (
            <div key={i} className="flex flex-col items-center p-2.5 rounded-lg bg-cream/30 border border-gold/10 min-w-[80px]">
              <span className="text-xs font-semibold text-foreground">{s.size}</span>
              <span className="text-lg font-bold text-gold-dark">{s.links}</span>
              <span className="text-[9px] text-muted-foreground">links</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Standard Base (£1.50/extra link)</p>
            <div className="space-y-1">
              {standardPricing.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-cream/20 border border-border/5">
                  <span className="text-[11px] text-foreground/70">{p.links} links</span>
                  <span className="text-[10px] text-muted-foreground">{p.extra}</span>
                  <span className="text-xs font-semibold text-gold-dark">{p.price}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Coloured */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Coloured Base (£2.50/extra link)</p>
            <div className="space-y-1">
              {colouredPricing.map((p, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded bg-cream/20 border border-border/5">
                  <span className="text-[11px] text-foreground/70">{p.links} links</span>
                  <span className="text-[10px] text-muted-foreground">{p.extra}</span>
                  <span className="text-xs font-semibold text-gold-dark">{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Scripts */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">What to Say to Customers</h3>
            <p className="text-[10px] text-muted-foreground">Ready-made scripts for common Style Icon questions</p>
          </div>
        </div>
        <div className="space-y-3">
          {customerScripts.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-cream/30 border border-gold/10">
              <p className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider mb-1.5">{s.scenario}</p>
              <p className="text-[11px] text-foreground/80 leading-relaxed italic">{s.script}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Style Icon FAQ</h3>
            <p className="text-[10px] text-muted-foreground">Quick reference for common questions</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {faq.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-cream/20 border border-border/10">
              <span className="text-xs font-medium text-foreground min-w-0 flex-1"><strong>Q:</strong> {item.q}</span>
              <span className="text-[11px] text-foreground/70 min-w-0 flex-1"><strong>A:</strong> {item.a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
