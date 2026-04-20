import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { redirect } from "next/navigation";
import { tryGetCurrentSession } from "@/lib/server/auth";
import { getHomePathForRole } from "@/lib/role-home";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function CadastroPage() {
  const session = await tryGetCurrentSession();

  if (session) {
    redirect(getHomePathForRole(session.user.role));
  }

  return (
    <main className="flex min-h-screen flex-col">
      <div className="gradient-bar h-1" />
      <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-6">
        <div className="flex w-full max-w-md flex-col gap-6">
          <Link
            className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Card className="grid gap-6 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft">
            <div className="grid gap-3">
              <Badge variant="secondary">Acesso</Badge>
              <div className="grid gap-2">
                <h1 className="text-3xl font-bold text-neutral-10 md:text-4xl">Acesso por convite</h1>
                <p className="max-w-xl text-sm leading-7 text-neutral-10/75">
                  Esta plataforma não tem cadastro aberto. O acesso é liberado individualmente por um administrador ou tutor.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-60/20 bg-primary-95 p-5 text-sm leading-7 text-neutral-10/80">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary-40" />
                <div>
                  <p className="font-semibold text-neutral-10">Como funciona?</p>
                  <p>
                    Um administrador ou tutor envia um link de convite diretamente para o seu e-mail. Ao clicar no link, você define seu nome e senha e acessa a plataforma imediatamente.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-neutral-10/70">
              Já recebeu seu convite?{" "}
              <span className="text-neutral-10/50">Acesse o link enviado para seu e-mail.</span>
            </p>
            <Link
              href="/login"
              className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline"
            >
              Já tenho conta — fazer login
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}
