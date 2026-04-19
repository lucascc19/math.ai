import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { tryGetCurrentSession } from "@/lib/server/auth";

export default async function LoginPage() {
  const session = await tryGetCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="pb-20">
      <div className="gradient-bar h-1" />
      <section className="content-shell mx-auto flex w-full flex-col gap-8 px-4 py-8 md:px-6 xl:px-8">
        <Link className="text-sm font-semibold text-primary-40 hover:underline" href="/">
          Voltar para a landing page
        </Link>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.8fr)]">
          <AuthForm
            mode="login"
            title="Entrar na plataforma"
            description="Acesse sua conta para continuar a trilha, revisar preferencias de acessibilidade e acompanhar seu progresso."
          />
          <aside className="grid gap-4 rounded-[28px] border border-black/5 bg-white/70 p-8 shadow-soft">
            <h2 className="text-2xl font-bold">Acesso rapido para testes</h2>
            <p className="text-sm leading-7 text-neutral-10/75">
              O ambiente local ja vem com um usuario demo para facilitar validacao da experiencia.
            </p>
            <div className="rounded-[24px] border border-black/5 bg-secondary-95 p-5 text-sm leading-7">
              <p>
                <strong>E-mail:</strong> aluno@basematematica.dev
              </p>
              <p>
                <strong>Senha:</strong> demo12345
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
