"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { api } from "@/lib/api";
import { passwordResetRequestSchema, type PasswordResetRequestInput } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const form = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" }
  });

  const mutation = useMutation({
    mutationFn: api.requestPasswordReset
  });

  return (
    <Card className="grid gap-6 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft dark:border-white/10 dark:bg-neutral-20/70">
      <div className="grid gap-3">
        <Badge variant="tertiary">Recuperação</Badge>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
            Redefinir senha
          </h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-10/75 dark:text-neutral-80">
            Informe o e-mail da sua conta. Se ele estiver cadastrado, enviaremos um link de redefinição válido por 1 hora.
          </p>
        </div>
      </div>

      {mutation.isSuccess ? (
        <p className="rounded-2xl border border-secondary-60/20 bg-secondary-95 px-4 py-3 text-sm leading-6 text-neutral-10/75 dark:border-secondary-60/30 dark:bg-secondary-20/40 dark:text-neutral-80">
          Se o e-mail estiver cadastrado, enviamos as instruções de redefinição. Verifique sua caixa de entrada.
        </p>
      ) : (
        <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <Input className="focus-ring" placeholder="E-mail" {...form.register("email")} />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Enviando..." : "Enviar link"}
          </Button>
          {mutation.error && (
            <p className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</p>
          )}
        </form>
      )}
    </Card>
  );
}
