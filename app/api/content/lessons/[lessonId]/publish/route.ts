import { NextRequest, NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { publishLesson, unpublishLesson } from "@/lib/server/content";

export async function POST(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params;
    const url = new URL(request.url);
    const action = url.searchParams.get("action") ?? "publish";
    const lesson = action === "unpublish" ? await unpublishLesson(lessonId) : await publishLesson(lessonId);
    return NextResponse.json({ lesson });
  } catch (error) {
    return handleError(error);
  }
}
