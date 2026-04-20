"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContentStatus } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type AdminLesson, type AdminTrackDetail } from "@/lib/api";
import {
  lessonDraftSchema,
  trackPatchSchema,
  type LessonDraftInput,
  type TrackPatchInput
} from "@/lib/schemas";
import { StatusPill } from "@/components/admin/content-panel";

type Props = { initialTrack: AdminTrackDetail };

export function TrackDetailPanel({ initialTrack }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creatingLesson, setCreatingLesson] = useState(false);

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

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => api.admin.reorderLessons(track.id, orderedIds),
    onSuccess: invalidate
  });

  const isPublished = track.status === ContentStatus.PUBLISHED;

  function moveLesson(index: number, delta: number) {
    const next = [...track.lessons];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMutation.mutate(next.map((l) => l.id));
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
            Slug: {track.slug} · {track.estimatedTime}
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
            <h2 className="text-lg font-bold text-neutral-10 dark:text-neutral-95">Lições</h2>
            <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
              {track.lessons.length} {track.lessons.length === 1 ? "lição" : "lições"} · ordem define a sequência para os alunos
            </span>
          </div>
          <Button onClick={() => setCreatingLesson((v) => !v)}>
            <Plus className="mr-2 h-4 w-4" />
            {creatingLesson ? "Fechar" : "Nova lição"}
          </Button>
        </div>

        {creatingLesson && (
          <CreateLessonForm
            trackId={track.id}
            nextOrderIndex={track.lessons.length}
            onSuccess={() => {
              setCreatingLesson(false);
              invalidate();
            }}
          />
        )}

        <div className="grid gap-3">
          {track.lessons.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhuma lição ainda. Adicione a primeira com o botão acima.
            </p>
          ) : (
            track.lessons.map((lesson, index) => (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                index={index}
                total={track.lessons.length}
                onMove={moveLesson}
                onChange={invalidate}
                reorderBusy={reorderMutation.isPending}
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
      estimatedTime: track.estimatedTime
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
      <form className="grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <Input placeholder="Slug" {...form.register("slug")} />
        <Input placeholder="Nome" {...form.register("name")} />
        <Input placeholder="Tempo estimado" {...form.register("estimatedTime")} />
        <Input placeholder="Descrição" {...form.register("description")} />
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
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

function LessonRow({
  lesson,
  index,
  total,
  onMove,
  onChange,
  reorderBusy
}: {
  lesson: AdminLesson;
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
            {lesson.level} · {lesson.goal} · Resposta: {lesson.answer}
          </span>
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
            onClick={() => setEditing((v) => !v)}
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
  trackId,
  nextOrderIndex,
  onSuccess
}: {
  trackId: string;
  nextOrderIndex: number;
  onSuccess: () => void;
}) {
  const form = useForm<LessonDraftInput>({
    resolver: zodResolver(lessonDraftSchema),
    defaultValues: {
      skillTrackId: trackId,
      title: "",
      prompt: "",
      story: "",
      explanation: "",
      answer: 0,
      level: "",
      goal: "",
      tip: "",
      orderIndex: nextOrderIndex
    }
  });

  const mutation = useMutation({
    mutationFn: api.admin.createLesson,
    onSuccess: () => {
      form.reset({
        skillTrackId: trackId,
        title: "",
        prompt: "",
        story: "",
        explanation: "",
        answer: 0,
        level: "",
        goal: "",
        tip: "",
        orderIndex: nextOrderIndex
      });
      onSuccess();
    }
  });

  return (
    <Card className="grid gap-3 rounded-2xl border border-secondary-60/20 bg-secondary-95 p-6 shadow-soft dark:border-secondary-60/30 dark:bg-secondary-20/40">
      <Badge variant="secondary">Nova lição (rascunho)</Badge>
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

function LessonEditForm({ lesson, onSuccess }: { lesson: AdminLesson; onSuccess: () => void }) {
  const form = useForm<LessonDraftInput>({
    resolver: zodResolver(lessonDraftSchema),
    values: {
      skillTrackId: lesson.skillTrackId,
      title: lesson.title,
      prompt: lesson.prompt,
      story: lesson.story,
      explanation: lesson.explanation,
      answer: lesson.answer,
      level: lesson.level,
      goal: lesson.goal,
      tip: lesson.tip,
      orderIndex: lesson.orderIndex
    }
  });

  const mutation = useMutation({
    mutationFn: (values: LessonDraftInput) => api.admin.updateLesson(lesson.id, values),
    onSuccess
  });

  return (
    <div className="grid gap-3 rounded-[18px] border border-black/10 bg-white/80 p-4 dark:border-white/15 dark:bg-neutral-20/60">
      <LessonFormFields form={form} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={form.handleSubmit((values) => mutation.mutate(values))} disabled={mutation.isPending}>
          {mutation.isPending ? "Salvando..." : "Salvar alterações"}
        </Button>
        {mutation.error && (
          <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
        )}
      </div>
    </div>
  );
}

function LessonFormFields({ form }: { form: ReturnType<typeof useForm<LessonDraftInput>> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Input placeholder="Título" {...form.register("title")} />
      <Input placeholder="Enunciado curto (prompt)" {...form.register("prompt")} />
      <Input placeholder="História/contexto" {...form.register("story")} />
      <Input placeholder="Explicação da resposta" {...form.register("explanation")} />
      <Input type="number" placeholder="Resposta (número inteiro)" {...form.register("answer")} />
      <Input placeholder="Nível (ex: Iniciante)" {...form.register("level")} />
      <Input placeholder="Objetivo" {...form.register("goal")} />
      <Input placeholder="Dica" {...form.register("tip")} />
      <Input type="number" placeholder="Ordem" {...form.register("orderIndex")} />
    </div>
  );
}
