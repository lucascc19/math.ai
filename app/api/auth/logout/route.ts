import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/server/auth";

export async function POST() {
  await revokeCurrentSession();
  return NextResponse.json({ ok: true });
}
