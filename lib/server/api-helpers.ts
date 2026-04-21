import { NextResponse } from "next/server";

import { InvitationExpiredError, InvitationAlreadyUsedError, InvitationRevokedError } from "@/lib/server/invitations";
import { ForbiddenError, NotFoundError } from "@/lib/server/permissions";

export function handleError(error: unknown) {
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (
    error instanceof InvitationExpiredError ||
    error instanceof InvitationAlreadyUsedError ||
    error instanceof InvitationRevokedError
  ) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.message === "AUTHENTICATION_REQUIRED") {
    return NextResponse.json({ error: "Autenticação requerida." }, { status: 401 });
  }
  if (error instanceof Error && error.message === "ACCOUNT_DEACTIVATED") {
    return NextResponse.json({ error: "Conta desativada." }, { status: 403 });
  }

  const message = error instanceof Error ? error.message : "Erro inesperado.";
  return NextResponse.json({ error: message }, { status: 400 });
}
