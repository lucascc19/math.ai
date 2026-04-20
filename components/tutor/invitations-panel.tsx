"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, Copy, MailX, Plus, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { api, type InvitationItem } from "@/lib/api";
import { createInvitationSchema, type CreateInvitationInput } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  used: "Aceito",
  expired: "Expirado",
  revoked: "Revogado"
};

type CreatedInvite = { token: string; email: string; inviteUrl: string };

export function TutorInvitationsPanel({
  initialInvitations,
  tutorId
}: {
  initialInvitations: InvitationItem[];
  tutorId: string;
}) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<CreatedInvite | null>(null);

  const { data: invitations = initialInvitations } = useQuery({
    queryKey: ["tutor", "invitations"],
    queryFn: () => api.invitations.list().then((response) => response.invitations),
    initialData: initialInvitations
  });

  function handleCreated(result: CreatedInvite) {
    setCreating(false);
    setLastCreated(result);
    queryClient.invalidateQueries({ queryKey: ["tutor", "invitations"] });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <Badge variant="primary">Convites</Badge>
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
            Convidar alunos
          </h1>
        </div>
        <Button
          onClick={() => {
            setCreating((value) => !value);
            setLastCreated(null);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Fechar" : "Novo convite"}
        </Button>
      </div>

      {creating && <TutorCreateInvitationForm tutorId={tutorId} onSuccess={handleCreated} />}

      {lastCreated && (
        <InviteCreatedBanner
          token={lastCreated.token}
          email={lastCreated.email}
          inviteUrl={lastCreated.inviteUrl}
          onDismiss={() => setLastCreated(null)}
        />
      )}

      <Card className="grid gap-4 rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-10/70 dark:text-neutral-80">Meus convites</h2>
          <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
            {invitations.length} {invitations.length === 1 ? "convite" : "convites"}
          </span>
        </div>

        <div className="grid gap-3">
          {invitations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Voce ainda nao enviou convites.
            </p>
          ) : (
            invitations.map((invitation) => (
              <TutorInvitationRow
                key={invitation.id}
                invitation={invitation}
                onRevoked={() => queryClient.invalidateQueries({ queryKey: ["tutor", "invitations"] })}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function TutorCreateInvitationForm({
  tutorId,
  onSuccess
}: {
  tutorId: string;
  onSuccess: (result: CreatedInvite) => void;
}) {
  const [linkToSelf, setLinkToSelf] = useState(true);

  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: "", role: "STUDENT", tutorId }
  });

  const mutation = useMutation({
    mutationFn: api.invitations.create,
    onSuccess: (result) => {
      form.reset({ email: "", role: "STUDENT", tutorId });
      onSuccess({
        token: result.invitation.token,
        email: result.invitation.email,
        inviteUrl: result.invitation.inviteUrl
      });
    }
  });

  return (
    <Card className="grid gap-4 rounded-[28px] border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40 md:p-8">
      <div className="grid gap-1">
        <Badge variant="primary">Novo convite</Badge>
        <h2 className="text-xl font-bold text-neutral-10 dark:text-neutral-95">Convidar aluno</h2>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
          A conta so e criada quando o aluno aceitar o convite.
        </p>
      </div>
      <form
        className="grid gap-3"
        onSubmit={form.handleSubmit((values) => {
          mutation.mutate({
            ...values,
            role: "STUDENT",
            tutorId: linkToSelf ? tutorId : undefined
          });
        })}
      >
        <Input type="email" placeholder="E-mail do aluno" {...form.register("email")} />
        <label className="flex items-center gap-2 text-sm text-neutral-10/80 dark:text-neutral-80">
          <input
            type="checkbox"
            checked={linkToSelf}
            onChange={(event) => setLinkToSelf(event.target.checked)}
            className="h-4 w-4 rounded"
          />
          Vincular como meu aluno ao aceitar o convite
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Gerando convite..." : "Gerar convite"}
          </Button>
          {mutation.error && (
            <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function InviteCreatedBanner({
  token,
  email,
  inviteUrl,
  onDismiss
}: {
  token: string;
  email: string;
  inviteUrl: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl || (typeof window !== "undefined" ? `${window.location.origin}/convite/${token}` : `/convite/${token}`);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="grid gap-3 rounded-[28px] border border-secondary-60/20 bg-secondary-95 p-6 shadow-soft dark:border-secondary-60/30 dark:bg-secondary-20/30">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">
          Convite gerado para <span className="text-primary-40">{email}</span>
        </p>
        <button type="button" onClick={onDismiss} className="text-xs text-neutral-10/50 hover:text-neutral-10">
          Fechar
        </button>
      </div>
      <p className="text-xs text-neutral-10/65">Copie o link e envie para o aluno. Expira em 3 dias.</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-black/10 bg-white px-3 py-2 text-xs text-neutral-10 dark:border-white/10 dark:bg-neutral-20/60 dark:text-neutral-90">
          {url}
        </code>
        <Button type="button" onClick={copy} className="shrink-0">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-2">{copied ? "Copiado!" : "Copiar"}</span>
        </Button>
      </div>
    </Card>
  );
}

function TutorInvitationRow({ invitation, onRevoked }: { invitation: InvitationItem; onRevoked: () => void }) {
  const revokeMutation = useMutation({
    mutationFn: () => api.invitations.revoke(invitation.id),
    onSuccess: onRevoked
  });

  const statusColors: Record<string, string> = {
    pending: "bg-secondary-95 text-secondary-40 dark:bg-secondary-20/40 dark:text-secondary-80",
    used: "bg-primary-95 text-primary-40 dark:bg-primary-20/40 dark:text-primary-70",
    expired: "bg-neutral-90 text-neutral-40 dark:bg-neutral-20/60 dark:text-neutral-70",
    revoked: "bg-tertiary-95 text-tertiary-40 dark:bg-tertiary-20/40 dark:text-tertiary-70"
  };

  const StatusIcon =
    { pending: Clock, used: Check, expired: MailX, revoked: XCircle }[invitation.status] ?? Clock;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/50">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm font-semibold text-neutral-10 dark:text-neutral-95">{invitation.email}</span>
        <span className="text-xs text-neutral-10/65 dark:text-neutral-80">
          {new Date(invitation.createdAt).toLocaleDateString("pt-BR")}
          {invitation.status === "pending" && <> · expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</>}
        </span>
      </div>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[invitation.status]}`}
      >
        <StatusIcon className="h-3 w-3" />
        {STATUS_LABEL[invitation.status] ?? invitation.status}
      </span>
      {invitation.status === "pending" && (
        <button
          type="button"
          disabled={revokeMutation.isPending}
          onClick={() => revokeMutation.mutate()}
          className="focus-ring inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-tertiary-40 hover:border-tertiary-60/30 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-20/60 dark:text-tertiary-70"
        >
          <XCircle className="h-3 w-3" />
          Revogar
        </button>
      )}
      {revokeMutation.error && <p className="w-full text-xs text-tertiary-30">{revokeMutation.error.message}</p>}
    </div>
  );
}
