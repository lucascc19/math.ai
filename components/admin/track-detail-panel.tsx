"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ContentStatus } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Clock3, FolderTree, Plus, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { StatusPill } from "@/components/admin/content-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SimpleMarkdownPreview } from "@/components/ui/simple-markdown-preview";
import { Textarea } from "@/components/ui/textarea";
import { api, type AdminLesson, type AdminTrackDetail, type AdminTrackModule } from "@/lib/api";
import {
  lessonActivityTypeSchema,
  lessonDraftSchema,
  lessonTypeSchema,
  moduleDraftSchema,
  modulePatchSchema,
  trackPatchSchema,
  type LessonActivityDraftInput,
  type LessonDraftInput,
  type ModuleDraftInput,
  type ModulePatchInput,
  type TrackPatchInput
} from "@/lib/schemas";

type Props = { initialTrack: AdminTrackDetail };

export function TrackDetailPanel({ initialTrack }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creatingModule, setCreatingModule] = useState(false);

  const queryKey = ["admin", "track", initialTrack.id] as const;

  const { data: track = initialTrack } = useQuery({
    queryKey,
    queryFn: () => api.admin.getTrack(initialTrack.id).then((r) => r.track),
    initialData: initialTrack
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
  };

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) => api.admin.setTrackPublish(track.id, publish),
    onSuccess: invalidate
  });

  const deleteTrackMutation = useMutation({
    mutationFn: () => api.admin.deleteTrack(track.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
      router.push("/admin/conteudo");
    }
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (orderedIds: string[]) => api.admin.reorderModules(track.id, orderedIds),
    onSuccess: invalidate
  });

  const isPublished = track.status === ContentStatus.PUBLISHED;
  const totalLessons = track.modules.reduce((sum, module) => sum + module.lessons.length, 0);

  function moveModule(index: number, delta: number) {
    const next = [...track.modules];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderModulesMutation.mutate(next.map((module) => module.id));
  }

  return (
    <div className="grid gap-6">
      <Link
        href="/admin/conteudo"
        className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para trilhas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <Badge variant="primary">Trilha</Badge>
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">{track.name}</h1>
          <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
            Slug: {track.slug} - {track.estimatedTime} - {track.modules.length} módulos - {totalLessons} lições
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={track.status} />
          <Button
            variant="secondary"
            onClick={() => publishMutation.mutate(!isPublished)}
            disabled={publishMutation.isPending}
          >
            {isPublished ? "Despublicar trilha" : "Publicar trilha"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (confirm(`Excluir a trilha "${track.name}"?`)) {
                deleteTrackMutation.mutate();
              }
            }}
            disabled={deleteTrackMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <TrackEditForm track={track} onSuccess={invalidate} />

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-lg font-bold text-neutral-10 dark:text-neutral-95">Módulos e lições</h2>
            <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
              Organize a trilha em módulos e associe a cada lição várias atividades avaliativas.
            </span>
          </div>
          <Button onClick={() => setCreatingModule((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            {creatingModule ? "Fechar" : "Novo módulo"}
          </Button>
        </div>

        {creatingModule && (
          <CreateModuleForm
            trackId={track.id}
            nextOrderIndex={track.modules.length}
            onSuccess={() => {
              setCreatingModule(false);
              invalidate();
            }}
          />
        )}

        <div className="grid gap-4">
          {track.modules.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum módulo ainda. Crie o primeiro para começar a estruturar a trilha.
            </p>
          ) : (
            track.modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                allModules={track.modules}
                index={track.modules.findIndex((item) => item.id === module.id)}
                total={track.modules.length}
                onMoveModule={moveModule}
                onChange={invalidate}
                reorderBusy={reorderModulesMutation.isPending}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function TrackEditForm({ track, onSuccess }: { track: AdminTrackDetail; onSuccess: () => void }) {
  const form = useForm<TrackPatchInput>({
    resolver: zodResolver(trackPatchSchema),
    values: {
      slug: track.slug,
      name: track.name,
      description: track.description,
      shortDescription: track.shortDescription || track.description,
      longDescriptionMd: track.longDescriptionMd,
      estimatedTime: track.estimatedTime,
      difficulty: track.difficulty,
      targetAudience: track.targetAudience,
      learningOutcomesMd: track.learningOutcomesMd,
      prerequisiteSummaryMd: track.prerequisiteSummaryMd
    }
  });

  const mutation = useMutation({
    mutationFn: (values: TrackPatchInput) => api.admin.updateTrack(track.id, values),
    onSuccess
  });

  return (
    <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
      <div className="grid gap-1">
        <Badge variant="tertiary">Metadados</Badge>
        <h2 className="text-lg font-bold text-neutral-10 dark:text-neutral-95">Editar dados da trilha</h2>
      </div>

      <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <section className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Slug" {...form.register("slug")} />
          <Input placeholder="Nome" {...form.register("name")} />
          <Input placeholder="Tempo estimado" {...form.register("estimatedTime")} />
          <Input placeholder="Dificuldade (ex: Fundamental II)" {...form.register("difficulty")} />
          <Input placeholder="Público-alvo" {...form.register("targetAudience")} className="md:col-span-2" />
        </section>

        <section className="grid gap-3">
          <Textarea placeholder="Descrição curta" {...form.register("description")} className="min-h-24" />
          <Textarea placeholder="Descrição longa em Markdown" {...form.register("longDescriptionMd")} className="min-h-40" />
          <Textarea
            placeholder="Objetivos de aprendizagem em Markdown"
            {...form.register("learningOutcomesMd")}
            className="min-h-28"
          />
          <Textarea
            placeholder="Pré-requisitos em Markdown"
            {...form.register("prerequisiteSummaryMd")}
            className="min-h-28"
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
          {mutation.error && (
            <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function CreateModuleForm({
  trackId,
  nextOrderIndex,
  onSuccess
}: {
  trackId: string;
  nextOrderIndex: number;
  onSuccess: () => void;
}) {
  const form = useForm<ModuleDraftInput>({
    resolver: zodResolver(moduleDraftSchema),
    defaultValues: {
      skillTrackId: trackId,
      title: "",
      descriptionMd: "",
      estimatedMinutes: undefined,
      orderIndex: nextOrderIndex
    }
  });

  const mutation = useMutation({
    mutationFn: api.admin.createModule,
    onSuccess
  });

  return (
    <Card className="grid gap-3 rounded-2xl border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40">
      <Badge variant="primary">Novo módulo</Badge>
      <form className="grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input placeholder="Título do módulo" {...form.register("title")} className="md:col-span-2" />
        <Input type="number" placeholder="Tempo estimado em minutos" {...form.register("estimatedMinutes")} />
        <Input type="number" placeholder="Ordem" {...form.register("orderIndex")} />
        <Textarea placeholder="Descrição do módulo em Markdown" {...form.register("descriptionMd")} className="md:col-span-2 min-h-28" />
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar módulo"}
          </Button>
          {mutation.error && (
            <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function ModuleCard({
  module,
  allModules,
  index,
  total,
  onMoveModule,
  onChange,
  reorderBusy
}: {
  module: AdminTrackModule;
  allModules: AdminTrackModule[];
  index: number;
  total: number;
  onMoveModule: (index: number, delta: number) => void;
  onChange: () => void;
  reorderBusy: boolean;
}) {
  const [editingModule, setEditingModule] = useState(false);
  const [creatingLesson, setCreatingLesson] = useState(false);

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => api.admin.reorderModuleLessons(module.id, orderedIds),
    onSuccess: onChange
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.deleteModule(module.id),
    onSuccess: onChange
  });

  function moveLesson(index: number, delta: number) {
    const next = [...module.lessons];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((lesson) => lesson.id));
  }

  return (
    <Card className="grid gap-4 rounded-2xl border border-black/6 bg-white/70 p-5 dark:border-white/10 dark:bg-neutral-20/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={index === 0 || reorderBusy}
              onClick={() => onMoveModule(index, -1)}
              className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30"
              aria-label="Subir módulo"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={index === total - 1 || reorderBusy}
              onClick={() => onMoveModule(index, 1)}
              className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30"
              aria-label="Descer módulo"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
            <FolderTree className="h-4 w-4 text-primary-40" />
            <strong className="text-base text-neutral-10 dark:text-neutral-95">{module.title}</strong>
            <StatusPill status={module.status} />
          </div>
          <span className="text-xs text-neutral-10/65 dark:text-neutral-80">
            Ordem {module.orderIndex + 1} - {module.lessons.length} {module.lessons.length === 1 ? "lição" : "lições"}
            {module.estimatedMinutes ? ` - ${module.estimatedMinutes} min` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setCreatingLesson((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            {creatingLesson ? "Fechar lição" : "Nova lição"}
          </Button>
          <Button variant="ghost" onClick={() => setEditingModule((value) => !value)}>
            {editingModule ? "Fechar módulo" : "Editar módulo"}
          </Button>
          <Button
            variant="ghost"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm(`Excluir o módulo "${module.title}"?`)) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {module.descriptionMd ? <SimpleMarkdownPreview content={module.descriptionMd} /> : null}

      {editingModule && (
        <ModuleEditForm
          module={module}
          onSuccess={() => {
            setEditingModule(false);
            onChange();
          }}
        />
      )}

      {creatingLesson && (
        <CreateLessonForm
          module={module}
          nextOrderIndex={module.lessons.length}
          onSuccess={() => {
            setCreatingLesson(false);
            onChange();
          }}
        />
      )}

      <div className="grid gap-3">
        {module.lessons.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-4 text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
            Nenhuma lição neste módulo ainda.
          </p>
        ) : (
          module.lessons.map((lesson, lessonIndex) => (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              allModules={allModules}
              index={lessonIndex}
              total={module.lessons.length}
              onMove={moveLesson}
              onChange={onChange}
              reorderBusy={reorderMutation.isPending}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function ModuleEditForm({ module, onSuccess }: { module: AdminTrackModule; onSuccess: () => void }) {
  const form = useForm<ModulePatchInput>({
    resolver: zodResolver(modulePatchSchema),
    values: {
      skillTrackId: module.skillTrackId,
      title: module.title,
      descriptionMd: module.descriptionMd,
      estimatedMinutes: module.estimatedMinutes ?? undefined,
      orderIndex: module.orderIndex
    }
  });

  const mutation = useMutation({
    mutationFn: (values: ModulePatchInput) => api.admin.updateModule(module.id, values),
    onSuccess
  });

  return (
    <div className="grid gap-3 rounded-[18px] border border-black/10 bg-white/80 p-4 dark:border-white/15 dark:bg-neutral-20/60">
      <form className="grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input placeholder="Título do módulo" {...form.register("title")} className="md:col-span-2" />
        <Input type="number" placeholder="Tempo estimado em minutos" {...form.register("estimatedMinutes")} />
        <Input type="number" placeholder="Ordem" {...form.register("orderIndex")} />
        <Textarea placeholder="Descrição do módulo em Markdown" {...form.register("descriptionMd")} className="md:col-span-2 min-h-28" />
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar módulo"}
          </Button>
          {mutation.error && (
            <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}

function LessonRow({
  lesson,
  allModules,
  index,
  total,
  onMove,
  onChange,
  reorderBusy
}: {
  lesson: AdminLesson;
  allModules: AdminTrackModule[];
  index: number;
  total: number;
  onMove: (index: number, delta: number) => void;
  onChange: () => void;
  reorderBusy: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) => api.admin.setLessonPublish(lesson.id, publish),
    onSuccess: onChange
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.deleteLesson(lesson.id),
    onSuccess: onChange
  });

  const isPublished = lesson.status === ContentStatus.PUBLISHED;
  const busy = publishMutation.isPending || deleteMutation.isPending || reorderBusy;
  const activitySummary =
    lesson.activities.length === 0
      ? "Sem atividades"
      : `${lesson.activities.length} ${lesson.activities.length === 1 ? "atividade" : "atividades"}`;

  return (
    <div className="grid gap-3 rounded-2xl border border-black/5 bg-white/70 p-5 dark:border-white/10 dark:bg-neutral-20/50">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={() => onMove(index, -1)}
            className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
            aria-label="Subir lição"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <span className="text-xs font-bold text-neutral-10/70 dark:text-neutral-80">{index + 1}</span>
          <button
            type="button"
            disabled={index === total - 1 || busy}
            onClick={() => onMove(index, 1)}
            className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
            aria-label="Descer lição"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>

        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate text-sm font-semibold text-neutral-10 dark:text-neutral-95">{lesson.title}</span>
          <span className="truncate text-xs text-neutral-10/65 dark:text-neutral-80">
            {lesson.lessonType} - {lesson.level} - {activitySummary}
          </span>
          {lesson.summary ? (
            <span className="truncate text-xs text-neutral-10/60 dark:text-neutral-80">{lesson.summary}</span>
          ) : null}
        </div>

        <StatusPill status={lesson.status} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => publishMutation.mutate(!isPublished)}
            className="focus-ring inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 hover:border-primary-60/30 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95 dark:hover:border-primary-60/50"
          >
            {isPublished ? "Despublicar" : "Publicar"}
          </button>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="focus-ring inline-flex items-center gap-1 rounded-full bg-primary-60 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-40"
          >
            {editing ? "Fechar" : "Editar"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (confirm(`Excluir a lição "${lesson.title}"?`)) {
                deleteMutation.mutate();
              }
            }}
            className="focus-ring inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 hover:border-tertiary-30/40 hover:text-tertiary-30 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95 dark:hover:border-tertiary-70/50 dark:hover:text-tertiary-70"
          >
            <Trash2 className="h-3 w-3" />
            Excluir
          </button>
        </div>
      </div>

      {editing && (
        <LessonEditForm
          lesson={lesson}
          modules={allModules}
          onSuccess={() => {
            setEditing(false);
            onChange();
          }}
        />
      )}
    </div>
  );
}

function CreateLessonForm({
  module,
  nextOrderIndex,
  onSuccess
}: {
  module: AdminTrackModule;
  nextOrderIndex: number;
  onSuccess: () => void;
}) {
  const form = useForm<LessonDraftInput>({
    resolver: zodResolver(lessonDraftSchema),
    defaultValues: {
      trackModuleId: module.id,
      title: "",
      summary: "",
      contentMd: "",
      instructionMd: "",
      teacherNotesMd: "",
      lessonType: lessonTypeSchema.enum.PRACTICE,
      estimatedMinutes: undefined,
      prompt: "",
      story: "",
      explanation: "",
      answer: 0,
      level: "",
      goal: "",
      tip: "",
      orderIndex: nextOrderIndex,
      activities: [createEmptyActivity(0)]
    }
  });

  const mutation = useMutation({
    mutationFn: api.admin.createLesson,
    onSuccess
  });

  return (
    <Card className="grid gap-3 rounded-2xl border border-secondary-60/20 bg-secondary-95 p-6 shadow-soft dark:border-secondary-60/30 dark:bg-secondary-20/40">
      <Badge variant="secondary">Nova lição</Badge>
      <p className="text-sm leading-6 text-neutral-10/70 dark:text-neutral-80">
        Esta lição será criada dentro do módulo <strong>{module.title}</strong>.
      </p>
      <LessonFormFields form={form} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))} disabled={mutation.isPending}>
          {mutation.isPending ? "Criando..." : "Criar lição"}
        </Button>
        {mutation.error && (
          <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
        )}
      </div>
    </Card>
  );
}

function LessonEditForm({
  lesson,
  modules,
  onSuccess
}: {
  lesson: AdminLesson;
  modules: AdminTrackModule[];
  onSuccess: () => void;
}) {
  const form = useForm<LessonDraftInput>({
    resolver: zodResolver(lessonDraftSchema),
    values: {
      trackModuleId: lesson.trackModuleId,
      title: lesson.title,
      summary: lesson.summary,
      contentMd: lesson.contentMd,
      instructionMd: lesson.instructionMd,
      teacherNotesMd: lesson.teacherNotesMd,
      lessonType: lesson.lessonType,
      estimatedMinutes: lesson.estimatedMinutes ?? undefined,
      prompt: lesson.prompt,
      story: lesson.story,
      explanation: lesson.explanation,
      answer: lesson.answer,
      level: lesson.level,
      goal: lesson.goal,
      tip: lesson.tip,
      orderIndex: lesson.orderIndex,
      activities:
        lesson.activities.length > 0
          ? lesson.activities.map((activity, index) => ({
              type: activity.type,
              instructionMd: activity.instructionMd,
              answerKey: activity.answerKey,
              choiceOptionsText: parseActivityOptionsForForm(activity.optionsJson),
              hintMd: activity.hintMd,
              feedbackCorrectMd: activity.feedbackCorrectMd,
              feedbackIncorrectMd: activity.feedbackIncorrectMd,
              orderIndex: activity.orderIndex ?? index
            }))
          : [createEmptyActivity(0)]
    }
  });

  const mutation = useMutation({
    mutationFn: (values: LessonDraftInput) => api.admin.updateLesson(lesson.id, values),
    onSuccess
  });

  return (
    <div className="grid gap-3 rounded-[18px] border border-black/10 bg-white/80 p-4 dark:border-white/15 dark:bg-neutral-20/60">
      <LessonFormFields form={form} />
      <div className="grid gap-2">
        <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">Módulo</span>
        <select
          className="focus-ring h-12 rounded-2xl border border-black/10 bg-white/90 px-4 text-sm text-neutral-10"
          {...form.register("trackModuleId")}
        >
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar lição"}
        </Button>
        {mutation.error && (
          <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
        )}
      </div>
    </div>
  );
}

function LessonFormFields({ form }: { form: ReturnType<typeof useForm<LessonDraftInput>> }) {
  const contentMd = form.watch("contentMd");
  const instructionMd = form.watch("instructionMd");
  const activities = form.watch("activities");

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "activities"
  });

  function appendActivity() {
    append(createEmptyActivity(fields.length));
  }

  function removeActivity(index: number) {
    if (fields.length === 1) return;
    remove(index);
    const nextActivities = form.getValues("activities") ?? [];
    reindexActivities(nextActivities, form);
  }

  function moveActivity(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= fields.length) return;
    move(index, target);
    const nextActivities = form.getValues("activities") ?? [];
    reindexActivities(nextActivities, form);
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 md:grid-cols-2">
        <Input placeholder="Título" {...form.register("title")} />
        <Input placeholder="Resumo rápido da lição" {...form.register("summary")} />
        <Input placeholder="Nível (ex: Iniciante)" {...form.register("level")} />
        <Input placeholder="Objetivo" {...form.register("goal")} />
        <Input placeholder="Tipo (EXPLANATION, PRACTICE, QUIZ, REVIEW)" {...form.register("lessonType")} />
        <Input type="number" placeholder="Tempo estimado em minutos" {...form.register("estimatedMinutes")} />
      </section>

      <section className="grid gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-10 dark:text-neutral-95">
          <Sparkles className="h-4 w-4 text-primary-40" />
          Conteúdo do aluno
        </div>
        <Textarea placeholder="Teoria, exemplos e explicações em Markdown" {...form.register("contentMd")} className="min-h-40" />
        <Textarea placeholder="Enunciado legado da lição em Markdown" {...form.register("instructionMd")} className="min-h-28" />
        <Textarea placeholder="Notas internas do professor" {...form.register("teacherNotesMd")} className="min-h-28" />
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        <Textarea placeholder="Enunciado curto legado" {...form.register("prompt")} className="min-h-24" />
        <Textarea placeholder="História ou contexto" {...form.register("story")} className="min-h-24" />
        <Textarea placeholder="Explicação da resposta" {...form.register("explanation")} className="min-h-24" />
        <Textarea placeholder="Dica geral" {...form.register("tip")} className="min-h-24" />
        <Input type="number" placeholder="Resposta numérica legada" {...form.register("answer")} />
        <Input type="number" placeholder="Ordem da lição" {...form.register("orderIndex")} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">Atividades da lição</span>
            <p className="text-sm leading-6 text-neutral-10/68 dark:text-neutral-80">
              Adicione, remova e reordene as atividades avaliativas desta lição.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={appendActivity}>
            <Plus className="mr-2 h-4 w-4" />
            Nova atividade
          </Button>
        </div>

        <div className="grid gap-4">
          {fields.map((field, index) => {
            const activityType = activities[index]?.type;
            const activityInstructionMd = activities[index]?.instructionMd;

            return (
              <Card key={field.id} className="grid gap-4 border-black/6 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveActivity(index, -1)}
                      className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30"
                      aria-label="Subir atividade"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === fields.length - 1}
                      onClick={() => moveActivity(index, 1)}
                      className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30"
                      aria-label="Descer atividade"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <Badge variant="primary">Atividade {index + 1}</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeActivity(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    className="focus-ring h-12 rounded-2xl border border-black/10 bg-white/90 px-4 text-sm text-neutral-10"
                    {...form.register(`activities.${index}.type`)}
                  >
                    {lessonActivityTypeSchema.options.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {activityType === lessonActivityTypeSchema.enum.TRUE_FALSE ? (
                    <select
                      className="focus-ring h-12 rounded-2xl border border-black/10 bg-white/90 px-4 text-sm text-neutral-10"
                      {...form.register(`activities.${index}.answerKey`)}
                    >
                      <option value="verdadeiro">Verdadeiro</option>
                      <option value="falso">Falso</option>
                    </select>
                  ) : (
                    <Input
                      placeholder={
                        activityType === lessonActivityTypeSchema.enum.SHORT_TEXT
                          ? "Resposta textual esperada"
                          : "Resposta correta"
                      }
                      {...form.register(`activities.${index}.answerKey`)}
                    />
                  )}
                  <Textarea
                    placeholder="Enunciado da atividade em Markdown"
                    {...form.register(`activities.${index}.instructionMd`)}
                    className="md:col-span-2 min-h-28"
                  />
                  <Textarea
                    placeholder="Dica da atividade"
                    {...form.register(`activities.${index}.hintMd`)}
                    className="min-h-24"
                  />
                  <Textarea
                    placeholder="Feedback quando acertar"
                    {...form.register(`activities.${index}.feedbackCorrectMd`)}
                    className="min-h-24"
                  />
                  <Textarea
                    placeholder="Feedback quando errar"
                    {...form.register(`activities.${index}.feedbackIncorrectMd`)}
                    className="min-h-24"
                  />
                  <Input type="number" placeholder="Ordem da atividade" {...form.register(`activities.${index}.orderIndex`)} />
                  {activityType === lessonActivityTypeSchema.enum.MULTIPLE_CHOICE ? (
                    <Textarea
                      placeholder="Opções da múltipla escolha, uma por linha"
                      {...form.register(`activities.${index}.choiceOptionsText`)}
                      className="md:col-span-2 min-h-28"
                    />
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-10 dark:text-neutral-95">
                    <Clock3 className="h-4 w-4 text-primary-40" />
                    Preview da atividade
                  </div>
                  <SimpleMarkdownPreview
                    content={activityInstructionMd || instructionMd}
                    emptyMessage="O enunciado em Markdown vai aparecer aqui."
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-10 dark:text-neutral-95">
            <Clock3 className="h-4 w-4 text-primary-40" />
            Preview do conteúdo
          </div>
          <SimpleMarkdownPreview content={contentMd} emptyMessage="O conteúdo em Markdown vai aparecer aqui." />
        </div>
        <div className="grid gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-10 dark:text-neutral-95">
            <Clock3 className="h-4 w-4 text-primary-40" />
            Preview legado da lição
          </div>
          <SimpleMarkdownPreview content={instructionMd} emptyMessage="O enunciado legado vai aparecer aqui." />
        </div>
      </section>
    </div>
  );
}

function createEmptyActivity(orderIndex: number): LessonActivityDraftInput {
  return {
    type: lessonActivityTypeSchema.enum.NUMERIC,
    instructionMd: "",
    answerKey: "",
    choiceOptionsText: "",
    hintMd: "",
    feedbackCorrectMd: "",
    feedbackIncorrectMd: "",
    orderIndex
  };
}

function parseActivityOptionsForForm(optionsJson?: string) {
  if (!optionsJson) return "";

  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").join("\n") : "";
  } catch {
    return "";
  }
}

function reindexActivities(
  activities: LessonActivityDraftInput[],
  form: ReturnType<typeof useForm<LessonDraftInput>>
) {
  activities.forEach((_, index) => {
    form.setValue(`activities.${index}.orderIndex`, index, { shouldDirty: true });
  });
}
