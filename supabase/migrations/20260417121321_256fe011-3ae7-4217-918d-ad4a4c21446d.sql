
-- Per-user, per-action rate limit buckets
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  user_id        uuid        NOT NULL,
  action         text        NOT NULL,
  minute_window  timestamptz NOT NULL,
  hour_window    timestamptz NOT NULL,
  minute_count   integer     NOT NULL DEFAULT 0,
  hour_count     integer     NOT NULL DEFAULT 0,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, action)
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- No policies: only SECURITY DEFINER functions can touch this table.
-- Users have zero direct access (read or write).

-- Atomic check-and-increment.
-- Returns: { allowed bool, retry_after int, minute_count int, hour_count int }
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _action          text,
  _max_per_minute  integer,
  _max_per_hour    integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id        uuid := auth.uid();
  _now            timestamptz := now();
  _minute_window  timestamptz := date_trunc('minute', _now);
  _hour_window    timestamptz := date_trunc('hour', _now);
  _row            public.rate_limit_buckets%ROWTYPE;
  _retry_after    integer;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after', 60, 'reason', 'no_user');
  END IF;

  -- Upsert / refresh the bucket row, rolling windows when they change
  INSERT INTO public.rate_limit_buckets AS b
    (user_id, action, minute_window, hour_window, minute_count, hour_count, updated_at)
  VALUES
    (_user_id, _action, _minute_window, _hour_window, 1, 1, _now)
  ON CONFLICT (user_id, action) DO UPDATE SET
    minute_count =
      CASE WHEN b.minute_window = EXCLUDED.minute_window
           THEN b.minute_count + 1
           ELSE 1 END,
    hour_count =
      CASE WHEN b.hour_window = EXCLUDED.hour_window
           THEN b.hour_count + 1
           ELSE 1 END,
    minute_window = EXCLUDED.minute_window,
    hour_window   = EXCLUDED.hour_window,
    updated_at    = _now
  RETURNING * INTO _row;

  -- Over the per-minute cap?
  IF _row.minute_count > _max_per_minute THEN
    _retry_after := GREATEST(1, 60 - EXTRACT(EPOCH FROM (_now - _row.minute_window))::int);
    RETURN jsonb_build_object(
      'allowed',      false,
      'retry_after',  _retry_after,
      'minute_count', _row.minute_count,
      'hour_count',   _row.hour_count,
      'reason',       'minute_cap'
    );
  END IF;

  -- Over the per-hour cap?
  IF _row.hour_count > _max_per_hour THEN
    _retry_after := GREATEST(1, 3600 - EXTRACT(EPOCH FROM (_now - _row.hour_window))::int);
    RETURN jsonb_build_object(
      'allowed',      false,
      'retry_after',  _retry_after,
      'minute_count', _row.minute_count,
      'hour_count',   _row.hour_count,
      'reason',       'hour_cap'
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed',      true,
    'minute_count', _row.minute_count,
    'hour_count',   _row.hour_count
  );
END;
$$;

-- Authenticated users can call the function (it self-scopes via auth.uid())
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated;
