/**
 * PersianBearStudio — abuse prevention (rate limit + dedupe).
 *
 * Scope and limits (proportionate for a business inquiry form):
 *  - Per-IP sliding window: max 5 submissions per 10 minutes.
 *  - Duplicate guard: identical e-mail + description within 60 seconds
 *    is treated as an accidental re-send (double click, network retry)
 *    and answered idempotently instead of sending twice.
 *
 * Cloudflare reality check: a Worker/Pages Function isolate has its own
 * memory, so this store is per-isolate. It meaningfully blunts abuse
 * from a single client hitting the same isolate and keeps the endpoint
 * zero-infrastructure; for a hard guarantee, additionally enable a
 * Cloudflare WAF rate-limiting rule on /api/inquiry (see docs/SETUP.md).
 * Nothing here pretends otherwise.
 *
 * The store is bounded (MAX_KEYS) and pruned lazily, so memory cannot
 * grow without limit.
 */

interface RateCheck {
  allowed: boolean;
  /** Seconds until the oldest hit leaves the window (0 when allowed). */
  retryAfterSec: number;
}

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const DEDUPE_WINDOW_MS = 60 * 1000;
const MAX_KEYS = 10_000;

const hits = new Map<string, number[]>();
const recent = new Map<string, { at: number; sent: boolean }>();

function pruneHits(now: number): void {
  for (const [key, stamps] of hits) {
    const alive = stamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (alive.length === 0) hits.delete(key);
    else hits.set(key, alive);
  }
}

/** Sliding-window rate check for one key (usually the client IP). */
export function checkRate(key: string, now = Date.now()): RateCheck {
  const stamps = (hits.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );

  if (stamps.length >= RATE_LIMIT) {
    const oldest = Math.min(...stamps);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000),
    );
    return { allowed: false, retryAfterSec };
  }

  if (hits.size > MAX_KEYS) pruneHits(now);
  stamps.push(now);
  hits.set(key, stamps);
  return { allowed: true, retryAfterSec: 0 };
}

/** Fast, non-cryptographic hash for dedupe grouping (not security). */
function fingerprint(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) {
    h = ((h << 5) + h + value.charCodeAt(i)) | 0;
  }
  return `d${h.toString(36)}`;
}

/**
 * Duplicate handling. Returns 'fresh' the first time a fingerprint is
 * seen. Later, within the window: 'sent' when the earlier attempt was
 * accepted (answer idempotent success) or 'failed' when it was not
 * (allow an immediate retry).
 */
export function checkDuplicate(
  email: string,
  description: string,
  now = Date.now(),
): 'fresh' | 'sent' | 'failed' {
  const key = fingerprint(`${email}\n${description}`);

  if (recent.size > MAX_KEYS) {
    for (const [k, v] of recent) {
      if (now - v.at > DEDUPE_WINDOW_MS) recent.delete(k);
    }
  }

  const seen = recent.get(key);
  if (seen && now - seen.at < DEDUPE_WINDOW_MS) {
    return seen.sent ? 'sent' : 'failed';
  }

  recent.set(key, { at: now, sent: false });
  return 'fresh';
}

/** Marks a fingerprint as successfully sent (for idempotent replies). */
export function markSent(
  email: string,
  description: string,
  now = Date.now(),
): void {
  recent.set(fingerprint(`${email}\n${description}`), {
    at: now,
    sent: true,
  });
}

/** Test helper — clears all in-memory state. */
export function resetAbuseState(): void {
  hits.clear();
  recent.clear();
}
