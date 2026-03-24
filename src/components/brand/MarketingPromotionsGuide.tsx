import { Badge } from "@/components/ui/badge";
import {
  Megaphone, Calendar, Globe, MapPin, Users, Palette, Image as ImageIcon,
  Video, ShoppingBag, Sparkles
} from "lucide-react";

const promotionsCalendar = [
  { month: "January", event: "Sales", detail: "Seasonal sale period" },
  { month: "February", event: "Valentine's Day", detail: "Gifting campaign — link charms for loved ones" },
  { month: "March / May", event: "Mother's Day", detail: "Key gifting occasion — exclusive shopping bag with £59+ purchase" },
  { month: "June", event: "#OneForMeOneForYou", detail: "Signature Nomination campaign — buy one gift one" },
  { month: "October", event: "Free Bracelet Days", detail: "Composable Free Bracelet Days — drive footfall" },
  { month: "November", event: "Black Friday", detail: "Composable Bracelet Free Links promotion" },
];

const marketingMaterials = [
  { item: "Sales Catalogue FW2025 (29.7×21cm)", code: "UK CAT2116", price: "£10.00" },
  { item: "Mini Catalogue (15×15cm)", code: "UK CAT2127", price: "£0.50" },
  { item: "New Links Flyer FW2025 (15×15cm)", code: "UK CAT2099", price: "£0.10" },
  { item: "Bracelet Holder (18×20cm)", code: "SUPP150", price: "£4.00" },
  { item: "Display Tray (18×22cm)", code: "VASSOIO105", price: "£20.00" },
  { item: "Institutional Table Tent (18×21cm)", code: "CART1059", price: "£1.50" },
  { item: "Sales Catalogue 2025 with Barcode (A4)", code: "UK CAT2062", price: "£15.00" },
  { item: "Price Stickers — Composable", code: "UK ETIC211", price: "£0.55" },
  { item: "Institutional Poster (57×154cm)", code: "POSTER682", price: "£25.00" },
  { item: "Totem (59.4×84.1cm)", code: "CART1060", price: "£2.50" },
];

const displayUnits = [
  { item: "Composable Window Display (Large)", code: "ESP124", size: "47×42×38cm", price: "£245.00" },
  { item: "Composable Window Display (Standard)", code: "ESP125", size: "39×35×33cm", price: "£190.00" },
  { item: "Composable Counter (Double Step)", code: "SUPP138", size: "36×8×45cm", price: "£96.80" },
  { item: "Composable Counter (Single Step)", code: "SUPP139", size: "18×8×45cm", price: "£60.64" },
  { item: "Counter Back Panel", code: "CART1079", size: "90×21cm", price: "£23.50" },
  { item: "Back Panel for ESP124", code: "CART1056", size: "37.8×27.7cm", price: "£5.00" },
];

const globalPresence = [
  { stat: "40+", label: "Countries" },
  { stat: "3,000+", label: "Authorised Retailers" },
  { stat: "80+", label: "Monobrand Stores" },
  { stat: "5", label: "Flagship Stores in Italy" },
];

const socialChannels = [
  { platform: "Facebook", handle: "@nomination.italy.fanpage" },
  { platform: "Instagram", handle: "@nominationitalyofficial" },
  { platform: "YouTube", handle: "Nomination Italy Official" },
  { platform: "TikTok", handle: "@nomination_italy" },
  { platform: "Pinterest", handle: "@nominationitaly" },
];

const tradeShows = [
  { name: "Vicenza", location: "Vicenza, Italy" },
  { name: "Il Tarì", location: "Caserta, Italy" },
  { name: "Inhorgenta", location: "Munich, Germany" },
  { name: "Gold Expo", location: "Warsaw, Poland" },
];

