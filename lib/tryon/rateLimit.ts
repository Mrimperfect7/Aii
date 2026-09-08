/**
 * In-memory rate limit + in-flight request dedupe. Fine for a single
 * serverless region or a single Node process. If SHYN.ISH deploys across
 * multiple regions/instances, swap the two Maps below for Upstash Redis (or
 * whatever the host app already uses) — the function signatures won't need
 * to change.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6; // per client, generous enough for retries

const requestLog = new Map<string, number[]>();
const inFlight = new Map<string, Promise<any>>();

export function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(clientKey) || []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  timestamps.push(now);
  requestLog.set(clientKey, timestamps);
  return true;
}

/**
 * Collapses duplicate generation requests for the same client+product+mode
 * fired in quick succession (e.g. a double-tap on "Generate") into a single
 * upstream call.
 */
export function dedupeInFlight<T>(dedupeKey: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(dedupeKey);
  if (existing) return existing;

  const promise = run().finally(() => {
    inFlight.delete(dedupeKey);
  });
  inFlight.set(dedupeKey, promise);
  return promise;
}
