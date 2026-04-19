import { NextResponse } from "next/server";
import { clearSessionCookie, revokeAllUserSessions } from "@/lib/server/auth";
import { handleError } from "@/lib/server/api-helpers";
import { requireActor } from "@/lib/server/permissions";

export async function POST() {
  try {
    const actor = await requireActor();
    await revokeAllUserSessions(actor.id);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
