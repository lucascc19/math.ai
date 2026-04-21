"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronRight, Clock3, Target } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SimpleMarkdownPreview } from "@/components/ui/simple-markdown-preview";
import { api, type DashboardResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

type TrackTab = "overview" | "content";
type SkillCard = DashboardResponse["skills"][number];
type ModuleCard = SkillCard["modules"][number];

export function StudentTrackDetail({ skillId }: { skillId: string }) {
  const { setDashboard, setActiveSkillId, dashboard } = useAppStore();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "content" ? "content" : "overview";
  const [activeTab, setActiveTab] = useState<TrackTab>(initialTab);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
  });

  useEffect(() => {
    if (dashboardQuery.data) {
      setDashboard(dashboardQuery.data);
    }
  }, [dashboardQuery.data, setDashboard]);

  const skill = useMemo<SkillCard | undefined>(
    () => dashboard?.skills.find((item: SkillCard) => item.id === skillId),
    [dashboard?.skills, skillId],
  );

  useEffect(() => {
    if (skill) {
      setActiveSkillId(skill.id);
    }
  }, [setActiveSkillId, skill]);

  if (dashboardQuery.isLoading || !dashboard) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-black/5 bg-white/70" />
    );
  }

  if (!skill) {
    notFound();
  }

  const totalLessons = skill.modules.reduce((sum: number, module: ModuleCard) => sum + module.lessons.length, 0);
  const completedLessons = Math.min(skill.progress.lessonIndex, totalLessons);

  return (
    <div className="grid gap-6">
      <Link
        href="/aluno/trilhas"
        className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para trilhas
      </Link>

      <section className="grid gap-2">
        <Badge variant="primary" className="w-fit">
          Trilha
        </Badge>
        <h1 className="max-w-4xl text-3xl font-bold leading-tight text-neutral-10 md:text-4xl">
          {skill.name}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-neutral-10/74">
          {skill.description}
        </p>
      </section>

      <TrackTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <OverviewTab
          skill={skill}
          totalLessons={totalLessons}
          completedLessons={completedLessons}
          onOpenContent={() => setActiveTab("content")}
        />
      ) : (
        <ContentTab skill={skill} />
      )}
    </div>
  );
}

function TrackTabs({
  activeTab,
  onChange,
}: {
  activeTab: TrackTab;
  onChange: (tab: TrackTab) => void;
}) {
  return (
    <div className="border-b border-black/8">
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === "overview"}
          label="Visão geral"
          onClick={() => onChange("overview")}
        />
        <TabButton
          active={activeTab === "content"}
          label="Conteúdos"
          onClick={() => onChange("content")}
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "focus-ring -mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition",
        active
          ? "border-primary-60 text-primary-40"
          : "border-transparent text-neutral-10/58 hover:text-neutral-10",
      )}
    >
      <BookOpen className="h-4 w-4" />
      {label}
    </button>
  );
}

function OverviewTab({
  skill,
  totalLessons,
  completedLessons,
  onOpenContent,
}: {
  skill: SkillCard;
  totalLessons: number;
  completedLessons: number;
  onOpenContent: () => void;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
      <SimpleMarkdownPreview
        content={skill.longDescriptionMd || skill.description}
        emptyMessage="A descrição detalhada desta trilha ainda não foi preenchida."
      />

      <div className="grid gap-4">
        <Card className="grid gap-5 bg-white/88">
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-10">Progresso geral</span>
            <Progress
              value={skill.progress.mastery}
              label={`${skill.progress.mastery}% de domínio atual`}
            />
          </div>
          <div className="grid gap-2 text-sm text-neutral-10/72">
            <MetricRow label="Lições concluídas" value={`${completedLessons}/${totalLessons}`} />
            <MetricRow label="Tentativas" value={String(skill.progress.attempts)} />
            <MetricRow label="Módulo atual" value={skill.currentLesson.moduleTitle} />
          </div>
          <Button type="button" variant="secondary" onClick={onOpenContent}>
            Acessar conteúdos
          </Button>
        </Card>

        <Card className="grid gap-5 bg-white/88">
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoItem icon={<Clock3 className="h-4 w-4 text-primary-40" />} label="Tempo estimado">
              {skill.estimatedTime}
            </InfoItem>
            <InfoItem icon={<Target className="h-4 w-4 text-primary-40" />} label="Nível">
              {skill.difficulty || "Não definido"}
            </InfoItem>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-10">Público</span>
            <p className="text-sm leading-6 text-neutral-10/68">
              {skill.targetAudience || "Público-alvo ainda não definido."}
            </p>
          </div>

          <DisclosureSection
            title="Objetivos"
            content={skill.learningOutcomesMd}
            emptyMessage="Os objetivos desta trilha ainda não foram definidos."
          />
          <DisclosureSection
            title="Pré-requisitos"
            content={skill.prerequisiteSummaryMd}
            emptyMessage="Nenhum pre-requisito informado até o momento."
          />
        </Card>
      </div>
    </section>
  );
}

function ContentTab({ skill }: { skill: SkillCard }) {
  return (
    <section className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
      {skill.modules.map((module: ModuleCard, index: number) => {
        const isCurrentModule = module.id === skill.currentLesson.moduleId;

        return (
          <Link
            key={module.id}
            href={`/aluno/trilhas/${skill.id}/modulos/${module.id}` as Route}
            className={cn(
              "focus-ring grid h-fit gap-4 rounded-2xl border bg-white/88 p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-primary-60/30",
              isCurrentModule ? "border-primary-60/30" : "border-black/5",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-10/55">
                  Módulo {index + 1}
                </span>
                <strong className="text-2xl text-neutral-10">{module.title}</strong>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-10/58">
                <span>{module.lessons.length} {module.lessons.length === 1 ? "lição" : "lições"}</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {module.descriptionMd ? (
              <SimpleMarkdownPreview content={module.descriptionMd} />
            ) : (
              <p className="text-sm leading-6 text-neutral-10/60">
                Abra este módulo para visualizar suas lições e atividades.
              </p>
            )}

            {isCurrentModule ? (
              <Badge variant="primary" className="w-fit">
                Módulo atual
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </section>
  );
}

function DisclosureSection({
  title,
  content,
  emptyMessage,
}: {
  title: string;
  content: string;
  emptyMessage: string;
}) {
  return (
    <details className="group rounded-2xl border border-black/6 bg-neutral-95 px-4 py-3">
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-neutral-10">
        {title}
        <ChevronRight className="h-4 w-4 text-neutral-10/45 transition group-open:rotate-90" />
      </summary>
      <div className="mt-3 border-t border-black/6 pt-3">
        {content ? (
          <SimpleMarkdownPreview content={content} />
        ) : (
          <p className="text-sm leading-6 text-neutral-10/60">{emptyMessage}</p>
        )}
      </div>
    </details>
  );
}

function InfoItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-neutral-10">{label}</span>
      </div>
      <strong className="text-lg text-neutral-10">{children}</strong>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <strong className="text-right text-neutral-10">{value}</strong>
    </div>
  );
}
