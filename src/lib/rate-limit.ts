type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

export function rateLimit(
  scope: string,
  identifier: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const key = `${scope}:${identifier}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) cleanup(now);
    return { ok: true, remaining: max - 1, resetMs: windowMs };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetMs: bucket.resetAt - now };
  }

  bucket.count++;
  return { ok: true, remaining: max - bucket.count, resetMs: bucket.resetAt - now };
}

function cleanup(now: number) {
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}
