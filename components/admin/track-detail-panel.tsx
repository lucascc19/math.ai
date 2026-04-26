"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ContentStatus } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Clock3, FolderTree, Plus, Sparkles, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { StatusPill } from "@/components/admin/content-panel";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SimpleMarkdownPreview } from "@/components/ui/simple-markdown-preview";
import { Textarea } from "@/components/ui/textarea";
import { api, type AdminLesson, type AdminTrackDetail, type AdminTrackModule } from "@/lib/api";
import {
  lessonActivityTypeSchema,
  lessonBlockTypeSchema,
  lessonDraftSchema,
  lessonTypeSchema,
  moduleDraftSchema,
  modulePatchSchema,
  trackPatchSchema,
  type LessonActivityDraftInput,
  type LessonBlockDraftInput,
  type LessonDraftInput,
  type ModuleDraftInput,
  type ModulePatchInput,
  type TrackPatchInput
} from "@/lib/schemas";

type Props = { initialTrack: AdminTrackDetail };

type LessonTemplate = {
  id: string;
  name: string;
  description: string;
  values: Omit<LessonDraftInput, "trackModuleId" | "title" | "orderIndex">;
};

type LessonEditorTab = "structure" | "content" | "blocks" | "activities" | "preview" | "publishing";

const LESSON_EDITOR_TABS: Array<{ id: LessonEditorTab; label: string }> = [
  { id: "structure", label: "Estrutura" },
  { id: "content", label: "Conteudo" },
  { id: "blocks", label: "Blocos" },
  { id: "activities", label: "Atividades" },
  { id: "preview", label: "Preview" },
  { id: "publishing", label: "Publicacao" }
];

const BLOCK_TYPE_LABELS: Record<string, string> = {
  THEORY: "Teoria",
  EXAMPLE: "Exemplo",
  VISUAL: "Visual",
  PRACTICE_INTRO: "Introducao da pratica",
  SUMMARY: "Resumo"
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  NUMERIC: "Numerica",
  MULTIPLE_CHOICE: "Multipla escolha",
  TRUE_FALSE: "Verdadeiro ou falso",
  SHORT_TEXT: "Texto curto"
};

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`grid gap-2 text-sm ${className ?? ""}`}>
      <span className="font-semibold text-neutral-10 dark:text-neutral-95">{label}</span>
      {children}
    </label>
  );
}

function SelectField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`grid gap-2 text-sm ${className ?? ""}`}>
      <span className="font-semibold text-neutral-10 dark:text-neutral-95">{label}</span>
      {children}
    </div>
  );
}

