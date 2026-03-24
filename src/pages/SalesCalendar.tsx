import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Phone, MapPin, Users, MessageSquare, Briefcase, Clock, Loader2, Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PromotionsTracker from "@/components/calendar/PromotionsTracker";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const typeConfig: Record<string, { label: string; cls: string; icon: typeof Phone }> = {
  meeting: { label: 'Meeting', cls: 'bg-champagne text-gold-dark', icon: Users },
  call: { label: 'Call', cls: 'bg-success-light text-success', icon: Phone },
  visit: { label: 'Visit', cls: 'bg-warning-light text-warning', icon: MapPin },
  follow_up: { label: 'Follow Up', cls: 'bg-info-light text-info', icon: MessageSquare },
  admin: { label: 'Admin', cls: 'bg-muted text-muted-foreground', icon: Briefcase },
  campaign: { label: 'Campaign', cls: 'bg-champagne/80 text-gold-dark', icon: CalendarDays },
};

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: string;
  retailer_id: string | null;
  retailer_name: string | null;
  town: string | null;
  notes: string | null;
  completed: boolean;
}

export default function SalesCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<'week' | 'list'>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("calendar_events").select("*").order("date", { ascending: true }).then(({ data }) => {
      setEvents(data ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Journey planner from live data
  const clusters = [
    { region: 'Bath & Bristol', towns: ['Bath', 'Bristol'], estimatedDrive: '30 mins between stops', priority: 'high' as const },
    { region: 'Cheltenham & Gloucester', towns: ['Cheltenham', 'Gloucester'], estimatedDrive: '20 mins between stops', priority: 'high' as const },
    { region: 'Dorset Coast', towns: ['Bournemouth', 'Poole'], estimatedDrive: '15 mins between stops', priority: 'medium' as const },
    { region: 'Devon', towns: ['Exeter', 'Plymouth'], estimatedDrive: '1 hour between stops', priority: 'low' as const },
  ];

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
          { icon: Users, label: 'Meetings', value: events.filter(e => e.type === 'meeting').length.toString(), cls: 'bg-champagne/20 border-gold/30' },
          { icon: Phone, label: 'Calls', value: events.filter(e => e.type === 'call').length.toString(), cls: '' },
          { icon: MapPin, label: 'Visits', value: events.filter(e => e.type === 'visit').length.toString(), cls: '' },
          { icon: MessageSquare, label: 'Follow Ups', value: events.filter(e => e.type === 'follow_up').length.toString(), cls: '' },
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
          <h3 className="text-lg font-display font-semibold text-foreground">
            Week of {monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        {view === 'week' ? (
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, i) => {
              const dayEvents = events.filter(e => e.date === weekDates[i]);
              return (
                <div key={day} className="min-h-[160px]">
                  <div className="text-center mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{day}</p>
                    <p className="text-sm font-display font-semibold text-foreground">{new Date(weekDates[i]).getDate()}</p>
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
                          <p className="text-[10px] font-medium leading-tight">{ev.retailer_name || ev.title}</p>
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
        ) : (
          <div className="space-y-2">
            {events.length === 0 && (
              <p className="text-sm text-muted-foreground/50 italic text-center py-8">No events scheduled. Events will appear here as you plan outreach activities.</p>
            )}
            {events.map(ev => {
              const tc = typeConfig[ev.type] || typeConfig.admin;
              return (
                <div key={ev.id} onClick={() => ev.retailer_id && navigate(`/retailer/${ev.retailer_id}`)}
                  className={`flex items-center gap-4 py-3 px-4 rounded-lg border border-border/10 hover:bg-champagne/15 transition-colors ${ev.retailer_id ? 'cursor-pointer' : ''}`}>
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

    </div>
  );
}
