import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { createInvitationSchema } from "@/lib/schemas";
import { handleError } from "@/lib/server/api-helpers";
import { buildInvitationUrl } from "@/lib/server/app-url";
import { cleanupInvitations, createInvitation, listInvitations } from "@/lib/server/invitations";
import { requireActor } from "@/lib/server/permissions";
import { checkRateLimit, rateLimitResponse } from "@/lib/server/rate-limit";

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
    const inviteUrl = buildInvitationUrl(result.token, request);

    return NextResponse.json({ ok: true, invitation: { ...result, inviteUrl } });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireActor("invite.list");
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

export async function DELETE() {
  try {
    const result = await cleanupInvitations();
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
