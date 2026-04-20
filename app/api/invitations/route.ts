import { NextRequest, NextResponse } from "next/server";
import { createInvitationSchema } from "@/lib/schemas";
import { createInvitation, listInvitations } from "@/lib/server/invitations";
import { handleError } from "@/lib/server/api-helpers";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";
import { requireActor } from "@/lib/server/permissions";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, { key: "invitations:create", limit: 10, windowMs: 60 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfter);

  const payload = await request.json();
  const parsed = createInvitationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const result = await createInvitation(parsed.data);
    const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/convite/${result.token}`;
    return NextResponse.json({ ok: true, invitation: { ...result, inviteUrl } });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActor("invite.list");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const roleParam = searchParams.get("role") as Role | null;

    const invitations = await listInvitations({
      status,
      role: roleParam ?? undefined
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    return handleError(error);
  }
}
