"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Copy, MailX, MoreHorizontal, Plus, RefreshCcw, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { api, type InvitationItem } from "@/lib/api";
import { createInvitationSchema, type CreateInvitationInput } from "@/lib/schemas";

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

  const cleanupMutation = useMutation({
    mutationFn: api.invitations.cleanup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tutor", "invitations"] });
      setLastCreated(null);
    }
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

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-10/70 dark:text-neutral-80">Meus convites</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
              {invitations.length} {invitations.length === 1 ? "convite" : "convites"}
            </span>
            <Button type="button" variant="ghost" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              {cleanupMutation.isPending ? "Limpando..." : "Limpar antigos"}
            </Button>
          </div>
        </div>
        {cleanupMutation.data && (
          <p className="text-xs text-neutral-10/65 dark:text-neutral-80">
            {cleanupMutation.data.deletedCount} convites removidos. A limpeza apaga todos os convites que não estão mais pendentes.
          </p>
        )}
        {cleanupMutation.error && <p className="text-xs text-tertiary-30">{cleanupMutation.error.message}</p>}

        <div className="grid gap-3">
          {invitations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Você ainda não enviou convites.
            </p>
          ) : (
            invitations.map((invitation) => (
              <TutorInvitationRow
                key={invitation.id}
                invitation={invitation}
                onChanged={() => queryClient.invalidateQueries({ queryKey: ["tutor", "invitations"] })}
                onResent={handleCreated}
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
    <Card className="grid gap-4 rounded-2xl border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40 md:p-8">
      <div className="grid gap-1">
        <Badge variant="primary">Novo convite</Badge>
        <h2 className="text-xl font-bold text-neutral-10 dark:text-neutral-95">Convidar aluno</h2>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
          A conta só é criada quando o aluno aceitar o convite.
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
          <Checkbox
            checked={linkToSelf}
            onCheckedChange={(checked) => setLinkToSelf(checked === true)}
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
    <Card className="grid gap-3 rounded-2xl border border-secondary-60/20 bg-secondary-95 p-6 shadow-soft dark:border-secondary-60/30 dark:bg-secondary-20/30">
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

function TutorInvitationRow({
  invitation,
  onChanged,
  onResent
}: {
  invitation: InvitationItem;
  onChanged: () => void;
  onResent: (result: CreatedInvite) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canResend = invitation.status !== "used";
  const canRevoke = invitation.status === "pending";
  const revokeMutation = useMutation({
    mutationFn: () => api.invitations.revoke(invitation.id),
    onSuccess: () => {
      setMenuOpen(false);
      onChanged();
    }
  });
  const resendMutation = useMutation({
    mutationFn: () => api.invitations.resend(invitation.id),
    onSuccess: (result) => {
      setMenuOpen(false);
      onChanged();
      onResent({
        token: result.invitation.token,
        email: result.invitation.email,
        inviteUrl: result.invitation.inviteUrl
      });
    }
  });
  const deleteMutation = useMutation({
    mutationFn: () => api.invitations.delete(invitation.id),
    onSuccess: () => {
      setMenuOpen(false);
      onChanged();
    }
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
    <div className="grid gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="grid min-w-0 gap-2">
        <div className="grid gap-0.5">
          <span className="truncate text-sm font-semibold text-neutral-10 dark:text-neutral-95">{invitation.email}</span>
          <span className="text-xs text-neutral-10/65 dark:text-neutral-80">
            {new Date(invitation.createdAt).toLocaleDateString("pt-BR")}
            {invitation.status === "pending" && <> · expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</>}
          </span>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[invitation.status]}`}
        >
          <StatusIcon className="h-3 w-3" />
          {STATUS_LABEL[invitation.status] ?? invitation.status}
        </span>
      </div>
      <div className="relative flex flex-wrap items-center justify-start gap-2 md:justify-end">
        <>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 hover:border-black/20 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-90"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
            Ações
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-2 grid min-w-[180px] gap-1 rounded-2xl border border-black/10 bg-white p-2 shadow-soft dark:border-white/10 dark:bg-neutral-20">
              {canResend && (
                <button
                  type="button"
                  disabled={resendMutation.isPending || revokeMutation.isPending || deleteMutation.isPending}
                  onClick={() => resendMutation.mutate()}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-primary-40 hover:bg-primary-95 disabled:opacity-50 dark:text-primary-70 dark:hover:bg-primary-20/30"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                  {resendMutation.isPending ? "Reenviando..." : "Reenviar convite"}
                </button>
              )}
              {canRevoke && (
                <button
                  type="button"
                  disabled={revokeMutation.isPending || resendMutation.isPending || deleteMutation.isPending}
                  onClick={() => revokeMutation.mutate()}
                  className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-tertiary-40 hover:bg-tertiary-95 disabled:opacity-50 dark:text-tertiary-70 dark:hover:bg-tertiary-20/30"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {revokeMutation.isPending ? "Revogando..." : "Revogar convite"}
                </button>
              )}
              <button
                type="button"
                disabled={deleteMutation.isPending || resendMutation.isPending || revokeMutation.isPending}
                onClick={() => deleteMutation.mutate()}
                className="focus-ring inline-flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-tertiary-40 hover:bg-tertiary-95 disabled:opacity-50 dark:text-tertiary-70 dark:hover:bg-tertiary-20/30"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleteMutation.isPending ? "Excluindo..." : "Excluir convite"}
              </button>
            </div>
          )}
        </>
      </div>
      {revokeMutation.error && <p className="w-full text-xs text-tertiary-30">{revokeMutation.error.message}</p>}
      {resendMutation.error && <p className="w-full text-xs text-tertiary-30">{resendMutation.error.message}</p>}
      {deleteMutation.error && <p className="w-full text-xs text-tertiary-30">{deleteMutation.error.message}</p>}
    </div>
  );
}
