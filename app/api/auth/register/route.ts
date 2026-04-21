import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Cadastro público desativado. O acesso à plataforma é liberado apenas por convite."
    },
    { status: 403 }
  );
}
