import { useState, useMemo } from "react";
import { mockRetailers, COUNTIES, CATEGORIES } from "@/data/mockData";
import { Search, Star, Globe, Instagram, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";

export default function ProspectFinder() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [county, setCounty] = useState("all");
  const [category, setCategory] = useState("all");
  const [minRating, setMinRating] = useState("0");
  const [independentOnly, setIndependentOnly] = useState(false);

  const filtered = useMemo(() => {
    return mockRetailers.filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.town.toLowerCase().includes(search.toLowerCase())) return false;
      if (county !== "all" && r.county !== county) return false;
      if (category !== "all" && r.category !== category) return false;
      if (r.rating < parseFloat(minRating)) return false;
      if (independentOnly && !r.isIndependent) return false;
      return true;
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [search, county, category, minRating, independentOnly]);

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Discover</p>
        <h1 className="page-title">Prospect Finder</h1>
        <p className="page-subtitle">Identify and evaluate potential Nomination retail partners</p>
      </div>

      <div className="divider-gold" />

      {/* Filters */}
      <div className="card-premium p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input placeholder="Search retailers or towns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/40 h-10" />
          </div>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger className="w-40 bg-background border-border/40 h-10"><SelectValue placeholder="County" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 bg-background border-border/40 h-10"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="w-32 bg-background border-border/40 h-10"><SelectValue placeholder="Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setIndependentOnly(!independentOnly)}
            className={`text-xs px-4 py-2.5 rounded-lg border transition-all duration-200 font-medium ${independentOnly ? 'gold-gradient border-gold/30 shadow-sm' : 'bg-background border-border/40 text-muted-foreground hover:text-foreground hover:border-border'}`}
            style={independentOnly ? { color: 'hsl(var(--sidebar-background))' } : {}}
          >
            Independent Only
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} retailer{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => navigate(`/retailer/${r.id}`)}
            className="card-premium p-5 cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-gold-dark transition-colors">{r.name}</h3>
                  <span className="badge-category">{r.category.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.town}, {r.county} · {r.postcode}</p>
                <div className="flex items-center gap-4 mt-2.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-warning" strokeWidth={1.5} />{r.rating} ({r.reviewCount})</span>
                  {r.hasWebsite && <Globe className="w-3 h-3 text-muted-foreground/50" strokeWidth={1.5} />}
                  {r.hasSocial && <Instagram className="w-3 h-3 text-muted-foreground/50" strokeWidth={1.5} />}
                  {r.isIndependent && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Independent</span>}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-24"><ScoreBar score={r.fitScore} label="Fit" /></div>
                <div className="w-24"><ScoreBar score={r.commercialHealthScore} label="Health" /></div>
                <div className="text-center">
                  <span className={`text-lg font-display font-bold ${r.priorityScore >= 85 ? 'score-excellent' : r.priorityScore >= 70 ? 'score-good' : 'score-moderate'}`}>{r.priorityScore}</span>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Priority</p>
                </div>
                <div className="text-right w-28">
                  <p className="text-sm font-medium text-foreground">{r.estimatedSpendBand}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Est. spend</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-gold transition-all" />
              </div>
            </div>
            {r.riskFlags && r.riskFlags.length > 0 && (
              <div className="flex gap-2 mt-3">
                {r.riskFlags.map((flag, i) => <span key={i} className="badge-risk">{flag}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
