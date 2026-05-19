// Lightweight helper for logging outbound AI / scraping / mapping calls so
// Emma's AI quota usage is observable rather than invisible.
//
// Usage:
//   const logger = createAiCallLogger(supabaseAdmin, { userId, functionName: "voice-to-crm" });
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
// function. Each call awaits a 1s timeout on the insert.

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

// `supabase` should be a service-role-keyed client so the insert bypasses RLS
// and is attributable to the right user_id (which the auth-context client
// can't insert if RLS only allows SELECT).
export function createAiCallLogger(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  opts: LoggerOpts,
): AiCallLogger {
  return {
    async log(entry: LogEntry): Promise<void> {
      const insertCtrl = new AbortController();
      const insertTimer = setTimeout(() => insertCtrl.abort(), 1000);
      try {
        await supabase.from("ai_call_log").insert({
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
      } catch (err) {
        // Don't propagate — logging must never break the caller.
        console.error("ai_call_log insert failed:", err);
      } finally {
        clearTimeout(insertTimer);
      }
    },
  };
}
