import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { tryGetCurrentSession } from "@/lib/server/auth";

export default async function RegisterPage() {
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(380px,0.78fr)]">
          <AuthForm
            mode="register"
            title="Criar seu acesso"
            description="Cadastre-se para entrar na plataforma, salvar progresso individual e personalizar a experiencia de aprendizagem."
          />
          <aside className="grid gap-4 rounded-[28px] border border-black/5 bg-primary-95 p-8 shadow-soft">
            <h2 className="text-2xl font-bold">O que acontece depois do cadastro</h2>
            <div className="grid gap-3 text-sm leading-7 text-neutral-10/75">
              <p>Sua conta e criada com perfil de aluno.</p>
              <p>As preferencias de acessibilidade passam a ser salvas por usuario.</p>
              <p>Seu progresso deixa de depender do usuario demo da plataforma.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
