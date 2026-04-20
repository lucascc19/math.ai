import { NextRequest, NextResponse } from "next/server";
import { revokeInvitation } from "@/lib/server/invitations";
import { handleError } from "@/lib/server/api-helpers";

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
