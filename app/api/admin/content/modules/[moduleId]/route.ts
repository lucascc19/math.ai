import { NextRequest, NextResponse } from "next/server";

import { modulePatchSchema } from "@/lib/schemas";
import { handleError } from "@/lib/server/api-helpers";
import { deleteTrackModule, updateTrackModule } from "@/lib/server/content";

type RouteContext = { params: Promise<{ moduleId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { moduleId } = await params;
    const payload = await request.json();
    const parsed = modulePatchSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const module = await updateTrackModule(moduleId, parsed.data);
    return NextResponse.json({ module });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { moduleId } = await params;
    const result = await deleteTrackModule(moduleId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
