import { NextRequest, NextResponse } from "next/server";
import { createDraftLesson } from "@/lib/server/content";
import { handleError } from "@/lib/server/api-helpers";
import { lessonDraftSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = lessonDraftSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const lesson = await createDraftLesson(parsed.data);
    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
