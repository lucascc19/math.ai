import { NextResponse } from "next/server";
import { getStudentProgress } from "@/lib/server/tutoring";
import { handleError } from "@/lib/server/api-helpers";

export async function GET(_: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const data = await getStudentProgress(studentId);
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
