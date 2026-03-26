import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CalendarDays, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface MeetingBookerProps {
  retailerId: string;
  retailerName: string;
  town: string;
  suggestedArrival: string;
  selectedDate: string;
  routeName: string;
  onBooked: () => void;
}

export function MeetingBooker({
  retailerId,
  retailerName,
  town,
  suggestedArrival,
  selectedDate,
  routeName,
  onBooked,
}: MeetingBookerProps) {
  const [open, setOpen] = useState(false);
  const [arrivalTime, setArrivalTime] = useState(suggestedArrival);
  const [duration, setDuration] = useState(30);
  const [meetingType, setMeetingType] = useState<"visit" | "call">("visit");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const endTime = (() => {
    const [h, m] = arrivalTime.split(":").map(Number);
    const totalMins = h * 60 + m + duration;
    return `${String(Math.floor(totalMins / 60)).padStart(2, "0")}:${String(totalMins % 60).padStart(2, "0")}`;
  })();

  const bookMeeting = async () => {
    setBooking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in first"); return; }

      const { error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title: `${meetingType === "visit" ? "Visit" : "Call"}: ${retailerName}`,
        date: selectedDate,
        time: arrivalTime,
        type: meetingType,
        retailer_name: retailerName,
        retailer_id: retailerId,
        town,
        notes: `Route: ${routeName} | ${arrivalTime}–${endTime} (${duration}m)${notes ? " | " + notes : ""}`,
      });

      if (error) throw error;
      toast.success(`${meetingType === "visit" ? "Visit" : "Call"} booked: ${retailerName} at ${arrivalTime} on ${format(new Date(selectedDate), "d MMM")}`);
      onBooked();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to book");
    } finally {
      setBooking(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[9px] text-primary hover:text-accent font-medium flex items-center gap-0.5 transition-colors"
      >
        <CalendarDays className="w-3 h-3" />Book
      </button>
    );
  }

  return (
    <div className="mt-1 p-2.5 rounded-lg bg-muted/40 border border-border/20 space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="w-3 h-3 text-primary" />
        <span className="text-xs font-medium text-foreground">{retailerName}</span>
        <span className="text-[10px] text-muted-foreground">{town}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Arrival</label>
          <input
            type="time"
            value={arrivalTime}
            onChange={e => setArrivalTime(e.target.value)}
            className="w-full text-xs bg-background rounded px-2 py-1.5 border border-border/30 text-foreground"
          />
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Duration</label>
          <select
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full text-xs bg-background rounded px-2 py-1.5 border border-border/30 text-foreground"
          >
            <option value={15}>15 min</option>
            <option value={30}>30 min</option>
            <option value={45}>45 min</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Type</label>
          <select
            value={meetingType}
            onChange={e => setMeetingType(e.target.value as "visit" | "call")}
            className="w-full text-xs bg-background rounded px-2 py-1.5 border border-border/30 text-foreground"
          >
            <option value="visit">Store Visit</option>
            <option value="call">Phone Call</option>
          </select>
        </div>
      </div>

      <input
        type="text"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Meeting notes (optional)..."
        className="w-full text-xs bg-background rounded px-2.5 py-1.5 border border-border/30 text-foreground placeholder:text-muted-foreground/40"
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />{arrivalTime} – {endTime}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Cancel
          </button>
          <button
            onClick={bookMeeting}
            disabled={booking}
            className="text-[10px] font-medium px-3 py-1.5 rounded-lg gold-gradient text-card hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
          >
            {booking ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            {booking ? "Booking..." : "Book Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
