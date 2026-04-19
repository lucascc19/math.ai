import { NextResponse } from "next/server";
import { getTutorMetrics } from "@/lib/server/tutoring";
import { handleError } from "@/lib/server/api-helpers";

export async function GET() {
  try {
    const metrics = await getTutorMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return handleError(error);
  }
}
