import { ContentStatus, Role } from "@prisma/client";
import { ArrowRight, BookOpen, Clock3, FileText, Link2, ShieldCheck, UserCog, UserPlus, Users } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { AdminTrack, AdminUser, InvitationItem, TutorLinkFull } from "@/lib/api";

export function AdminOverview({
  users,
  invitations,
  links,
  tracks
}: {
  users: AdminUser[];
  invitations: InvitationItem[];
  links: TutorLinkFull[];
  tracks: AdminTrack[];
}) {
  const activeUsers = users.filter((user) => user.active).length;
  const admins = users.filter((user) => user.role === Role.ADMIN).length;
  const tutors = users.filter((user) => user.role === Role.TUTOR).length;
  const students = users.filter((user) => user.role === Role.STUDENT).length;
  const pendingInvitations = invitations.filter((invite) => invite.status === "pending");
  const draftTracks = tracks.filter((track) => track.status === ContentStatus.DRAFT);
  const publishedTracks = tracks.filter((track) => track.status === ContentStatus.PUBLISHED);
  const totalLessons = tracks.reduce((sum, track) => sum + track.lessons.length, 0);
  const publishedLessons = tracks.reduce(
    (sum, track) => sum + track.lessons.filter((lesson) => lesson.status === ContentStatus.PUBLISHED).length,
    0
  );
  const recentUsers = users.slice(0, 5);
  const recentInvitations = invitations.slice(0, 5);
  const recentTracks = tracks.slice(0, 4);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-2xl border border-black/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(239,240,255,0.88))] p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-neutral-10 md:text-4xl">
              Central de operação do admin
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-neutral-10/72">
              Aqui fica a leitura rápida da plataforma: contas, convites, vínculos e conteúdo em andamento.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Usuários ativos"
            value={`${activeUsers}/${users.length}`}
            description={`${admins} admins, ${tutors} tutores e ${students} alunos cadastrados`}
            icon={Users}
            tone="primary"
          />
          <StatCard
            title="Convites pendentes"
            value={String(pendingInvitations.length)}
            description={`${invitations.length} convites no histórico total`}
            icon={UserPlus}
            tone="secondary"
          />
          <StatCard
            title="Vínculos tutor-aluno"
            value={String(links.length)}
            description="Relações ativas entre acompanhamento e estudo"
            icon={Link2}
            tone="tertiary"
          />
          <StatCard
            title="Conteúdo publicado"
            value={`${publishedTracks.length}/${tracks.length}`}
            description={`${publishedLessons}/${totalLessons} lições publicadas`}
            icon={BookOpen}
            tone="primary"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="grid gap-5 bg-white/84">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold text-neutral-10">Onde agir agora</h2>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <QuickActionCard
              href="/admin/usuarios"
              title="Gerenciar usuários"
              description="Perfis, papéis e contas desativadas."
              meta={`${users.length} contas cadastradas`}
              icon={UserCog}
            />
            <QuickActionCard
              href="/admin/convites"
              title="Revisar convites"
              description="Criação, reenvio e limpeza de acessos."
              meta={`${pendingInvitations.length} pendentes`}
              icon={ShieldCheck}
            />
            <QuickActionCard
              href="/admin/vinculos"
              title="Organizar vínculos"
              description="Conectar tutores e alunos com menos fricção."
              meta={`${links.length} relações ativas`}
              icon={Link2}
            />
            <QuickActionCard
              href="/admin/conteudo"
              title="Publicar conteúdo"
              description="Trilhas, lições e rascunhos em progresso."
              meta={`${draftTracks.length} trilhas em rascunho`}
              icon={FileText}
            />
          </div>
        </Card>

        <Card className="grid gap-4 bg-primary-95">
          <div className="grid gap-2">
            <h2 className="text-2xl font-bold text-neutral-10">Fila de atenção</h2>
          </div>

          <div className="grid gap-3">
            <PriorityRow
              label="Convites aguardando aceite"
              value={String(pendingInvitations.length)}
              helper="Bom ponto para acompanhar onboarding."
            />
            <PriorityRow
              label="Trilhas em rascunho"
              value={String(draftTracks.length)}
              helper="Conteúdo ainda não publicado para alunos."
            />
            <PriorityRow
              label="Usuários inativos"
              value={String(users.length - activeUsers)}
              helper="Pode indicar bloqueios ou contas antigas."
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "secondary" | "tertiary";
}) {
  const toneClasses = {
    primary: "bg-primary-95 text-primary-30",
    secondary: "bg-secondary-95 text-secondary-30",
    tertiary: "bg-tertiary-95 text-tertiary-30"
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-black/5 bg-white/82 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-2">
          <span className="text-sm font-medium text-neutral-10/68">{title}</span>
          <strong className="text-3xl font-bold text-neutral-10">{value}</strong>
        </div>
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="text-sm leading-6 text-neutral-10/68">{description}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  meta,
  icon: Icon
}: {
  href: Route;
  title: string;
  description: string;
  meta: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="focus-ring grid gap-3 rounded-2xl border border-black/5 bg-white/80 p-5 transition hover:border-primary-60/18 hover:bg-white"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-95 text-primary-30">
          <Icon className="h-5 w-5" />
        </span>
        <ArrowRight className="h-4 w-4 text-neutral-10/45" />
      </div>
      <div className="grid gap-1">
        <strong className="text-base text-neutral-10">{title}</strong>
        <p className="text-sm leading-6 text-neutral-10/68">{description}</p>
      </div>
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary-40">{meta}</span>
    </Link>
  );
}

function PriorityRow({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="grid gap-1 rounded-2xl border border-primary-60/12 bg-white/82 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-neutral-10">{label}</span>
        <span className="rounded-full bg-primary-60 px-2.5 py-1 text-xs font-bold text-white">{value}</span>
      </div>
      <span className="text-sm leading-6 text-neutral-10/68">{helper}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "used" | "expired" | "revoked" | "published" | "draft" }) {
  const label = {
    pending: "Pendente",
    used: "Aceito",
    expired: "Expirado",
    revoked: "Revogado",
    published: "Publicado",
    draft: "Rascunho"
  } as const;

  const config = {
    pending: "bg-secondary-95 text-secondary-30",
    used: "bg-primary-95 text-primary-30",
    expired: "bg-neutral-95 text-neutral-30",
    revoked: "bg-tertiary-95 text-tertiary-30",
    published: "bg-secondary-95 text-secondary-30",
    draft: "bg-neutral-95 text-neutral-30"
  } as const;

  const icon = status === "pending" ? <Clock3 className="h-3 w-3" /> : null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${config[status]}`}>
      {icon}
      {label[status]}
    </span>
  );
}
