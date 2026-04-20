import { NextRequest, NextResponse } from "next/server";
import { passwordResetRequestSchema } from "@/lib/schemas";
import { buildResetPasswordUrl } from "@/lib/server/app-url";
import { sendPasswordResetEmail } from "@/lib/server/mailer";
import { requestPasswordReset } from "@/lib/server/password-reset";
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

    if (result.token && result.expiresAt) {
      const resetUrl = buildResetPasswordUrl(result.token, request);
      await sendPasswordResetEmail({
        email: parsed.data.email,
        resetUrl,
        expiresAt: result.expiresAt
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("password-reset:request failed", error);
    return NextResponse.json({ ok: true });
  }
}
