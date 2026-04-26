"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronRight, Clock3, PlayCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SimpleMarkdownPreview } from "@/components/ui/simple-markdown-preview";
import { api, type DashboardResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

type SkillCard = DashboardResponse["skills"][number];
type ModuleCard = SkillCard["modules"][number];
type LessonCard = ModuleCard["lessons"][number];
type StudentLessonBlock = {
  id: string;
  type: "THEORY" | "EXAMPLE" | "VISUAL" | "PRACTICE_INTRO" | "SUMMARY";
  title: string;
  contentMd: string;
  orderIndex: number;
};
type SelectedLesson = LessonCard & {
  moduleId: string;
  moduleTitle: string;
  blocks: StudentLessonBlock[];
};
type StudyMode = "guided" | "theory" | "practice" | "review";

const STUDY_MODES: Array<{
  id: StudyMode;
  label: string;
  description: string;
}> = [
  {
    id: "guided",
    label: "Guiado",
    description: "Conteudo e atividade em sequencia."
  },
  {
    id: "theory",
    label: "Teoria",
    description: "Explicacao antes da pratica."
  },
  {
    id: "practice",
    label: "Pratica",
    description: "Atividade com apoio rapido."
  },
  {
    id: "review",
    label: "Revisao",
    description: "Resumo, objetivo e checkpoint."
  }
];

function getLessonBlockContent(lesson: SelectedLesson, types: StudentLessonBlock["type"][]) {
  return lesson.blocks
    .filter((block: StudentLessonBlock) => types.includes(block.type) && block.contentMd.trim().length > 0)
    .sort((a: StudentLessonBlock, b: StudentLessonBlock) => a.orderIndex - b.orderIndex)
    .map((block: StudentLessonBlock) => `## ${block.title || block.type}\n\n${block.contentMd}`)
    .join("\n\n");
}

export function StudentModuleDetail({ skillId, moduleId }: { skillId: string; moduleId: string }) {
  const queryClient = useQueryClient();
  const { setDashboard, setActiveSkillId, dashboard } = useAppStore();
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("guided");
  const [pendingAnswer, setPendingAnswer] = useState("");
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null>(null);

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
    () => dashboard?.skills.find((item: SkillCard) => item.id === skillId),
    [dashboard?.skills, skillId]
  );

  const module = useMemo<ModuleCard | undefined>(
    () => skill?.modules.find((item: ModuleCard) => item.id === moduleId),
    [skill?.modules, moduleId]
  );

  useEffect(() => {
    if (skill) {
      setActiveSkillId(skill.id);
    }
  }, [setActiveSkillId, skill]);

  const lessons = useMemo<SelectedLesson[]>(
    () =>
      module?.lessons.map((lesson: LessonCard) => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title
      })) ?? [],
    [module]
  );

  useEffect(() => {
    if (!skill || !module) return;
    const currentLessonInModule = module.lessons.find((lesson: LessonCard) => lesson.id === skill.currentLesson.id);
    setSelectedLessonId((current) => current ?? currentLessonInModule?.id ?? module.lessons[0]?.id ?? null);
  }, [skill, module]);

  const selectedLesson =
    lessons.find((lesson) => lesson.id === selectedLessonId) ??
    lessons.find((lesson) => lesson.isCurrent) ??
    lessons[0];

  useEffect(() => {
    setPendingAnswer("");
    setLastResult(null);
  }, [selectedLesson?.id]);

  const submitMutation = useMutation({
    mutationFn: (answer: string) =>
      api.submitAnswer({
        skillId,
        lessonId: selectedLesson!.id,
        activityId: selectedLesson!.activity!.id,
        answer
      }),
    onSuccess: async (response) => {
      setLastResult(response.result);
      setPendingAnswer("");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  if (dashboardQuery.isLoading || !dashboard) {
    return <div className="h-64 animate-pulse rounded-2xl border border-black/5 bg-white/70" />;
  }

  if (!skill || !module) {
    notFound();
  }

  const allLessons = skill.modules.flatMap((item: ModuleCard) => item.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = Math.min(skill.progress.lessonIndex, totalLessons);
  const currentActivity = selectedLesson?.activity ?? null;

  return (
    <div className="grid gap-6">
      <Link
        href={`/aluno/trilhas/${skill.id}?tab=content` as Route}
        className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para trilha
      </Link>

      <section className="grid gap-2">
        <Badge variant="primary" className="w-fit">
          Módulo
        </Badge>
        <h1 className="max-w-4xl text-3xl font-bold leading-tight text-neutral-10 md:text-4xl">{module.title}</h1>
        {module.descriptionMd ? (
          <SimpleMarkdownPreview content={module.descriptionMd} />
        ) : (
          <p className="max-w-3xl text-sm leading-7 text-neutral-10/74">
            Escolha uma lição para abrir o conteúdo e responder à atividade.
          </p>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Card className="grid gap-4 bg-white/88">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-10/55">
                Conteúdo do módulo
              </span>
              <strong className="text-2xl text-neutral-10">{module.title}</strong>
            </div>
            <span className="text-sm text-neutral-10/58">
              {module.lessons.length} {module.lessons.length === 1 ? "lição" : "lições"}
            </span>
          </div>

          <div className="grid gap-3">
            {lessons.map((lesson: SelectedLesson) => {
              const isSelected = lesson.id === selectedLesson?.id;
              const isCurrent = lesson.isCurrent;
              const globalIndex = allLessons.findIndex((item: LessonCard) => item.id === lesson.id);
              const isCompleted = globalIndex > -1 && globalIndex < skill.progress.lessonIndex;

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={cn(
                    "focus-ring grid gap-2 rounded-2xl border px-4 py-4 text-left transition",
                    isSelected
                      ? "border-primary-60/30 bg-primary-95"
                      : "border-black/6 bg-neutral-95 hover:border-primary-60/30 hover:bg-white"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{lesson.lessonType}</Badge>
                    {lesson.activity ? <Badge variant="tertiary">{lesson.activity.type}</Badge> : null}
                    {isCurrent ? <Badge variant="primary">Atual</Badge> : null}
                    {isCompleted ? <Badge variant="secondary">Concluida</Badge> : null}
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <strong className="text-base text-neutral-10">{lesson.title}</strong>
                      {lesson.summary ? <p className="text-sm leading-6 text-neutral-10/68">{lesson.summary}</p> : null}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-neutral-10/45" />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedLesson ? (
            <LessonDetail
              selectedLesson={selectedLesson}
              currentActivity={currentActivity}
              studyMode={studyMode}
              onStudyModeChange={setStudyMode}
              pendingAnswer={pendingAnswer}
              setPendingAnswer={setPendingAnswer}
              lastResult={lastResult}
              onSubmitAnswer={(answer) => submitMutation.mutate(answer)}
              isSubmitting={submitMutation.isPending}
              submitError={submitMutation.error}
            />
          ) : null}
        </Card>

        <Card className="grid gap-5 bg-white/88">
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-10">Progresso detalhado</span>
            <Progress value={skill.progress.mastery} label={`${skill.progress.mastery}% de domínio atual`} />
          </div>

          <div className="grid gap-3 text-sm text-neutral-10/72">
            <MetricRow label="Aulas" value={`${completedLessons}/${totalLessons}`} />
            <MetricRow label="Quizzes avaliativos" value={String(skill.progress.attempts)} />
            <MetricRow label="Acertos" value={String(skill.progress.correct)} />
          </div>

          <Button
            type="button"
            onClick={() => setSelectedLessonId(skill.currentLesson.id)}
            disabled={!module.lessons.some((lesson: LessonCard) => lesson.id === skill.currentLesson.id)}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Continuar módulo
          </Button>

          <div className="grid gap-3 border-t border-black/8 pt-4">
            <span className="text-sm font-semibold text-neutral-10">Lição atual</span>
            <div className="grid gap-1 rounded-2xl border border-black/6 bg-neutral-95 px-4 py-4">
              <strong className="text-sm text-neutral-10">{skill.currentLesson.title}</strong>
              <span className="text-xs text-neutral-10/62">{skill.currentLesson.moduleTitle}</span>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

function LessonDetail({
  selectedLesson,
  currentActivity,
  studyMode,
  onStudyModeChange,
  pendingAnswer,
  setPendingAnswer,
  lastResult,
  onSubmitAnswer,
  isSubmitting,
  submitError
}: {
  selectedLesson: SelectedLesson;
  currentActivity: SelectedLesson["activity"] | null;
  studyMode: StudyMode;
  onStudyModeChange: (mode: StudyMode) => void;
  pendingAnswer: string;
  setPendingAnswer: (value: string) => void;
  lastResult: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
  } | null;
  onSubmitAnswer: (answer: string) => void;
  isSubmitting: boolean;
  submitError: Error | null;
}) {
  const showTheory = studyMode === "guided" || studyMode === "theory";
  const showPractice = studyMode === "guided" || studyMode === "practice";
  const showReview = studyMode === "review";
  const contentGridClass = studyMode === "guided" ? "grid gap-4 xl:grid-cols-2" : "grid gap-4";
  const theoryContent =
    getLessonBlockContent(selectedLesson, ["THEORY", "EXAMPLE", "VISUAL"]) ||
    selectedLesson.contentMd ||
    selectedLesson.explanation;
  const practiceIntroContent =
    getLessonBlockContent(selectedLesson, ["PRACTICE_INTRO"]) ||
    currentActivity?.instructionMd ||
    selectedLesson.instructionMd ||
    selectedLesson.prompt;
  const reviewContent =
    getLessonBlockContent(selectedLesson, ["SUMMARY", "PRACTICE_INTRO"]) ||
    selectedLesson.instructionMd ||
    selectedLesson.contentMd ||
    selectedLesson.explanation;

  return (
    <div className="grid gap-5 rounded-2xl border border-primary-60/20 bg-white/75 p-4 md:p-5">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">{selectedLesson.moduleTitle}</Badge>
          <Badge variant="secondary">{selectedLesson.lessonType}</Badge>
          {selectedLesson.level ? <Badge variant="tertiary">{selectedLesson.level}</Badge> : null}
          {selectedLesson.goal ? <Badge variant="primary">{selectedLesson.goal}</Badge> : null}
          {selectedLesson.estimatedMinutes ? (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-10/60">
              <Clock3 className="h-3 w-3" />
              {selectedLesson.estimatedMinutes} min
            </span>
          ) : null}
        </div>
        <div className="grid gap-2">
          <h2 className="text-2xl font-bold text-neutral-10">{selectedLesson.title}</h2>
          {selectedLesson.summary ? (
            <p className="text-sm leading-7 text-neutral-10/72">{selectedLesson.summary}</p>
          ) : null}
          {selectedLesson.story ? <p className="text-sm leading-7 text-neutral-10/72">{selectedLesson.story}</p> : null}
        </div>
      </div>

      <StudyModeSelector activeMode={studyMode} onChange={onStudyModeChange} />

      {showReview ? (
        <Card className="grid gap-3 border-black/6 bg-neutral-95">
          <span className="text-sm font-semibold text-neutral-10">Resumo de revisao</span>
          {selectedLesson.summary ? (
            <p className="text-sm leading-7 text-neutral-10/72">{selectedLesson.summary}</p>
          ) : null}
          {selectedLesson.goal ? (
            <p className="text-sm leading-7 text-neutral-10/72">Objetivo: {selectedLesson.goal}</p>
          ) : null}
          <SimpleMarkdownPreview
            content={reviewContent}
            emptyMessage="Esta licao ainda nao possui resumo de revisao."
          />
        </Card>
      ) : null}

      <div className={contentGridClass}>
        {showTheory ? (
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-10">Explicação</span>
            <Card className="grid gap-3 border-black/6 bg-neutral-95">
              <SimpleMarkdownPreview
                content={theoryContent}
                emptyMessage="O conteúdo desta lição ainda não foi preenchido."
              />
            </Card>
          </div>
        ) : null}

        {studyMode === "practice" ? (
          <Card className="grid gap-3 border-black/6 bg-neutral-95">
            <span className="text-sm font-semibold text-neutral-10">Apoio rapido</span>
            {selectedLesson.summary ? (
              <p className="text-sm leading-7 text-neutral-10/72">{selectedLesson.summary}</p>
            ) : null}
            {selectedLesson.goal ? (
              <p className="text-sm leading-7 text-neutral-10/72">Objetivo: {selectedLesson.goal}</p>
            ) : null}
            {selectedLesson.tip ? (
              <p className="text-sm leading-7 text-neutral-10/72">Dica: {selectedLesson.tip}</p>
            ) : null}
          </Card>
        ) : null}

        {showPractice || showReview ? (
          <div className="grid gap-2">
            <span className="text-sm font-semibold text-neutral-10">Atividade</span>
            <Card className="grid gap-4 border-black/6 bg-neutral-95">
              <SimpleMarkdownPreview
                content={practiceIntroContent}
                emptyMessage="A atividade desta lição ainda não foi preenchida."
              />

              {currentActivity ? (
                <div className="grid gap-3">
                  {currentActivity.type === "MULTIPLE_CHOICE" ? (
                    <div className="grid gap-2">
                      {currentActivity.options.map((option: string) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPendingAnswer(option)}
                          className={cn(
                            "focus-ring rounded-2xl border px-4 py-3 text-left text-sm transition",
                            pendingAnswer === option
                              ? "border-primary-60/30 bg-primary-95"
                              : "border-black/8 bg-white hover:border-primary-60/30"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : currentActivity.type === "TRUE_FALSE" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {["Verdadeiro", "Falso"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setPendingAnswer(option.toLowerCase())}
                          className={cn(
                            "focus-ring rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition",
                            pendingAnswer === option.toLowerCase()
                              ? "border-primary-60/30 bg-primary-95"
                              : "border-black/8 bg-white hover:border-primary-60/30"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Input
                      placeholder={
                        currentActivity.type === "NUMERIC"
                          ? "Digite sua resposta numérica"
                          : "Digite sua resposta em texto"
                      }
                      value={pendingAnswer}
                      onChange={(event) => setPendingAnswer(event.target.value)}
                    />
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => onSubmitAnswer(pendingAnswer)}
                      disabled={isSubmitting || pendingAnswer.trim().length === 0}
                    >
                      {isSubmitting ? "Enviando..." : "Responder atividade"}
                    </Button>
                    {currentActivity.hintMd ? (
                      <span className="text-xs leading-6 text-neutral-10/60">Dica disponível abaixo.</span>
                    ) : null}
                  </div>

                  {currentActivity.hintMd ? (
                    <Card className="grid gap-2 border-black/6 bg-white">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-10/55">Dica</span>
                      <SimpleMarkdownPreview content={currentActivity.hintMd} />
                    </Card>
                  ) : null}

                  {lastResult ? (
                    <Card
                      className={cn(
                        "grid gap-2 border",
                        lastResult.isCorrect
                          ? "border-secondary-60/30 bg-secondary-95"
                          : "border-tertiary-30/25 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-neutral-10" />
                        <strong className="text-sm text-neutral-10">
                          {lastResult.isCorrect ? "Resposta correta" : "Resposta incorreta"}
                        </strong>
                      </div>
                      {!lastResult.isCorrect ? (
                        <p className="text-sm text-neutral-10/72">Resposta esperada: {lastResult.correctAnswer}</p>
                      ) : null}
                      {lastResult.explanation ? <SimpleMarkdownPreview content={lastResult.explanation} /> : null}
                    </Card>
                  ) : null}

                  {submitError ? <p className="text-sm text-tertiary-30">{submitError.message}</p> : null}
                </div>
              ) : (
                <p className="text-sm leading-6 text-neutral-10/60">
                  Esta lição ainda não possui atividade configurada.
                </p>
              )}
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StudyModeSelector({ activeMode, onChange }: { activeMode: StudyMode; onChange: (mode: StudyMode) => void }) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-neutral-10">Modo de estudo</span>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Modo de estudo da licao">
        {STUDY_MODES.map((mode) => {
          const isActive = activeMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(mode.id)}
              className={cn(
                "focus-ring grid gap-1 rounded-2xl border px-4 py-3 text-left transition",
                isActive
                  ? "border-primary-60/30 bg-primary-95 text-primary-20"
                  : "border-black/8 bg-white text-neutral-10 hover:border-primary-60/30"
              )}
            >
              <span className="text-sm font-bold">{mode.label}</span>
              <span className="text-xs leading-5 opacity-75">{mode.description}</span>
            </button>
          );
        })}
      </div>
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
