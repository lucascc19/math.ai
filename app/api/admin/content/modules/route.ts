import { NextRequest, NextResponse } from "next/server";

import { moduleDraftSchema } from "@/lib/schemas";
import { handleError } from "@/lib/server/api-helpers";
import { createTrackModule } from "@/lib/server/content";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = moduleDraftSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const module = await createTrackModule(parsed.data);
    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
