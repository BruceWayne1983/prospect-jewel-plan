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
  const [qualFilter, setQualFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = useMemo(() => {
    return mockRetailers.filter(r => {
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.town.toLowerCase().includes(search.toLowerCase())) return false;
      if (county !== "all" && r.county !== county) return false;
      if (category !== "all" && r.category !== category) return false;
      if (r.rating < parseFloat(minRating)) return false;
      if (qualFilter !== "all" && r.qualificationStatus !== qualFilter) return false;
      if (priorityFilter !== "all" && r.outreach.outreachPriority !== priorityFilter) return false;
      return true;
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }, [search, county, category, minRating, qualFilter, priorityFilter]);

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Discover</p>
        <h1 className="page-title">Prospect Finder</h1>
        <p className="page-subtitle">Research and evaluate potential Nomination retail partners</p>
      </div>
      <div className="divider-gold" />

      <div className="card-premium p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input placeholder="Search retailers or towns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background border-border/40 h-10" />
          </div>
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger className="w-36 bg-background border-border/40 h-10 text-xs"><SelectValue placeholder="County" /></SelectTrigger>
            <SelectContent>{[<SelectItem key="all" value="all">All Counties</SelectItem>, ...COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)]}</SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 bg-background border-border/40 h-10 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{[<SelectItem key="all" value="all">All Categories</SelectItem>, ...CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)]}</SelectContent>
          </Select>
          <Select value={qualFilter} onValueChange={setQualFilter}>
            <SelectTrigger className="w-36 bg-background border-border/40 h-10 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Status</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="in_progress">Qualifying</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 bg-background border-border/40 h-10 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} retailer{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="space-y-3">
        {filtered.map(r => (
          <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="card-premium p-5 cursor-pointer group">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-gold-dark transition-colors">{r.name}</h3>
                  <span className="badge-category">{r.category.replace('_', ' ')}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                    r.qualificationStatus === 'qualified' ? 'bg-success-light text-success' :
                    r.qualificationStatus === 'in_progress' ? 'bg-warning-light text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>{r.qualificationStatus === 'in_progress' ? 'qualifying' : r.qualificationStatus}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.town}, {r.county} · {r.postcode}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="w-3 h-3 text-warning" strokeWidth={1.5} />{r.rating} ({r.reviewCount})</span>
                  {r.hasWebsite && <Globe className="w-3 h-3 text-muted-foreground/50" strokeWidth={1.5} />}
                  {r.hasSocial && <Instagram className="w-3 h-3 text-muted-foreground/50" strokeWidth={1.5} />}
                  {r.isIndependent && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Independent</span>}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    r.outreach.outreachPriority === 'high' ? 'bg-success-light text-success' :
                    r.outreach.outreachPriority === 'medium' ? 'bg-warning-light text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>{r.outreach.outreachPriority} priority</span>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-20"><ScoreBar score={r.fitScore} label="Fit" /></div>
                <div className="w-20"><ScoreBar score={r.spendPotentialScore} label="Spend" /></div>
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
              <div className="flex gap-2 mt-3">{r.riskFlags.map((f, i) => <span key={i} className="badge-risk">{f}</span>)}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
