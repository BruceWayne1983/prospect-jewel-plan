import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Phone, MapPin, Users, MessageSquare, Briefcase, Clock, Loader2, Megaphone, Plus, ChevronLeft, ChevronRight, Trash2, Edit2, CheckCircle2, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import PromotionsTracker from "@/components/calendar/PromotionsTracker";
import { EventBooker, type EventType } from "@/components/calendar/EventBooker";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const typeConfig: Record<string, { label: string; cls: string; icon: typeof Phone }> = {
  meeting: { label: 'Meeting', cls: 'bg-champagne text-gold-dark', icon: Users },
  call: { label: 'Call', cls: 'bg-success-light text-success', icon: Phone },
  visit: { label: 'Visit', cls: 'bg-warning-light text-warning', icon: MapPin },
  follow_up: { label: 'Follow Up', cls: 'bg-info-light text-info', icon: MessageSquare },
  email: { label: 'Email', cls: 'bg-accent/20 text-accent-foreground', icon: Mail },
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchEvents = async () => {
    const { data } = await supabase.from("calendar_events").select("*").order("date", { ascending: true }).order("time", { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const today = new Date();
  const monday = startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), "yyyy-MM-dd"));

  const weekEvents = events.filter(e => weekDates.includes(e.date));

  const toggleComplete = async (ev: CalendarEvent) => {
    const { error } = await supabase.from("calendar_events").update({ completed: !ev.completed }).eq("id", ev.id);
    if (error) { toast.error("Failed to update"); return; }
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, completed: !e.completed } : e));
    toast.success(ev.completed ? "Marked incomplete" : "Marked complete");
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setEvents(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
    toast.success("Event deleted");
  };

  const handleDayClick = (dateStr: string) => {
    setEditEvent(null);
    setDefaultDate(dateStr);
    setBookOpen(true);
  };

  const handleEditClick = (ev: CalendarEvent) => {
    setEditEvent(ev);
    setBookOpen(true);
  };

  const handleNewClick = () => {
    setEditEvent(null);
    setDefaultDate(undefined);
    setBookOpen(true);
  };

  if (loading) {
    return <div className="page-container flex items-center justify-center min-h-[400px]"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>;
  }

  const completedThisWeek = weekEvents.filter(e => e.completed).length;
  const totalThisWeek = weekEvents.length;

  return (
    <div className="page-container">
      <div className="flex items-end justify-between">
        <div>
          <p className="section-header mb-2">Plan</p>
          <h1 className="page-title">Sales Calendar</h1>
          <p className="page-subtitle">Book meetings, calls, emails and visits — manage your full schedule</p>
        </div>
        <Button onClick={handleNewClick} size="sm" className="gold-gradient text-card border-0 gap-1.5">
          <Plus className="w-4 h-4" />New Event
        </Button>
      </div>
      <div className="divider-gold" />

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="bg-card border border-border/20 mb-6">
          <TabsTrigger value="calendar" className="text-xs data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />Calendar
          </TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs data-[state=active]:bg-champagne/40 data-[state=active]:text-gold-dark">
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />Promotions & Sales
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { icon: Users, label: 'Meetings', count: weekEvents.filter(e => e.type === 'meeting').length, cls: 'bg-champagne/20 border-gold/30' },
              { icon: Phone, label: 'Calls', count: weekEvents.filter(e => e.type === 'call').length, cls: '' },
              { icon: MapPin, label: 'Visits', count: weekEvents.filter(e => e.type === 'visit').length, cls: '' },
              { icon: Mail, label: 'Emails', count: weekEvents.filter(e => e.type === 'email').length, cls: '' },
              { icon: MessageSquare, label: 'Follow Ups', count: weekEvents.filter(e => e.type === 'follow_up').length, cls: '' },
              { icon: CheckCircle2, label: 'Completed', count: completedThisWeek, cls: completedThisWeek === totalThisWeek && totalThisWeek > 0 ? 'bg-success-light border-success/20' : '' },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.cls}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.cls ? 'gold-gradient' : 'bg-muted'}`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.cls ? 'text-card' : 'text-muted-foreground'}`} strokeWidth={1.5} />
                </div>
                <p className="text-xl font-display font-bold text-foreground">{s.count}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Week Navigation & View Toggle */}
          <div className="flex items-center justify-between mt-4 mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-lg border border-border/20 hover:bg-muted/50 transition-colors">
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button onClick={() => setWeekOffset(0)} className="text-xs px-3 py-2 rounded-lg border border-border/20 hover:bg-muted/50 transition-colors font-medium text-foreground">
                Today
              </button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 rounded-lg border border-border/20 hover:bg-muted/50 transition-colors">
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
              <h3 className="text-sm font-display font-semibold text-foreground ml-2">
                {format(monday, "d MMM")} – {format(addDays(monday, 6), "d MMM yyyy")}
              </h3>
            </div>
            <div className="flex gap-1.5">
              {(['week', 'list'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`text-xs px-4 py-2 rounded-lg border transition-all ${view === v ? 'bg-card border-gold/30 text-foreground shadow-sm' : 'border-border/20 text-muted-foreground hover:bg-card'}`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Views */}
          <div className="card-premium p-4 sm:p-6">
            {view === 'week' ? (
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {DAYS.map((day, i) => {
                  const dateStr = weekDates[i];
                  const dayEvents = events.filter(e => e.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                  const isToday = isSameDay(new Date(dateStr), today);
                  return (
                    <div key={day} className="min-h-[180px]">
                      <button
                        onClick={() => handleDayClick(dateStr)}
                        className={`w-full text-center mb-2 py-1.5 rounded-lg transition-colors hover:bg-primary/10 ${isToday ? 'bg-primary/10' : ''}`}
                      >
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{day}</p>
                        <p className={`text-sm font-display font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>{new Date(dateStr).getDate()}</p>
                      </button>
                      <div className="space-y-1">
                        {dayEvents.map(ev => {
                          const tc = typeConfig[ev.type] || typeConfig.admin;
                          return (
                            <div
                              key={ev.id}
                              className={`rounded-lg p-1.5 sm:p-2 border border-border/15 ${tc.cls} bg-opacity-60 group relative cursor-pointer transition-all hover:shadow-sm ${ev.completed ? 'opacity-50' : ''}`}
                              onClick={() => handleEditClick(ev)}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <tc.icon className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                                <span className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider truncate">{tc.label}</span>
                              </div>
                              <p className="text-[9px] sm:text-[10px] font-medium leading-tight truncate">{ev.retailer_name || ev.title}</p>
                              {ev.time && <p className="text-[8px] sm:text-[9px] opacity-70 mt-0.5">{ev.time}</p>}
                              {/* Quick actions on hover */}
                              <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                                <button
                                  onClick={e => { e.stopPropagation(); toggleComplete(ev); }}
                                  className="p-0.5 rounded bg-background/80 hover:bg-background"
                                  title={ev.completed ? "Mark incomplete" : "Mark complete"}
                                >
                                  <CheckCircle2 className={`w-3 h-3 ${ev.completed ? 'text-success' : 'text-muted-foreground'}`} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); setConfirmDelete(ev.id); }}
                                  className="p-0.5 rounded bg-background/80 hover:bg-destructive/10"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {dayEvents.length === 0 && i < 5 && (
                          <button
                            onClick={() => handleDayClick(dateStr)}
                            className="w-full rounded-lg p-2 border border-dashed border-border/20 text-center hover:border-primary/30 hover:bg-primary/5 transition-colors"
                          >
                            <Plus className="w-3 h-3 mx-auto text-muted-foreground/40 mb-0.5" />
                            <p className="text-[8px] text-muted-foreground/40">Add</p>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {weekEvents.length === 0 && (
                  <div className="text-center py-12">
                    <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground/50 italic">No events this week</p>
                    <Button onClick={handleNewClick} variant="outline" size="sm" className="mt-3 text-xs gap-1">
                      <Plus className="w-3.5 h-3.5" />Book your first event
                    </Button>
                  </div>
                )}
                {weekEvents.map(ev => {
                  const tc = typeConfig[ev.type] || typeConfig.admin;
                  return (
                    <div key={ev.id}
                      className={`flex items-center gap-3 py-3 px-4 rounded-lg border border-border/10 hover:bg-champagne/15 transition-colors group ${ev.completed ? 'opacity-50' : ''}`}>
                      <button onClick={() => toggleComplete(ev)} className="flex-shrink-0">
                        <CheckCircle2 className={`w-5 h-5 ${ev.completed ? 'text-success' : 'text-muted-foreground/30 hover:text-success/60'} transition-colors`} />
                      </button>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.cls}`}>
                        <tc.icon className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => ev.retailer_id ? navigate(`/retailer/${ev.retailer_id}`) : handleEditClick(ev)}>
                        <p className={`text-sm font-medium text-foreground ${ev.completed ? 'line-through' : ''}`}>{ev.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {ev.town && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{ev.town}</span>}
                          {ev.notes && <span className="truncate max-w-[200px]">{ev.notes}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-foreground">{format(new Date(ev.date), "EEE d MMM")}</p>
                        {ev.time && <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{ev.time}</p>}
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${tc.cls}`}>{tc.label}</span>
                      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleEditClick(ev)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete(ev.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="promotions">
          <PromotionsTracker />
        </TabsContent>
      </Tabs>

      {/* Event Booker Dialog */}
      <EventBooker
        open={bookOpen}
        onOpenChange={setBookOpen}
        editEvent={editEvent}
        defaultDate={defaultDate}
        onSaved={fetchEvents}
      />

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <div className="card-premium p-6 max-w-sm mx-4 space-y-4">
            <h3 className="text-sm font-display font-semibold text-foreground">Delete Event?</h3>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)} className="text-xs">Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteEvent(confirmDelete)} className="text-xs">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
