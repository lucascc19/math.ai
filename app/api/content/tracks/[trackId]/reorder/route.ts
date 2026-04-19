import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { reorderLessons } from "@/lib/server/content";
import { handleError } from "@/lib/server/api-helpers";

const reorderSchema = z.object({
  orderedLessonIds: z.array(z.string().min(1)).min(1)
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ trackId: string }> }) {
  try {
    const { trackId } = await params;
    const payload = await request.json();
    const parsed = reorderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const result = await reorderLessons(trackId, parsed.data.orderedLessonIds);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
