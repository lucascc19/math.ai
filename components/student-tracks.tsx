"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, Clock3, Target } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api, type DashboardResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const accentStyles = {
  primary: "border-primary-60/24 bg-primary-95",
  secondary: "border-secondary-60/24 bg-secondary-95",
  tertiary: "border-tertiary-70/24 bg-tertiary-95"
} as const;

type SkillCard = DashboardResponse["skills"][number];

export function StudentTracks() {
  const { setDashboard, dashboard } = useAppStore();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard
  });

  useEffect(() => {
    if (dashboardQuery.data) {
      setDashboard(dashboardQuery.data);
    }
  }, [dashboardQuery.data, setDashboard]);

  const skills: SkillCard[] = dashboard?.skills ?? [];

  if (dashboardQuery.isLoading || !dashboard) {
    return (
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-2xl border border-black/5 bg-white/70" />
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <Badge variant="primary" className="w-fit">Trilhas</Badge>
        <div className="grid gap-2">
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-neutral-10 md:text-4xl">
            Escolha onde continuar
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-neutral-10/74">
            Selecione uma trilha para abrir os detalhes, ver a atividade atual e continuar seus estudos.
          </p>
        </div>
      </section>

      {skills.length === 0 ? (
        <Card className="grid gap-3 bg-white/88">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary-40" />
            <strong className="text-lg text-neutral-10">Nenhuma trilha disponível</strong>
          </div>
          <p className="text-sm leading-6 text-neutral-10/72">
            Assim que uma trilha com lições publicadas estiver disponível, ela vai aparecer aqui.
          </p>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/aluno/trilhas/${skill.id}` as Route}
              className={cn(
                "focus-ring grid gap-4 rounded-2xl border p-5 text-left transition hover:-translate-y-0.5",
                accentStyles[skill.accent as keyof typeof accentStyles]
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <strong className="text-xl text-neutral-10">{skill.name}</strong>
                <Badge
                  variant={
                    skill.accent === "primary" ? "primary" : skill.accent === "secondary" ? "secondary" : "tertiary"
                  }
                >
                  {skill.estimatedTime}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-neutral-10/75">{skill.description}</p>
              <div className="grid gap-1 rounded-2xl border border-black/6 bg-white/45 px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-10/55">
                  Módulo atual
                </span>
                <strong className="text-sm text-neutral-10">{skill.currentLesson.moduleTitle}</strong>
                <span className="text-xs text-neutral-10/65">{skill.currentLesson.title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-10/68">
                {skill.difficulty ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1">
                    <Target className="h-3 w-3" />
                    {skill.difficulty}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1">
                  <Clock3 className="h-3 w-3" />
                  {skill.currentLesson.estimatedMinutes ? `${skill.currentLesson.estimatedMinutes} min na lição atual` : "ritmo livre"}
                </span>
                {skill.modules?.length ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/65 px-2.5 py-1">
                    <BookOpen className="h-3 w-3" />
                    {skill.modules.length} {skill.modules.length === 1 ? "módulo" : "módulos"}
                  </span>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Progress value={skill.progress.mastery} label={`Dominio atual: ${skill.progress.mastery}%`} />
                <div className="flex items-center justify-between gap-3 text-xs text-neutral-10/65">
                  <span>{skill.progress.attempts} tentativas</span>
                  <span>{skill.progress.correct} acertos</span>
                </div>
              </div>
              {skill.targetAudience && (
                <p className="text-xs leading-5 text-neutral-10/65">{skill.targetAudience}</p>
              )}
              <span className="inline-flex items-center text-sm font-semibold text-primary-40">
                Abrir trilha
                <ArrowRight className="ml-2 h-4 w-4" />
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
