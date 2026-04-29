import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetails {
  name?: string;
  address?: string;
  town?: string;
  county?: string;
  lat?: number;
  lng?: number;
  website?: string;
  phone?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (details: PlaceDetails & { prediction: PlacePrediction }) => void;
  placeholder?: string;
  disabled?: boolean;
  onEnter?: () => void;
}

export function PlacesAutocomplete({ value, onChange, onSelect, placeholder, disabled, onEnter }: Props) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setPredictions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("places-autocomplete", {
          body: { action: "autocomplete", input: value, sessionToken: sessionTokenRef.current },
        });
        if (!error && data?.predictions) {
          setPredictions(data.predictions);
          setOpen(true);
        }
      } catch (err) {
        console.error("autocomplete error", err);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);

  const pick = async (p: PlacePrediction) => {
    setOpen(false);
    setResolving(true);
    onChange(p.main_text);
    try {
      const { data, error } = await supabase.functions.invoke("places-autocomplete", {
        body: { action: "details", placeId: p.place_id, sessionToken: sessionTokenRef.current },
      });
      // Rotate session token after a details call (Google billing optimisation)
      sessionTokenRef.current = crypto.randomUUID();
      if (!error && data?.place) {
        onSelect({ ...data.place, prediction: p });
      }
    } catch (err) {
      console.error("details error", err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" && onEnter) { setOpen(false); onEnter(); } }}
        placeholder={placeholder || "Type a store name…"}
        disabled={disabled || resolving}
        className="text-xs h-8 pl-8 pr-8 bg-background/60 border-border/40"
      />
      {(loading || resolving) && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
      )}
      {open && predictions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-popover border border-border/40 rounded-md shadow-lg max-h-64 overflow-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => pick(p)}
              className="w-full text-left px-3 py-2 hover:bg-muted/60 text-xs flex items-start gap-2 border-b border-border/20 last:border-b-0"
            >
              <MapPin className="w-3.5 h-3.5 mt-0.5 text-gold flex-shrink-0" strokeWidth={1.5} />
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{p.main_text}</div>
                <div className="text-[10px] text-muted-foreground truncate">{p.secondary_text}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
