import { NextRequest, NextResponse } from "next/server";
import { publishTrack, unpublishTrack } from "@/lib/server/content";
import { handleError } from "@/lib/server/api-helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ trackId: string }> }) {
  try {
    const { trackId } = await params;
    const url = new URL(request.url);
    const action = url.searchParams.get("action") ?? "publish";
    const track = action === "unpublish" ? await unpublishTrack(trackId) : await publishTrack(trackId);
    return NextResponse.json({ track });
  } catch (error) {
    return handleError(error);
  }
}
