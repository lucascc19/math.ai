import { NextRequest, NextResponse } from "next/server";
import { revokeInvitation } from "@/lib/server/invitations";
import { handleError } from "@/lib/server/api-helpers";

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json(await revokeInvitation(params.id));
  } catch (error) {
    return handleError(error);
  }
}
