import { NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { getStudentProgress } from "@/lib/server/tutoring";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const data = await getStudentProgress(studentId);
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
