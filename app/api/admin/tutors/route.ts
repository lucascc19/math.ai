import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Criacao direta de tutor desativada. Use o fluxo de convites para liberar novos acessos."
    },
    { status: 403 }
  );
}
