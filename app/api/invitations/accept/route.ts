import { NextRequest, NextResponse } from "next/server";
import { acceptInvitationSchema } from "@/lib/schemas";
import { acceptInvitation } from "@/lib/server/invitations";
import { handleError } from "@/lib/server/api-helpers";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, { key: "invitations:accept", limit: 5, windowMs: 60 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);

  const payload = await request.json();
  const parsed = acceptInvitationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await acceptInvitation(parsed.data));
  } catch (error) {
    return handleError(error);
  }
}
