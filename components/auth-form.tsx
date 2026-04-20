"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthFormProps =
  | {
      mode: "login";
      title: string;
      description: string;
    }
  | {
      mode: "register";
      title: string;
      description: string;
    };

export function AuthForm(props: AuthFormProps) {
  const router = useRouter();

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "aluno@basematematica.dev",
      password: "demo12345"
    }
  });

  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    }
  });

  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    }
  });

  const isLogin = props.mode === "login";

  return (
    <Card className="grid gap-6 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft">
      <div className="grid gap-3">
        <Badge variant="secondary">{isLogin ? "Acesso" : "Cadastro"}</Badge>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 md:text-4xl">{props.title}</h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-10/75">{props.description}</p>
        </div>
      </div>

      {isLogin ? (
        <form className="grid gap-4" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
          <Input className="focus-ring" placeholder="E-mail" {...loginForm.register("email")} />
          <Input className="focus-ring" type="password" placeholder="Senha" {...loginForm.register("password")} />
          <div className="flex justify-end">
            <Link
              className="text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
              href="/esqueci-senha"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-sm text-neutral-10/65">
            {loginMutation.error ? loginMutation.error.message : "Use suas credenciais para acessar o dashboard do aluno."}
          </p>
        </form>
      ) : (
        <form className="grid gap-4" onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}>
          <Input className="focus-ring" placeholder="Nome completo" {...registerForm.register("name")} />
          <Input className="focus-ring" placeholder="E-mail" {...registerForm.register("email")} />
          <Input className="focus-ring" type="password" placeholder="Senha" {...registerForm.register("password")} />
          <p className="rounded-2xl border border-secondary-60/20 bg-secondary-95 px-4 py-3 text-sm leading-6 text-neutral-10/75">
            Novos cadastros entram como aluno por padrao. Perfis de tutor e administracao ficam reservados para gestao interna.
          </p>
          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
          </Button>
          <p className="text-sm text-neutral-10/65">
            {registerMutation.error ? registerMutation.error.message : "Seu acesso sera criado e voce ja entra na plataforma em seguida."}
          </p>
        </form>
      )}

      <div className="text-sm text-neutral-10/70">
        {isLogin ? "Ainda nao tem conta? " : "Ja tem conta? "}
        <Link className="font-semibold text-primary-40 hover:underline" href={isLogin ? "/cadastro" : "/login"}>
          {isLogin ? "Cadastre-se" : "Fazer login"}
        </Link>
      </div>
    </Card>
  );
}
