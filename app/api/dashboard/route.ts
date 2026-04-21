import { NextResponse } from "next/server";

import { getDashboardData } from "@/lib/server/app-data";
import { getCurrentSession } from "@/lib/server/auth";

export async function GET() {
  const session = await getCurrentSession();
  return NextResponse.json(await getDashboardData(session?.userId ?? null));
}
