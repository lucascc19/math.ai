import { NextRequest, NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { revokeInvitation } from "@/lib/server/invitations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    return NextResponse.json(await revokeInvitation(id));
  } catch (error) {
    return handleError(error);
  }
}
