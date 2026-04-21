"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { passwordResetConfirmSchema, type PasswordResetConfirmInput } from "@/lib/schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { token, password: "" }
  });

  const mutation = useMutation({
    mutationFn: api.confirmPasswordReset,
    onSuccess: () => {
      setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1500);
    }
  });

  if (!token) {
    return (
      <Card className="grid gap-4 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft dark:border-white/10 dark:bg-neutral-20/70">
        <Badge variant="tertiary">Link inválido</Badge>
        <h1 className="text-2xl font-bold text-neutral-10 dark:text-neutral-95">Token ausente</h1>
        <p className="text-sm leading-7 text-neutral-10/75 dark:text-neutral-80">
          O link de redefinição está incompleto. Peça um novo link na página de recuperação.
        </p>
        <Link href="/esqueci-senha" className="font-semibold text-primary-40 hover:underline dark:text-primary-70">
          Solicitar novo link
        </Link>
      </Card>
    );
  }

  return (
    <Card className="grid gap-6 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft dark:border-white/10 dark:bg-neutral-20/70">
      <div className="grid gap-3">
        <Badge variant="tertiary">Nova senha</Badge>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">Defina sua nova senha</h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-10/75 dark:text-neutral-80">
            Use pelo menos 8 caracteres. Ao confirmar, todas as outras sessões serão encerradas.
          </p>
        </div>
      </div>

      {mutation.isSuccess ? (
        <p className="rounded-2xl border border-secondary-60/20 bg-secondary-95 px-4 py-3 text-sm leading-6 text-neutral-10/75 dark:border-secondary-60/30 dark:bg-secondary-20/40 dark:text-neutral-80">
          Senha atualizada. Redirecionando para o login...
        </p>
      ) : (
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <input type="hidden" {...form.register("token")} />
          <Input className="focus-ring" type="password" placeholder="Nova senha" {...form.register("password")} />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Redefinir senha"}
          </Button>
          {mutation.error && (
            <p className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</p>
          )}
        </form>
      )}
    </Card>
  );
}
