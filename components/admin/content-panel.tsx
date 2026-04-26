"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ContentStatus } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type AdminTrack } from "@/lib/api";
import { trackDraftSchema, type TrackDraftInput } from "@/lib/schemas";

export function ContentPanel({ initialTracks }: { initialTracks: AdminTrack[] }) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const { data: tracks = initialTracks } = useQuery({
    queryKey: ["admin", "tracks"],
    queryFn: () => api.admin.listTracks().then((r) => r.tracks),
    initialData: initialTracks
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">Trilhas e lições</h1>
          <p className="max-w-2xl text-sm leading-7 text-neutral-10/70 dark:text-neutral-80">
            Crie trilhas em rascunho, descreva melhor o percurso pedagógico e publique quando o conteúdo estiver pronto.
          </p>
        </div>
        <Button onClick={() => setCreating((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Fechar" : "Nova trilha"}
        </Button>
      </div>

      {creating && (
        <CreateTrackForm
          onSuccess={() => {
            setCreating(false);
            queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] });
          }}
        />
      )}

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-neutral-10/65 dark:text-neutral-80">
            {tracks.length} {tracks.length === 1 ? "trilha" : "trilhas"}
          </span>
        </div>

        <div className="grid gap-3">
          {tracks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhuma trilha cadastrada. Crie a primeira com o botão acima.
            </p>
          ) : (
            tracks.map((track) => <TrackRow key={track.id} track={track} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function TrackRow({ track }: { track: AdminTrack }) {
  const queryClient = useQueryClient();
  const published = track.lessons.filter((lesson) => lesson.status === ContentStatus.PUBLISHED).length;

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) => api.admin.setTrackPublish(track.id, publish),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] })
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.admin.deleteTrack(track.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tracks"] })
  });

  const isPublished = track.status === ContentStatus.PUBLISHED;
  const busy = publishMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/50">
      <BookOpen className="h-5 w-5 text-primary-40 dark:text-primary-70" />
      <div className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm font-semibold text-neutral-10 dark:text-neutral-95">{track.name}</span>
        <span className="truncate text-xs text-neutral-10/65 dark:text-neutral-80">
          {track.slug} · {track.estimatedTime} · {track.lessons.length} lições ({published} publicadas)
        </span>
        <span className="truncate text-xs text-neutral-10/60 dark:text-neutral-80">{track.description}</span>
      </div>
      <StatusPill status={track.status} />
      <DropdownMenu>
        <DropdownMenuTrigger className="focus-ring inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-10 hover:border-black/20 disabled:opacity-50 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-90">
          <MoreHorizontal className="h-3.5 w-3.5" />
          Ações
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={busy}
            onClick={() => publishMutation.mutate(!isPublished)}
            className="text-primary-40 hover:bg-primary-95 dark:text-primary-70 dark:hover:bg-primary-20/30"
          >
            <FileText className="h-3.5 w-3.5" />
            {isPublished ? "Despublicar" : "Publicar"}
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="text-primary-40 hover:bg-primary-95 dark:text-primary-70 dark:hover:bg-primary-20/30"
          >
            <Link href={`/admin/conteudo/${track.id}`}>
              <ArrowRight className="h-3.5 w-3.5" />
              Editar trilha
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={busy}
            onClick={() => {
              if (confirm(`Excluir a trilha "${track.name}"? Todas as lições também serão removidas.`)) {
                deleteMutation.mutate();
              }
            }}
            className="text-tertiary-40 hover:bg-tertiary-95 dark:text-tertiary-70 dark:hover:bg-tertiary-20/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir trilha
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {(publishMutation.error || deleteMutation.error) && (
        <p className="w-full text-xs text-tertiary-30 dark:text-tertiary-70">
          {(publishMutation.error ?? deleteMutation.error)?.message}
        </p>
      )}
    </div>
  );
}

export function StatusPill({ status }: { status: ContentStatus }) {
  if (status === ContentStatus.PUBLISHED) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary-95 px-2.5 py-1 text-xs font-bold text-secondary-40 dark:bg-secondary-20/40 dark:text-secondary-80">
        Publicado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-90 px-2.5 py-1 text-xs font-bold text-neutral-30 dark:bg-neutral-20/60 dark:text-neutral-70">
      <FileText className="h-3 w-3" />
      Rascunho
    </span>
  );
}

function CreateTrackForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<TrackDraftInput>({
    resolver: zodResolver(trackDraftSchema),
    defaultValues: {
      slug: "",
      name: "",
      description: "",
      shortDescription: "",
      longDescriptionMd: "",
      estimatedTime: "",
      difficulty: "",
      targetAudience: "",
      learningOutcomesMd: "",
      prerequisiteSummaryMd: ""
    }
  });

  const mutation = useMutation({
    mutationFn: api.admin.createTrack,
    onSuccess: () => {
      form.reset();
      onSuccess();
    }
  });

  return (
    <Card className="grid gap-4 rounded-2xl border border-primary-60/20 bg-primary-95 p-6 shadow-soft dark:border-primary-60/30 dark:bg-primary-20/40 md:p-8">
      <div className="grid gap-1">
        <Badge variant="primary">Nova trilha</Badge>
        <h2 className="text-xl font-bold text-neutral-10 dark:text-neutral-95">Criar trilha em rascunho</h2>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">
          Comece pelos metadados essenciais e já registre objetivos, pré-requisitos e descrição longa em Markdown.
        </p>
      </div>

      <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <section className="grid gap-3 md:grid-cols-2">
          <Field label="Slug">
            <Input placeholder="Ex: fracoes" {...form.register("slug")} />
          </Field>
          <Field label="Nome da trilha">
            <Input placeholder="Nome" {...form.register("name")} />
          </Field>
          <Field label="Tempo estimado">
            <Input placeholder="Ex: 4 semanas" {...form.register("estimatedTime")} />
          </Field>
          <Field label="Nível sugerido">
            <Input placeholder="Ex: Fundamental II" {...form.register("difficulty")} />
          </Field>
          <Field label="Público-alvo" className="md:col-span-2">
            <Input placeholder="Público-alvo" {...form.register("targetAudience")} />
          </Field>
        </section>

        <section className="grid gap-3">
          <Field label="Descrição curta">
            <Textarea
              placeholder="Descrição curta para listagens"
              {...form.register("description")}
              className="min-h-24"
            />
          </Field>
          <Field label="Descrição longa">
            <Textarea
              placeholder="Descrição longa em Markdown"
              {...form.register("longDescriptionMd")}
              className="min-h-40"
            />
          </Field>
          <Field label="Objetivos de aprendizagem">
            <Textarea
              placeholder="Objetivos de aprendizagem em Markdown"
              {...form.register("learningOutcomesMd")}
              className="min-h-28"
            />
          </Field>
          <Field label="Pré-requisitos">
            <Textarea
              placeholder="Pré-requisitos em Markdown"
              {...form.register("prerequisiteSummaryMd")}
              className="min-h-28"
            />
          </Field>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando..." : "Criar trilha"}
          </Button>
          {mutation.error && (
            <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
          )}
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ""}`}>
      <span className="font-semibold text-neutral-10 dark:text-neutral-95">{label}</span>
      {children}
    </label>
  );
}
