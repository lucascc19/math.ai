import { NextRequest, NextResponse } from "next/server";
import { createTutor } from "@/lib/server/admin";
import { handleError } from "@/lib/server/api-helpers";
import { createTutorSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = createTutorSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const tutor = await createTutor(parsed.data);
    return NextResponse.json({ tutor }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
