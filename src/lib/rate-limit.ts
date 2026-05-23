/**
 * Rate limit in-memory minimalista. Sirve para single-instance (dev local
 * y Vercel funciones individuales). En despliegues serverless multi-region
 * cada instancia tiene su propio bucket — útil contra ataques triviales,
 * insuficiente contra ataques distribuidos. Para algo robusto, migrar a
 * Upstash Redis + @upstash/ratelimit (Plan B).
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  opts: { max: number; windowSec: number },
): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: opts.max - 1, resetAt };
  }

  if (current.count >= opts.max) {
    return { ok: false, retryAfterSec: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  return { ok: true, remaining: opts.max - current.count, resetAt: current.resetAt };
}

/** Limpia buckets expirados — pensado para llamar en intervalos largos. */
export function cleanupExpired(): number {
  const now = Date.now();
  let removed = 0;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
      removed++;
    }
  }
  return removed;
}
