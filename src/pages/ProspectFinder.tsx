import { useState, useMemo } from "react";
import { mockRetailers, COUNTIES, CATEGORIES, type Retailer } from "@/data/mockData";
import { Search, Filter, Star, Globe, Instagram, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 85 ? "text-success" : score >= 70 ? "text-warning" : "text-muted-foreground";
  return (
    <div className="text-center">
      <p className={`text-sm font-semibold ${color}`}>{score}%</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

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
    <div className="p-6 space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Prospect Finder</h1>
        <p className="text-sm text-muted-foreground mt-1">Discover and evaluate potential Nomination retailers</p>
      </div>

      <div className="card-premium rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search retailers or towns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/50" />
          </div>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger className="w-40 bg-background border-border/50"><SelectValue placeholder="County" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 bg-background border-border/50"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="w-32 bg-background border-border/50"><SelectValue placeholder="Min Rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any Rating</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => setIndependentOnly(!independentOnly)}
            className={`text-xs px-3 py-2 rounded-md border transition-colors ${independentOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border/50 text-muted-foreground hover:text-foreground'}`}
          >
            Independent Only
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} retailers found</p>

      <div className="grid gap-3">
        {filtered.map(r => (
          <div
            key={r.id}
            onClick={() => navigate(`/retailer/${r.id}`)}
            className="card-premium rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{r.category.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{r.town}, {r.county} · {r.postcode}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-warning" />{r.rating} ({r.reviewCount})</span>
                  {r.hasWebsite && <Globe className="w-3 h-3 text-muted-foreground" />}
                  {r.hasSocial && <Instagram className="w-3 h-3 text-muted-foreground" />}
                  {r.isIndependent && <span className="text-[10px] text-muted-foreground">Independent</span>}
                </div>
              </div>
              <div className="flex items-center gap-5">
                <ScoreBadge score={r.fitScore} label="Fit" />
                <ScoreBadge score={r.commercialHealthScore} label="Health" />
                <ScoreBadge score={r.priorityScore} label="Priority" />
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{r.estimatedSpendBand}</p>
                  <p className="text-[10px] text-muted-foreground">Est. spend</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            {r.riskFlags && r.riskFlags.length > 0 && (
              <div className="flex gap-2 mt-2">
                {r.riskFlags.map((flag, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{flag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
