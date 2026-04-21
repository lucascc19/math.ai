import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { listUsers } from "@/lib/server/admin";
import { handleError } from "@/lib/server/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");
    const activeParam = url.searchParams.get("active");

    const role =
      roleParam === Role.STUDENT || roleParam === Role.TUTOR || roleParam === Role.ADMIN ? roleParam : undefined;
    const active = activeParam === "true" ? true : activeParam === "false" ? false : undefined;

    const users = await listUsers({ role, active });
    return NextResponse.json({ users });
  } catch (error) {
    return handleError(error);
  }
}
