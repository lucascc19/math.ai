import { NextRequest, NextResponse } from "next/server";
import { passwordResetRequestSchema } from "@/lib/schemas";
import { buildResetUrl, requestPasswordReset } from "@/lib/server/password-reset";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, { key: "auth:password-reset", limit: 3, windowMs: 60 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);

  const payload = await request.json();
  const parsed = passwordResetRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await requestPasswordReset(parsed.data.email);

    if (result.token) {
      const origin = request.nextUrl.origin;
      const resetUrl = buildResetUrl(origin, result.token);
      console.log(`[password-reset] Link gerado para ${parsed.data.email}: ${resetUrl}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("password-reset:request failed", error);
    return NextResponse.json({ ok: true });
  }
}
