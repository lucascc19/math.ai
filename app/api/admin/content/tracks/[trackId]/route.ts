import { NextRequest, NextResponse } from "next/server";
import { deleteTrack, getTrackWithLessons, updateTrack } from "@/lib/server/content";
import { handleError } from "@/lib/server/api-helpers";
import { trackPatchSchema } from "@/lib/schemas";

type RouteContext = { params: Promise<{ trackId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { trackId } = await params;
    const track = await getTrackWithLessons(trackId);
    return NextResponse.json({ track });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { trackId } = await params;
    const result = await deleteTrack(trackId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
