"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { api, type DashboardResponse } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const accentStyles = {
  primary: "border-primary-60/24 bg-primary-95",
  secondary: "border-secondary-60/24 bg-secondary-95",
  tertiary: "border-tertiary-70/24 bg-tertiary-95"
} as const;

type SkillCard = DashboardResponse["skills"][number];

export function StudentTrackDetail({ skillId }: { skillId: string }) {
  const { setDashboard, setActiveSkillId, dashboard } = useAppStore();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard
  });

  useEffect(() => {
    if (dashboardQuery.data) {
      setDashboard(dashboardQuery.data);
    }
  }, [dashboardQuery.data, setDashboard]);

  const skill = useMemo<SkillCard | undefined>(
    () => dashboard?.skills.find((item) => item.id === skillId),
    [dashboard?.skills, skillId]
  );

  useEffect(() => {
    if (skill) {
      setActiveSkillId(skill.id);
    }
  }, [setActiveSkillId, skill]);

  if (dashboardQuery.isLoading || !dashboard) {
    return <div className="h-64 animate-pulse rounded-2xl border border-black/5 bg-white/70" />;
  }

  if (!skill) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <Link
        href="/aluno/trilhas"
        className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para trilhas
      </Link>

      <section className="grid gap-3">
        <Badge variant="primary" className="w-fit">Trilha</Badge>
        <div className="grid gap-2">
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-neutral-10 md:text-4xl">{skill.name}</h1>
          <p className="max-w-3xl text-sm leading-7 text-neutral-10/74">{skill.description}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className={cn("grid gap-3", accentStyles[skill.accent as keyof typeof accentStyles])}>
          <span className="text-sm text-neutral-10/70">Tempo estimado</span>
          <strong className="text-2xl text-neutral-10">{skill.estimatedTime}</strong>
        </Card>
        <Card className="grid gap-3 bg-white/88">
          <span className="text-sm text-neutral-10/70">Dominio atual</span>
          <strong className="text-2xl text-neutral-10">{skill.progress.mastery}%</strong>
        </Card>
        <Card className="grid gap-3 bg-white/88">
          <span className="text-sm text-neutral-10/70">Tentativas</span>
          <strong className="text-2xl text-neutral-10">{skill.progress.attempts}</strong>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <Card className="grid gap-5 bg-white/88">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-2">
              <Badge variant="secondary">Atividade atual</Badge>
              <h2 className="text-2xl font-bold text-neutral-10">{skill.currentLesson.title}</h2>
            </div>
            <BookOpen className="h-7 w-7 text-primary-40" />
          </div>

          <div className="grid gap-4 rounded-2xl border border-black/6 bg-neutral-95 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{skill.currentLesson.level}</Badge>
              <Badge variant="primary">{skill.currentLesson.goal}</Badge>
            </div>
            <strong className="text-3xl font-bold text-neutral-10">{skill.currentLesson.prompt}</strong>
            <p className="text-sm leading-7 text-neutral-10/75">{skill.currentLesson.story}</p>
            <p className="text-sm leading-7 text-neutral-10/68">{skill.currentLesson.tip}</p>
            <Progress value={skill.progress.mastery} label={`Dominio atual: ${skill.progress.mastery}%`} />
          </div>
        </Card>

        <Card className="grid gap-5 bg-white/88">
          <div className="grid gap-2">
            <Badge variant="primary">Leitura guiada</Badge>
            <h2 className="text-2xl font-bold text-neutral-10">Como seguir nessa trilha</h2>
          </div>

          <div className="grid gap-3">
            {skill.currentLesson.guidance.map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-2xl border border-black/6 bg-neutral-95 px-4 py-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-60 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-neutral-10/75">{step}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 rounded-2xl border border-black/6 bg-neutral-95 px-4 py-4">
            <div className="flex items-center gap-2 text-primary-40">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">Explicacao</span>
            </div>
            <p className="text-sm leading-6 text-neutral-10/74">{skill.currentLesson.explanation}</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
