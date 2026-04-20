import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Cadastro publico desativado. O acesso a plataforma e liberado apenas por convite."
    },
    { status: 403 }
  );
}
