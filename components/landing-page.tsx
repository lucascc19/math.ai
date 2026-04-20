import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ExternalLink, GraduationCap, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const monitors = [
  {
    name: "Lucas",
    role: "Monitor do projeto",
    description:
      "Estudante de Ciência da Computação, com foco em tecnologia, organização da plataforma e apoio no desenvolvimento das atividades.",
    course: "Ciência da Computação",
    instagram: "@lucas.a.definir",
    instagramHref: "#",
    linkedin: "LinkedIn a definir",
    linkedinHref: "#"
  },
  {
    name: "Gabi",
    role: "Monitora do projeto",
    description:
      "Estudante de Ciência da Computação, contribuindo com acolhimento, acompanhamento dos alunos e apoio nas ações do projeto.",
    course: "Ciência da Computação",
    instagram: "@gabi.a.definir",
    instagramHref: "#",
    linkedin: "LinkedIn a definir",
    linkedinHref: "#"
  }
];

const cardBase = "rounded-[28px] border border-black/5 bg-white/85 p-6 md:p-8 shadow-soft";
const accentCard = "rounded-[28px] border border-black/5 p-6 md:p-8 shadow-soft";

export function LandingPage() {
  return (
    <main>
      <div className="gradient-bar h-1" />

      <section className="content-shell mx-auto flex w-full flex-col gap-8 px-4 py-6 md:px-6 md:py-8 xl:px-8">
        <header className="sticky top-4 z-20 rounded-[28px] border border-black/5 bg-white/85 px-5 py-4 shadow-soft backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Link className="flex items-center gap-3" href="/">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-95 ring-1 ring-primary-60/15">
                  <Image alt="Logo do projeto Base Matemática" src="/logo-bg-transparent.svg" width={34} height={34} priority />
                </div>
                <div className="grid gap-0.5">
                  <span className="text-sm font-bold uppercase  text-primary-40">Projeto Base Matemática</span>
                  <span className="text-xs text-neutral-10/60">Matemática, acolhimento e acompanhamento</span>
                </div>
              </Link>

              <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-10/70 xl:ml-10">
                <a className="hover:text-primary-40" href="#projeto">
                  Projeto
                </a>
                <a className="hover:text-primary-40" href="#monitores">
                  Monitores
                </a>
                <a className="hover:text-primary-40" href="#professor">
                  Professor
                </a>
                <a className="hover:text-primary-40" href="#contato">
                  Contato
                </a>
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/cadastro">Cadastrar</Link>
              </Button>
            </div>
          </div>
        </header>

        <section
          id="projeto"
          className="relative overflow-hidden rounded-[28px] border border-black/5 bg-white/85 px-6 py-8 shadow-soft md:px-8 md:py-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(134,215,188,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(119,149,248,0.14),transparent_28%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="grid gap-5">
              <Badge variant="secondary">O que é o projeto</Badge>
              <div className="grid gap-4">
                <h1 className="max-w-4xl text-4xl font-bold leading-[0.98] text-neutral-10 md:text-6xl">
                  Um projeto de apoio em matemática básica com foco em acolhimento, clareza e acompanhamento.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-neutral-10/78 md:text-lg">
                  O Projeto Base Matemática fortalece a aprendizagem de estudantes que precisam de uma base mais sólida
                  no início da trajetória acadêmica, com materiais claros e acompanhamento próximo dos monitores.
                </p>
              </div>
            </div>

            <Card className={`${accentCard} self-start bg-primary-95`}>
              <div className="grid gap-3">
                <Badge variant="primary">Antes do login</Badge>
                <h2 className="text-2xl font-bold text-neutral-10">Uma apresentação pública do projeto</h2>
                <p className="text-sm leading-7 text-neutral-10/75">
                  Aqui você conhece a proposta, os monitores e o professor coordenador. Depois de fazer login,
                  o estudante acessa a área da plataforma.
                </p>
              </div>
            </Card>
          </div>
        </section>

        <section id="monitores" className="grid gap-6">
          <div className="grid gap-2">
            <Badge variant="secondary">Monitores</Badge>
            <h2 className="text-3xl font-bold text-neutral-10 md:text-4xl">Quem acompanha os estudantes no projeto</h2>
            <p className="max-w-3xl text-sm leading-7 text-neutral-10/72 md:text-base">
              Os monitores apoiam as atividades e aproximam os alunos da proposta do projeto.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {monitors.map((monitor) => (
              <Card key={monitor.name} className={`${cardBase} grid gap-5`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-95 text-xl font-bold text-primary-40 ring-1 ring-primary-60/20">
                    {monitor.name.charAt(0)}
                  </div>
                  <div className="grid gap-0.5">
                    <h3 className="text-xl font-bold text-neutral-10">{monitor.name}</h3>
                    <span className="text-sm text-neutral-10/65">{monitor.role}</span>
                  </div>
                </div>

                <p className="text-sm leading-7 text-neutral-10/74">{monitor.description}</p>

                <div className="w-fit flex items-center gap-2 rounded-xl border border-tertiary-60/20 bg-tertiary-95 px-3 py-1 text-sm text-tertiary-20">
                  <GraduationCap className="h-4 w-4 shrink-0 text-tertiary-20" />
                  <span className="font-medium">
                  {monitor.course}
                  </span>
                </div>

                <div className="grid gap-2 border-t border-black/5 pt-4">
                  <SocialRow
                    href={monitor.instagramHref}
                    icon={Instagram}
                    label="Instagram"
                    value={monitor.instagram}
                    external={monitor.instagramHref !== "#"}
                  />
                  <SocialRow
                    href={monitor.linkedinHref}
                    icon={Linkedin}
                    label="LinkedIn"
                    value={monitor.linkedin}
                    external={monitor.linkedinHref !== "#"}
                  />
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="professor">
          <Card className={`${cardBase} grid gap-5`}>
            <Badge variant="tertiary">Professor coordenador</Badge>
            <div className="grid gap-3">
              <h2 className="text-3xl font-bold text-neutral-10 md:text-4xl">Prof. Dr. Anderson Feitoza Leitão Maia</h2>
              <p className="text-sm leading-7 text-neutral-10/76 md:text-base">
                Professor doutor vinculado à Universidade Federal do Ceará, Campus de Russas. Coordena o curso de
                Engenharia de Software e está associado a iniciativas de fortalecimento da base acadêmica dos estudantes.
              </p>
            </div>

            <div className="grid gap-2 border-t border-black/5 pt-4 sm:grid-cols-2">
              <SocialRow href="#" icon={Linkedin} label="LinkedIn" value="LinkedIn a definir" external={false} />
              <SocialRow
                href="https://www.escavador.com/sobre/3753599/anderson-feitoza-leitao-maia"
                icon={GraduationCap}
                label="Perfil acadêmico"
                value="Escavador"
                external
              />
            </div>
          </Card>
        </section>

        <section id="contato" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
          <Card className={`${cardBase} grid gap-5`}>
            <Badge variant="primary">Contato</Badge>
            <div className="grid gap-3">
              <h2 className="text-3xl font-bold text-neutral-10 md:text-4xl">Fale com o projeto</h2>
              <p className="max-w-3xl text-sm leading-7 text-neutral-10/74 md:text-base">
                Acompanhe publicações, avisos e novidades pelos canais oficiais do projeto.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SocialCard
                href="https://www.instagram.com/projetobasematematica"
                icon={Instagram}
                label="Instagram"
                value="@projetobasematematica"
                external
              />
              <SocialCard
                href="#"
                icon={Linkedin}
                label="LinkedIn"
                value="LinkedIn a definir"
                external={false}
              />
            </div>
          </Card>

          <Card className={`${accentCard} grid gap-4 bg-primary-95`}>
            <Badge variant="secondary">Entrar agora</Badge>
            <h2 className="text-3xl font-bold text-neutral-10">Acesse a plataforma</h2>
            <p className="text-sm leading-7 text-neutral-10/75">
              Para entrar no ambiente do aluno, faça login ou crie sua conta.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link href="/login">
                  Fazer login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/cadastro">Criar conta</Link>
              </Button>
            </div>
          </Card>
        </section>
      </section>
    </main>
  );
}

function SocialRow({
  href,
  icon: Icon,
  label,
  value,
  external
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  external?: boolean;
}) {
  const isPlaceholder = href === "#";

  const content = (
    <div className="flex items-center gap-3 rounded-[14px] px-2 py-2 transition hover:bg-primary-95/60">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-95 ring-1 ring-primary-60/15">
        <Icon className="h-4 w-4 text-primary-40" />
      </div>
      <div className="grid">
        <span className="text-xs font-medium text-neutral-10/60">{label}</span>
        <span className="text-sm font-semibold text-neutral-10">{value}</span>
      </div>
      {external && !isPlaceholder ? <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-neutral-10/45" /> : null}
    </div>
  );

  if (isPlaceholder) {
    return content;
  }

  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      {content}
    </a>
  );
}

function SocialCard({
  href,
  icon: Icon,
  label,
  value,
  external
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  external?: boolean;
}) {
  const isPlaceholder = href === "#";

  const content = (
    <div className="flex items-start gap-3 rounded-[18px] border border-black/5 bg-white/85 p-5 transition hover:border-primary-60/30">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-40" />
      <div className="grid gap-1">
        <span className="text-sm font-semibold text-neutral-10">{label}</span>
        <span className="text-sm leading-6 text-neutral-10/74">{value}</span>
      </div>
      {external && !isPlaceholder ? <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-neutral-10/45" /> : null}
    </div>
  );

  if (isPlaceholder) {
    return content;
  }

  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
      {content}
    </a>
  );
}
