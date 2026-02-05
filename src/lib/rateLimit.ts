import { NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  timestamps: number[];
}

// In-memory store keyed by IP address
// Each entry tracks request timestamps within the current window
const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS = 10; // max requests per window per IP
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // cleanup every 10 minutes

// Periodic cleanup of expired entries to prevent memory leaks
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - WINDOW_MS;
  for (const [ip, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    entry.count = entry.timestamps.length;
    if (entry.count === 0) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Extract the client IP address from the request.
 * On Vercel, `x-forwarded-for` is set automatically by the platform.
 * Falls back to `x-real-ip`, then to a default identifier.
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs; the first is the client's
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  // Fallback – treat as a single anonymous source
  return 'unknown';
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (ms) when the oldest request expires
}

/**
 * Check whether a request from the given IP is within the rate limit.
 * Returns { success, remaining, resetAt }.
 */
export function checkRateLimit(request: Request): RateLimitResult {
  cleanupExpiredEntries();

  const ip = getClientIP(request);
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let entry = rateLimitStore.get(ip);
  if (!entry) {
    entry = { count: 0, timestamps: [] };
    rateLimitStore.set(ip, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
  entry.count = entry.timestamps.length;

  if (entry.count >= MAX_REQUESTS) {
    // Rate limited – compute when the earliest request in the window expires
    const oldestTimestamp = Math.min(...entry.timestamps);
    const resetAt = oldestTimestamp + WINDOW_MS;
    return { success: false, remaining: 0, resetAt };
  }

  // Allow the request and record it
  entry.timestamps.push(now);
  entry.count = entry.timestamps.length;

  return {
    success: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.timestamps[0] + WINDOW_MS,
  };
}

/**
 * Convenience helper: if the caller is rate-limited, returns a 429 NextResponse.
 * Otherwise returns null (meaning "proceed").
 */
export function applyRateLimit(request: Request): NextResponse | null {
  const result = checkRateLimit(request);

  if (!result.success) {
    const retryAfterSeconds = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded. You can make at most 10 requests per hour. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}
