"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, Copy, MailX, MoreHorizontal, Plus, RefreshCcw, Trash2, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { api, type AdminUser, type InvitationItem } from "@/lib/api";
import { createInvitationSchema, type CreateInvitationInput } from "@/lib/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Aluno",
  TUTOR: "Tutor",
  ADMIN: "Admin"
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  used: "Aceito",
  expired: "Expirado",
  revoked: "Revogado"
};

type Filters = { status?: string; role?: Role };
type CreatedInvite = { token: string; email: string; inviteUrl: string };

export function AdminInvitationsPanel({
  initialInvitations,
  tutors
}: {
  initialInvitations: InvitationItem[];
  tutors: AdminUser[];
}) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [lastCreated, setLastCreated] = useState<CreatedInvite | null>(null);

  const queryKey = ["admin", "invitations", filters] as const;

  const { data: invitations = initialInvitations } = useQuery({
    queryKey,
    queryFn: () => api.invitations.list(filters).then((response) => response.invitations),
    initialData: initialInvitations
  });

  const cleanupMutation = useMutation({
    mutationFn: api.invitations.cleanup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invitations"] });
      setLastCreated(null);
    }
  });

  function handleCreated(result: CreatedInvite) {
    setCreating(false);
    setLastCreated(result);
    queryClient.invalidateQueries({ queryKey: ["admin", "invitations"] });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
            Gerenciar convites
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

      {creating && <CreateInvitationForm tutors={tutors} showRoleSelect onSuccess={handleCreated} />}

      {lastCreated && (
        <InviteCreatedBanner
          token={lastCreated.token}
          email={lastCreated.email}
          inviteUrl={lastCreated.inviteUrl}
          onDismiss={() => setLastCreated(null)}
        />
      )}

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            onChange={(value) => setFilters((current) => ({ ...current, status: value || undefined }))}
            options={[
              { value: "", label: "Todos" },
              { value: "pending", label: "Pendentes" },
              { value: "used", label: "Aceitos" },
              { value: "expired", label: "Expirados" },
              { value: "revoked", label: "Revogados" }
            ]}
          />
          <FilterSelect
            label="Papel"
            value={filters.role ?? ""}
            onChange={(value) => setFilters((current) => ({ ...current, role: (value as Role) || undefined }))}
            options={[
              { value: "", label: "Todos" },
              { value: Role.STUDENT, label: "Aluno" },
              { value: Role.TUTOR, label: "Tutor" },
              { value: Role.ADMIN, label: "Admin" }
            ]}
          />
          <span className="ml-auto text-sm text-neutral-10/65 dark:text-neutral-80">
            {invitations.length} {invitations.length === 1 ? "convite" : "convites"}
          </span>
          <Button type="button" variant="ghost" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            {cleanupMutation.isPending ? "Limpando..." : "Limpar antigos"}
          </Button>
        </div>
        {cleanupMutation.data && (
          <p className="text-xs text-neutral-10/65 dark:text-neutral-80">
            {cleanupMutation.data.deletedCount} convites removidos. A limpeza apaga todos os convites que nao estao mais pendentes.
          </p>
        )}
        {cleanupMutation.error && <p className="text-xs text-tertiary-30">{cleanupMutation.error.message}</p>}

        <div className="grid gap-3">
          {invitations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum convite encontrado com esses filtros.
            </p>
          ) : (
            invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                onChanged={() => queryClient.invalidateQueries({ queryKey: ["admin", "invitations"] })}
                onResent={handleCreated}
              />
            ))
          )}
        </div>
      </Card>
    </div>
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
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-neutral-10/50 hover:text-neutral-10 dark:text-neutral-80"
        >
          Fechar
        </button>
      </div>
      <p className="text-xs text-neutral-10/65 dark:text-neutral-80">
        Copie o link abaixo e envie para o convidado. O link expira em 3 dias.
      </p>
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

function InvitationRow({
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
            por {invitation.invitedBy.name} · {new Date(invitation.createdAt).toLocaleDateString("pt-BR")}
            {invitation.tutor && <> · tutor: {invitation.tutor.name}</>}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{ROLE_LABEL[invitation.role] ?? invitation.role}</Badge>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[invitation.status]}`}
          >
            <StatusIcon className="h-3 w-3" />
            {STATUS_LABEL[invitation.status] ?? invitation.status}
          </span>
        </div>
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

export function CreateInvitationForm({
  tutors,
  showRoleSelect = false,
  forcedRole,
  onSuccess
}: {
  tutors: AdminUser[];
  showRoleSelect?: boolean;
  forcedRole?: string;
  onSuccess: (result: CreatedInvite) => void;
}) {
  const [selectedRole, setSelectedRole] = useState(forcedRole ?? "STUDENT");

  const form = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: "", role: (forcedRole as CreateInvitationInput["role"]) ?? "STUDENT", tutorId: "" }
  });

  const mutation = useMutation({
    mutationFn: api.invitations.create,
    onSuccess: (result) => {
      form.reset();
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
        <h2 className="text-xl font-bold text-neutral-10 dark:text-neutral-95">Convidar pessoa</h2>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
          Um link de convite sera gerado. A conta so e criada quando o convidado aceitar.
        </p>
      </div>
      <form
        className="grid gap-3"
        onSubmit={form.handleSubmit((values) => {
          const data: CreateInvitationInput = {
            ...values,
            role: selectedRole as CreateInvitationInput["role"],
            tutorId: selectedRole === "STUDENT" && values.tutorId ? values.tutorId : undefined
          };
          mutation.mutate(data);
        })}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Input type="email" placeholder="E-mail do convidado" {...form.register("email")} />
          {showRoleSelect && (
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Aluno</SelectItem>
                <SelectItem value="TUTOR">Tutor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
          {selectedRole === "STUDENT" && tutors.length > 0 && (
            <Select
              value={form.watch("tutorId") || "__none__"}
              onValueChange={(nextValue) =>
                form.setValue("tutorId", nextValue === "__none__" ? "" : nextValue, { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem tutor vinculado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem tutor vinculado</SelectItem>
                {tutors.map((tutor) => (
                  <SelectItem key={tutor.id} value={tutor.id}>
                    {tutor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const normalizedValue = value || "__all__";

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-neutral-10/70 dark:text-neutral-80">{label}:</span>
      <Select value={normalizedValue} onValueChange={(nextValue) => onChange(nextValue === "__all__" ? "" : nextValue)}>
        <SelectTrigger className="h-10 w-[180px] rounded-full bg-white px-3 py-1.5 text-sm dark:bg-neutral-20/60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value || "__all__"} value={option.value || "__all__"}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
