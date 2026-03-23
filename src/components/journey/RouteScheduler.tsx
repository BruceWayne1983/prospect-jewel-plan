import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Car, MapPin, CalendarDays, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { DayPreference, ScheduledVisit } from "./DiaryWeekView";

interface RouteCluster {
  town: string;
  county: string;
  retailers: { id: string; name: string; town: string; contactName: string; }[];
  lat: number;
  lng: number;
}

interface PlannedRoute {
  name: string;
  clusters: RouteCluster[];
  totalStops: number;
  estimatedDriveMinutes: number;
  priority: 'high' | 'medium' | 'low';
}

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDriveMinutes(km: number): number {
  return Math.round(km * 2);
}

function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMins = h * 60 + m + mins;
  return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface RouteSchedulerProps {
  route: PlannedRoute;
  selectedDate: string;
  dayPref: DayPreference;
  onScheduled: (visits: ScheduledVisit[]) => void;
}

export function RouteScheduler({ route, selectedDate, dayPref, onScheduled }: RouteSchedulerProps) {
  const [booking, setBooking] = useState(false);
  const visitDuration = 30; // minutes per visit

  // Check if route fits within the day's constraints
  const routeFitsDay = (): { fits: boolean; warnings: string[]; schedule: ScheduledVisit[] } => {
    const warnings: string[] = [];
    const schedule: ScheduledVisit[] = [];
    let currentTime = dayPref.startTime;
    const endMinutes = timeToMinutes(dayPref.endTime);

    // Check drive time constraint for local_only days
    if (dayPref.availability === 'local_only' && dayPref.maxDriveMinutes > 0) {
      if (route.estimatedDriveMinutes > dayPref.maxDriveMinutes * 2) {
        warnings.push(`Route needs ~${route.estimatedDriveMinutes}m driving — exceeds ${dayPref.maxDriveMinutes}m local limit`);
      }
    }

    for (let ci = 0; ci < route.clusters.length; ci++) {
      const cluster = route.clusters[ci];

      // Drive time from previous cluster
      if (ci > 0) {
        const prev = route.clusters[ci - 1];
        const driveKm = haversine(prev.lat, prev.lng, cluster.lat, cluster.lng);
        const driveMins = estimateDriveMinutes(driveKm);
        const leaveTime = currentTime;
        currentTime = addMinutesToTime(currentTime, driveMins);

        // Check if we've overrun the day
        if (timeToMinutes(currentTime) > endMinutes) {
          warnings.push(`Visits to ${cluster.town} would run past ${dayPref.endTime}`);
        }
      }

      for (const r of cluster.retailers) {
        const leaveTime = ci === 0 && cluster.retailers.indexOf(r) === 0
          ? addMinutesToTime(currentTime, -15) // Leave 15m before first visit
          : currentTime;
        const arrivalTime = currentTime;
        const visitEnd = addMinutesToTime(currentTime, visitDuration);

        schedule.push({
          retailerId: r.id,
          retailerName: r.name,
          town: cluster.town,
          date: selectedDate,
          leaveTime,
          arrivalTime,
          visitEndTime: visitEnd,
          driveMinutes: ci > 0 && cluster.retailers.indexOf(r) === 0
            ? estimateDriveMinutes(haversine(
                route.clusters[ci - 1].lat, route.clusters[ci - 1].lng,
                cluster.lat, cluster.lng
              ))
            : 0,
          routeName: route.name,
        });

        currentTime = visitEnd;
      }
    }

    // Check total time
    const totalMinutes = timeToMinutes(currentTime) - timeToMinutes(dayPref.startTime);
    const availableMinutes = endMinutes - timeToMinutes(dayPref.startTime);

    if (dayPref.availability === 'morning_only' || dayPref.availability === 'afternoon_only') {
      if (totalMinutes > availableMinutes) {
        warnings.push(`Route needs ~${Math.round(totalMinutes / 60)}h but only ${Math.round(availableMinutes / 60)}h available`);
      }
    }

    return { fits: warnings.length === 0, warnings, schedule };
  };

  const { fits, warnings, schedule } = routeFitsDay();

  const bookRoute = async () => {
    setBooking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in first"); setBooking(false); return; }

      // Create calendar events for each visit
      const events = schedule.map(v => ({
        user_id: user.id,
        title: `Visit: ${v.retailerName}`,
        date: v.date,
        time: v.arrivalTime,
        type: 'visit' as const,
        retailer_name: v.retailerName,
        town: v.town,
        notes: `Route: ${v.routeName} | Leave: ${v.leaveTime} | Drive: ${v.driveMinutes}m | Visit: ${v.arrivalTime}–${v.visitEndTime}`,
      }));

      const { error } = await supabase.from("calendar_events").insert(events);
      if (error) throw error;

      toast.success(`${schedule.length} visits booked for ${format(new Date(selectedDate), 'EEEE d MMM')}`);
      onScheduled(schedule);
    } catch (err: any) {
      toast.error(err.message || "Failed to book route");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-display font-semibold text-foreground">
            Schedule for {format(new Date(selectedDate), 'EEEE d MMM')}
          </h4>
        </div>
        {!fits && <AlertTriangle className="w-4 h-4 text-warning" />}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />{w}
            </p>
          ))}
        </div>
      )}

      {/* Time schedule preview */}
      <div className="bg-muted/30 rounded-lg p-3 mb-3">
        <div className="space-y-1.5">
          {schedule.map((v, i) => (
            <div key={i} className="flex items-center gap-3 text-[10px]">
              {v.driveMinutes > 0 && i > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground/60 w-full pb-1">
                  <Car className="w-3 h-3" />
                  <span>Leave {v.leaveTime} · {v.driveMinutes}m drive</span>
                  <div className="flex-1 border-b border-dashed border-border/20" />
                </div>
              )}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-mono font-medium w-10">{v.arrivalTime}</span>
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">{v.retailerName}</span>
                  <span className="text-muted-foreground">{v.town}</span>
                </div>
                <span className="text-muted-foreground">until {v.visitEndTime}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1.5 border-t border-border/15 mt-1.5">
            <Clock className="w-3 h-3" />
            <span>Day ends ~{schedule.length > 0 ? schedule[schedule.length - 1].visitEndTime : dayPref.endTime} · Back by {dayPref.endTime}</span>
          </div>
        </div>
      </div>

      <button
        onClick={bookRoute}
        disabled={booking}
        className="w-full py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2
          gold-gradient text-card hover:opacity-90 disabled:opacity-50"
      >
        {booking ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Booking...</>
        ) : (
          <><CheckCircle2 className="w-3.5 h-3.5" />Book {schedule.length} Visits into Calendar</>
        )}
      </button>
    </div>
  );
}
