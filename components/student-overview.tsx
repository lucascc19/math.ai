"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, BookOpen, CircleCheckBig, Gauge } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

const chartData = [
  { dia: "Seg", sessões: 2 },
  { dia: "Ter", sessões: 3 },
  { dia: "Qua", sessões: 2 },
  { dia: "Qui", sessões: 4 },
  { dia: "Sex", sessões: 3 },
  { dia: "Sab", sessões: 2 }
];

export function StudentOverview() {
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

  if (dashboardQuery.isLoading || !dashboard) {
    return (
      <div className="grid gap-6">
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-black/5 bg-white/70" />
          ))}
        </section>
        <section className="h-[360px] animate-pulse rounded-2xl border border-black/5 bg-white/70" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <div className="grid gap-2">
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-neutral-10 md:text-4xl">
            Ola, {dashboard.user?.name}.
          </h1>
          <p className="max-w-3xl text-[var(--reading-size)] leading-7 text-neutral-10/74">
            Aqui você acompanha suas trilhas ativas e enxerga com clareza onde seguir agora.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Tentativas" value={String(dashboard.stats.totalAttempts)} icon={Gauge} />
        <MetricCard title="Precisao geral" value={`${dashboard.stats.accuracy}%`} icon={CircleCheckBig} />
        <MetricCard title="Trilhas ativas" value={String(dashboard.stats.activeTracks)} icon={BookOpen} />
      </section>

      <section className="grid gap-6">
        <Card className="grid gap-5 bg-white/88">
          <div className="flex items-center justify-between gap-3">
            <div className="grid gap-2">
              <Badge variant="primary">Engajamento</Badge>
              <h2 className="text-2xl font-bold text-neutral-10">Ritmo semanal</h2>
            </div>
            <BarChart3 className="h-8 w-8 text-primary-40" />
          </div>
          <div className="h-72 rounded-2xl bg-primary-95 p-4">
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
                <Area type="monotone" dataKey="sessões" stroke="#3959B8" fill="url(#studyGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-6 text-neutral-10/75">
              Essa leitura ajuda a acompanhar constancia de estudo ao longo da semana.
            </p>
            <Button asChild variant="ghost" className="w-fit">
              <Link href="/aluno/trilhas">
                Abrir trilhas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </section>
    </div>
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
    <Card className="bg-white/88">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-2">
          <span className="text-sm text-neutral-10/65">{title}</span>
          <strong className="text-2xl font-bold text-neutral-10">{value}</strong>
        </div>
        <Icon className="h-6 w-6 text-primary-40" />
      </div>
    </Card>
  );
}
