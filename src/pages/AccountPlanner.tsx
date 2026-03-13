import { mockRetailers } from "@/data/mockData";
import { CalendarDays, Phone, MapPin, Clock, Mail, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const priorityAccounts = mockRetailers
  .filter(r => r.priorityScore >= 80)
  .sort((a, b) => b.priorityScore - a.priorityScore);

const weekPlan = [
  { day: "Monday", tasks: [{ type: "call", retailer: "The Bath Gem Company", color: "bg-success-light text-success" }, { type: "email", retailer: "Milsom Place Jewellers", color: "bg-info-light text-info" }] },
  { day: "Tuesday", tasks: [{ type: "visit", retailer: "Clifton Fine Jewellers", color: "bg-warning-light text-warning" }, { type: "visit", retailer: "Park Street Accessories", color: "bg-warning-light text-warning" }] },
  { day: "Wednesday", tasks: [{ type: "call", retailer: "The Sandbanks Collection", color: "bg-success-light text-success" }, { type: "research", retailer: "Westbourne Boutique", color: "bg-champagne text-gold-dark" }] },
  { day: "Thursday", tasks: [{ type: "visit", retailer: "The Promenade Collection", color: "bg-warning-light text-warning" }, { type: "call", retailer: "Montpellier Gems", color: "bg-success-light text-success" }] },
  { day: "Friday", tasks: [{ type: "admin", retailer: "Pipeline review & reporting", color: "bg-muted text-muted-foreground" }] },
];

const strategies = [
  { icon: Phone, title: "Initial Introduction", desc: "Warm call to introduce the Nomination brand, gauge interest and arrange an in-store presentation", step: "01" },
  { icon: MapPin, title: "Store Visit & Presentation", desc: "Present the collection in person, assess store environment, footfall and brand compatibility", step: "02" },
  { icon: Mail, title: "Proposal & Terms", desc: "Send tailored opening order proposal with recommended product mix and terms", step: "03" },
  { icon: Clock, title: "Follow-up & Onboarding", desc: "Negotiate final terms, confirm opening order and begin account onboarding", step: "04" },
];

export default function AccountPlanner() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Plan</p>
        <h1 className="page-title">Account Planner</h1>
        <p className="page-subtitle">Outreach strategy and territory visit planning</p>
      </div>

      <div className="divider-gold" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Priority Accounts */}
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-display font-semibold text-foreground">Priority Accounts</h3>
            <button onClick={() => navigate('/prospects')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1">
              All <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {priorityAccounts.slice(0, 7).map((r, i) => (
              <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-3 border-b border-border/15 last:border-0 cursor-pointer hover:bg-champagne/15 -mx-2 px-2 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/50 w-4 font-display">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.town} · Score {r.priorityScore}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gold-dark">{r.estimatedSpendBand.split('–')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Strategy */}
        <div className="lg:col-span-3 card-premium p-6">
          <h3 className="text-lg font-display font-semibold text-foreground mb-5">Suggested Contact Strategy</h3>
          <div className="space-y-5">
            {strategies.map((s) => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold" style={{ color: 'hsl(var(--sidebar-background))' }}>{s.step}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Plan */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-gold" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground">Weekly Outreach Plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {weekPlan.map(day => (
            <div key={day.day} className="bg-cream/50 rounded-xl p-4 border border-border/15">
              <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{day.day}</h4>
              <div className="space-y-2">
                {day.tasks.map((task, i) => (
                  <div key={i} className="bg-card rounded-lg p-2.5 border border-border/20">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider mb-1 ${task.color}`}>{task.type}</span>
                    <p className="text-[11px] text-foreground leading-snug">{task.retailer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
