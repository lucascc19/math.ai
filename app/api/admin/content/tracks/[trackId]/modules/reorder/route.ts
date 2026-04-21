import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleError } from "@/lib/server/api-helpers";
import { reorderTrackModules } from "@/lib/server/content";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});

type RouteContext = { params: Promise<{ trackId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { trackId } = await params;
    const payload = await request.json();
    const parsed = reorderSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await reorderTrackModules(trackId, parsed.data.orderedIds);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
