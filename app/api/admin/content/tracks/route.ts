import { NextRequest, NextResponse } from "next/server";
import { createDraftTrack, listTracksForAdmin } from "@/lib/server/content";
import { handleError } from "@/lib/server/api-helpers";
import { trackDraftSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const tracks = await listTracksForAdmin();
    return NextResponse.json({ tracks });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = trackDraftSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const track = await createDraftTrack(parsed.data);
    return NextResponse.json({ track }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