const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: "theory-first",
    name: "Teoria primeiro",
    description: "Explicacao, exemplo resolvido e uma checagem curta.",
    values: {
      summary: "Introducao conceitual com exemplo resolvido.",
      contentMd:
        "## Conceito\n\nExplique a ideia central da licao com linguagem direta.\n\n## Exemplo resolvido\n\nMostre um exemplo passo a passo.\n\n## Ponto de atencao\n\nDestaque um erro comum ou uma observacao importante.",
      instructionMd: "Leia a explicacao e resolva a checagem para confirmar o entendimento.",
      teacherNotesMd: "Use esta licao quando o aluno precisar construir base antes de praticar.",
      lessonType: "EXPLANATION",
      estimatedMinutes: 12,
      prompt: "Resolva a checagem conceitual da licao.",
      story: "O aluno estudou a definicao e precisa verificar se entendeu o conceito principal.",
      explanation: "A resposta deve seguir diretamente a definicao apresentada no conteudo.",
      answer: 0,
      level: "Iniciante",
      goal: "Compreender o conceito antes de aplicar em exercicios.",
      tip: "Volte ao exemplo resolvido e compare os passos.",
      blocks: [
        { type: "SUMMARY", title: "Resumo", contentMd: "Introducao conceitual com exemplo resolvido.", orderIndex: 0 },
        {
          type: "THEORY",
          title: "Explicacao",
          contentMd:
            "## Conceito\n\nExplique a ideia central da licao com linguagem direta.\n\n## Exemplo resolvido\n\nMostre um exemplo passo a passo.\n\n## Ponto de atencao\n\nDestaque um erro comum ou uma observacao importante.",
          orderIndex: 1
        },
        {
          type: "PRACTICE_INTRO",
          title: "Atividade",
          contentMd: "Leia a explicacao e resolva a checagem para confirmar o entendimento.",
          orderIndex: 2
        }
      ],
      activities: [
        {
          type: "SHORT_TEXT",
          instructionMd: "Explique com suas palavras a ideia principal desta licao.",
          answerKey: "resposta conceitual",
          choiceOptionsText: "",
          hintMd: "Use a definicao e o exemplo resolvido como referencia.",
          feedbackCorrectMd: "Boa leitura do conceito. Agora avance para uma aplicacao.",
          feedbackIncorrectMd: "Revise a definicao e tente reescrever a ideia com suas palavras.",
          orderIndex: 0
        }
      ]
    }
  },
  {
    id: "guided-practice",
    name: "Pratica guiada",
    description: "Problema com contexto, dica e feedback.",
    values: {
      summary: "Exercicio guiado para aplicar o conceito.",
      contentMd:
        "## Antes de resolver\n\nRetome a regra ou estrategia que sera usada.\n\n## Caminho sugerido\n\n1. Identifique os dados do problema.\n2. Escolha a operacao ou relacao adequada.\n3. Resolva e confira a resposta.",
      instructionMd: "Resolva a atividade seguindo os passos sugeridos.",
      teacherNotesMd: "Use esta licao para consolidar um conceito ja apresentado.",
      lessonType: "PRACTICE",
      estimatedMinutes: 15,
      prompt: "Resolva o problema guiado.",
      story: "O aluno vai aplicar o conteudo em uma situacao direta.",
      explanation: "A resolucao deve explicitar os dados, a estrategia e o resultado.",
      answer: 0,
      level: "Intermediario",
      goal: "Aplicar o conceito em um exercicio orientado.",
      tip: "Separe os dados antes de calcular.",
      blocks: [
        { type: "SUMMARY", title: "Resumo", contentMd: "Exercicio guiado para aplicar o conceito.", orderIndex: 0 },
        {
          type: "THEORY",
          title: "Antes de resolver",
          contentMd:
            "## Antes de resolver\n\nRetome a regra ou estrategia que sera usada.\n\n## Caminho sugerido\n\n1. Identifique os dados do problema.\n2. Escolha a operacao ou relacao adequada.\n3. Resolva e confira a resposta.",
          orderIndex: 1
        },
        {
          type: "PRACTICE_INTRO",
          title: "Atividade",
          contentMd: "Resolva a atividade seguindo os passos sugeridos.",
          orderIndex: 2
        }
      ],
      activities: [
        {
          type: "NUMERIC",
          instructionMd: "Calcule o resultado do problema proposto.",
          answerKey: "0",
          choiceOptionsText: "",
          hintMd: "Confira se voce usou todos os dados do enunciado.",
          feedbackCorrectMd: "Correto. A estrategia foi aplicada adequadamente.",
          feedbackIncorrectMd: "Revise os dados e refaca o calculo passo a passo.",
          orderIndex: 0
        }
      ]
    }
  },
  {
    id: "visual",
    name: "Visual",
    description: "Leitura visual, interpretacao e pergunta objetiva.",
    values: {
      summary: "Licao com foco em representacao visual.",
      contentMd:
        "## Observe\n\nDescreva aqui a figura, tabela, grafico ou diagrama que sera usado.\n\n## Interpretacao\n\nExplique como ler os elementos visuais e o que eles representam.",
      instructionMd: "Use a representacao visual para responder a atividade.",
      teacherNotesMd: "Adicione ou referencie uma imagem/diagrama quando a licao exigir suporte visual.",
      lessonType: "PRACTICE",
      estimatedMinutes: 10,
      prompt: "Interprete a representacao visual.",
      story: "O aluno observa uma representacao e extrai informacoes matematicas dela.",
      explanation: "A resposta depende da leitura correta dos elementos visuais.",
      answer: 0,
      level: "Iniciante",
      goal: "Interpretar uma representacao visual de um conceito matematico.",
      tip: "Observe legendas, medidas, eixos ou marcacoes antes de responder.",
      blocks: [
        { type: "SUMMARY", title: "Resumo", contentMd: "Licao com foco em representacao visual.", orderIndex: 0 },
        {
          type: "VISUAL",
          title: "Representacao visual",
          contentMd:
            "## Observe\n\nDescreva aqui a figura, tabela, grafico ou diagrama que sera usado.\n\n## Interpretacao\n\nExplique como ler os elementos visuais e o que eles representam.",
          orderIndex: 1
        },
        {
          type: "PRACTICE_INTRO",
          title: "Atividade",
          contentMd: "Use a representacao visual para responder a atividade.",
          orderIndex: 2
        }
      ],
      activities: [
        {
          type: "MULTIPLE_CHOICE",
          instructionMd: "Qual alternativa interpreta corretamente a representacao?",
          answerKey: "Alternativa correta",
          choiceOptionsText: "Alternativa correta\nAlternativa incorreta\nOutra alternativa incorreta",
          hintMd: "Elimine primeiro as alternativas que contradizem a representacao.",
          feedbackCorrectMd: "Correto. A leitura visual esta consistente.",
          feedbackIncorrectMd: "Revise os elementos da representacao antes de escolher.",
          orderIndex: 0
        }
      ]
    }
  },
  {
    id: "review",
    name: "Revisao",
    description: "Resumo, pontos-chave e checkpoint.",
    values: {
      summary: "Revisao curta dos pontos principais.",
      contentMd:
        "## Resumo\n\nRetome as ideias principais da aula.\n\n## Pontos-chave\n\n- Primeiro ponto importante\n- Segundo ponto importante\n- Erro comum a evitar",
      instructionMd: "Responda ao checkpoint para verificar se esta pronto para seguir.",
      teacherNotesMd: "Use esta licao no fim de um modulo ou antes de um desafio.",
      lessonType: "REVIEW",
      estimatedMinutes: 8,
      prompt: "Revise os pontos principais.",
      story: "O aluno precisa consolidar o que aprendeu antes de avancar.",
      explanation: "A resposta deve demonstrar dominio dos pontos revisados.",
      answer: 0,
      level: "Revisao",
      goal: "Consolidar os principais aprendizados da sequencia.",
      tip: "Compare sua resposta com os pontos-chave do resumo.",
      blocks: [
        { type: "SUMMARY", title: "Resumo", contentMd: "Revisao curta dos pontos principais.", orderIndex: 0 },
        {
          type: "THEORY",
          title: "Pontos-chave",
          contentMd:
            "## Resumo\n\nRetome as ideias principais da aula.\n\n## Pontos-chave\n\n- Primeiro ponto importante\n- Segundo ponto importante\n- Erro comum a evitar",
          orderIndex: 1
        },
        {
          type: "PRACTICE_INTRO",
          title: "Checkpoint",
          contentMd: "Responda ao checkpoint para verificar se esta pronto para seguir.",
          orderIndex: 2
        }
      ],
      activities: [
        {
          type: "TRUE_FALSE",
          instructionMd: "A afirmacao principal da revisao esta correta?",
          answerKey: "verdadeiro",
          choiceOptionsText: "",
          hintMd: "Volte aos pontos-chave e procure a afirmacao equivalente.",
          feedbackCorrectMd: "Correto. Voce identificou bem a ideia central.",
          feedbackIncorrectMd: "Revise os pontos-chave antes de tentar novamente.",
          orderIndex: 0
        }
      ]
    }
  },
  {
    id: "challenge",
    name: "Desafio",
    description: "Problema mais aberto com pistas.",
    values: {
      summary: "Desafio para aplicar mais de uma ideia.",
      contentMd:
        "## Desafio\n\nApresente um problema que combine conceitos ja estudados.\n\n## Estrategia\n\nOriente o aluno a decompor o problema em partes menores.",
      instructionMd: "Resolva o desafio e registre o resultado final.",
      teacherNotesMd: "Use quando o aluno ja tiver visto os pre-requisitos.",
      lessonType: "PRACTICE",
      estimatedMinutes: 20,
      prompt: "Resolva o desafio proposto.",
      story: "O aluno enfrenta um problema menos direto e precisa escolher uma estrategia.",
      explanation: "A resolucao deve decompor o problema e justificar o resultado.",
      answer: 0,
      level: "Avancado",
      goal: "Combinar conceitos para resolver um problema menos imediato.",
      tip: "Quebre o problema em etapas e resolva uma parte por vez.",
      blocks: [
        { type: "SUMMARY", title: "Resumo", contentMd: "Desafio para aplicar mais de uma ideia.", orderIndex: 0 },
        {
          type: "THEORY",
          title: "Estrategia",
          contentMd:
            "## Desafio\n\nApresente um problema que combine conceitos ja estudados.\n\n## Estrategia\n\nOriente o aluno a decompor o problema em partes menores.",
          orderIndex: 1
        },
        {
          type: "PRACTICE_INTRO",
          title: "Atividade",
          contentMd: "Resolva o desafio e registre o resultado final.",
          orderIndex: 2
        }
      ],
      activities: [
        {
          type: "NUMERIC",
          instructionMd: "Qual e o resultado final do desafio?",
          answerKey: "0",
          choiceOptionsText: "",
          hintMd: "Identifique primeiro quais conceitos aparecem no problema.",
          feedbackCorrectMd: "Correto. Voce combinou bem as etapas do desafio.",
          feedbackIncorrectMd: "Revise a decomposicao do problema e confira cada etapa.",
          orderIndex: 0
        }
      ]
    }
  },
  {
    id: "quick-quiz",
    name: "Quiz rapido",
    description: "Pergunta objetiva para checagem rapida.",
    values: {
      summary: "Checagem rapida de entendimento.",
      contentMd: "## Antes do quiz\n\nLeia a pergunta com atencao e escolha a melhor alternativa.",
      instructionMd: "Responda ao quiz rapido.",
      teacherNotesMd: "Use para verificar entendimento durante ou ao fim de uma aula.",
      lessonType: "QUIZ",
      estimatedMinutes: 5,
      prompt: "Escolha a alternativa correta.",
      story: "O aluno responde uma pergunta objetiva para checar entendimento.",
      explanation: "A alternativa correta deve refletir diretamente o conceito trabalhado.",
      answer: 0,
      level: "Check",
      goal: "Verificar rapidamente se o aluno entendeu o ponto principal.",
      tip: "Procure a alternativa que melhor combina com a definicao.",
      blocks: [
        { type: "SUMMARY", title: "Resumo", contentMd: "Checagem rapida de entendimento.", orderIndex: 0 },
        {
          type: "THEORY",
          title: "Antes do quiz",
          contentMd: "## Antes do quiz\n\nLeia a pergunta com atencao e escolha a melhor alternativa.",
          orderIndex: 1
        },
        { type: "PRACTICE_INTRO", title: "Quiz", contentMd: "Responda ao quiz rapido.", orderIndex: 2 }
      ],
      activities: [
        {
          type: "MULTIPLE_CHOICE",
          instructionMd: "Qual alternativa esta correta?",
          answerKey: "Alternativa correta",
          choiceOptionsText: "Alternativa correta\nAlternativa incorreta\nOutra alternativa incorreta",
          hintMd: "Elimine as alternativas que contradizem a explicacao.",
          feedbackCorrectMd: "Correto. Voce identificou a alternativa adequada.",
          feedbackIncorrectMd: "Revise o conceito e compare as alternativas novamente.",
          orderIndex: 0
        }
      ]
    }
  }
];

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
          <Field label="Slug">
            <Input placeholder="Slug" {...form.register("slug")} />
          </Field>
          <Field label="Nome da trilha">
            <Input placeholder="Nome" {...form.register("name")} />
          </Field>
          <Field label="Tempo estimado">
            <Input placeholder="Tempo estimado" {...form.register("estimatedTime")} />
          </Field>
          <Field label="Dificuldade">
            <Input placeholder="Ex: Fundamental II" {...form.register("difficulty")} />
          </Field>
          <Field label="Público-alvo" className="md:col-span-2">
            <Input placeholder="Público-alvo" {...form.register("targetAudience")} />
          </Field>
        </section>

        <section className="grid gap-3">
          <Field label="Descrição curta">
            <Textarea placeholder="Descrição curta" {...form.register("description")} className="min-h-24" />
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
        <Field label="Título do módulo" className="md:col-span-2">
          <Input placeholder="Título do módulo" {...form.register("title")} />
        </Field>
        <Field label="Tempo estimado em minutos">
          <Input type="number" placeholder="Tempo estimado em minutos" {...form.register("estimatedMinutes")} />
        </Field>
        <Field label="Ordem">
          <Input type="number" placeholder="Ordem" {...form.register("orderIndex")} />
        </Field>
        <Field label="Descrição do módulo" className="md:col-span-2">
          <Textarea
            placeholder="Descrição do módulo em Markdown"
            {...form.register("descriptionMd")}
            className="min-h-28"
          />
        </Field>
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
        <Field label="Título do módulo" className="md:col-span-2">
          <Input placeholder="Título do módulo" {...form.register("title")} />
        </Field>
        <Field label="Tempo estimado em minutos">
          <Input type="number" placeholder="Tempo estimado em minutos" {...form.register("estimatedMinutes")} />
        </Field>
        <Field label="Ordem">
          <Input type="number" placeholder="Ordem" {...form.register("orderIndex")} />
        </Field>
        <Field label="Descrição do módulo" className="md:col-span-2">
          <Textarea
            placeholder="Descrição do módulo em Markdown"
            {...form.register("descriptionMd")}
            className="min-h-28"
          />
        </Field>
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
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
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
      activities: [createEmptyActivity(0)],
      blocks: []
    }
  });

  function applyTemplate(template: LessonTemplate) {
    const currentTitle = form.getValues("title");

    setSelectedTemplateId(template.id);
    form.reset({
      trackModuleId: module.id,
      title: currentTitle,
      orderIndex: nextOrderIndex,
      ...template.values
    });
  }

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
      <section className="grid gap-3 rounded-2xl border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/40">
        <div className="grid gap-1">
          <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">Comecar por um template</span>
          <p className="text-sm leading-6 text-neutral-10/68 dark:text-neutral-80">
            Escolha uma estrutura inicial e ajuste os campos depois.
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {LESSON_TEMPLATES.map((template) => {
            const isSelected = selectedTemplateId === template.id;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className={`focus-ring grid gap-1 rounded-2xl border p-4 text-left transition ${
                  isSelected
                    ? "border-primary-60 bg-primary-95 text-primary-20 dark:border-primary-60 dark:bg-primary-20/50 dark:text-primary-95"
                    : "border-black/10 bg-white text-neutral-10 hover:border-primary-60/40 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
                }`}
              >
                <span className="text-sm font-bold">{template.name}</span>
                <span className="text-xs leading-5 opacity-75">{template.description}</span>
              </button>
            );
          })}
        </div>
      </section>
      <LessonFormFields form={form} />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={form.handleSubmit((values) => mutation.mutate(values))}
          disabled={mutation.isPending}
        >
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
          : [createEmptyActivity(0)],
      blocks: lesson.blocks.map((block, index) => ({
        type: block.type,
        title: block.title,
        contentMd: block.contentMd,
        orderIndex: block.orderIndex ?? index
      }))
    }
  });

  const mutation = useMutation({
    mutationFn: (values: LessonDraftInput) => api.admin.updateLesson(lesson.id, values),
    onSuccess
  });

  return (
    <div className="grid gap-3 rounded-[18px] border border-black/10 bg-white/80 p-4 dark:border-white/15 dark:bg-neutral-20/60">
      <LessonFormFields form={form} modules={modules} />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={form.handleSubmit((values) => mutation.mutate(values))}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Salvando..." : "Salvar lição"}
        </Button>
        {mutation.error && (
          <span className="text-sm text-tertiary-30 dark:text-tertiary-70">{mutation.error.message}</span>
        )}
      </div>
    </div>
  );
}

