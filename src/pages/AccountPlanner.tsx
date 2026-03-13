import { mockRetailers } from "@/data/mockData";
import { CalendarDays, Phone, MapPin, Target, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScoreBar } from "@/components/ScoreIndicators";

const topTargets = mockRetailers
  .filter(r => r.outreach.outreachPriority === 'high')
  .sort((a, b) => b.priorityScore - a.priorityScore)
  .slice(0, 10);

const callList = mockRetailers
  .filter(r => r.outreach.bestContactMethod === 'phone' && r.outreach.outreachPriority !== 'low')
  .sort((a, b) => b.priorityScore - a.priorityScore);

const visitPlan = mockRetailers
  .filter(r => r.outreach.bestContactMethod === 'visit' || r.activity.meetingScheduled)
  .sort((a, b) => b.priorityScore - a.priorityScore);

const weekPlan = [
  { day: "Monday", tasks: [
    { type: "call", retailer: "The Bath Gem Company", color: "bg-success-light text-success" },
    { type: "email", retailer: "Park Street Accessories", color: "bg-info-light text-info" },
  ]},
  { day: "Tuesday", tasks: [
    { type: "visit", retailer: "Clifton Fine Jewellers", color: "bg-warning-light text-warning" },
    { type: "visit", retailer: "Park Street Accessories", color: "bg-warning-light text-warning" },
  ]},
  { day: "Wednesday", tasks: [
    { type: "call", retailer: "The Sandbanks Collection", color: "bg-success-light text-success" },
    { type: "call", retailer: "Westbourne Boutique", color: "bg-success-light text-success" },
  ]},
  { day: "Thursday", tasks: [
    { type: "meeting", retailer: "The Promenade Collection", color: "bg-champagne text-gold-dark" },
    { type: "call", retailer: "Milsom Place Jewellers", color: "bg-success-light text-success" },
  ]},
  { day: "Friday", tasks: [
    { type: "admin", retailer: "Pipeline review & reporting", color: "bg-muted text-muted-foreground" },
    { type: "research", retailer: "AI discovery review", color: "bg-info-light text-info" },
  ]},
];

export default function AccountPlanner() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div>
        <p className="section-header mb-2">Plan</p>
        <h1 className="page-title">Account Planner</h1>
        <p className="page-subtitle">Outreach strategy, visit planning and target account management</p>
      </div>
      <div className="divider-gold" />

      {/* Top 10 Targets */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Target className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Top 10 Target Accounts</h3>
          </div>
          <button onClick={() => navigate('/prospects')} className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 font-medium">
            All prospects <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                {['#', 'Retailer', 'Location', 'Fit', 'Predicted Value', 'Next Action', 'Confidence', 'Status'].map(h => (
                  <th key={h} className="text-left py-2.5 section-header text-[9px] first:w-6">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topTargets.map((r, i) => (
                <tr key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="border-b border-border/10 hover:bg-champagne/15 transition-colors cursor-pointer group">
                  <td className="py-3 text-xs text-muted-foreground/50 font-display">{i + 1}</td>
                  <td className="py-3 text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</td>
                  <td className="py-3 text-xs text-muted-foreground">{r.town}</td>
                  <td className="py-3"><div className="w-16"><ScoreBar score={r.fitScore} label="" /></div></td>
                  <td className="py-3 text-xs text-foreground">{r.performancePrediction.predictedAnnualValue}</td>
                  <td className="py-3 text-xs text-muted-foreground max-w-[180px] truncate">{r.activity.suggestedNextStep || 'Plan needed'}</td>
                  <td className="py-3"><span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                    r.performancePrediction.predictionConfidence === 'high' ? 'bg-success-light text-success' :
                    r.performancePrediction.predictionConfidence === 'medium' ? 'bg-warning-light text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>{r.performancePrediction.predictionConfidence}</span></td>
                  <td className="py-3"><span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{r.pipelineStage.replace(/_/g, ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call List */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <Phone className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Call List</h3>
          </div>
          <div className="space-y-1">
            {callList.slice(0, 6).map((r, i) => (
              <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 cursor-pointer hover:bg-champagne/15 -mx-2 px-2 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/50 w-4 font-display">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.outreach.contactName || 'Contact TBC'} · {r.town}</p>
                  </div>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  r.outreach.outreachPriority === 'high' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
                }`}>{r.outreach.outreachPriority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Visit Planning */}
        <div className="card-premium p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <MapPin className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-lg font-display font-semibold text-foreground">Visit Planning</h3>
          </div>
          <div className="space-y-1">
            {visitPlan.slice(0, 6).map((r, i) => (
              <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)} className="flex items-center justify-between py-2.5 border-b border-border/10 last:border-0 cursor-pointer hover:bg-champagne/15 -mx-2 px-2 rounded-lg transition-colors group">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground/50 w-4 font-display">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-gold-dark transition-colors">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.town}, {r.county}</p>
                  </div>
                </div>
                {r.activity.meetingScheduled ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-champagne text-gold-dark font-medium">Meeting booked</span>
                ) : (
                  <span className="text-[9px] text-muted-foreground">Visit needed</span>
                )}
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
