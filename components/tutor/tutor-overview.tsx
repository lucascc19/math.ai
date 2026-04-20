import Link from "next/link";
import { ArrowRight, CircleCheckBig, Gauge, Users } from "lucide-react";
import type { AdminUser, InvitationItem, TutorMetrics } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function TutorOverview({
  students,
  metrics,
  invitations
}: {
  students: AdminUser[];
  metrics: TutorMetrics;
  invitations: InvitationItem[];
}) {
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");
  const recentStudents = students.slice(0, 5);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 rounded-2xl border border-black/5 bg-white/88 p-6 shadow-soft">
        <Badge variant="primary">Visao geral</Badge>
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 md:text-4xl">Area do tutor</h1>
          <p className="max-w-3xl text-sm leading-7 text-neutral-10/72">
            Acompanhe seus alunos, convites e sinais de progresso sem precisar navegar por varias telas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Alunos acompanhados" value={String(metrics.studentsTracked)} icon={Users} />
          <MetricCard title="Tentativas" value={String(metrics.attempts)} icon={Gauge} />
          <MetricCard
            title="Acertos"
            value={`${metrics.correct}${metrics.attempts ? ` (${Math.round((metrics.correct / metrics.attempts) * 100)}%)` : ""}`}
            icon={CircleCheckBig}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card className="grid gap-4 bg-white/88">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-1">
              <Badge variant="secondary">Alunos recentes</Badge>
              <h2 className="text-xl font-bold text-neutral-10">Quem precisa da sua atencao</h2>
            </div>
            <Button asChild variant="ghost" className="rounded-2xl">
              <Link href="/tutor/alunos">
                Abrir lista
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3">
            {recentStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-neutral-95 p-5 text-sm text-neutral-10/68">
                Nenhum aluno vinculado ainda. Quando a administracao fizer os vinculos, eles aparecem aqui.
              </div>
            ) : (
              recentStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/tutor/alunos/${student.id}`}
                  className="focus-ring flex items-center gap-3 rounded-2xl border border-black/6 bg-white px-4 py-3 hover:border-primary-60/18"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-95 font-bold text-primary-30">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="grid min-w-0 gap-0.5">
                    <strong className="truncate text-sm text-neutral-10">{student.name}</strong>
                    <span className="truncate text-xs text-neutral-10/62">{student.email}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="grid gap-4 bg-white/88">
          <div className="grid gap-1">
            <Badge variant="primary">Convites</Badge>
            <h2 className="text-xl font-bold text-neutral-10">Fila rapida</h2>
          </div>
          <div className="grid gap-3">
            <PriorityRow label="Convites pendentes" value={String(pendingInvitations.length)} />
            <PriorityRow label="Total de alunos" value={String(students.length)} />
          </div>
          <Button asChild className="rounded-2xl">
            <Link href="/tutor/convites">
              Gerenciar convites
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-black/6 bg-neutral-95 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary-40">{title}</span>
        <Icon className="h-4 w-4 text-primary-40" />
      </div>
      <span className="text-2xl font-bold text-neutral-10">{value}</span>
    </div>
  );
}

function PriorityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/6 bg-neutral-95 px-4 py-3">
      <span className="text-sm text-neutral-10/72">{label}</span>
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-primary-60 px-2 text-xs font-bold text-white">
        {value}
      </span>
    </div>
  );
}
