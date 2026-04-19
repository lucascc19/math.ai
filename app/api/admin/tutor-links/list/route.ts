import { NextResponse } from "next/server";
import { listTutorLinks } from "@/lib/server/admin";
import { handleError } from "@/lib/server/api-helpers";

export async function GET() {
  try {
    const links = await listTutorLinks();
    return NextResponse.json({ links });
  } catch (error) {
    return handleError(error);
  }
}
