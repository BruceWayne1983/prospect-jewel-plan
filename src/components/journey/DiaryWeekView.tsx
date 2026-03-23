import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock, MapPin, Home, Baby, AlertCircle, Plus, X, Car } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

export type DayAvailability = 'full_day' | 'local_only' | 'morning_only' | 'afternoon_only' | 'unavailable';

export interface DayPreference {
  dayOfWeek: number; // 0=Mon, 1=Tue, etc
  availability: DayAvailability;
  startTime: string;
  endTime: string;
  maxDriveMinutes: number; // 0 = no limit
  notes: string;
}

export interface ScheduledVisit {
  retailerId: string;
  retailerName: string;
  town: string;
  date: string;
  leaveTime: string;
  arrivalTime: string;
  visitEndTime: string;
  driveMinutes: number;
  routeName: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  type: string;
  retailer_name: string | null;
  town: string | null;
}

const AVAILABILITY_CONFIG: Record<DayAvailability, { label: string; cls: string; icon: typeof MapPin }> = {
  full_day: { label: 'Full Day', cls: 'bg-success-light text-success', icon: MapPin },
  local_only: { label: 'Local Only', cls: 'bg-warning-light text-warning', icon: Home },
  morning_only: { label: 'Morning Only', cls: 'bg-info-light text-info', icon: Clock },
  afternoon_only: { label: 'Afternoon Only', cls: 'bg-info-light text-info', icon: Clock },
  unavailable: { label: 'Unavailable', cls: 'bg-destructive/10 text-destructive', icon: AlertCircle },
};

