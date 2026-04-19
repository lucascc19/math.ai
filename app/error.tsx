"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application route error:", error);
  }, [error]);

  return (
    <main className="pb-20">
      <div className="gradient-bar h-1" />
      <section className="content-shell mx-auto flex w-full flex-col gap-8 px-4 py-8 md:px-6 xl:px-8">
        <Card className="grid gap-5 rounded-[32px] border border-black/5 bg-white/90 p-8 shadow-soft">
          <div className="grid gap-3">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-primary-40">Erro de carregamento</span>
            <h1 className="text-3xl font-bold text-neutral-10 md:text-4xl">Nao foi possivel carregar esta pagina agora.</h1>
            <p className="max-w-2xl text-sm leading-7 text-neutral-10/75 md:text-base">
              Ocorreu uma falha durante a navegacao. A interface continua estavel e voce pode tentar novamente sem perder o
              restante da aplicacao.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={reset}>Tentar novamente</Button>
            <Button asChild variant="ghost">
              <Link href="/">Voltar para a landing page</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}
