import { useState } from "react";
import { calendarEvents, mockRetailers, type CalendarEvent } from "@/data/mockData";
import { CalendarDays, Phone, MapPin, Users, MessageSquare, Briefcase, ChevronLeft, ChevronRight, Clock, Navigation } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const typeConfig: Record<string, { label: string; cls: string; icon: typeof Phone }> = {
  meeting: { label: 'Meeting', cls: 'bg-champagne text-gold-dark', icon: Users },
  call: { label: 'Call', cls: 'bg-success-light text-success', icon: Phone },
  visit: { label: 'Visit', cls: 'bg-warning-light text-warning', icon: MapPin },
  follow_up: { label: 'Follow Up', cls: 'bg-info-light text-info', icon: MessageSquare },
  admin: { label: 'Admin', cls: 'bg-muted text-muted-foreground', icon: Briefcase },
  campaign: { label: 'Campaign', cls: 'bg-champagne/80 text-gold-dark', icon: CalendarDays },
};

// Journey planner — group visits by town for efficient territory days
const journeyRoutes = [
  { region: 'Bath & Bristol', towns: ['Bath', 'Bristol'], retailers: mockRetailers.filter(r => ['Bath', 'Bristol'].includes(r.town)).slice(0, 4), estimatedDrive: '30 mins between stops', priority: 'high' as const },
  { region: 'Cheltenham & Gloucester', towns: ['Cheltenham', 'Gloucester'], retailers: mockRetailers.filter(r => ['Cheltenham', 'Gloucester'].includes(r.town)).slice(0, 3), estimatedDrive: '20 mins between stops', priority: 'high' as const },
  { region: 'Dorset Coast', towns: ['Bournemouth', 'Poole'], retailers: mockRetailers.filter(r => ['Bournemouth', 'Poole'].includes(r.town)).slice(0, 3), estimatedDrive: '15 mins between stops', priority: 'medium' as const },
  { region: 'Devon', towns: ['Exeter', 'Plymouth'], retailers: mockRetailers.filter(r => ['Exeter', 'Plymouth'].includes(r.town)).slice(0, 4), estimatedDrive: '1 hour between stops', priority: 'low' as const },
];

function WeekView({ events }: { events: CalendarEvent[] }) {
  const weekDates = ['2025-06-09', '2025-06-10', '2025-06-11', '2025-06-12', '2025-06-13', '2025-06-14', '2025-06-15'];

  return (
    <div className="grid grid-cols-7 gap-2">
      {DAYS.map((day, i) => {
        const dayEvents = events.filter(e => e.date === weekDates[i]);
        return (
          <div key={day} className="min-h-[160px]">
            <div className="text-center mb-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{day}</p>
              <p className="text-sm font-display font-semibold text-foreground">{9 + i}</p>
            </div>
            <div className="space-y-1.5">
              {dayEvents.map(ev => {
                const tc = typeConfig[ev.type] || typeConfig.admin;
                return (
                  <div key={ev.id} className={`rounded-lg p-2 border border-border/15 ${tc.cls} bg-opacity-60`}>
                    <div className="flex items-center gap-1 mb-0.5">
                      <tc.icon className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">{tc.label}</span>
                    </div>
                    <p className="text-[10px] font-medium leading-tight">{ev.retailerName || ev.title.split(':').pop()?.trim()}</p>
                    {ev.time && <p className="text-[9px] opacity-70 mt-0.5">{ev.time}</p>}
                  </div>
                );
              })}
              {dayEvents.length === 0 && i < 5 && (
                <div className="rounded-lg p-2 border border-dashed border-border/20 text-center">
                  <p className="text-[9px] text-muted-foreground/40">Available</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SalesCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<'week' | 'list'>('week');

  const upcoming = [...calendarEvents]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter(e => e.date >= '2025-06-10');

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Plan</p>
          <h1 className="page-title">Sales Calendar</h1>
          <p className="page-subtitle">Meetings, calls, visits and outreach scheduling</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs px-4 py-2 rounded-lg border transition-all ${view === v ? 'bg-card border-gold/30 text-foreground shadow-sm' : 'border-border/20 text-muted-foreground hover:bg-card'}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="divider-gold" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Meetings', value: calendarEvents.filter(e => e.type === 'meeting').length.toString(), cls: 'bg-champagne/20 border-gold/30' },
          { icon: Phone, label: 'Calls', value: calendarEvents.filter(e => e.type === 'call').length.toString(), cls: '' },
          { icon: MapPin, label: 'Visits', value: calendarEvents.filter(e => e.type === 'visit').length.toString(), cls: '' },
          { icon: MessageSquare, label: 'Follow Ups', value: calendarEvents.filter(e => e.type === 'follow_up').length.toString(), cls: '' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.cls ? 'gold-gradient' : 'bg-muted'}`}>
              <s.icon className={`w-4 h-4 ${s.cls ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Week/List view */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-champagne transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <h3 className="text-lg font-display font-semibold text-foreground">Week of 9 June 2025</h3>
            <button className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-champagne transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {view === 'week' ? (
          <WeekView events={calendarEvents} />
        ) : (
          <div className="space-y-2">
            {upcoming.map(ev => {
              const tc = typeConfig[ev.type] || typeConfig.admin;
              return (
                <div key={ev.id} onClick={() => ev.retailerId && navigate(`/retailer/${ev.retailerId}`)}
                  className={`flex items-center gap-4 py-3 px-4 rounded-lg border border-border/10 hover:bg-champagne/15 transition-colors ${ev.retailerId ? 'cursor-pointer' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tc.cls}`}>
                    <tc.icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{ev.title}</p>
                    {ev.town && <p className="text-[10px] text-muted-foreground">{ev.town}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-foreground">{ev.date}</p>
                    {ev.time && <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{ev.time}</p>}
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${tc.cls}`}>{tc.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Territory Journey Planner */}
      <div className="card-premium p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <Navigation className="w-5 h-5 text-gold" strokeWidth={1.5} />
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Territory Journey Planner</h3>
            <p className="text-[10px] text-muted-foreground">Optimised visit routes by region</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journeyRoutes.map(route => (
            <div key={route.region} className={`bg-cream/50 rounded-xl p-5 border ${route.priority === 'high' ? 'border-gold/20' : 'border-border/15'}`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground">{route.region}</h4>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                  route.priority === 'high' ? 'bg-success-light text-success' : route.priority === 'medium' ? 'bg-warning-light text-warning' : 'bg-muted text-muted-foreground'
                }`}>{route.priority} priority</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3">
                <MapPin className="w-3 h-3 inline mr-1" />{route.towns.join(' → ')} · {route.estimatedDrive}
              </p>
              <div className="space-y-1.5">
                {route.retailers.map(r => (
                  <div key={r.id} onClick={() => navigate(`/retailer/${r.id}`)}
                    className="flex items-center justify-between py-1.5 cursor-pointer hover:text-gold-dark transition-colors">
                    <span className="text-xs text-foreground">{r.name}</span>
                    <span className={`text-xs font-display font-bold ${r.fitScore >= 85 ? 'score-excellent' : r.fitScore >= 70 ? 'score-good' : 'score-moderate'}`}>{r.fitScore}%</span>
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
