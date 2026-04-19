import { NextRequest, NextResponse } from "next/server";
import { deleteLesson, updateLesson } from "@/lib/server/content";
import { handleError } from "@/lib/server/api-helpers";
import { lessonPatchSchema } from "@/lib/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params;
    const payload = await request.json();
    const parsed = lessonPatchSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const lesson = await updateLesson(lessonId, parsed.data);
    return NextResponse.json({ lesson });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const { lessonId } = await params;
    const result = await deleteLesson(lessonId);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
