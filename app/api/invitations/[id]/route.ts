import { NextResponse } from "next/server";

import { handleError } from "@/lib/server/api-helpers";
import { deleteInvitation } from "@/lib/server/invitations";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await deleteInvitation(id);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
