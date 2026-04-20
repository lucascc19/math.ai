import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

function getClientKey(request: NextRequest, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : request.headers.get("x-real-ip") ?? "anon";
  return `${scope}:${ip}`;
}

export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): { allowed: true } | { allowed: false; retryAfter: number } {
  const key = getClientKey(request, options.key);
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= options.limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { error: `Muitas tentativas. Tente novamente em ${retryAfter}s.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}, 60_000).unref?.();
