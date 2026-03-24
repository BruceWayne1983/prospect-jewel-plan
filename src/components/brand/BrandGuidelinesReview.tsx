import { Badge } from "@/components/ui/badge";
import {
  Gem, Store, MapPin, Users, Star, ShieldCheck, AlertTriangle, Target,
  TrendingUp, Heart, Gift, Repeat, Package, Award, Globe, Sparkles, CheckCircle, XCircle
} from "lucide-react";

const brandFundamentals = [
  { label: "Founded", value: "1983, Florence, Italy" },
  { label: "Founder", value: "Paolo Gensini (family-owned; son Alessandro runs marketing)" },
  { label: "2024 Revenue", value: "€60 million (+30% YoY)" },
  { label: "Production", value: "Florence, Italy — 15,000–18,000 links per day" },
  { label: "2024 Links Sold", value: "3.25 million" },
  { label: "UK Market Position", value: "England is a top-2 global market for Nomination" },
  { label: "Core Product", value: "COMPOSABLE — interchangeable link charm bracelet system" },
  { label: "Price Architecture", value: "Links £25–£45 (silver) to £70–£150+ (gold/gem). Bases £30–£80" },
  { label: "Made In", value: "Florence, Italy — genuine Italian craftsmanship, not outsourced" },
  { label: "USP", value: "Modular, personalised, collectible. Every link tells a story." },
];

const salesArguments = [
  { icon: Repeat, title: "Repeat Purchase Engine", description: "Customers return 3–5 times per year to add links for birthdays, anniversaries, milestones. This is the most important commercial argument for retailers." },
  { icon: Gift, title: "Gifting Category Leader", description: "Links are the perfect gift — affordable (£25–£45), personalised, and part of a growing collection. Partners, parents, children, and friends all buy for the same bracelet owner." },
  { icon: Gem, title: "Accessible Luxury", description: "Premium Italian quality at a non-luxury price point. Appeals to customers who want 'real' jewellery but can't or won't spend £500+." },
  { icon: Package, title: "Stock Efficiency", description: "Compact display footprint. High volume, high margin. A 30-link display takes less space than a single tray of fashion rings." },
  { icon: Heart, title: "Brand Loyalty is Sticky", description: "Once a customer starts a bracelet, they are committed to the Nomination ecosystem — locking in the retailer's customer base too." },
  { icon: Store, title: "Shop-in-Shop Opportunity", description: "Nomination supports independents with branded display solutions — spinning towers, wall units, branded packaging — elevating the entire store." },
];

const competitors = [
  { name: "Pandora", threat: "HIGH", coexist: "Sometimes", guidance: "Dominant mass-market competitor. UK revenue £3.2bn. Made in Thailand. Nomination offers an independent, premium alternative.", color: "bg-destructive/10 text-destructive" },
  { name: "Thomas Sabo", threat: "MEDIUM", coexist: "Yes", guidance: "German brand, UK revenue £9.2m and declining (-18%). Retailers stocking Thomas Sabo are prime Nomination prospects.", color: "bg-warning/20 text-warning" },
  { name: "Joma Jewellery", threat: "MEDIUM", coexist: "Yes", guidance: "Popular in indie gift/jewellery channel. No repeat mechanic. Retailers stocking Joma are excellent prospects — same customer, same channel.", color: "bg-warning/20 text-warning" },
  { name: "Clogau Gold", threat: "LOW–MEDIUM", coexist: "Yes", guidance: "Welsh heritage brand, £60–£400+. STRONG PROSPECT SIGNAL — a Clogau stockist is exactly the right quality positioning for Nomination.", color: "bg-success/10 text-success" },
  { name: "Swarovski", threat: "MEDIUM", coexist: "Yes", guidance: "Crystal fashion jewellery. Different positioning. Not a direct conflict.", color: "bg-warning/20 text-warning" },
  { name: "Trollbeads", threat: "LOW", coexist: "Yes", guidance: "Danish, niche, premium price. Small UK footprint. Not a significant conflict.", color: "bg-muted text-muted-foreground" },
  { name: "Links of London", threat: "LOW", coexist: "Yes", guidance: "Brand has weakened significantly. Not a meaningful competitor currently.", color: "bg-muted text-muted-foreground" },
  { name: "Katie Loxton", threat: "LOW", coexist: "Yes", guidance: "Fashion accessories, same indie channel. No jewellery repeat mechanic. Not a conflict.", color: "bg-muted text-muted-foreground" },
  { name: "Monica Vinader", threat: "LOW", coexist: "Yes", guidance: "Online-first premium. Not present in indie channel meaningfully.", color: "bg-muted text-muted-foreground" },
];

