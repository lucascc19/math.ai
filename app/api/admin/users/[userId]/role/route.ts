import { NextRequest, NextResponse } from "next/server";
import { setUserRole } from "@/lib/server/admin";
import { handleError } from "@/lib/server/api-helpers";
import { setRoleSchema } from "@/lib/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const payload = await request.json();
    const parsed = setRoleSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const user = await setUserRole(userId, parsed.data);
    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}
