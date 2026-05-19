// Lightweight helper for logging outbound AI / scraping / mapping calls so
// Emma's AI quota usage is observable rather than invisible.
//
// Usage:
//   const logger = createAiCallLogger(supabase, { userId, functionName: "voice-to-crm" });
//   const start = Date.now();
//   try {
//     const res = await fetch(LOVABLE_URL, { ... });
//     await logger.log({ provider: "lovable", model: "gemini-3-flash", status: res.ok ? "success" : "error", durationMs: Date.now() - start, ...tokens });
//     ...
//   } catch (err) {
//     await logger.log({ provider: "lovable", status: "timeout", durationMs: Date.now() - start, errorMessage: String(err) });
//     throw err;
//   }
//
// Inserts are best-effort — a logging failure must never break the calling
// function. The insert is fire-and-forget via Promise.race against a 1-second
// timeout. supabase-js doesn't honour AbortSignal on inserts, so we let the
// real HTTP request continue in the background but stop awaiting it.

interface LoggerOpts {
  userId?: string | null;
  functionName: string;
  retailerId?: string | null;
}

interface LogEntry {
  provider: string;
  model?: string | null;
  status?: "success" | "error" | "rate_limited" | "timeout";
  durationMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  errorMessage?: string;
  retailerId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AiCallLogger {
  log: (entry: LogEntry) => Promise<void>;
}

// `supabase` is the auth-context client the calling edge function already
// holds. RLS on ai_call_log allows the user to insert their own rows, so no
// service-role client is needed.
//
// Typed as SupabaseClient<unknown> — Supabase's generated DB types aren't
// available in the _shared module, so the row shape is enforced at the
// call site rather than the type level.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

export function createAiCallLogger(
  supabase: SupabaseLike,
  opts: LoggerOpts,
): AiCallLogger {
  return {
    async log(entry: LogEntry): Promise<void> {
      const insertPromise = supabase.from("ai_call_log").insert({
        user_id: opts.userId ?? null,
        function_name: opts.functionName,
        retailer_id: entry.retailerId ?? opts.retailerId ?? null,
        provider: entry.provider,
        model: entry.model ?? null,
        status: entry.status ?? "success",
        duration_ms: entry.durationMs ?? null,
        prompt_tokens: entry.promptTokens ?? null,
        completion_tokens: entry.completionTokens ?? null,
        total_tokens: entry.totalTokens ?? null,
        error_message: entry.errorMessage ?? null,
        metadata: entry.metadata ?? {},
      });
      const timeout = new Promise<{ timedOut: true }>(resolve =>
        setTimeout(() => resolve({ timedOut: true }), 1000),
      );
      try {
        const result = await Promise.race([
          insertPromise.then((r: { error?: { message?: string } | null }) => r),
          timeout,
        ]);
        if (result && typeof result === "object" && "timedOut" in result) {
          console.warn("ai_call_log insert exceeded 1s — left running in background");
        } else if (result && result.error) {
          console.error("ai_call_log insert failed:", result.error.message);
        }
      } catch (err) {
        // Don't propagate — logging must never break the caller.
        console.error("ai_call_log insert threw:", err);
      }
    },
  };
}
