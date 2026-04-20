"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Clock, Copy, Link2, MailX, Plus, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type AdminUser, type InvitationItem } from "@/lib/api";
import { createInvitationSchema, type CreateInvitationInput } from "@/lib/schemas";

const ROLE_LABEL: Record<string, string> = { STUDENT: "Aluno", TUTOR: "Tutor", ADMIN: "Admin" };
const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  used: "Aceito",
  expired: "Expirado",
  revoked: "Revogado"
};

type Filters = { status?: string; role?: Role };
type CreatedInvite = { token: string; email: string };

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
    queryFn: () => api.invitations.list(filters).then((r) => r.invitations),
    initialData: initialInvitations
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
          <Badge variant="tertiary">Convites</Badge>
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
            Gerenciar convites
          </h1>
        </div>
        <Button onClick={() => { setCreating((v) => !v); setLastCreated(null); }}>
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Fechar" : "Novo convite"}
        </Button>
      </div>

      {creating && (
        <CreateInvitationForm
          tutors={tutors}
          showRoleSelect
          onSuccess={handleCreated}
        />
      )}

      {lastCreated && (
        <InviteCreatedBanner
          token={lastCreated.token}
          email={lastCreated.email}
          onDismiss={() => setLastCreated(null)}
        />
      )}

      <Card className="grid gap-4 rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Status"
            value={filters.status ?? ""}
            onChange={(v) => setFilters((f) => ({ ...f, status: v || undefined }))}
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
            onChange={(v) => setFilters((f) => ({ ...f, role: (v as Role) || undefined }))}
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
        </div>

        <div className="grid gap-3">
          {invitations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum convite encontrado com esses filtros.
            </p>
          ) : (
            invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                onRevoked={() => queryClient.invalidateQueries({ queryKey: ["admin", "invitations"] })}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function InviteCreatedBanner({ token, email, onDismiss }: { token: string; email: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/convite/${token}` : `/convite/${token}`;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="grid gap-3 rounded-[28px] border border-secondary-60/20 bg-secondary-95 p-6 shadow-soft dark:border-secondary-60/30 dark:bg-secondary-20/30">
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
  onRevoked
}: {
  invitation: InvitationItem;
  onRevoked: () => void;
}) {
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
      {revokeMutation.error && (
        <p className="w-full text-xs text-tertiary-30">{revokeMutation.error.message}</p>
      )}
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
      onSuccess({ token: result.invitation.token, email: result.invitation.email });
    }
  });

  return (
    <Card className="grid gap-4 rounded-[28px] border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40 md:p-8">
      <div className="grid gap-1">
        <Badge variant="primary">Novo convite</Badge>
        <h2 className="text-xl font-bold text-neutral-10 dark:text-neutral-95">Convidar pessoa</h2>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
          Um link de convite será gerado. A conta só é criada quando o convidado aceitar.
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
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="focus-ring rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-10 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
            >
              <option value="STUDENT">Aluno</option>
              <option value="TUTOR">Tutor</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
          {selectedRole === "STUDENT" && tutors.length > 0 && (
            <select
              {...form.register("tutorId")}
              className="focus-ring rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-10 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
            >
              <option value="">Sem tutor vinculado</option>
              {tutors.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
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
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-medium text-neutral-10/70 dark:text-neutral-80">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-10 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
