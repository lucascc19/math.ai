"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  CircleCheckBig,
  Eye,
  Gauge,
  LayoutDashboard,
  LogOut,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, type DashboardResponse } from "@/lib/api";
import { settingsSchema, submitAnswerSchema, type SettingsInput, type SubmitAnswerInput } from "@/lib/schemas";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const accentStyles = {
  primary: "border-primary-60/30 bg-primary-95",
  secondary: "border-secondary-60/30 bg-secondary-95",
  tertiary: "border-tertiary-70/30 bg-tertiary-95"
} as const;

const chartData = [
  { dia: "Seg", sessoes: 2 },
  { dia: "Ter", sessoes: 3 },
  { dia: "Qua", sessoes: 2 },
  { dia: "Qui", sessoes: 4 },
  { dia: "Sex", sessoes: 3 },
  { dia: "Sab", sessoes: 2 }
];

type SkillCard = DashboardResponse["skills"][number];

export function DashboardApp() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeSkillId, settings, setActiveSkillId, setDashboard, setSettings, dashboard } = useAppStore();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard
  });

  useEffect(() => {
    if (dashboardQuery.data) {
      setDashboard(dashboardQuery.data);
    }
  }, [dashboardQuery.data, setDashboard]);

  const settingsForm = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    values: settings
  });

  const answerForm = useForm<SubmitAnswerInput>({
    resolver: zodResolver(submitAnswerSchema),
    defaultValues: {
      skillId: activeSkillId ?? "",
      lessonId: "",
      answer: 0
    }
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    }
  });

  const settingsMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: (response) => {
      setSettings(response.settings);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const answerMutation = useMutation({
    mutationFn: api.submitAnswer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      answerForm.reset({ skillId: activeSkillId ?? "", lessonId: currentSkill?.currentLesson.id ?? "", answer: 0 });
    }
  });

  const skills: SkillCard[] = dashboard?.skills ?? [];
  const currentSkill = useMemo<SkillCard | undefined>(
    () => skills.find((skill: SkillCard) => skill.id === (activeSkillId ?? skills[0]?.id)) ?? skills[0],
    [activeSkillId, skills]
  );

  useEffect(() => {
    if (currentSkill) {
      setActiveSkillId(currentSkill.id);
      answerForm.setValue("skillId", currentSkill.id);
      answerForm.setValue("lessonId", currentSkill.currentLesson.id);
    }
  }, [answerForm, currentSkill, setActiveSkillId]);

  useEffect(() => {
    document.documentElement.style.setProperty("--reading-size", `${settings.fontSize / 16}rem`);
    document.documentElement.style.setProperty("--reading-gap", `${settings.spacing}px`);
    document.body.classList.toggle("minimal-ui", settings.minimal);
    document.body.classList.toggle("guidance-on", settings.guidance);
    document.body.classList.remove("focus-calmo", "focus-guiado", "focus-contraste");
    document.body.classList.add(`focus-${settings.focusMode}`);
  }, [settings]);

  if (dashboardQuery.isLoading || !dashboard) {
    return <div className="flex min-h-screen items-center justify-center text-neutral-10/70">Carregando sistema...</div>;
  }

  return (
    <main>
      <div className="gradient-bar h-1" />
      <section className="content-shell adaptive-stack mx-auto flex w-full flex-col px-4 py-6 md:px-6 md:py-8 xl:px-8">
        <header className="adaptive-stack grid items-start xl:grid-cols-[minmax(0,1.18fr)_minmax(380px,0.82fr)]">
          <div className="adaptive-stack grid">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="secondary">Painel do aluno</Badge>
              <div className="flex flex-wrap items-center gap-3">
                {dashboard.user?.role === "ADMIN" && (
                  <Button asChild variant="ghost">
                    <Link href="/admin/usuarios">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Painel admin
                    </Link>
                  </Button>
                )}
                {dashboard.user?.role === "TUTOR" && (
                  <Button asChild variant="ghost">
                    <Link href="/tutor/alunos">
                      <Users className="mr-2 h-4 w-4" />
                      Meus alunos
                    </Link>
                  </Button>
                )}
                <Button asChild variant="ghost">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para a landing
                  </Link>
                </Button>
              </div>
            </div>
            <div className="adaptive-stack grid">
              <h1 className="max-w-5xl text-4xl font-bold leading-[0.98] text-neutral-10 md:text-5xl 2xl:text-6xl">
                Ola, {dashboard.user?.name}. Sua trilha esta pronta para continuar.
              </h1>
              <p className="max-w-4xl text-[var(--reading-size)] leading-7">
                O dashboard agora e uma area protegida, com sessao real e progresso salvo por usuario autenticado.
              </p>
            </div>
            <div className="adaptive-stack decorative-only grid sm:grid-cols-2 2xl:grid-cols-3">
              <MetricCard title="Tentativas" value={String(dashboard.stats.totalAttempts)} icon={Gauge} />
              <MetricCard title="Precisao geral" value={`${dashboard.stats.accuracy}%`} icon={CircleCheckBig} />
              <MetricCard title="Trilhas ativas" value={String(dashboard.stats.activeTracks)} icon={BookOpen} />
            </div>
          </div>

          <Card className="adaptive-stack focus-surface grid self-start bg-primary-95">
            <div className="flex items-center justify-between gap-3">
              <Badge>Sessao ativa</Badge>
              <span className="text-sm text-neutral-10/60">{dashboard.user?.role.toLowerCase()}</span>
            </div>
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold">{dashboard.user?.name}</h2>
              <p className="text-sm leading-6 text-neutral-10/75">{dashboard.user?.email}</p>
            </div>
            <div className="grid gap-3 rounded-[20px] border border-black/10 bg-white/80 p-4 text-sm leading-6">
              <p>Seu progresso, preferencias de acessibilidade e respostas sao carregados com base na sua conta.</p>
              <p>Quando quiser encerrar, a sessao atual pode ser invalidada com um clique.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard"] })}>
                Atualizar painel
              </Button>
              <Button type="button" variant="secondary" onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </Card>
        </header>

        <section className="adaptive-stack grid items-start xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <Card className="adaptive-stack focus-surface grid self-start">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-2">
                <Badge variant="primary">Trilhas</Badge>
                <h2 className="text-2xl font-bold">Painel principal</h2>
              </div>
              <LayoutDashboard className="h-8 w-8 text-primary-40" />
            </div>

            <div className="adaptive-stack grid md:grid-cols-2">
              {skills.map((skill: SkillCard) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => setActiveSkillId(skill.id)}
                  className={cn(
                    "focus-ring grid gap-3 rounded-[20px] border p-5 text-left transition",
                    skill.id === currentSkill?.id
                      ? `${accentStyles[skill.accent as keyof typeof accentStyles]} shadow-soft`
                      : "border-black/5 bg-white hover:border-primary-60/20"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-lg">{skill.name}</strong>
                    <Badge variant={skill.accent === "primary" ? "primary" : skill.accent === "secondary" ? "secondary" : "tertiary"}>
                      {skill.estimatedTime}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-neutral-10/75">{skill.description}</p>
                  <Progress value={skill.progress.mastery} label={`Dominio atual: ${skill.progress.mastery}%`} />
                </button>
              ))}
            </div>
          </Card>

          <Card className="adaptive-stack focus-surface grid self-start bg-secondary-95">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-2">
                <Badge variant="secondary">Atividade atual</Badge>
                <h2 className="text-2xl font-bold">{currentSkill?.name}</h2>
              </div>
              <Brain className="h-8 w-8 text-secondary-40" />
            </div>

            {currentSkill ? (
              <>
                <div className="adaptive-stack focus-surface grid rounded-[20px] border border-secondary-60/20 bg-white/70 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{currentSkill.currentLesson.level}</Badge>
                    <Badge variant="primary">{currentSkill.currentLesson.goal}</Badge>
                  </div>
                  <p className="text-sm text-neutral-10/75">{currentSkill.currentLesson.story}</p>
                  <p className="text-4xl font-bold text-primary-30">{currentSkill.currentLesson.prompt}</p>
                  <p className="text-sm text-neutral-10/70">{currentSkill.currentLesson.tip}</p>
                </div>

                <form className="adaptive-stack grid" onSubmit={answerForm.handleSubmit((values) => answerMutation.mutate(values))}>
                  <Input className="focus-ring" inputMode="numeric" placeholder="Digite sua resposta" {...answerForm.register("answer")} />
                  <input type="hidden" {...answerForm.register("skillId")} />
                  <input type="hidden" {...answerForm.register("lessonId")} />
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit">Verificar resposta</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        answerForm.setValue("skillId", currentSkill.id);
                        answerForm.setValue("lessonId", currentSkill.currentLesson.id);
                        answerForm.resetField("answer");
                      }}
                    >
                      Limpar resposta
                    </Button>
                  </div>
                  <Card className={cn("bg-white/80", answerMutation.data?.result.isCorrect ? "border-secondary-60/30 bg-secondary-95" : "bg-tertiary-95")}>
                    <p className="text-sm leading-6">
                      {answerMutation.error
                        ? answerMutation.error.message
                        : answerMutation.data
                          ? answerMutation.data.result.isCorrect
                            ? `Resposta correta. ${answerMutation.data.result.explanation}`
                            : `Ainda nao foi dessa vez. A resposta certa e ${answerMutation.data.result.correctAnswer}. ${answerMutation.data.result.explanation}`
                          : "O feedback aparece aqui com texto curto, direto e sem ambiguidade."}
                    </p>
                  </Card>
                </form>

                <div className="adaptive-stack guidance-panel grid">
                  <h3 className="text-lg font-semibold">Leitura guiada</h3>
                  <div className="adaptive-stack grid">
                    {currentSkill.currentLesson.guidance.map((step: string, index: number) => (
                      <div key={step} className="guidance-step flex items-start gap-3 rounded-2xl bg-primary-95 p-4">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-60 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="text-sm leading-6">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </Card>
        </section>

        <section className="adaptive-stack grid items-start xl:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)]">
          <Card className="adaptive-stack focus-surface grid self-start">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-2">
                <Badge variant="secondary">Acessibilidade</Badge>
                <h2 className="text-2xl font-bold">Painel de preferencias</h2>
              </div>
              <Eye className="h-8 w-8 text-secondary-40" />
            </div>
            <form className="adaptive-stack grid" onSubmit={settingsForm.handleSubmit((values) => settingsMutation.mutate(values))}>
              <RangeField
                label="Tamanho do texto"
                min={16}
                max={22}
                step={1}
                value={settingsForm.watch("fontSize")}
                onChange={(value) => settingsForm.setValue("fontSize", Number(value))}
              />
              <RangeField
                label="Espacamento entre blocos"
                min={24}
                max={40}
                step={4}
                value={settingsForm.watch("spacing")}
                onChange={(value) => settingsForm.setValue("spacing", Number(value))}
              />
              <ToggleField
                label="Leitura guiada passo a passo"
                checked={settingsForm.watch("guidance")}
                onCheckedChange={(value) => settingsForm.setValue("guidance", value)}
              />
              <ToggleField
                label="Ocultar elementos secundarios"
                checked={settingsForm.watch("minimal")}
                onCheckedChange={(value) => settingsForm.setValue("minimal", value)}
              />
              <ToggleField
                label="Reduzir animacoes extras"
                checked={settingsForm.watch("reducedMotion")}
                onCheckedChange={(value) => settingsForm.setValue("reducedMotion", value)}
              />
              <div className="adaptive-stack grid">
                <label className="text-sm font-semibold">Modo de foco</label>
                <div className="flex flex-wrap gap-3">
                  {(["calmo", "guiado", "contraste"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => settingsForm.setValue("focusMode", mode)}
                      className={cn(
                        "focus-ring rounded-full border px-4 py-2 text-sm font-semibold",
                        settingsForm.watch("focusMode") === mode ? "border-primary-60 bg-primary-60 text-white" : "border-black/10 bg-white"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit">Salvar preferencias</Button>
            </form>
          </Card>

          <Card className="adaptive-stack optional-panel focus-surface grid self-start">
            <div className="flex items-center justify-between gap-3">
              <div className="grid gap-2">
                <Badge variant="primary">Engajamento</Badge>
                <h2 className="text-2xl font-bold">Ritmo semanal</h2>
              </div>
              <BarChart3 className="h-8 w-8 text-primary-40" />
            </div>
            <div className="h-72 rounded-[20px] bg-primary-95 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7795F8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#86D7BC" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dia" stroke="#2D3436" />
                  <YAxis stroke="#2D3436" allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="sessoes" stroke="#3959B8" fill="url(#studyGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm leading-6 text-neutral-10/75">
              O grafico usa Recharts para apoiar o painel do aluno e futuramente pode refletir dados reais do banco.
            </p>
          </Card>
        </section>

        <section className="adaptive-stack optional-panel grid items-start xl:grid-cols-3">
          <RolePanel
            badge="Tutor"
            title="Painel do tutor"
            description="Acompanha alunos, identifica habilidades fragilizadas e organiza intervencoes curtas."
            icon={Users}
            metrics={[
              { label: "Alunos monitorados", value: String(dashboard.tutor.studentsTracked) },
              { label: "Em risco", value: String(dashboard.tutor.studentsAtRisk) },
              { label: "Maior dificuldade", value: dashboard.tutor.topDifficulty }
            ]}
          />
          <RolePanel
            badge="Admin"
            title="CMS e governanca"
            description="Administra trilhas, licoes, revisoes de conteudo e a base estrutural do sistema."
            icon={ShieldCheck}
            metrics={[
              { label: "Trilhas publicadas", value: String(dashboard.admin.publishedTracks) },
              { label: "Licoes", value: String(dashboard.admin.totalLessons) },
              { label: "Revisoes pendentes", value: String(dashboard.admin.pendingReviews) }
            ]}
          />
        </section>
      </section>
    </main>
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
    <Card className="bg-white/80">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-2">
          <span className="text-sm text-neutral-10/65">{title}</span>
          <strong className="text-2xl font-bold">{value}</strong>
        </div>
        <Icon className="h-6 w-6 text-primary-40" />
      </div>
    </Card>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold">{label}</label>
        <span className="text-sm text-neutral-10/65">{value}px</span>
      </div>
      <input className="accent-[#5874D8]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onCheckedChange
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/80 px-4 py-3">
      <input checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} type="checkbox" />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

function RolePanel({
  badge,
  title,
  description,
  icon: Icon,
  metrics
}: {
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <Card className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="tertiary">{badge}</Badge>
        <Icon className="h-7 w-7 text-tertiary-30" />
      </div>
      <div className="grid gap-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-sm leading-6 text-neutral-10/75">{description}</p>
      </div>
      <div className="grid gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-95 px-4 py-3">
            <span className="text-sm text-neutral-10/70">{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
