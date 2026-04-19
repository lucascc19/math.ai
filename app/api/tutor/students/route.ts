import { NextResponse } from "next/server";
import { listStudentsForActor } from "@/lib/server/tutoring";
import { handleError } from "@/lib/server/api-helpers";

export async function GET() {
  try {
    const students = await listStudentsForActor();
    return NextResponse.json({ students });
  } catch (error) {
    return handleError(error);
  }
}
