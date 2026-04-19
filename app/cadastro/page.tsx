import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { tryGetCurrentSession } from "@/lib/server/auth";

export default async function RegisterPage() {
  const session = await tryGetCurrentSession();

  if (session) {
    redirect("/dashboard");
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
            Voltar para a landing page
          </Link>
          <AuthForm
            mode="register"
            title="Criar seu acesso"
            description="Cadastre-se para entrar na plataforma, salvar progresso individual e personalizar a experiência de aprendizagem."
          />
        </div>
      </div>
    </main>
  );
}
