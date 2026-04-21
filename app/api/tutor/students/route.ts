import { NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { listStudentsForActor } from "@/lib/server/tutoring";

export async function GET() {
  try {
    const students = await listStudentsForActor();
    return NextResponse.json({ students });
  } catch (error) {
    return handleError(error);
  }
}
