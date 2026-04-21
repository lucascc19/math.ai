"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  LayoutDashboard,
  Link2,
  Menu,
  ShieldCheck,
  UserCog,
  Users,
  X
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AccessibilityFab } from "@/components/accessibility-fab";
import { api } from "@/lib/api";
import type { SettingsInput } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type ShellRole = "admin" | "tutor" | "student";

type NavItem = {
  href: Route;
  label: string;
  icon: keyof typeof icons;
};

const icons = {
  dashboard: LayoutDashboard,
  users: UserCog,
  invites: ShieldCheck,
  links: Link2,
  content: BookOpen,
  students: Users
};

const shellConfig: Record<
  ShellRole,
  {
    title: string;
    subtitle: string;
    nav: NavItem[];
  }
> = {
  admin: {
    title: "Base Matemática",
    subtitle: "Administrador",
    nav: [
      { href: "/admin", label: "Visão geral", icon: "dashboard" },
      { href: "/admin/usuarios", label: "Usuários", icon: "users" },
      { href: "/admin/convites", label: "Convites", icon: "invites" },
      { href: "/admin/vinculos", label: "Vínculos", icon: "links" },
      { href: "/admin/conteudo", label: "Conteúdo", icon: "content" }
    ]
  },
  tutor: {
    title: "Base Matemática",
    subtitle: "Tutor",
    nav: [
      { href: "/tutor", label: "Visão geral", icon: "dashboard" },
      { href: "/tutor/alunos", label: "Alunos", icon: "students" },
      { href: "/tutor/convites", label: "Convites", icon: "invites" }
    ]
  },
  student: {
    title: "Base Matemática",
    subtitle: "Aluno",
    nav: [
      { href: "/aluno", label: "Visão geral", icon: "dashboard" },
      { href: "/aluno/trilhas", label: "Trilhas", icon: "content" }
    ]
  }
};

export function RoleShell({
  role,
  userName,
  initialSettings,
  children
}: {
  role: ShellRole;
  userName: string;
  initialSettings: SettingsInput;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const config = shellConfig[role];
  const rootHref = config.nav[0]?.href;

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.clear();
      setAccountMenuOpen(false);
      router.push("/login");
      router.refresh();
    }
  });

  const currentItem = useMemo(
    () =>
      config.nav.find((item) =>
        item.href === rootHref ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
      ) ?? config.nav[0],
    [config.nav, pathname, rootHref]
  );

  function SidebarContent({ compact = false }: { compact?: boolean }) {
    return (
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "border-b border-black/6 py-4",
            compact ? "flex flex-col items-center gap-3 px-2" : "flex items-start justify-between gap-3 px-4"
          )}
        >
          <div className={cn("flex items-start gap-3", compact && "justify-center")}>
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-200 text-white">
              <Image alt="Logo" src="/logo-bg-transparent.svg" width={24} height={24} />
            </div>
            {!compact && (
              <div className="grid gap-0.5">
                <strong className="text-sm font-semibold text-neutral-10">{config.title}</strong>
                <span className="text-xs text-neutral-10/60">{config.subtitle}</span>
              </div>
            )}
          </div>
          <div className={cn("flex items-center gap-1", compact && "w-full justify-center")}>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="focus-ring hidden h-9 w-9 items-center justify-center rounded-full text-neutral-10/62 transition hover:bg-primary-95 hover:text-primary-40 xl:inline-flex"
              aria-label={compact ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {compact ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-10 lg:hidden"
              aria-label="Fechar menu lateral"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn("py-4", compact ? "px-2" : "px-3")}>
          {!compact && (
            <div className="mb-2 px-2 text-xs font-medium uppercase tracking-[0.12em] text-neutral-10/45">Plataforma</div>
          )}
          <nav className="grid gap-1">
            {config.nav.map((item) => {
              const Icon = icons[item.icon];
              const isActive =
                item.href === rootHref ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "focus-ring group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                    compact && "mx-auto h-12 w-12 justify-center px-0 py-0",
                    isActive ? "bg-black/[0.04] text-neutral-10" : "text-neutral-10/76 hover:bg-black/[0.03] hover:text-neutral-10"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!compact && <span className="flex-1">{item.label}</span>}
                  {compact && (
                    <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-30 -translate-y-1/2 rounded-xl border border-primary-60/14 bg-white px-3 py-1.5 text-xs font-medium text-neutral-10 opacity-0 shadow-soft transition group-hover:opacity-100">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={cn("relative mt-auto border-t border-black/6 py-4", compact ? "px-2" : "px-4")}>
          {accountMenuOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-10"
                onClick={() => setAccountMenuOpen(false)}
                aria-label="Fechar menu da conta"
              />
              <div
                className={cn(
                  "absolute z-20 rounded-2xl border border-primary-60/14 bg-white p-2 shadow-soft",
                  compact ? "bottom-4 left-[calc(100%+12px)] w-[220px]" : "bottom-[88px] left-4 right-4"
                )}
              >
                <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6E8CEE,#4E9F86)] text-sm font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="grid min-w-0 gap-0.5">
                    <strong className="truncate text-sm text-neutral-10">{userName}</strong>
                    <span className="text-xs text-neutral-10/58">{config.subtitle}</span>
                  </div>
                </div>
                <div className="my-1 h-px bg-black/6" />
                <button
                  type="button"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-10 transition hover:bg-primary-95 disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4 text-primary-40" />
                  {logoutMutation.isPending ? "Saindo..." : "Sair"}
                </button>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => setAccountMenuOpen((value) => !value)}
            className={cn(
              "focus-ring relative z-20 rounded-2xl bg-black/[0.04] text-left",
              compact
                ? "mx-auto flex h-14 w-14 items-center justify-center p-0"
                : "flex w-full items-center gap-3 px-3 py-3"
            )}
            aria-label="Abrir menu da conta"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6E8CEE,#4E9F86)] text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!compact && (
              <>
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <strong className="truncate text-sm text-neutral-10">{userName}</strong>
                  <span className="text-xs text-neutral-10/58">{config.subtitle}</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-neutral-10/42 transition-transform",
                    accountMenuOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F6F7FB_100%)]">
      <div
        className={cn(
          "grid min-h-screen w-full",
          collapsed ? "xl:grid-cols-[80px_minmax(0,1fr)]" : "xl:grid-cols-[280px_minmax(0,1fr)]"
        )}
      >
        <aside className="hidden border-r border-black/6 bg-[#FCFCFD] xl:block">
          <div className="sticky top-0 h-screen">
            <SidebarContent compact={collapsed} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-black/6 bg-white/88 px-4 py-3 backdrop-blur xl:hidden">
            <div className="grid gap-0.5">
              <span className="text-xs uppercase tracking-[0.12em] text-neutral-10/45">{config.subtitle}</span>
              <strong className="text-sm text-neutral-10">{currentItem?.label ?? config.title}</strong>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/6 bg-white text-neutral-10"
              aria-label="Abrir menu lateral"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="min-w-0 p-4 md:p-6">{children}</div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/20"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu lateral"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(86vw,300px)] border-r border-black/6 bg-[#FCFCFD] shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <AccessibilityFab initialSettings={initialSettings} />
    </main>
  );
}
