import { NextRequest, NextResponse } from "next/server";
import { settingsSchema } from "@/lib/schemas";
import { updateAccessibilitySettings } from "@/lib/server/app-data";
import { requireCurrentUser } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = settingsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const user = await requireCurrentUser();
    return NextResponse.json(await updateAccessibilitySettings(user.id, parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error && error.message === "AUTHENTICATION_REQUIRED" ? "Sessao expirada. Entre novamente." : "Erro inesperado." },
      { status: 401 }
    );
  }
}