const DEFAULT_PREFERENCES: DayPreference[] = [
  { dayOfWeek: 0, availability: 'full_day', startTime: '08:30', endTime: '17:00', maxDriveMinutes: 0, notes: '' },
  { dayOfWeek: 1, availability: 'full_day', startTime: '08:30', endTime: '17:00', maxDriveMinutes: 0, notes: '' },
  { dayOfWeek: 2, availability: 'local_only', startTime: '09:30', endTime: '14:30', maxDriveMinutes: 30, notes: 'School run — local visits only' },
  { dayOfWeek: 3, availability: 'full_day', startTime: '08:30', endTime: '17:00', maxDriveMinutes: 0, notes: '' },
  { dayOfWeek: 4, availability: 'local_only', startTime: '09:30', endTime: '14:30', maxDriveMinutes: 30, notes: 'School run — local visits only' },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function loadPreferences(): DayPreference[] {
  try {
    const saved = localStorage.getItem('emma_diary_prefs');
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PREFERENCES;
}

function savePreferences(prefs: DayPreference[]) {
  localStorage.setItem('emma_diary_prefs', JSON.stringify(prefs));
}

interface DiaryWeekViewProps {
  onDaySelect: (dayIndex: number, date: string, pref: DayPreference) => void;
  selectedDay: number | null;
  scheduledVisits: ScheduledVisit[];
}

export function DiaryWeekView({ onDaySelect, selectedDay, scheduledVisits }: DiaryWeekViewProps) {
  const [preferences, setPreferences] = useState<DayPreference[]>(loadPreferences);
  const [editing, setEditing] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Current week dates
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 5 }, (_, i) => addDays(monday, i));

  useEffect(() => {
    const startDate = format(weekDates[0], 'yyyy-MM-dd');
    const endDate = format(weekDates[4], 'yyyy-MM-dd');
    supabase.from("calendar_events").select("id, title, date, time, type, retailer_name, town")
      .gte("date", startDate).lte("date", endDate)
      .order("time", { ascending: true })
      .then(({ data }) => setEvents(data ?? []));
  }, []);

  const updatePref = (dayIndex: number, updates: Partial<DayPreference>) => {
    const next = preferences.map(p => p.dayOfWeek === dayIndex ? { ...p, ...updates } : p);
    setPreferences(next);
    savePreferences(next);
  };

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Emma's Diary</h3>
            <p className="text-[10px] text-muted-foreground">Week of {format(monday, 'd MMMM yyyy')}</p>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} className="text-[10px] text-primary hover:text-accent transition-colors font-medium">
          {editing ? 'Done' : 'Edit Availability'}
        </button>
      </div>

      <div className="space-y-2">
        {weekDates.map((date, i) => {
          const pref = preferences.find(p => p.dayOfWeek === i) ?? DEFAULT_PREFERENCES[i];
          const avail = AVAILABILITY_CONFIG[pref.availability];
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayEvents = events.filter(e => e.date === dateStr);
          const dayVisits = scheduledVisits.filter(v => v.date === dateStr);
          const isToday = isSameDay(date, today);
          const isSelected = selectedDay === i;

          return (
            <div
              key={i}
              onClick={() => pref.availability !== 'unavailable' && onDaySelect(i, dateStr, pref)}
              className={`rounded-xl border p-3 transition-all cursor-pointer
                ${isSelected ? 'border-primary/40 bg-champagne/20 shadow-sm' : 'border-border/20 hover:border-border/40 hover:bg-muted/30'}
                ${pref.availability === 'unavailable' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-display font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {DAY_SHORT[i]}
                  </span>
                  <span className="text-xs text-muted-foreground">{format(date, 'd MMM')}</span>
                  {isToday && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Today</span>}
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${avail.cls}`}>
                  <avail.icon className="w-2.5 h-2.5" />
                  {avail.label}
                </span>
              </div>

              {/* Time window */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{pref.startTime} – {pref.endTime}</span>
                {pref.maxDriveMinutes > 0 && (
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" />Max {pref.maxDriveMinutes}m drive</span>
                )}
              </div>

              {pref.notes && (
                <p className="text-[10px] text-warning flex items-center gap-1 mb-1.5">
                  <Baby className="w-3 h-3 flex-shrink-0" />{pref.notes}
                </p>
              )}

              {/* Existing calendar events */}
              {dayEvents.length > 0 && (
                <div className="space-y-1 mt-1.5">
                  {dayEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">{ev.time && `${ev.time} · `}{ev.retailer_name || ev.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scheduled visits from route planning */}
              {dayVisits.length > 0 && (
                <div className="space-y-1 mt-1.5 pt-1.5 border-t border-border/15">
                  {dayVisits.map((v, vi) => (
                    <div key={vi} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2">
                        <Car className="w-3 h-3 text-primary/60" />
                        <span className="text-foreground font-medium">{v.retailerName}</span>
                        <span className="text-muted-foreground">{v.town}</span>
                      </div>
                      <span className="text-muted-foreground">Leave {v.leaveTime} · Arrive {v.arrivalTime}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit mode */}
              {editing && (
                <div className="mt-2 pt-2 border-t border-border/20 space-y-2">
                  <div className="flex gap-1.5 flex-wrap">
                    {(Object.entries(AVAILABILITY_CONFIG) as [DayAvailability, typeof AVAILABILITY_CONFIG['full_day']][]).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={(e) => { e.stopPropagation(); updatePref(i, { availability: key }); }}
                        className={`text-[9px] px-2 py-0.5 rounded-full font-medium transition-all
                          ${pref.availability === key ? config.cls + ' ring-1 ring-current' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <label className="text-[9px] text-muted-foreground">Start</label>
                      <input type="time" value={pref.startTime}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updatePref(i, { startTime: e.target.value }); }}
                        className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5 border border-border/20 text-foreground" />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[9px] text-muted-foreground">End</label>
                      <input type="time" value={pref.endTime}
                        onClick={e => e.stopPropagation()}
                        onChange={e => { e.stopPropagation(); updatePref(i, { endTime: e.target.value }); }}
                        className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5 border border-border/20 text-foreground" />
                    </div>
                    {(pref.availability === 'local_only') && (
                      <div className="flex items-center gap-1">
                        <label className="text-[9px] text-muted-foreground">Max drive</label>
                        <input type="number" value={pref.maxDriveMinutes} min={0} max={120}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); updatePref(i, { maxDriveMinutes: parseInt(e.target.value) || 0 }); }}
                          className="text-[10px] bg-muted/50 rounded px-1.5 py-0.5 border border-border/20 text-foreground w-14" />
                        <span className="text-[9px] text-muted-foreground">min</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Notes (e.g. school run, kids club)"
                    value={pref.notes}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); updatePref(i, { notes: e.target.value }); }}
                    className="w-full text-[10px] bg-muted/50 rounded px-2 py-1 border border-border/20 text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { AVAILABILITY_CONFIG, loadPreferences, DAY_NAMES, DAY_SHORT };
