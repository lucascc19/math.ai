import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/schemas";
import { registerUser } from "@/lib/server/app-data";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await registerUser(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 400 }
    );
  }
}
