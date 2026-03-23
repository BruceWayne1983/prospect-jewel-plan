import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Car, MapPin, CalendarDays, CheckCircle2, AlertTriangle, Loader2, Home } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { DayPreference, ScheduledVisit } from "./DiaryWeekView";
import type { HomeBase } from "@/pages/JourneyPlanner";
import { haversine, estimateDriveMinutes } from "@/pages/JourneyPlanner";

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
  driveFromHomeMinutes: number;
  driveHomeMinutes: number;
  priority: 'high' | 'medium' | 'low';
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
  homeBase: HomeBase;
  onScheduled: (visits: ScheduledVisit[]) => void;
}

export function RouteScheduler({ route, selectedDate, dayPref, homeBase, onScheduled }: RouteSchedulerProps) {
  const [booking, setBooking] = useState(false);
  const visitDuration = 30;

  const routeFitsDay = (): { fits: boolean; warnings: string[]; schedule: ScheduledVisit[]; leaveHomeTime: string; arriveHomeTime: string } => {
    const warnings: string[] = [];
    const schedule: ScheduledVisit[] = [];

    // Start with drive from home
    const leaveHomeTime = dayPref.startTime;
    let currentTime = addMinutesToTime(leaveHomeTime, route.driveFromHomeMinutes);
    const endMinutes = timeToMinutes(dayPref.endTime);

    if (dayPref.availability === 'local_only' && dayPref.maxDriveMinutes > 0) {
      if (route.driveFromHomeMinutes > dayPref.maxDriveMinutes) {
        warnings.push(`${route.driveFromHomeMinutes}m drive from home — exceeds ${dayPref.maxDriveMinutes}m local limit`);
      }
    }

    for (let ci = 0; ci < route.clusters.length; ci++) {
      const cluster = route.clusters[ci];

      if (ci > 0) {
        const prev = route.clusters[ci - 1];
        const driveKm = haversine(prev.lat, prev.lng, cluster.lat, cluster.lng);
        const driveMins = estimateDriveMinutes(driveKm);
        currentTime = addMinutesToTime(currentTime, driveMins);

        if (timeToMinutes(currentTime) > endMinutes) {
          warnings.push(`Visits to ${cluster.town} would run past ${dayPref.endTime}`);
        }
      }

      for (const r of cluster.retailers) {
        const arrivalTime = currentTime;
        const visitEnd = addMinutesToTime(currentTime, visitDuration);

        schedule.push({
          retailerId: r.id,
          retailerName: r.name,
          town: cluster.town,
          date: selectedDate,
          leaveTime: ci === 0 && cluster.retailers.indexOf(r) === 0 ? leaveHomeTime : currentTime,
          arrivalTime,
          visitEndTime: visitEnd,
          driveMinutes: ci === 0 && cluster.retailers.indexOf(r) === 0
            ? route.driveFromHomeMinutes
            : ci > 0 && cluster.retailers.indexOf(r) === 0
              ? estimateDriveMinutes(haversine(route.clusters[ci - 1].lat, route.clusters[ci - 1].lng, cluster.lat, cluster.lng))
              : 0,
          routeName: route.name,
        });

        currentTime = visitEnd;
      }
    }

    // Drive home
    const arriveHomeTime = addMinutesToTime(currentTime, route.driveHomeMinutes);

    if (timeToMinutes(arriveHomeTime) > endMinutes) {
      warnings.push(`Won't be home until ${arriveHomeTime} — after ${dayPref.endTime} end time`);
    }

    return { fits: warnings.length === 0, warnings, schedule, leaveHomeTime, arriveHomeTime };
  };

  const { fits, warnings, schedule, leaveHomeTime, arriveHomeTime } = routeFitsDay();

  const bookRoute = async () => {
    setBooking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in first"); setBooking(false); return; }

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

      {warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />{w}
            </p>
          ))}
        </div>
      )}

      <div className="bg-muted/30 rounded-lg p-3 mb-3">
        <div className="space-y-1.5">
          {/* Leave home */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground pb-1">
            <Home className="w-3 h-3 text-primary" />
            <span className="text-primary font-mono font-medium w-10">{leaveHomeTime}</span>
            <span className="font-medium text-foreground">Leave home</span>
            <span className="text-muted-foreground">({homeBase.address})</span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground/60 w-full pb-1 text-[10px]">
            <Car className="w-3 h-3" />
            <span>{route.driveFromHomeMinutes}m drive to {route.clusters[0]?.town}</span>
            <div className="flex-1 border-b border-dashed border-border/20" />
          </div>

          {schedule.map((v, i) => (
            <div key={i}>
              {v.driveMinutes > 0 && i > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground/60 w-full pb-1 text-[10px]">
                  <Car className="w-3 h-3" />
                  <span>{v.driveMinutes}m drive</span>
                  <div className="flex-1 border-b border-dashed border-border/20" />
                </div>
              )}
              <div className="flex items-center justify-between w-full text-[10px]">
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

          {/* Drive home */}
          <div className="flex items-center gap-1 text-muted-foreground/60 w-full pt-1 text-[10px]">
            <Car className="w-3 h-3" />
            <span>{route.driveHomeMinutes}m drive home</span>
            <div className="flex-1 border-b border-dashed border-border/20" />
          </div>

          <div className="flex items-center gap-2 text-[10px] pt-1.5 border-t border-border/15 mt-1.5">
            <Home className="w-3 h-3 text-primary" />
            <span className="text-primary font-mono font-medium w-10">{arriveHomeTime}</span>
            <span className="font-medium text-foreground">Arrive home</span>
            {timeToMinutes(arriveHomeTime) > timeToMinutes(dayPref.endTime) && (
              <span className="text-warning text-[9px]">⚠ past {dayPref.endTime}</span>
            )}
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