function LessonFormFields({
  form,
  modules
}: {
  form: ReturnType<typeof useForm<LessonDraftInput>>;
  modules?: AdminTrackModule[];
}) {
  const [activeTab, setActiveTab] = useState<LessonEditorTab>("structure");
  const contentMd = form.watch("contentMd");
  const instructionMd = form.watch("instructionMd");
  const activities = form.watch("activities");
  const title = form.watch("title");
  const summary = form.watch("summary");
  const goal = form.watch("goal");
  const level = form.watch("level");
  const lessonType = form.watch("lessonType");

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "activities"
  });

  const {
    fields: blockFields,
    append: appendBlock,
    remove: removeBlock,
    move: moveBlock
  } = useFieldArray({
    control: form.control,
    name: "blocks"
  });

  const filledRequirements = [
    { label: "Titulo", done: Boolean(title?.trim()) },
    { label: "Resumo", done: Boolean(summary?.trim()) },
    { label: "Objetivo", done: Boolean(goal?.trim()) },
    { label: "Conteudo", done: Boolean(contentMd?.trim()) },
    { label: "Atividade", done: fields.length > 0 }
  ];

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

  function appendNewBlock() {
    appendBlock(createEmptyBlock(blockFields.length));
  }

  function removeBlockItem(index: number) {
    removeBlock(index);
    const nextBlocks = form.getValues("blocks") ?? [];
    reindexBlocks(nextBlocks, form);
  }

  function moveBlockItem(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= blockFields.length) return;
    moveBlock(index, target);
    const nextBlocks = form.getValues("blocks") ?? [];
    reindexBlocks(nextBlocks, form);
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3 dark:border-white/10" role="tablist">
        {LESSON_EDITOR_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-primary-60 text-white"
                  : "border border-black/10 bg-white text-neutral-10 hover:border-primary-60/40 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className={`grid gap-3 md:grid-cols-2 ${activeTab === "structure" ? "" : "hidden"}`}>
        <Field label="Título">
          <Input placeholder="Título" {...form.register("title")} />
        </Field>
        <Field label="Resumo da lição">
          <Input placeholder="Resumo rápido da lição" {...form.register("summary")} />
        </Field>
        <Field label="Nível">
          <Input placeholder="Ex: Iniciante" {...form.register("level")} />
        </Field>
        <Field label="Objetivo">
          <Input placeholder="Objetivo" {...form.register("goal")} />
        </Field>
        <Field label="Tipo da lição">
          <Input placeholder="EXPLANATION, PRACTICE, QUIZ, REVIEW" {...form.register("lessonType")} />
        </Field>
        <Field label="Tempo estimado em minutos">
          <Input type="number" placeholder="Tempo estimado em minutos" {...form.register("estimatedMinutes")} />
        </Field>
        {modules ? (
          <SelectField label="Módulo" className="md:col-span-2">
            <Controller
              control={form.control}
              name="trackModuleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modulo" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </SelectField>
        ) : null}
      </section>

      <section className={`grid gap-3 ${activeTab === "content" ? "" : "hidden"}`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-10 dark:text-neutral-95">
          <Sparkles className="h-4 w-4 text-primary-40" />
          Conteúdo do aluno
        </div>
        <Field label="Conteúdo principal">
          <Textarea
            placeholder="Teoria, exemplos e explicações em Markdown"
            {...form.register("contentMd")}
            className="min-h-40"
          />
        </Field>
        <Field label="Enunciado legado">
          <Textarea
            placeholder="Enunciado legado da lição em Markdown"
            {...form.register("instructionMd")}
            className="min-h-28"
          />
        </Field>
        <Field label="Notas internas do professor">
          <Textarea
            placeholder="Notas internas do professor"
            {...form.register("teacherNotesMd")}
            className="min-h-28"
          />
        </Field>
      </section>

      <section
        className={`grid gap-4 rounded-2xl border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/40 ${
          activeTab === "blocks" ? "" : "hidden"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">Blocos da licao</span>
            <p className="text-sm leading-6 text-neutral-10/68 dark:text-neutral-80">
              Monte a licao por partes. Cada bloco tem um tipo, titulo e conteudo em Markdown.
            </p>
          </div>
          <Button type="button" variant="secondary" onClick={appendNewBlock}>
            <Plus className="mr-2 h-4 w-4" />
            Novo bloco
          </Button>
        </div>

        <div className="grid gap-4">
          {blockFields.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-4 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Nenhum bloco ainda. Clique em "Novo bloco" para comecar.
            </p>
          ) : (
            blockFields.map((field, index) => (
              <Card key={field.id} className="grid gap-4 border-black/6 bg-white dark:bg-neutral-20/60">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveBlockItem(index, -1)}
                      className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
                      aria-label="Subir bloco"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === blockFields.length - 1}
                      onClick={() => moveBlockItem(index, 1)}
                      className="focus-ring rounded-full border border-black/10 bg-white p-1 text-neutral-10 hover:border-primary-60/30 disabled:opacity-30 dark:border-white/15 dark:bg-neutral-20/60 dark:text-neutral-95"
                      aria-label="Descer bloco"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <Badge variant="secondary">Bloco {index + 1}</Badge>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => removeBlockItem(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SelectField label="Tipo do bloco">
                    <Controller
                      control={form.control}
                      name={`blocks.${index}.type`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo do bloco" />
                          </SelectTrigger>
                          <SelectContent>
                            {lessonBlockTypeSchema.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {BLOCK_TYPE_LABELS[type] ?? type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </SelectField>
                  <Field label="Título do bloco">
                    <Input placeholder="Título do bloco" {...form.register(`blocks.${index}.title`)} />
                  </Field>
                  <Field label="Conteúdo do bloco" className="md:col-span-2">
                    <Textarea
                      placeholder="Conteúdo do bloco em Markdown"
                      {...form.register(`blocks.${index}.contentMd`)}
                      className="min-h-28"
                    />
                  </Field>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      <section className={`grid gap-3 md:grid-cols-2 ${activeTab === "publishing" ? "" : "hidden"}`}>
        <Field label="Enunciado curto legado">
          <Textarea placeholder="Enunciado curto legado" {...form.register("prompt")} className="min-h-24" />
        </Field>
        <Field label="História ou contexto">
          <Textarea placeholder="História ou contexto" {...form.register("story")} className="min-h-24" />
        </Field>
        <Field label="Explicação da resposta">
          <Textarea placeholder="Explicação da resposta" {...form.register("explanation")} className="min-h-24" />
        </Field>
        <Field label="Dica geral">
          <Textarea placeholder="Dica geral" {...form.register("tip")} className="min-h-24" />
        </Field>
        <Field label="Resposta numérica legada">
          <Input type="number" placeholder="Resposta numérica legada" {...form.register("answer")} />
        </Field>
        <Field label="Ordem da lição">
          <Input type="number" placeholder="Ordem da lição" {...form.register("orderIndex")} />
        </Field>
        <div className="grid gap-2 rounded-2xl border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/40 md:col-span-2">
          <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">Checklist editorial</span>
          <div className="flex flex-wrap gap-2">
            {filledRequirements.map((item) => (
              <Badge key={item.label} variant={item.done ? "primary" : "tertiary"}>
                {item.done ? "OK" : "Pendente"} - {item.label}
              </Badge>
            ))}
          </div>
          <p className="text-sm leading-6 text-neutral-10/68 dark:text-neutral-80">
            A publicacao continua sendo feita pelo botao da linha da licao. Esta aba concentra compatibilidade e
            pendencias editoriais.
          </p>
        </div>
      </section>

      <section
        className={`grid gap-4 rounded-2xl border border-black/8 bg-white/70 p-4 dark:border-white/10 dark:bg-neutral-20/40 ${
          activeTab === "activities" ? "" : "hidden"
        }`}
      >
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
                  <SelectField label="Tipo da atividade">
                    <Controller
                      control={form.control}
                      name={`activities.${index}.type`}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo da atividade" />
                          </SelectTrigger>
                          <SelectContent>
                            {lessonActivityTypeSchema.options.map((type) => (
                              <SelectItem key={type} value={type}>
                                {ACTIVITY_TYPE_LABELS[type] ?? type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </SelectField>
                  {activityType === lessonActivityTypeSchema.enum.TRUE_FALSE ? (
                    <SelectField label="Resposta correta">
                      <Controller
                        control={form.control}
                        name={`activities.${index}.answerKey`}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Resposta correta" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verdadeiro">Verdadeiro</SelectItem>
                              <SelectItem value="falso">Falso</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </SelectField>
                  ) : (
                    <Field label="Resposta correta">
                      <Input
                        placeholder={
                          activityType === lessonActivityTypeSchema.enum.SHORT_TEXT
                            ? "Resposta textual esperada"
                            : "Resposta correta"
                        }
                        {...form.register(`activities.${index}.answerKey`)}
                      />
                    </Field>
                  )}
                  <Field label="Enunciado da atividade" className="md:col-span-2">
                    <Textarea
                      placeholder="Enunciado da atividade em Markdown"
                      {...form.register(`activities.${index}.instructionMd`)}
                      className="min-h-28"
                    />
                  </Field>
                  <Field label="Dica da atividade">
                    <Textarea
                      placeholder="Dica da atividade"
                      {...form.register(`activities.${index}.hintMd`)}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Feedback quando acertar">
                    <Textarea
                      placeholder="Feedback quando acertar"
                      {...form.register(`activities.${index}.feedbackCorrectMd`)}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Feedback quando errar">
                    <Textarea
                      placeholder="Feedback quando errar"
                      {...form.register(`activities.${index}.feedbackIncorrectMd`)}
                      className="min-h-24"
                    />
                  </Field>
                  <Field label="Ordem da atividade">
                    <Input
                      type="number"
                      placeholder="Ordem da atividade"
                      {...form.register(`activities.${index}.orderIndex`)}
                    />
                  </Field>
                  {activityType === lessonActivityTypeSchema.enum.MULTIPLE_CHOICE ? (
                    <Field label="Opções da múltipla escolha" className="md:col-span-2">
                      <Textarea
                        placeholder="Opções da múltipla escolha, uma por linha"
                        {...form.register(`activities.${index}.choiceOptionsText`)}
                        className="min-h-28"
                      />
                    </Field>
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

      <section className={`grid gap-3 xl:grid-cols-2 ${activeTab === "preview" ? "" : "hidden"}`}>
        <div className="xl:col-span-2 flex flex-wrap gap-2">
          <Badge variant="primary">{lessonType}</Badge>
          {level ? <Badge variant="secondary">{level}</Badge> : null}
          {summary ? <span className="text-sm text-neutral-10/70 dark:text-neutral-80">{summary}</span> : null}
        </div>
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

function reindexActivities(activities: LessonActivityDraftInput[], form: ReturnType<typeof useForm<LessonDraftInput>>) {
  activities.forEach((_, index) => {
    form.setValue(`activities.${index}.orderIndex`, index, { shouldDirty: true });
  });
}

function createEmptyBlock(orderIndex: number): LessonBlockDraftInput {
  return {
    type: lessonBlockTypeSchema.enum.THEORY,
    title: "",
    contentMd: "",
    orderIndex
  };
}

function reindexBlocks(blocks: LessonBlockDraftInput[], form: ReturnType<typeof useForm<LessonDraftInput>>) {
  blocks.forEach((_, index) => {
    form.setValue(`blocks.${index}.orderIndex`, index, { shouldDirty: true });
  });
}
