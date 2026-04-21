import { NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { getTutorMetrics } from "@/lib/server/tutoring";

export async function GET() {
  try {
    const metrics = await getTutorMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return handleError(error);
  }
}
