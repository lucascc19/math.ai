import Link from "next/link";
import { Role } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import { requirePageRole } from "@/lib/server/guards";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole([Role.TUTOR, Role.ADMIN]);

  return (
    <main className="min-h-screen pb-20">
      <div className="gradient-bar h-1" />
      <div className="content-shell mx-auto flex w-full flex-col gap-6 px-4 py-8 md:px-6 xl:px-8">
        <header className="rounded-[28px] border border-black/5 bg-white/85 px-5 py-4 shadow-soft backdrop-blur dark:border-white/10 dark:bg-neutral-20/70 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <Link
                href="/dashboard"
                className="focus-ring inline-flex items-center gap-2 text-sm font-semibold text-primary-40 hover:underline dark:text-primary-70"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-10/70 dark:text-neutral-80">
                <Link className="hover:text-primary-40 dark:hover:text-primary-70" href="/tutor/alunos">
                  Alunos
                </Link>
              </nav>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-40 dark:text-primary-70">
              Painel do tutor
            </span>
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
