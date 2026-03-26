import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, Users, Phone, Mail, MessageSquare, Briefcase, Loader2, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type EventType = "meeting" | "call" | "visit" | "follow_up" | "email" | "admin";

interface EventBookerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retailerId?: string | null;
  retailerName?: string;
  town?: string;
  defaultDate?: string;
  defaultTime?: string;
  defaultType?: EventType;
  defaultTitle?: string;
  defaultNotes?: string;
  editEvent?: {
    id: string;
    title: string;
    date: string;
    time: string | null;
    type: string;
    notes: string | null;
    retailer_id: string | null;
    retailer_name: string | null;
    town: string | null;
    completed: boolean;
  } | null;
  onSaved?: () => void;
}

const EVENT_TYPES: { value: EventType; label: string; icon: typeof Phone }[] = [
  { value: "visit", label: "Store Visit", icon: MapPin },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "call", label: "Phone Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "follow_up", label: "Follow Up", icon: MessageSquare },
  { value: "admin", label: "Admin Task", icon: Briefcase },
];

const DURATIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function EventBooker({
  open,
  onOpenChange,
  retailerId,
  retailerName,
  town,
  defaultDate,
  defaultTime,
  defaultType = "meeting",
  defaultTitle,
  defaultNotes,
  editEvent,
  onSaved,
}: EventBookerProps) {
  const isEditing = !!editEvent;

  const [eventType, setEventType] = useState<EventType>(defaultType);
  const [title, setTitle] = useState(defaultTitle || "");
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState(defaultTime || "10:00");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState(defaultNotes || "");
  const [saving, setSaving] = useState(false);
  const [retailers, setRetailers] = useState<{ id: string; name: string; town: string }[]>([]);
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(retailerId || null);
  const [selectedRetailerName, setSelectedRetailerName] = useState(retailerName || "");
  const [selectedTown, setSelectedTown] = useState(town || "");
  const [searchRetailer, setSearchRetailer] = useState("");

  // Load retailers for picker
  useEffect(() => {
    if (open && !retailerId) {
      supabase.from("retailers").select("id, name, town").order("name").then(({ data }) => {
        setRetailers(data ?? []);
      });
    }
  }, [open, retailerId]);

  // Populate from edit event
  useEffect(() => {
    if (editEvent) {
      setEventType(editEvent.type as EventType);
      setTitle(editEvent.title);
      setDate(editEvent.date);
      setTime(editEvent.time || "10:00");
      setNotes(editEvent.notes || "");
      setSelectedRetailerId(editEvent.retailer_id);
      setSelectedRetailerName(editEvent.retailer_name || "");
      setSelectedTown(editEvent.town || "");
    } else {
      setEventType(defaultType);
      setTitle(defaultTitle || "");
      setDate(defaultDate || new Date().toISOString().split("T")[0]);
      setTime(defaultTime || "10:00");
      setNotes(defaultNotes || "");
      setSelectedRetailerId(retailerId || null);
      setSelectedRetailerName(retailerName || "");
      setSelectedTown(town || "");
    }
  }, [editEvent, open, defaultType, defaultDate, defaultTime, defaultTitle, defaultNotes, retailerId, retailerName, town]);

  // Auto-generate title
  useEffect(() => {
    if (!isEditing && selectedRetailerName) {
      const typeLabel = EVENT_TYPES.find(t => t.value === eventType)?.label || "Meeting";
      setTitle(`${typeLabel}: ${selectedRetailerName}`);
    }
  }, [eventType, selectedRetailerName, isEditing]);

  const endTime = (() => {
    const [h, m] = time.split(":").map(Number);
    const totalMins = h * 60 + m + duration;
    return `${String(Math.floor(totalMins / 60)).padStart(2, "0")}:${String(totalMins % 60).padStart(2, "0")}`;
  })();

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in first"); return; }

      const payload = {
        user_id: user.id,
        title: title.trim(),
        date,
        time,
        type: eventType,
        retailer_name: selectedRetailerName || null,
        retailer_id: selectedRetailerId || null,
        town: selectedTown || null,
        notes: notes.trim() || `${time}–${endTime} (${duration}m)`,
      };

      if (isEditing && editEvent) {
        const { error } = await supabase.from("calendar_events").update(payload).eq("id", editEvent.id);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { error } = await supabase.from("calendar_events").insert(payload);
        if (error) throw error;
        const typeLabel = EVENT_TYPES.find(t => t.value === eventType)?.label || "Event";
        toast.success(`${typeLabel} booked for ${format(new Date(date), "d MMM")} at ${time}`);
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const filteredRetailers = retailers.filter(r =>
    r.name.toLowerCase().includes(searchRetailer.toLowerCase()) ||
    r.town.toLowerCase().includes(searchRetailer.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            {isEditing ? "Edit Event" : "Book Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Type */}
          <div className="grid grid-cols-3 gap-1.5">
            {EVENT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setEventType(t.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  eventType === t.value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/20 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Account Picker (if no retailer pre-selected) */}
          {!retailerId && (
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Account (optional)</label>
              {selectedRetailerId ? (
                <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border border-border/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedRetailerName}</p>
                    {selectedTown && <p className="text-[10px] text-muted-foreground">{selectedTown}</p>}
                  </div>
                  <button onClick={() => { setSelectedRetailerId(null); setSelectedRetailerName(""); setSelectedTown(""); }}
                    className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    placeholder="Search accounts..."
                    value={searchRetailer}
                    onChange={e => setSearchRetailer(e.target.value)}
                    className="text-xs h-9"
                  />
                  {searchRetailer && (
                    <div className="max-h-32 overflow-y-auto rounded-lg border border-border/20 bg-background">
                      {filteredRetailers.slice(0, 8).map(r => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setSelectedRetailerId(r.id);
                            setSelectedRetailerName(r.name);
                            setSelectedTown(r.town);
                            setSearchRetailer("");
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors border-b border-border/10 last:border-0"
                        >
                          <span className="font-medium text-foreground">{r.name}</span>
                          <span className="text-muted-foreground ml-2">{r.town}</span>
                        </button>
                      ))}
                      {filteredRetailers.length === 0 && (
                        <p className="text-xs text-muted-foreground p-3 text-center">No accounts found</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title..." className="text-sm h-9" />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm h-9" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Time</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="text-sm h-9" />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Duration</label>
            <Select value={String(duration)} onValueChange={v => setDuration(Number(v))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map(d => (
                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add meeting agenda, talking points..." rows={3} className="text-sm resize-none" />
          </div>

          {/* Time Summary */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(date), "EEE d MMM yyyy")} · {time} – {endTime} ({duration}m)</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gold-gradient text-card border-0">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              {isEditing ? "Update" : "Book"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick book button to embed anywhere
export function QuickBookButton({
  retailerId,
  retailerName,
  town,
  defaultType = "meeting",
  variant = "default",
  className = "",
}: {
  retailerId: string;
  retailerName: string;
  town?: string;
  defaultType?: EventType;
  variant?: "default" | "icon" | "small";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const typeIcons: Record<EventType, typeof Calendar> = {
    meeting: Users,
    call: Phone,
    visit: MapPin,
    follow_up: MessageSquare,
    email: Mail,
    admin: Briefcase,
  };
  const Icon = typeIcons[defaultType];

  return (
    <>
      {variant === "icon" ? (
        <button onClick={() => setOpen(true)} className={`p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors ${className}`} title="Book event">
          <Calendar className="w-4 h-4" />
        </button>
      ) : variant === "small" ? (
        <button onClick={() => setOpen(true)} className={`text-[9px] text-primary hover:text-accent font-medium flex items-center gap-0.5 transition-colors ${className}`}>
          <Calendar className="w-3 h-3" />Book
        </button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className={`text-xs gap-1.5 ${className}`}>
          <Icon className="w-3.5 h-3.5" />
          Book {EVENT_TYPES.find(t => t.value === defaultType)?.label}
        </Button>
      )}
      <EventBooker
        open={open}
        onOpenChange={setOpen}
        retailerId={retailerId}
        retailerName={retailerName}
        town={town}
        defaultType={defaultType}
        onSaved={() => {}}
      />
    </>
  );
}
