import { NextRequest, NextResponse } from "next/server";

import { submitAnswerSchema } from "@/lib/schemas";
import { submitAnswer } from "@/lib/server/app-data";
import { requireCurrentUser } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = submitAnswerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    return NextResponse.json(await submitAnswer(user.id, parsed.data));
  } catch (error) {
    const isAuthError = error instanceof Error && error.message === "AUTHENTICATION_REQUIRED";
    const message = isAuthError
      ? "Sessão expirada. Entre novamente."
      : error instanceof Error
        ? error.message
        : "Erro inesperado.";

    return NextResponse.json({ error: message }, { status: isAuthError ? 401 : 400 });
  }
}
