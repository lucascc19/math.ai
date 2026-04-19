import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setUserActive } from "@/lib/server/admin";
import { handleError } from "@/lib/server/api-helpers";

const activeSchema = z.object({ active: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const payload = await request.json();
    const parsed = activeSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const user = await setUserActive(userId, parsed.data.active);
    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
