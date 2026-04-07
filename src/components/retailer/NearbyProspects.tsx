import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Radar, MapPin, Target, Loader2, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ScoreIndicators";
import { toast } from "sonner";

interface NearbyProspectsProps {
  retailerId: string;
  retailerName: string;
  retailerLat: number | null;
  retailerLng: number | null;
  retailerTown: string;
  retailerCounty: string;
  pipelineStage: string;
}

interface NearbyItem {
  id: string;
  name: string;
  town: string;
  county: string;
  category: string;
  lat: number;
  lng: number;
  fit_score: number;
  pipeline_stage?: string;
  type: "prospect" | "retailer";
  distanceMiles: number;
  distanceBand: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function kmToMiles(km: number): number {
  return km * 0.621371;
}

function getDistanceBand(miles: number): string {
  if (miles <= 3) return "Walking distance";
  if (miles <= 10) return "Short drive";
  if (miles <= 20) return "Same trip";
  return "Further";
}

export function NearbyProspects({
  retailerId,
  retailerName,
  retailerLat,
  retailerLng,
  retailerTown,
  retailerCounty,
  pipelineStage,
}: NearbyProspectsProps) {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<any[]>([]);
  const [pipelineRetailers, setPipelineRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!retailerLat || !retailerLng) {
      setLoading(false);
      return;
    }

    const fetchNearby = async () => {
      const [prospectsRes, retailersRes] = await Promise.all([
        supabase.from("discovered_prospects").select("id, name, town, county, category, lat, lng, predicted_fit_score, status"),
        supabase.from("retailers").select("id, name, town, county, category, lat, lng, fit_score, pipeline_stage").neq("id", retailerId),
      ]);

      setProspects(prospectsRes.data || []);
      setPipelineRetailers(retailersRes.data || []);
      setLoading(false);
    };

    fetchNearby();
  }, [retailerId, retailerLat, retailerLng]);

  const nearbyItems: NearbyItem[] = useMemo(() => {
    if (!retailerLat || !retailerLng) return [];

    const items: NearbyItem[] = [];

    for (const p of prospects) {
      if (!p.lat || !p.lng || p.status === "dismissed") continue;
      const km = haversineKm(retailerLat, retailerLng, p.lat, p.lng);
      const miles = kmToMiles(km);
      if (miles <= 20) {
        items.push({
          id: p.id,
          name: p.name,
          town: p.town,
          county: p.county,
          category: p.category,
          lat: p.lat,
          lng: p.lng,
          fit_score: p.predicted_fit_score ?? 0,
          type: "prospect",
          distanceMiles: miles,
          distanceBand: getDistanceBand(miles),
        });
      }
    }

    for (const r of pipelineRetailers) {
      if (!r.lat || !r.lng) continue;
      // Only show pipeline accounts that aren't approved (those are existing accounts, not prospects)
      if (r.pipeline_stage === "approved") continue;
      const km = haversineKm(retailerLat, retailerLng, r.lat, r.lng);
      const miles = kmToMiles(km);
      if (miles <= 20) {
        items.push({
          id: r.id,
          name: r.name,
          town: r.town,
          county: r.county,
          category: r.category,
          lat: r.lat,
          lng: r.lng,
          fit_score: r.fit_score ?? 0,
          pipeline_stage: r.pipeline_stage,
          type: "retailer",
          distanceMiles: miles,
          distanceBand: getDistanceBand(miles),
        });
      }
    }

    return items.sort((a, b) => a.distanceMiles - b.distanceMiles);
  }, [retailerLat, retailerLng, prospects, pipelineRetailers]);

  const handleFindProspects = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("discover-web", {
        body: {
          county: retailerCounty,
          town: retailerTown,
          categories: ["jeweller", "gift_shop", "fashion_boutique", "lifestyle_store", "premium_accessories"],
        },
      });
      if (error) throw error;
      if (data?.prospects?.length > 0) {
        toast.success(`Found ${data.prospects.length} prospects near ${retailerTown}!`);
        // Refresh data
        const prospectsRes = await supabase.from("discovered_prospects").select("id, name, town, county, category, lat, lng, predicted_fit_score, status");
        setProspects(prospectsRes.data || []);
      } else {
        toast.info("No new prospects found in this area");
      }
    } catch (err: any) {
      toast.error(err.message || "Discovery scan failed");
    } finally {
      setScanning(false);
    }
  };

  // Only show for approved accounts
  if (pipelineStage !== "approved") return null;
  if (!retailerLat || !retailerLng) return null;

  const walkingDistance = nearbyItems.filter((i) => i.distanceBand === "Walking distance");
  const shortDrive = nearbyItems.filter((i) => i.distanceBand === "Short drive");
  const sameTrip = nearbyItems.filter((i) => i.distanceBand === "Same trip");

  const shown = expanded ? nearbyItems : nearbyItems.slice(0, 6);

  return (
    <div className="card-premium p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Radar className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-base font-display font-semibold text-foreground">Nearby Prospects</h3>
            <p className="text-[10px] text-muted-foreground">
              {nearbyItems.length} prospect{nearbyItems.length !== 1 ? "s" : ""} within 20 miles of {retailerName}
            </p>
          </div>
        </div>
        <Button
          onClick={handleFindProspects}
          disabled={scanning}
          variant="outline"
          size="sm"
          className="text-xs h-8"
        >
          {scanning ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-1.5" />}
          {scanning ? "Scanning..." : "Find Prospects Nearby"}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : nearbyItems.length === 0 ? (
        <div className="text-center py-8 bg-cream/30 rounded-lg border border-border/10">
          <Radar className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No prospects found within 20 miles</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Use "Find Prospects Nearby" to scan for opportunities</p>
        </div>
      ) : (
        <>
          {/* Distance band summary */}
          <div className="flex items-center gap-4 mb-4">
            {walkingDistance.length > 0 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-success-light text-success font-medium">
                🚶 {walkingDistance.length} walking distance
              </span>
            )}
            {shortDrive.length > 0 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-warning-light text-warning font-medium">
                🚗 {shortDrive.length} short drive
              </span>
            )}
            {sameTrip.length > 0 && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                📍 {sameTrip.length} same trip
              </span>
            )}
          </div>

          {/* Prospects list */}
          <div className="space-y-0.5">
            {shown.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() =>
                  navigate(item.type === "prospect" ? `/prospect/${item.id}` : `/retailer/${item.id}`)
                }
                className="w-full text-left flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-champagne/15 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {item.category.replace(/_/g, " ")}
                    </span>
                    {item.type === "retailer" && item.pipeline_stage && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {item.pipeline_stage.replace(/_/g, " ")}
                      </span>
                    )}
                    {item.type === "prospect" && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-champagne/50 text-primary font-medium">
                        prospect
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {item.town}
                    </span>
                    <span
                      className={`text-[10px] font-medium ${
                        item.distanceBand === "Walking distance"
                          ? "text-success"
                          : item.distanceBand === "Short drive"
                          ? "text-warning"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.distanceMiles.toFixed(1)} mi — {item.distanceBand}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-14">
                    <ScoreBar score={item.fit_score} label="" />
                  </div>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>

          {nearbyItems.length > 6 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-2 text-[10px] text-primary hover:text-accent font-medium py-1.5 transition-colors"
            >
              {expanded ? "Show less" : `Show all ${nearbyItems.length} nearby prospects`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
