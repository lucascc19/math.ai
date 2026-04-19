import { NextRequest, NextResponse } from "next/server";
import { linkTutorToStudent, unlinkTutorFromStudent } from "@/lib/server/admin";
import { handleError } from "@/lib/server/api-helpers";
import { tutorLinkSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = tutorLinkSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const link = await linkTutorToStudent(parsed.data);
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = tutorLinkSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await unlinkTutorFromStudent(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
