CREATE TABLE IF NOT EXISTS public.route_distance_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_id TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  origin_lat NUMERIC NOT NULL,
  origin_lng NUMERIC NOT NULL,
  destination_lat NUMERIC NOT NULL,
  destination_lng NUMERIC NOT NULL,
  hour_of_day INTEGER NOT NULL,
  distance_km NUMERIC NOT NULL,
  duration_minutes INTEGER NOT NULL,
  duration_in_traffic_minutes INTEGER,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS idx_route_cache_lookup
  ON public.route_distance_cache(origin_id, destination_id, hour_of_day);

CREATE INDEX IF NOT EXISTS idx_route_cache_expires
  ON public.route_distance_cache(expires_at);

ALTER TABLE public.route_distance_cache ENABLE ROW LEVEL SECURITY;
-- Intentionally no client policies: only the service role (used inside the
-- route-distances edge function) can read or write this cache.