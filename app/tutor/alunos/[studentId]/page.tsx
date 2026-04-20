import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CircleCheckBig, Flame, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/server/prisma";
import { NotFoundError } from "@/lib/server/permissions";
import { getStudentProgress } from "@/lib/server/tutoring";

const prismaDb = prisma as any;

type PageProps = { params: Promise<{ studentId: string }> };

export default async function TutorStudentDetailPage({ params }: PageProps) {
  const { studentId } = await params;

  let data: Awaited<ReturnType<typeof getStudentProgress>>;
  try {
    data = await getStudentProgress(studentId);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }

  const student = await prismaDb.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, active: true }
  });

  if (!student) notFound();

  const accuracy = data.totals.attempts > 0 ? Math.round((data.totals.correct / data.totals.attempts) * 100) : 0;

  return (
    <div className="grid gap-6">
      <Link
        href="/tutor/alunos"
        className="focus-ring inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a lista
      </Link>

      <div className="grid gap-2">
        <Badge variant="primary">Perfil do aluno</Badge>
        <h1 className="text-3xl font-bold text-neutral-10 dark:text-neutral-95 md:text-4xl">{student.name}</h1>
        <p className="text-sm text-neutral-10/70 dark:text-neutral-80">{student.email}</p>
        {!student.active && (
          <span className="w-fit rounded-full bg-neutral-90 px-2.5 py-1 text-xs font-bold text-neutral-30 dark:bg-neutral-20/60 dark:text-neutral-70">
            Conta desativada
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricTile title="Tentativas" value={String(data.totals.attempts)} icon={Gauge} />
        <MetricTile title="Acertos" value={String(data.totals.correct)} icon={CircleCheckBig} />
        <MetricTile title="Precisão" value={`${accuracy}%`} icon={Flame} />
      </div>

      <Card className="grid gap-4 rounded-2xl border border-black/5 bg-white/85 p-6 shadow-soft dark:border-white/10 dark:bg-neutral-20/70 md:p-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary-40 dark:text-primary-70" />
          <h2 className="text-lg font-bold text-neutral-10 dark:text-neutral-95">Trilhas</h2>
        </div>

        <div className="grid gap-3">
          {data.progress.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-black/10 bg-white/40 p-6 text-center text-sm text-neutral-10/70 dark:border-white/15 dark:bg-neutral-20/40 dark:text-neutral-80">
              Aluno ainda não iniciou nenhuma trilha.
            </p>
          ) : (
            data.progress.map((track: (typeof data.progress)[number]) => {
              const trackAccuracy = track.attempts > 0 ? Math.round((track.correct / track.attempts) * 100) : 0;
              return (
                <div
                  key={track.id}
                  className="grid gap-3 rounded-2xl border border-black/5 bg-white/70 p-5 dark:border-white/10 dark:bg-neutral-20/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid gap-0.5">
                      <span className="text-sm font-semibold text-neutral-10 dark:text-neutral-95">
                        {track.skillTrack.name}
                      </span>
                      <span className="text-xs text-neutral-10/65 dark:text-neutral-80">
                        Lição atual: {track.lessonIndex + 1} · Streak: {track.streak}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-primary-40 dark:text-primary-70">
                      {trackAccuracy}% de acerto
                    </span>
                  </div>
                  <Progress value={track.mastery} label={`Domínio: ${track.mastery}%`} />
                  <div className="flex flex-wrap gap-4 text-xs text-neutral-10/65 dark:text-neutral-80">
                    <span>{track.attempts} tentativas</span>
                    <span>{track.correct} acertos</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function MetricTile({
  title,
  value,
  icon: Icon
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="grid gap-3 rounded-2xl border border-black/5 bg-white/85 p-5 shadow-soft dark:border-white/10 dark:bg-neutral-20/70">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary-40 dark:text-primary-70">
          {title}
        </span>
        <Icon className="h-4 w-4 text-primary-40 dark:text-primary-70" />
      </div>
      <span className="text-2xl font-bold text-neutral-10 dark:text-neutral-95">{value}</span>
    </Card>
  );
}
