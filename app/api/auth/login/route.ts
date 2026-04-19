import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { loginUser } from "@/lib/server/app-data";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    return NextResponse.json(await loginUser(parsed.data));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 401 }
    );
  }
}
