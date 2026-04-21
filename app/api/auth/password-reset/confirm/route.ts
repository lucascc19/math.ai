import { NextRequest, NextResponse } from "next/server";

import { passwordResetConfirmSchema } from "@/lib/schemas";
import { confirmPasswordReset } from "@/lib/server/password-reset";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, { key: "auth:password-reset-confirm", limit: 5, windowMs: 60 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);

  const payload = await request.json();
  const parsed = passwordResetConfirmSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await confirmPasswordReset(parsed.data.token, parsed.data.password);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    );
  }
}