export default function MarketingPromotionsGuide() {
  return (
    <div className="space-y-6">
      {/* Global Brand Stats */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Nomination Global Presence</h3>
            <p className="text-[10px] text-muted-foreground">International brand — use these stats in pitches</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {globalPresence.map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-cream/30 border border-gold/10 text-center">
              <p className="text-xl font-bold text-gold-dark">{item.stat}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-3 rounded-lg bg-champagne/20 border border-gold/15">
          <p className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider mb-1">Italian Flagships</p>
          <p className="text-[11px] text-foreground/70">Florence · Milan · Rome · Venice · Bari</p>
        </div>
      </div>

      {/* Promotions Calendar */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Annual Promotions Calendar</h3>
            <p className="text-[10px] text-muted-foreground">Brand-led campaigns that drive footfall to your retailers</p>
          </div>
        </div>
        <div className="space-y-2">
          {promotionsCalendar.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-cream/30 border border-gold/10">
              <Badge variant="secondary" className="text-[9px] bg-champagne/40 text-gold-dark border-gold/10 min-w-[80px] justify-center flex-shrink-0">{item.month}</Badge>
              <div>
                <p className="text-xs font-semibold text-foreground">{item.event}</p>
                <p className="text-[11px] text-foreground/70 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marketing Materials Catalogue */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Marketing Materials Catalogue (FW2025)</h3>
            <p className="text-[10px] text-muted-foreground">POS materials, catalogues, and print items available for retailers</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Item</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="text-right py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody>
              {marketingMaterials.map((item, i) => (
                <tr key={i} className="border-b border-border/5">
                  <td className="py-2 px-3 text-foreground/80">{item.item}</td>
                  <td className="py-2 px-3 font-mono text-foreground/70">{item.code}</td>
                  <td className="py-2 px-3 text-right font-semibold text-gold-dark">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Display Units */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Palette className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Display Units & Counters</h3>
            <p className="text-[10px] text-muted-foreground">Branded furniture and shop-in-shop solutions</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/20">
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="text-right py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody>
              {displayUnits.map((item, i) => (
                <tr key={i} className="border-b border-border/5">
                  <td className="py-2 px-3 text-foreground/80">{item.item}</td>
                  <td className="py-2 px-3 font-mono text-foreground/70">{item.code}</td>
                  <td className="py-2 px-3 text-foreground/70">{item.size}</td>
                  <td className="py-2 px-3 text-right font-semibold text-gold-dark">{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 rounded-lg bg-champagne/20 border border-gold/15">
          <p className="text-[11px] text-foreground/70">
            <strong>Shop-in-Shop:</strong> In addition to branded furniture, Nomination provides made-to-measure posters, panels, and light box graphics. 
            Co-op advertising available — ask how Nomination can share the cost of increasing Brand Awareness and traffic to your store.
          </p>
        </div>
      </div>

      {/* Social Media & Digital */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Social Media & Digital Presence</h3>
            <p className="text-[10px] text-muted-foreground">Nomination publishes new content daily — shared with retail partners</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          {socialChannels.map((ch, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-cream/30 border border-border/10 text-center">
              <p className="text-[10px] font-semibold text-gold-dark uppercase tracking-wider">{ch.platform}</p>
              <p className="text-[11px] text-foreground/70 mt-0.5">{ch.handle}</p>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-cream/20 border border-border/10">
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            <strong>Hashtags:</strong> #NominationItaly · #NominationBracelet · #ItalianCharmBracelet · #OneForMeOneForYou
          </p>
          <p className="text-[11px] text-foreground/70 mt-1">
            <strong>Video:</strong> Institutional video FW2025 available for in-store and tradeshow use. Specific request required for web/TV adverts.
          </p>
        </div>
      </div>

      {/* Trade Shows */}
      <div className="card-premium p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-champagne/40 border border-gold/20 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">International Trade Shows</h3>
            <p className="text-[10px] text-muted-foreground">Where Nomination maintains brand presence</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {tradeShows.map((show, i) => (
            <div key={i} className="p-3 rounded-lg bg-cream/30 border border-gold/10 text-center">
              <p className="text-xs font-semibold text-foreground">{show.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{show.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
