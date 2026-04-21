import { NextRequest, NextResponse } from "next/server";

import { trackPatchSchema } from "@/lib/schemas";
import { handleError } from "@/lib/server/api-helpers";
import { deleteTrack, updateTrack } from "@/lib/server/content";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ trackId: string }> }) {
  try {
    const { trackId } = await params;
    const payload = await request.json();
    const parsed = trackPatchSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const track = await updateTrack(trackId, parsed.data);
    return NextResponse.json({ track });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ trackId: string }> }) {
  try {
    const { trackId } = await params;
    const result = await deleteTrack(trackId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