const idealRetailerProfile = [
  "Independent jeweller or quality gift shop — NOT a chain or franchise",
  "Trades from a permanent, established retail premises (not market stall or pop-up)",
  "Already sells aspirational, quality brands — demonstrates taste and customer positioning",
  "Has a loyal, returning customer base — not purely footfall-driven",
  "Customer demographic: women aged 30–65, purchasing for themselves or as gifts",
  "Staff who are engaged with the product — owner-operated or well-managed indie",
  "Located on a quality high street, garden centre, retail park, or shopping centre",
  "Has display space for a Nomination tower/unit (minimum 0.5m counter or wall space)",
  "Good social media presence — active Instagram, engaged followers in target demographic",
  "Not exclusive to a direct competitor that would prevent stocking Nomination",
];

const scoringCriteria = [
  { criteria: "Store Type Match", weight: "20 pts", detail: "Jeweller or gift shop = 20. Fashion boutique = 12. Garden centre/deli = 10. Toy store = 0." },
  { criteria: "Location Quality", weight: "15 pts", detail: "Established high street or centre = 15. Secondary retail = 8. Remote/rural only = 4." },
  { criteria: "Existing Brand Portfolio", weight: "15 pts", detail: "Stocks Clogau/Thomas Sabo/Joma = 15. Stocks Pandora = 10. No relevant brands = 5." },
  { criteria: "Social Media Presence", weight: "12 pts", detail: "Active Instagram 1k+ followers = 12. Some presence = 6. None found = 0." },
  { criteria: "Estimated Customer Demo", weight: "12 pts", detail: "Clearly women 30–65 gifting market = 12. Mixed = 6. Wrong demographic = 0." },
  { criteria: "Town Population / Footfall", weight: "10 pts", detail: "Town 50k+ = 10. Town 20–50k = 7. Under 20k = 4." },
  { criteria: "No Exclusivity Conflict", weight: "8 pts", detail: "No conflict = 8. Possible conflict = 4. Confirmed conflict = 0." },
  { criteria: "Google Reviews / Reputation", weight: "5 pts", detail: "4+ stars, 20+ reviews = 5. Some reviews = 3. None or poor = 0." },
  { criteria: "Territory Gap Value", weight: "3 pts", detail: "Only stockist in town = 3. One other within 5 miles = 1." },
];

const disqualificationRules = [
  "Toy store, children's clothing, or children-only retailer",
  "Confirmed existing Nomination stockist (already approved)",
  "Supermarket, pharmacy, petrol station, or non-retail food business",
  "Online-only retailer with no physical store presence",
  "Business with fewer than 3 Google reviews and no social media",
  "Confirmed closed, administration, or no longer trading",
];

const prospectCategories = [
  { category: "Independent Jeweller", priority: "HIGHEST", bias: "+10", description: "Core channel. Understands the customer, has display space, can train staff." },
  { category: "Quality Gift Shop", priority: "HIGH", bias: "+5", description: "Strong gifting occasion alignment. Good for impulse and occasion purchases." },
  { category: "Garden Centre Gift Hall", priority: "MEDIUM-HIGH", bias: "+3", description: "Seasonal peaks can be very strong. Must have a staffed gift section." },
  { category: "Fashion / Lifestyle Boutique", priority: "MEDIUM", bias: "0", description: "Good if targeting women 30–65. Risk: staff turnover, less jewellery expertise." },
  { category: "Department Store (indie)", priority: "MEDIUM", bias: "0", description: "Good footfall but margin and brand control can be weaker." },
  { category: "Spa / Hotel Gift Shop", priority: "LOW-MEDIUM", bias: "-2", description: "Can work in premium locations (Bath, Cotswolds, coastal). Niche but valid." },
  { category: "Craft / Hobby / Art Shop", priority: "LOW", bias: "-5", description: "Rarely the right customer profile." },
  { category: "Toy Store", priority: "DISQUALIFY", bias: "N/A", description: "Wrong demographic. No exceptions." },
];

