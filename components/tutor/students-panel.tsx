"use client";

import { ArrowRight, BarChart3, CircleCheckBig, Gauge, Users } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AdminUser, TutorMetrics } from "@/lib/api";

type Props = {
  initialStudents: AdminUser[];
  metrics: TutorMetrics;
};

export function StudentsPanel({ initialStudents, metrics }: Props) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <Badge variant="primary">Meus alunos</Badge>
        <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">
          {metrics.scope === "global" ? "Todos os alunos da plataforma" : "Alunos vinculados a você"}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-neutral-10/70 dark:text-neutral-80">
          {metrics.scope === "global"
            ? "Como admin, você vê todos os alunos. Os tutores veem apenas seus vinculados."
            : "Você vê apenas os alunos que a coordenação vinculou a você. Para adicionar novos vínculos, peça à administração."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile title="Alunos acompanhados" value={String(metrics.studentsTracked)} icon={Users} />
        <MetricTile title="Tentativas" value={String(metrics.attempts)} icon={Gauge} />
        <MetricTile
          title="Acertos"
          value={`${metrics.correct}${metrics.attempts ? ` (${Math.round((metrics.correct / metrics.attempts) * 100)}%)` : ""}`}
          icon={CircleCheckBig}
        />
      </div>

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-10 dark:text-neutral-95">Lista de alunos</h2>
          <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
            {initialStudents.length} {initialStudents.length === 1 ? "aluno" : "alunos"}
          </span>
        </div>

        <div className="grid gap-3">
          {initialStudents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum aluno vinculado ainda. A administração precisa criar o vínculo em /admin/vinculos.
            </p>
          ) : (
            initialStudents.map((student) => (
              <Link
                key={student.id}
                href={`/tutor/alunos/${student.id}`}
                className="focus-ring flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 transition hover:border-primary-60/30 dark:border-white/10 dark:bg-neutral-20/50 dark:hover:border-primary-60/50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-95 font-bold text-secondary-40 dark:bg-secondary-20/40 dark:text-secondary-70">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="truncate text-sm font-semibold text-neutral-10 dark:text-neutral-95">
                    {student.name}
                  </span>
                  <span className="truncate text-xs text-neutral-10/65 dark:text-neutral-80">{student.email}</span>
                </div>
                {!student.active && (
                  <span className="rounded-full bg-neutral-90 px-2.5 py-1 text-xs font-bold text-neutral-30 dark:bg-neutral-20/60 dark:text-neutral-70">
                    Desativado
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-neutral-10/45 dark:text-neutral-70" />
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function MetricTile({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="grid gap-3 rounded-2xl border border-black/5 bg-white/85 p-5 shadow-soft dark:border-white/10 dark:bg-neutral-20/70">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary-40 dark:text-primary-70">
          {title}
        </span>
        <Icon className="h-4 w-4 text-primary-40 dark:text-primary-70" />
      </div>
      <span className="text-2xl font-bold text-neutral-10 dark:text-neutral-95">{value}</span>
    </Card>
  );
}
