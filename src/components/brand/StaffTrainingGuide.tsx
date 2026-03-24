import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, ListOrdered, Lightbulb, ShieldCheck, AlertTriangle,
  RotateCcw, CheckCircle, XCircle, Package
} from "lucide-react";

const salesFlow = [
  { step: "1", title: "Discovery", detail: "Greet warmly. Find out who they're buying for — self-purchase or gift? What's the occasion?" },
  { step: "2", title: "Explain the Concept", detail: "\"Every bracelet tells a personal story — you build it link by link with symbols that mean something to you.\"" },
  { step: "3", title: "Choose Decorated Links", detail: "Guide them to the decorated links FIRST. Letters, symbols, birthstones, milestones — let them create meaning." },
  { step: "4", title: "Add Base Links", detail: "Once they've chosen their charms, add base links to make it fit. Point out they're only £1.50 each (£2.50 coloured)." },
  { step: "5", title: "Reassure", detail: "\"You can always come back and add more links — that's the beauty of it. Your bracelet grows with your story.\"" },
  { step: "6", title: "Upsell with Excitement", detail: "Suggest colour, sparkle, or initials. Show how additional links transform the look. Mention gifting for friends/family." },
];

const quickSellingTips = [
  { tip: "Wear it — be the brand. You are your best advert!", icon: "star" },
  { tip: "Always start with decorated links, not the Composable base links", icon: "check" },
  { tip: "Tell stories, not prices. Customers buy meaning.", icon: "star" },
  { tip: "Keep trays immaculate. Presentation = confidence.", icon: "check" },
  { tip: "Display by metal type and code order", icon: "check" },
  { tip: "Show examples. Inspire with ready-made themes.", icon: "star" },
  { tip: "Upsell with colour, sparkle, or initials", icon: "star" },
  { tip: "Practice daily. Confidence grows through repetition.", icon: "check" },
  { tip: "Follow returns procedures — it builds trust", icon: "check" },
  { tip: "Celebrate every sale! Make it memorable so they come back.", icon: "star" },
];

const storeStandards = [
  "Nomination counters must look like a stand-alone boutique inside your store",
  "Clean trays with alcohol daily (dishwasher safe if needed)",
  "Counter glass polished every morning and during the day",
  "Never allow dirty or smudged trays — it lowers the brand's luxury feel",
  "Gaps = missed sales. Always keep trays full and inspiring",
  "Restock and tidy during quiet times — never in front of customers",
  "Ensure consumer brochures, packaging and warranty cards always in stock",
  "Make sure the counters are clutter-free",
  "Follow counter VM Guidelines for maximum impact",
];

const packagingChecklist = [
  { item: "Box", detail: "Nomination branded jewellery box" },
  { item: "Bag", detail: "Branded shopping bag" },
  { item: "Warranty Card", detail: "Must be completed with: date of purchase, retailer info/stamp, item reference per link" },
  { item: "Sticker", detail: "Nomination seal sticker" },
];

const warrantyCovered = [
  "Faults in production or materials",
  "Items showing a clear defect not caused by misuse",
];

const warrantyNotCovered = [
  "General wear and tear",
  "Damage due to perfume, chemicals, or impact",
  "Improper use or attempted self-repair",
];

const returnProcess = [
  "Retailers can replace faulty items immediately from stock (with valid warranty)",
  "Replace with new item (or similar if original unavailable)",
  "Complete the JotForm with faulty item details: form.jotform.com/203276766435058",
  "Keep JotForm ID number for reference (auto-response confirms submission)",
  "Nomination repair department reviews and sends replacement FOC (free of charge)",
  "If item doesn't qualify as production fault → replacement invoiced at 50% cost with explanation",
  "Discontinued items → replacement of equal value or credit/discount for future orders",
];

export default function StaffTrainingGuide() {
  return (
    <div className="space-y-6">
      {/* Sales Flow */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <ListOrdered className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">6-Step Composable Sales Flow</h3>
            <p className="text-[10px] text-muted-foreground">The official Nomination selling process — train retailers on this</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-champagne/20 border border-gold/15 mb-4">
          <p className="text-xs text-foreground/80 italic leading-relaxed">
            <strong>Mantra:</strong> "Choose the decorated charms — THEN add the base links to 'make it fit'"
          </p>
        </div>
        <div className="space-y-2">
          {salesFlow.map((item) => (
            <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-cream/30 border border-gold/10">
              <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-gold-dark">{item.step}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{item.title}</p>
                <p className="text-[11px] text-foreground/70 leading-relaxed mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Reference Selling Tips */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">10 Quick Reference Selling Tips</h3>
            <p className="text-[10px] text-muted-foreground">From the official Nomination training guide</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {quickSellingTips.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-cream/30 border border-border/10">
              <span className="text-xs font-bold text-gold-dark min-w-[20px]">{i + 1}.</span>
              <span className="text-[11px] text-foreground/80 leading-relaxed">{item.tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Store Standards */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Visual Merchandising & Store Standards</h3>
            <p className="text-[10px] text-muted-foreground">Counter presentation and display requirements</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {storeStandards.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
              <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-foreground/80 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Packaging Checklist */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Package className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Packaging Checklist</h3>
            <p className="text-[10px] text-muted-foreground">Every sale must include all of these</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {packagingChecklist.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-cream/30 border border-gold/10 text-center">
              <p className="text-xs font-semibold text-foreground">{item.item}</p>
              <p className="text-[10px] text-foreground/60 mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty & Returns */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Warranty & Returns Process</h3>
            <p className="text-[10px] text-muted-foreground">2-year warranty — must be validated with completed warranty card</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-semibold text-success uppercase tracking-wider mb-2">What's Covered</p>
            <div className="space-y-1.5">
              {warrantyCovered.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
                  <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-destructive uppercase tracking-wider mb-2">Not Covered</p>
            <div className="space-y-1.5">
              {warrantyNotCovered.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-[11px] text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-warning/5 border border-warning/15 mb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span className="text-[10px] font-semibold text-warning uppercase tracking-wider">Important</span>
          </div>
          <p className="text-[11px] text-foreground/70">Only genuine Nomination® links should be used. Using imitation or non-Nomination links may damage the mechanism and invalidate the warranty. Every authentic link is engraved with the Nomination® logo.</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider mb-2">Return / Replace Process</p>
          <div className="space-y-1.5">
            {returnProcess.map((item, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/20 border border-border/10">
                <RotateCcw className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-foreground/80 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