export default function BrandGuidelinesReview() {
  return (
    <div className="space-y-6">
      {/* Brand Fundamentals */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Gem className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Brand Fundamentals</h3>
            <p className="text-[10px] text-muted-foreground">Core identity & positioning</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {brandFundamentals.map((item, i) => (
            <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-cream/30 border border-border/10">
              <span className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider min-w-[100px] flex-shrink-0">{item.label}</span>
              <span className="text-xs text-foreground/80">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6 Key Sales Arguments */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">6 Key Sales Arguments</h3>
            <p className="text-[10px] text-muted-foreground">Use in every pitch & briefing</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {salesArguments.map((arg, i) => (
            <div key={i} className="p-3 rounded-lg bg-cream/30 border border-gold/10 space-y-1.5">
              <div className="flex items-center gap-2">
                <arg.icon className="w-4 h-4 text-gold flex-shrink-0" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-foreground">{arg.title}</span>
              </div>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{arg.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Intelligence */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Competitor Intelligence Matrix</h3>
            <p className="text-[10px] text-muted-foreground">Threat levels & AI pitch guidance</p>
          </div>
        </div>
        <div className="space-y-2">
          {competitors.map((comp, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-cream/20 border border-border/10">
              <div className="min-w-[110px] flex-shrink-0">
                <p className="text-xs font-semibold text-foreground">{comp.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="secondary" className={`text-[9px] ${comp.color}`}>{comp.threat}</Badge>
                  <span className="text-[9px] text-muted-foreground">Co-exist: {comp.coexist}</span>
                </div>
              </div>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{comp.guidance}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ideal Retailer Profile */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ideal Retailer Profile</h3>
            <p className="text-[10px] text-muted-foreground">What the perfect Nomination stockist looks like</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {idealRetailerProfile.map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-cream/30 border border-border/10">
              <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-foreground/80 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring Criteria */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Star className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Prospect Scoring System (0–100)</h3>
            <p className="text-[10px] text-muted-foreground">Weighted criteria for fit_score calculation</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {scoringCriteria.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-cream/20 border border-border/10">
              <span className="text-[10px] font-bold text-gold-dark min-w-[50px] flex-shrink-0 text-center bg-champagne/40 rounded px-1.5 py-0.5">{item.weight}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">{item.criteria}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-champagne/20 border border-gold/15">
          <p className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider mb-1.5">Score Interpretation</p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-success/15 text-success border-success/20 text-[10px]">80–100: Priority — pursue immediately</Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">60–79: Strong — worth visiting</Badge>
            <Badge className="bg-warning/15 text-warning border-warning/20 text-[10px]">40–59: Moderate — add to long list</Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">Under 40: Low priority or disqualify</Badge>
          </div>
        </div>
      </div>

      {/* Auto-Disqualification Rules */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-destructive" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Auto-Disqualification Rules</h3>
            <p className="text-[10px] text-muted-foreground">Prospects matching ANY of these are automatically rejected (score = 0)</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {disqualificationRules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
              <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-foreground/80 leading-relaxed">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prospect Categories */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Prospect Category Definitions</h3>
            <p className="text-[10px] text-muted-foreground">Category classification with scoring bias</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {prospectCategories.map((cat, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-cream/20 border border-border/10">
              <div className="min-w-[130px] flex-shrink-0">
                <p className="text-xs font-medium text-foreground">{cat.category}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="secondary" className={`text-[9px] ${
                    cat.priority === "HIGHEST" ? "bg-success/15 text-success" :
                    cat.priority === "HIGH" ? "bg-primary/10 text-primary" :
                    cat.priority === "DISQUALIFY" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>{cat.priority}</Badge>
                  {cat.bias !== "N/A" && <span className="text-[9px] text-gold-dark font-medium">Bias: {cat.bias}</span>}
                </div>
              </div>
              <p className="text-[11px] text-foreground/70 leading-relaxed">{cat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Store Display Requirements */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Award className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Store & Display Requirements</h3>
            <p className="text-[10px] text-muted-foreground">What a retailer needs to stock Nomination</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-cream/30 border border-gold/10 space-y-2">
            <p className="text-xs font-semibold text-foreground">Physical Space</p>
            <ul className="space-y-1.5">
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />Minimum 0.5m counter space or wall space for display</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />Permanent, established retail premises (not pop-up only)</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />Quality high street, garden centre, retail park, or shopping centre location</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-cream/30 border border-gold/10 space-y-2">
            <p className="text-xs font-semibold text-foreground">Display Solutions Available</p>
            <ul className="space-y-1.5">
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><Sparkles className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />Spinning tower displays — compact, high-visibility</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><Sparkles className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />Wall-mounted display units</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><Sparkles className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />Branded packaging & POS materials</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-cream/30 border border-gold/10 space-y-2">
            <p className="text-xs font-semibold text-foreground">Staff Requirements</p>
            <ul className="space-y-1.5">
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />Engaged staff who can explain the composable concept</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />Owner-operated or well-managed independent preferred</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-success mt-0.5 flex-shrink-0" />Training support provided by Nomination/Emma</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-cream/30 border border-gold/10 space-y-2">
            <p className="text-xs font-semibold text-foreground">Opening Order Guidelines</p>
            <ul className="space-y-1.5">
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><Package className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />Average opening order: ~£3,200</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><Package className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />Bracelet to charm ratio: 1:3.8</li>
              <li className="text-[11px] text-foreground/70 flex items-start gap-1.5"><Package className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />Average annual value per account: £11,500</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
