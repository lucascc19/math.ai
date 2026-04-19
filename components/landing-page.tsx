import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, GraduationCap, Instagram, Linkedin, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const monitors = [
  {
    name: "Lucas",
    description:
      "Monitor do projeto e estudante de Ciencia da Computacao, com foco em tecnologia, organizacao da plataforma e apoio no desenvolvimento das atividades.",
    course: "Ciencia da Computacao",
    instagram: "@lucas.a.definir",
    instagramHref: "#",
    linkedin: "LinkedIn a definir",
    linkedinHref: "#"
  },
  {
    name: "Gabi",
    description:
      "Monitora do projeto e estudante de Ciencia da Computacao, contribuindo com acolhimento, acompanhamento dos alunos e apoio nas acoes do projeto.",
    course: "Ciencia da Computacao",
    instagram: "@gabi.a.definir",
    instagramHref: "#",
    linkedin: "LinkedIn a definir",
    linkedinHref: "#"
  }
];

export function LandingPage() {
  return (
    <main className="pb-20">
      <div className="gradient-bar h-1" />

      <section className="content-shell mx-auto flex w-full flex-col gap-8 px-4 py-6 md:px-6 md:py-8 xl:px-8">
        <header className="sticky top-4 z-20 rounded-[30px] border border-black/5 bg-white/85 px-5 py-4 shadow-soft backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <Link className="flex items-center gap-3" href="/">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-95 ring-1 ring-primary-60/15">
                  <Image alt="Logo do projeto Base Matematica" src="/logo-bg-transparent.svg" width={34} height={34} priority />
                </div>
                <div className="grid gap-0.5">
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-primary-40">Projeto Base Matematica</span>
                  <span className="text-xs text-neutral-10/60">Matematica, acolhimento e acompanhamento</span>
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
                <a className="hover:text-primary-40" href="#instagram">
                  Instagram
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
          className="relative overflow-hidden rounded-[36px] border border-black/5 bg-white/85 px-6 py-8 shadow-soft md:px-8 md:py-10"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(134,215,188,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(119,149,248,0.14),transparent_28%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <div className="grid gap-5">
              <Badge variant="secondary">O que e o projeto</Badge>
              <div className="grid gap-4">
                <h1 className="max-w-4xl text-4xl font-bold leading-[0.98] text-neutral-10 md:text-6xl">
                  Um projeto de apoio em matematica basica com foco em acolhimento, clareza e acompanhamento.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-neutral-10/78 md:text-lg">
                  O Projeto Base Matematica foi pensado para fortalecer a aprendizagem em matematica basica e apoiar estudantes
                  que precisam de uma base mais solida no inicio da trajetoria academica.
                </p>
                <p className="max-w-3xl text-sm leading-7 text-neutral-10/70 md:text-base">
                  Nesta pagina, voce conhece a proposta do projeto, quem sao os monitores, quem coordena as atividades e onde
                  acompanhar atualizacoes. Depois do login, o estudante acessa a area da plataforma.
                </p>
              </div>
            </div>

            <div className="grid gap-4 self-start">
              <Card className="rounded-[28px] border border-primary-60/15 bg-primary-95 p-6">
                <div className="grid gap-3">
                  <Badge variant="primary">Resumo rapido</Badge>
                  <h2 className="text-2xl font-bold text-neutral-10">Aprender com mais apoio e mais contexto</h2>
                  <p className="text-sm leading-7 text-neutral-10/72">
                    A proposta do projeto e aproximar os alunos de uma experiencia mais acessivel, organizada e acolhedora.
                  </p>
                </div>
              </Card>

              <Card className="rounded-[28px] border border-secondary-60/20 bg-secondary-95 p-6">
                <div className="grid gap-2">
                  <span className="text-sm font-semibold uppercase tracking-[0.14em] text-secondary-30">Antes do login</span>
                  <p className="text-sm leading-7 text-neutral-10/72">
                    O usuario encontra aqui uma apresentacao institucional. O ambiente da plataforma fica disponivel apos o acesso.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="monitores" className="grid gap-6">
          <div className="grid gap-2">
            <Badge variant="secondary">Monitores</Badge>
            <h2 className="text-3xl font-bold text-neutral-10 md:text-4xl">Quem acompanha os estudantes no projeto</h2>
            <p className="max-w-3xl text-sm leading-7 text-neutral-10/72 md:text-base">
              Esta secao apresenta os monitores que apoiam as atividades e ajudam a aproximar os alunos da proposta do projeto.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {monitors.map((monitor, index) => (
              <Card
                key={monitor.name}
                className={`grid gap-5 rounded-[32px] border border-black/5 p-7 shadow-soft ${
                  index === 0 ? "bg-white/88" : "bg-white/82"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="grid gap-2">
                    <h3 className="text-2xl font-bold text-neutral-10">{monitor.name}</h3>
                    <p className="text-sm leading-7 text-neutral-10/74">{monitor.description}</p>
                  </div>
                  <div className="rounded-2xl bg-primary-95 p-3">
                    <GraduationCap className="h-6 w-6 text-primary-40" />
                  </div>
                </div>

                <div className="rounded-[22px] border border-black/5 bg-secondary-95 px-4 py-4 text-sm leading-7 text-neutral-10/78">
                  <strong>Curso:</strong> {monitor.course}
                </div>

                <div className="grid gap-3">
                  <SocialCard
                    href={monitor.instagramHref}
                    icon={Instagram}
                    label="Instagram"
                    value={monitor.instagram}
                    external={monitor.instagramHref !== "#"}
                  />
                  <SocialCard
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

        <section id="professor" className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <Card className="grid gap-5 rounded-[34px] border border-black/5 bg-white/85 p-8 shadow-soft">
            <Badge variant="tertiary">Professor coordenador</Badge>
            <div className="grid gap-3">
              <h2 className="text-3xl font-bold text-neutral-10 md:text-4xl">Prof. Dr. Anderson Feitoza Leitao Maia</h2>
              <p className="text-sm leading-7 text-neutral-10/76 md:text-base">
                Anderson Feitoza Leitao Maia e professor doutor vinculado a Universidade Federal do Ceara, Campus de Russas.
                Em paginas institucionais publicas, ele aparece como coordenador do curso de Engenharia de Software e associado a
                iniciativas de fortalecimento da base academica dos estudantes.
              </p>
              <p className="text-sm leading-7 text-neutral-10/76 md:text-base">
                Esta descricao foi escrita a partir de referencias publicas institucionais e academicas. Se voce quiser, depois
                podemos substituir esse texto por uma apresentacao mais personalizada do professor dentro do contexto do projeto.
              </p>
            </div>
          </Card>

          <Card className="grid gap-4 rounded-[34px] border border-black/5 bg-tertiary-95 p-8 shadow-soft">
            <Badge variant="tertiary">Links do professor</Badge>
            <p className="text-sm leading-7 text-neutral-10/72">
              Nao encontrei um LinkedIn publico confirmado durante a pesquisa. Deixei a area preparada para voce substituir pelo link correto.
            </p>
            <div className="grid gap-3">
              <SocialCard href="#" icon={Linkedin} label="LinkedIn" value="Adicionar link do professor" external={false} />
              <SocialCard
                href="https://www.escavador.com/sobre/3753599/anderson-feitoza-leitao-maia"
                icon={GraduationCap}
                label="Perfil academico"
                value="Escavador"
                external
              />
              <SocialCard
                href="https://prograd.ufc.br/pt/cursos-de-graduacao/engenharia-de-software-russas/"
                icon={Mail}
                label="Referencia institucional"
                value="UFC Russas"
                external
              />
            </div>
          </Card>
        </section>

        <section id="instagram" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
          <Card className="grid gap-5 rounded-[34px] border border-black/5 bg-white/85 p-8 shadow-soft">
            <Badge variant="primary">Instagram do projeto</Badge>
            <div className="grid gap-3">
              <h2 className="text-3xl font-bold text-neutral-10 md:text-4xl">@projetobasematematica</h2>
              <p className="max-w-3xl text-sm leading-7 text-neutral-10/74 md:text-base">
                Siga o perfil para acompanhar publicacoes, avisos, novidades e atualizacoes sobre as atividades do projeto.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
              <SocialCard
                href="https://www.instagram.com/projetobasematematica"
                icon={Instagram}
                label="Instagram oficial"
                value="@projetobasematematica"
                external
              />
              <Card className="grid content-start gap-2 rounded-[24px] border border-secondary-60/20 bg-secondary-95 p-5">
                <span className="text-sm font-semibold uppercase tracking-[0.12em] text-secondary-30">Acesso</span>
                <p className="text-sm leading-7 text-neutral-10/72">
                  O login e o cadastro continuam disponiveis no topo da pagina.
                </p>
              </Card>
            </div>
          </Card>

          <Card className="grid gap-4 rounded-[34px] border border-black/5 bg-primary-95 p-8 shadow-soft">
            <Badge variant="secondary">Entrar agora</Badge>
            <h2 className="text-3xl font-bold text-neutral-10">Acesse a plataforma</h2>
            <p className="text-sm leading-7 text-neutral-10/75">
              Esta pagina e a apresentacao publica do projeto. Para entrar no ambiente do aluno, use uma das opcoes abaixo.
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
    <div className="flex items-start gap-3 rounded-[22px] border border-black/5 bg-white/82 p-5 transition hover:border-primary-60/30">
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
