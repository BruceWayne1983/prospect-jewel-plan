import { Badge } from "@/components/ui/badge";
import {
  Store, Globe, Shield, FileCheck, BookOpen, Gem, Droplets, AlertTriangle, CheckCircle, XCircle
} from "lucide-react";

const retailerStandards = [
  { label: "Location", detail: "Store should be in a busy shopping area — high street, town centre, or shopping mall. Aim: potential to achieve ~£100,000 wholesale sales per year." },
  { label: "Neighbours", detail: "High street: sit among other strong retailers. Shopping centre: near branded fashion/jewellery stores or anchor store." },
  { label: "Appearance", detail: "Inside and outside must be clean, tidy, well-lit. Windows and displays attractive and up-to-date." },
  { label: "Customer Experience", detail: "Staff friendly, welcoming, professional. Layout organised and enjoyable." },
  { label: "Product Selection", detail: "Focus on branded jewellery. Non-jewellery items should complement the brand. Dedicated Nomination area required." },
  { label: "Commitment", detail: "Both Nomination and retailer sign to confirm expectations. Reviewed periodically." },
];

const ecommerceRules = [
  { rule: "Authorised to sell online ONLY via retailer's own approved website", type: "must" },
  { rule: "No selling on marketplaces — Amazon, eBay, Alibaba, etc.", type: "block" },
  { rule: "Sales and marketing must target UK only", type: "must" },
  { rule: "Nomination must approve website layout and all changes in writing", type: "must" },
  { rule: "All imagery, content, prices must align with brand's official look — updated quarterly", type: "must" },
  { rule: "Must show visible link to nomination.com and state 'Authorised Retailer'", type: "must" },
  { rule: "'Exclusive' or 'Official' wording is NOT permitted", type: "block" },
  { rule: "Must include full packaging, tags, and warranty cards with products", type: "must" },
  { rule: "Cannot sell the Composable base without at least one decorated link", type: "block" },
  { rule: "No promotions, discounts, Google Ads, or loyalty offers without written permission", type: "block" },
  { rule: "Monthly sales reports must be sent to Nomination including shipping destinations", type: "must" },
  { rule: "Follow wholesale price list and recommended online retail prices", type: "must" },
];

const sellingTips = [
  "Encourage customer to choose decorated links FIRST — then add the base links to 'make it fit'",
  "The more decorated links they choose, the less base links required — tell the customer!",
  "Point out that base links cost only £1.50 each (or £2.50 for coloured) — keep focus on the charms",
  "Never assume or guess what the customer wants — let them build their own story",
  "Staff wearing inspiring examples drives sales — customers want their bracelets to fill up",
  "Display examples for all ages and styles — baby themes, wedding, celebratory — more inspiring than stock trays",
  "The beauty of Composable is the customer decides how much (or how little) they spend",
  "There is no 'standard bracelet' — Composable is unisex, fits babies to adults, and is endlessly personal",
];

const materials = [
  { name: "Stainless Steel (304/316)", detail: "Highest quality, hypoallergenic, does not tarnish, incredibly strong. Clean with warm soapy water and soft toothbrush." },
  { name: "Classic Gold & Rose Gold", detail: "Bonded yellow gold (Classic) and rose gold. Timeless appeal, high market value." },
  { name: "Sterling Silver", detail: "Finest quality hypoallergenic silver. Rhodium/platinum plated to prevent tarnishing. Some oxidised for vintage effect." },
  { name: "Gemstones", detail: "Precious, semiprecious, cubic zirconia, synthetic, crystals, simulated pearls. Natural stones may show inclusions — this is normal." },
  { name: "Enamel", detail: "Coloured enamel painted by hand. Water-resistant but may crack from violent blows. Treat as fragile." },
];

const careInstructions = [
  "Store in a jewellery box with separate compartments or soft pouches",
  "Remove jewellery before applying perfumes, skin creams, suntan lotion or oils",
  "Never wear with detergents, bleaches, ammonia, or alcohols — causes discoloration",
  "Clean sterling silver or gold with a dry, soft cloth or jewellery polishing cloth",
  "Do NOT use brushes on silver/gold — they may scratch",
  "Clean stainless steel with warm soapy water and a soft toothbrush",
];

const warrantyInfo = [
  "Original Nomination items guaranteed by the Nomination logo on each item",
  "Product warranty valid for 2 years from date of purchase",
  "Customer Assistance handled exclusively by Nomination in Italy",
  "Warranty terms viewable at www.nomination.com",
];

export default function RetailerPoliciesGuide() {
  return (
    <div className="space-y-6">
      {/* Retailer Standards */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Store className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Nomination Retailer Quality Standards</h3>
            <p className="text-[10px] text-muted-foreground">What Nomination expects from every authorised retailer</p>
          </div>
        </div>
        <div className="space-y-2">
          {retailerStandards.map((item, i) => (
            <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-cream/30 border border-border/10">
              <span className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider min-w-[100px] flex-shrink-0">{item.label}</span>
              <span className="text-[11px] text-foreground/80 leading-relaxed">{item.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* E-Commerce Agreement */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">E-Commerce & Advertising Rules</h3>
            <p className="text-[10px] text-muted-foreground">Key terms from the Nomination E-Commerce Agreement</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {ecommerceRules.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
              {item.type === "must" ? (
                <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              )}
              <span className="text-[11px] text-foreground/80 leading-relaxed">{item.rule}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">Breach Consequences</span>
          </div>
          <p className="text-[11px] text-foreground/70">Any breach allows Nomination to terminate immediately and revoke all selling rights. After termination, retailer must stop all online sales, remove branding, and may only sell remaining stock offline within the authorised network.</p>
        </div>
      </div>

      {/* Selling Composable Guide */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Selling Composable — Sales Technique Guide</h3>
            <p className="text-[10px] text-muted-foreground">How to answer "How much is the bracelet?" and maximise sales</p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-champagne/20 border border-gold/15 mb-3">
          <p className="text-xs text-foreground/80 leading-relaxed">
            <strong>Article 3.1.1:</strong> The base bracelet must NOT be sold without a minimum of one decorated link. 
            There is no "standard bracelet" — Composable is unisex, fits all ages, and the customer decides how much they spend.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sellingTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
              <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-foreground/80 leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Materials & Care */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Gem className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Materials & Quality</h3>
            <p className="text-[10px] text-muted-foreground">Italian craftsmanship — designed, created, and produced in Florence, Tuscany</p>
          </div>
        </div>
        <div className="space-y-2">
          {materials.map((mat, i) => (
            <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-cream/30 border border-border/10">
              <span className="text-[10px] font-semibold text-gold-dark min-w-[120px] flex-shrink-0">{mat.name}</span>
              <span className="text-[11px] text-foreground/80 leading-relaxed">{mat.detail}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Care & Storage */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Droplets className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Care, Cleaning & Storage</h3>
            <p className="text-[10px] text-muted-foreground">Share with retailers for customer guidance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {careInstructions.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
              {tip.startsWith("Do NOT") || tip.startsWith("Never") ? (
                <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
              )}
              <span className="text-[11px] text-foreground/80 leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warranty */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Warranty Information</h3>
            <p className="text-[10px] text-muted-foreground">2-year product warranty from date of purchase</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {warrantyInfo.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
              <FileCheck className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-foreground/80 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
