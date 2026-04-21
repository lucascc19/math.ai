"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type InvitationPublic } from "@/lib/api";
import { getHomePathForRole } from "@/lib/role-home";
import { acceptInvitationSchema, type AcceptInvitationInput } from "@/lib/schemas";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Aluno",
  TUTOR: "Tutor",
  ADMIN: "Administrador"
};

export function InvitationAcceptForm({ token, invitation }: { token: string; invitation: InvitationPublic }) {
  const router = useRouter();

  const form = useForm<Omit<AcceptInvitationInput, "token">>({
    resolver: zodResolver(acceptInvitationSchema.omit({ token: true })),
    defaultValues: { name: "", password: "" }
  });

  const mutation = useMutation({
    mutationFn: (values: Omit<AcceptInvitationInput, "token">) =>
      api.invitations.accept({ ...values, token }),
    onSuccess: (response) => {
      router.push(getHomePathForRole(response.user.role));
      router.refresh();
    }
  });

  return (
    <Card className="grid gap-6 rounded-[28px] border border-black/5 bg-white/90 p-8 shadow-soft">
      <div className="grid gap-3">
        <Badge variant="primary">Convite</Badge>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 md:text-4xl">Ativar sua conta</h1>
          <p className="max-w-xl text-sm leading-7 text-neutral-10/75">
            Você foi convidado para entrar na plataforma como{" "}
            <span className="font-semibold">{ROLE_LABEL[invitation.role] ?? invitation.role}</span>.
            {invitation.tutor && (
              <>
                {" "}
                Seu tutor será <span className="font-semibold">{invitation.tutor.name}</span>.
              </>
            )}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-neutral-95 px-4 py-3 text-sm text-neutral-10/75">
        <span className="font-medium">E-mail: </span>
        {invitation.email}
      </div>

      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Input className="focus-ring" placeholder="Seu nome completo" {...form.register("name")} />
        <Input className="focus-ring" type="password" placeholder="Escolha uma senha" {...form.register("password")} />
        {form.formState.errors.name && (
          <p className="text-sm text-tertiary-30">{form.formState.errors.name.message}</p>
        )}
        {form.formState.errors.password && (
          <p className="text-sm text-tertiary-30">{form.formState.errors.password.message}</p>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Ativando conta..." : "Ativar conta"}
        </Button>
        <p className="text-sm text-neutral-10/65">
          {mutation.error ? mutation.error.message : "Depois de ativar, você poderá entrar normalmente pelo login."}
        </p>
      </form>
    </Card>
  );
}
