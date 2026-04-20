import { NextRequest, NextResponse } from "next/server";
import { getInvitationByToken } from "@/lib/server/invitations";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, { key: "invitations:resolve", limit: 30, windowMs: 60 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token ausente." }, { status: 400 });
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return NextResponse.json({ error: "Convite não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ invitation });
}
