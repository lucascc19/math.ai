import { NextRequest, NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { publishTrack, unpublishTrack } from "@/lib/server/content";

type RouteContext = { params: Promise<{ trackId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { trackId } = await params;
    const body = await request.json().catch(() => ({}));
    const publish = body?.publish !== false;
    const track = publish ? await publishTrack(trackId) : await unpublishTrack(trackId);
    return NextResponse.json({ track });
  } catch (error) {
    return handleError(error);
  }
}
