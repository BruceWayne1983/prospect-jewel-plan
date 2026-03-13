import { mockRetailers } from "@/data/mockData";
import { CalendarDays, Phone, MapPin, Clock } from "lucide-react";

const priorityAccounts = mockRetailers
  .filter(r => r.priorityScore >= 80)
  .sort((a, b) => b.priorityScore - a.priorityScore);

const weekPlan = [
  { day: "Monday", tasks: [{ type: "call", retailer: "The Bath Gem Company" }, { type: "email", retailer: "Milsom Place Jewellers" }] },
  { day: "Tuesday", tasks: [{ type: "visit", retailer: "Clifton Fine Jewellers" }, { type: "visit", retailer: "Park Street Accessories" }] },
  { day: "Wednesday", tasks: [{ type: "call", retailer: "The Sandbanks Collection" }, { type: "research", retailer: "Westbourne Boutique" }] },
  { day: "Thursday", tasks: [{ type: "visit", retailer: "The Promenade Collection" }, { type: "call", retailer: "Montpellier Gems" }] },
  { day: "Friday", tasks: [{ type: "admin", retailer: "Pipeline review & reporting" }] },
];

export default function AccountPlanner() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground">Account Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">Plan outreach and territory visits</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium rounded-lg p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4">Priority Accounts</h3>
          <div className="space-y-3">
            {priorityAccounts.slice(0, 6).map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.town} · Priority: {r.priorityScore}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-primary">{r.estimatedSpendBand}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{r.pipelineStage.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium rounded-lg p-5">
          <h3 className="text-sm font-display font-semibold text-foreground mb-4">Suggested Contact Strategy</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Initial Call</p>
                <p className="text-xs text-muted-foreground">Introduce Nomination brand, gauge interest, request meeting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Store Visit</p>
                <p className="text-xs text-muted-foreground">Present collection, assess store environment, discuss terms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Follow Up</p>
                <p className="text-xs text-muted-foreground">Send proposal, negotiate opening order, onboard account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-premium rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">Weekly Outreach Plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {weekPlan.map(day => (
            <div key={day.day} className="bg-muted/30 rounded-lg p-3 border border-border/20">
              <h4 className="text-xs font-semibold text-foreground mb-2">{day.day}</h4>
              <div className="space-y-1.5">
                {day.tasks.map((task, i) => (
                  <div key={i} className="text-[10px]">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium uppercase mr-1 ${
                      task.type === 'visit' ? 'bg-primary/10 text-primary' :
                      task.type === 'call' ? 'bg-success/10 text-success' :
                      task.type === 'email' ? 'bg-info/10 text-info' :
                      'bg-muted text-muted-foreground'
                    }`}>{task.type}</span>
                    <span className="text-muted-foreground">{task.retailer}</span>
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
