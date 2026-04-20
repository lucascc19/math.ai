import { NextRequest, NextResponse } from "next/server";
import { buildInvitationUrl } from "@/lib/server/app-url";
import { handleError } from "@/lib/server/api-helpers";
import { resendInvitation } from "@/lib/server/invitations";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await resendInvitation(id);
    const inviteUrl = buildInvitationUrl(result.token, request);

    return NextResponse.json({ ok: true, invitation: { ...result, inviteUrl } });
  } catch (error) {
    return handleError(error);
  }
}
