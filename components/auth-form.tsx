"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { getHomePathForRole } from "@/lib/role-home";
import { loginSchema, type LoginInput } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  mode: "login";
  title: string;
  description: string;
};

export function AuthForm(props: AuthFormProps) {
  const router = useRouter();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "aluno@basematematica.dev",
      password: "demo12345"
    }
  });

  const mutation = useMutation({
    mutationFn: api.login,
    onSuccess: (response) => {
      router.push(getHomePathForRole(response.user.role));
      router.refresh();
    }
  });

  return (
    <Card className="grid gap-6 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft">
      <div className="grid gap-3">
        <Badge variant="secondary">Acesso</Badge>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 md:text-4xl">{props.title}</h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-10/75">{props.description}</p>
        </div>
      </div>

      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input className="focus-ring" placeholder="E-mail" {...form.register("email")} />
        <Input className="focus-ring" type="password" placeholder="Senha" {...form.register("password")} />
        <div className="flex justify-end">
          <Link
            className="text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
            href="/esqueci-senha"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-sm text-neutral-10/65">
          {mutation.error ? mutation.error.message : "Use suas credenciais para acessar a sua area."}
        </p>
      </form>

      <p className="text-sm text-neutral-10/70">
        Acesso liberado apenas por convite.{" "}
        <Link className="font-semibold text-primary-40 hover:underline" href="/cadastro">
          Saiba mais
        </Link>
      </p>
    </Card>
  );
}
