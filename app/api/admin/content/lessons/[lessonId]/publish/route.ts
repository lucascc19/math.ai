import { NextRequest, NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { publishLesson, unpublishLesson } from "@/lib/server/content";

type RouteContext = { params: Promise<{ lessonId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { lessonId } = await params;
    const body = await request.json().catch(() => ({}));
    const publish = body?.publish !== false;
    const lesson = publish ? await publishLesson(lessonId) : await unpublishLesson(lessonId);
    return NextResponse.json({ lesson });
  } catch (error) {
    return handleError(error);
  }
}
