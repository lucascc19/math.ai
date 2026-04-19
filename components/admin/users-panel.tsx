"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Role } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type AdminUser } from "@/lib/api";
import { createTutorSchema, type CreateTutorInput } from "@/lib/schemas";

type Filters = { role?: Role; active?: boolean };

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Aluno",
  TUTOR: "Tutor",
  ADMIN: "Admin"
};

const ROLE_BADGE_VARIANT: Record<Role, "primary" | "secondary" | "tertiary"> = {
  STUDENT: "secondary",
  TUTOR: "primary",
  ADMIN: "tertiary"
};

export function UsersPanel({ initialUsers, filters }: { initialUsers: AdminUser[]; filters: Filters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [creatingTutor, setCreatingTutor] = useState(false);

  const queryKey = ["admin", "users", filters] as const;

  const { data: users = initialUsers } = useQuery({
    queryKey,
    queryFn: () => api.admin.listUsers(filters).then((r) => r.users),
    initialData: initialUsers
  });

  function updateFilter(key: "role" | "active", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`/admin/usuarios?${params.toString()}`);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <Badge variant="tertiary">Usuários</Badge>
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
            Gerenciar contas da plataforma
          </h1>
        </div>
        <Button onClick={() => setCreatingTutor((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          {creatingTutor ? "Fechar" : "Criar tutor"}
        </Button>
      </div>

      {creatingTutor && (
        <CreateTutorForm
          onSuccess={() => {
            setCreatingTutor(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
          }}
        />
      )}

      <Card className="grid gap-4 rounded-[28px] border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Papel"
            value={filters.role ?? ""}
            onChange={(v) => updateFilter("role", v)}
            options={[
              { value: "", label: "Todos" },
              { value: Role.STUDENT, label: "Alunos" },
              { value: Role.TUTOR, label: "Tutores" },
              { value: Role.ADMIN, label: "Admins" }
            ]}
          />
          <FilterSelect
            label="Status"
            value={filters.active === undefined ? "" : String(filters.active)}
            onChange={(v) => updateFilter("active", v)}
            options={[
              { value: "", label: "Todos" },
              { value: "true", label: "Ativos" },
              { value: "false", label: "Desativados" }
            ]}
          />
          <span className="ml-auto text-sm text-neutral-10/65 dark:text-neutral-80">
            {users.length} {users.length === 1 ? "usuário" : "usuários"}
          </span>
        </div>

        <div className="grid gap-3">
          {users.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum usuário encontrado com esses filtros.
            </p>
          ) : (
            users.map((user) => <UserRow key={user.id} user={user} />)
          )}
        </div>
      </Card>
    </div>
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

function UserRow({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();

  const roleMutation = useMutation({
    mutationFn: (role: Role) => api.admin.setUserRole(user.id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
  });

  const activeMutation = useMutation({
    mutationFn: (active: boolean) => api.admin.setUserActive(user.id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
  });

  const busy = roleMutation.isPending || activeMutation.isPending;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[20px] border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/50">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-95 font-bold text-primary-40 dark:bg-primary-20/50 dark:text-primary-70">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm font-semibold text-neutral-10 dark:text-neutral-95">{user.name}</span>
        <span className="truncate text-xs text-neutral-10/65 dark:text-neutral-80">{user.email}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={ROLE_BADGE_VARIANT[user.role]}>{ROLE_LABEL[user.role]}</Badge>
        {user.active ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-95 px-2.5 py-1 text-xs font-bold text-secondary-40 dark:bg-secondary-20/40 dark:text-secondary-80">
            <UserCheck className="h-3 w-3" />
            Ativo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-90 px-2.5 py-1 text-xs font-bold text-neutral-30 dark:bg-neutral-20/60 dark:text-neutral-70">
            <UserX className="h-3 w-3" />
            Desativado
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={user.role}
          disabled={busy}
          onChange={(e) => roleMutation.mutate(e.target.value as Role)}
          className="focus-ring rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
        >
          <option value={Role.STUDENT}>Aluno</option>
          <option value={Role.TUTOR}>Tutor</option>
          <option value={Role.ADMIN}>Admin</option>
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => activeMutation.mutate(!user.active)}
          className="focus-ring inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 hover:border-primary-60/30 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95 dark:hover:border-primary-60/50"
        >
          <ShieldCheck className="h-3 w-3" />
          {user.active ? "Desativar" : "Reativar"}
        </button>
      </div>
      {(roleMutation.error || activeMutation.error) && (
        <p className="w-full text-xs text-tertiary-30 dark:text-tertiary-70">
          {(roleMutation.error ?? activeMutation.error)?.message}
        </p>
      )}
    </div>
  );
}

function CreateTutorForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<CreateTutorInput>({
    resolver: zodResolver(createTutorSchema),
    defaultValues: { name: "", email: "", password: "" }
  });

  const mutation = useMutation({
    mutationFn: api.admin.createTutor,
    onSuccess: () => {
      form.reset();
      onSuccess();
    }
  });

  return (
    <Card className="grid gap-4 rounded-[28px] border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40 md:p-8">
      <div className="grid gap-1">
        <Badge variant="primary">Novo tutor</Badge>
        <h2 className="text-xl font-bold text-neutral-10 dark:text-neutral-95">Criar conta de tutor</h2>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
          A conta é criada já ativa. O tutor poderá fazer login com essas credenciais.
        </p>
      </div>
      <form
        className="grid gap-3 md:grid-cols-3"
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      >
        <Input placeholder="Nome completo" {...form.register("name")} />
        <Input type="email" placeholder="E-mail" {...form.register("email")} />
        <Input type="password" placeholder="Senha inicial" {...form.register("password")} />
        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar tutor"}
          </Button>
          {mutation.error && (
            <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
          )}
        </div>
      </form>
    </Card>
  );
}
