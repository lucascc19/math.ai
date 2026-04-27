"use client";

import { ArrowRight, ArrowUpRight, BarChart3, Building2, Code, Cog, Cpu, GraduationCap, Menu, X, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   Types
   ============================================================ */
type Tone = "primary" | "secondary" | "tertiary";

interface Equation {
  lhs: string;
  mid: string;
  rhs: string;
  sol: string;
}

interface MathConstant {
  sym: string;
  digits: string;
  color: string;
}

interface Course {
  name: string;
  lines: string[];
  tone: Tone;
  Icon: LucideIcon;
}

interface Pillar {
  tag: string;
  title: string;
  body: string;
  tone: Tone;
}

interface PersonLink {
  key: string;
  val: string;
  href: string;
}

interface Person {
  name: string;
  role: string;
  desc: string;
  course: string;
  initial: string;
  constant: number;
  idx: string;
  links: PersonLink[];
}

interface SineWaveProps {
  color?: string;
  height?: number;
  amp?: number;
  freq?: number;
  speed?: number;
}

/* ============================================================
   Data
   ============================================================ */
const EQUATIONS: Equation[] = [
  { lhs: "x² − 5x + 6", mid: "=", rhs: "0", sol: "x ∈ {2, 3}" },
  { lhs: "∫₀¹ 2x dx", mid: "=", rhs: "?", sol: "= 1" },
  { lhs: "lim x→0  sin(x)/x", mid: "=", rhs: "?", sol: "= 1" },
  { lhs: "a² + b²", mid: "=", rhs: "c²", sol: "Pitágoras" },
  { lhs: "d/dx [ x³ ]", mid: "=", rhs: "?", sol: "= 3x²" },
  { lhs: "Σₙ₌₁⁴ n", mid: "=", rhs: "?", sol: "= 10" }
];

const CONSTANTS: MathConstant[] = [
  { sym: "π", digits: "3.14159265358979323846", color: "var(--color-primary-40)" },
  { sym: "φ", digits: "1.61803398874989484820", color: "var(--color-tertiary-40)" },
  { sym: "e", digits: "2.71828182845904523536", color: "var(--color-secondary-40)" }
];

const FLOAT_SYMBOLS = ["∑", "∫", "√", "π", "∞", "∂", "Δ", "θ", "φ", "λ"] as const;

const ACCENT_COLORS = [
  "var(--color-primary-base)",
  "var(--color-secondary-base)",
  "var(--color-tertiary-base)"
] as const;

const COURSES: Course[] = [
  { name: "Ciência da Computação", lines: ["Ciência da", "Computação"], tone: "primary", Icon: Cpu },
  { name: "Engenharia de Software", lines: ["Engenharia de", "Software"], tone: "tertiary", Icon: Code },
  { name: "Engenharia Civil", lines: ["Engenharia", "Civil"], tone: "secondary", Icon: Building2 },
  { name: "Engenharia Mecânica", lines: ["Engenharia", "Mecânica"], tone: "primary", Icon: Cog },
  { name: "Engenharia de Produção", lines: ["Engenharia de", "Produção"], tone: "tertiary", Icon: BarChart3 }
];

const PILLARS: Pillar[] = [
  {
    tag: "Σ",
    title: "Soma do que importa",
    body: "Conteúdos selecionados para cobrir as bases que sustentam todo o resto: aritmética, álgebra, funções e introdução ao cálculo.",
    tone: "primary"
  },
  {
    tag: "lim",
    title: "No seu ritmo",
    body: "Trilhas progressivas com revisões guiadas. Sem pressa, sem julgamento — o foco está no entendimento real.",
    tone: "secondary"
  },
  {
    tag: "∂",
    title: "Acompanhamento próximo",
    body: "Monitores e professor coordenador acompanham a evolução, ajustam o caminho e respondem dúvidas quando surgem.",
    tone: "tertiary"
  }
];

const PEOPLE: Person[] = [
  {
    name: "Prof. Dr. Anderson F. L. Maia",
    role: "Professor coordenador",
    desc: "Professor doutor vinculado à UFC, Campus de Russas. Coordena o curso de Engenharia de Software e está associado a iniciativas de fortalecimento da base acadêmica dos estudantes.",
    course: "UFC · Campus Russas",
    initial: "A",
    constant: 0,
    idx: "P.01",
    links: [
      {
        key: "escavador",
        val: "Escavador · perfil acadêmico",
        href: "https://www.escavador.com/sobre/3753599/anderson-feitoza-leitao-maia"
      }
    ]
  },
  {
    name: "Lucas",
    role: "Monitor do projeto",
    desc: "Estudante de Ciência da Computação, com foco em tecnologia, organização da plataforma e apoio no desenvolvimento das atividades.",
    course: "Ciência da Computação",
    initial: "L",
    constant: 1,
    idx: "M.01",
    links: [{ key: "linkedin", val: "LinkedIn", href: "https://www.linkedin.com/in/lucas-ts/" }]
  },
  {
    name: "Gabi",
    role: "Monitora do projeto",
    desc: "Estudante de Ciência da Computação, contribuindo com acolhimento, acompanhamento dos alunos e apoio nas ações do projeto.",
    course: "Ciência da Computação",
    initial: "G",
    constant: 2,
    idx: "M.02",
    links: [{ key: "linkedin", val: "LinkedIn", href: "https://www.linkedin.com/in/gabriela-sousa-de-oliveira//" }]
  }
];

const NAV_LINKS = [
  { id: "projeto", label: "Projeto" },
  { id: "cursos", label: "Cursos" },
  { id: "pessoas", label: "Pessoas" },
  { id: "participar", label: "Participar" }
] as const;

const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary-95 text-primary-40",
  secondary: "bg-secondary-95 text-secondary-40",
  tertiary: "bg-tertiary-95 text-tertiary-40"
};

const ORBITAL_FILL: Record<Tone, string> = {
  primary: "#EFF0FF",
  secondary: "#BAFFE6",
  tertiary: "#F7EDFF"
};

const ORBITAL_TEXT: Record<Tone, string> = {
  primary: "var(--color-primary-40)",
  secondary: "var(--color-secondary-40)",
  tertiary: "var(--color-tertiary-40)"
};

/* ============================================================
   SineWave
   ============================================================ */
function SineWave({ color = "var(--color-primary-base)", height = 80, amp = 14, freq = 0.03, speed = 0.012 }: SineWaveProps) {
  const ref = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    let raf = 0;
    let t = 0;
    const path = ref.current;
    if (!path) return;
    const W = 800;
    const tick = () => {
      t += speed;
      const pts: string[] = [];
      for (let x = 0; x <= W; x += 6) {
        const y = height / 2 + Math.sin(x * freq + t) * amp;
        pts.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(2)}`);
      }
      path.setAttribute("d", pts.join(" "));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [amp, freq, speed, height]);

  return (
    <svg
      viewBox={`0 0 800 ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
      aria-hidden
    >
      <path ref={ref} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ============================================================
   EquationCycler
   ============================================================ */
function EquationCycler() {
  const [i, setI] = useState(0);
  const [showSol, setShowSol] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSol(true), 1400);
    const t2 = setTimeout(() => {
      setShowSol(false);
      setI((v) => (v + 1) % EQUATIONS.length);
    }, 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [i]);

  const eq = EQUATIONS[i];

  return (
    <div className="relative border border-neutral-10/[8%] rounded-2xl bg-neutral-base px-6 py-[22px] overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-gradient-to-r before:from-primary-base before:via-secondary-base before:to-tertiary-base">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-neutral-10/55">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-base animate-bm-pulse" />
        resolvendo
      </div>
      <div
        className="mt-3.5 font-mono text-[clamp(18px,2vw,24px)] flex flex-wrap gap-2.5 items-baseline animate-bm-slide-in"
        key={`eq-${i}`}
      >
        <span>{eq.lhs}</span>
        <span className="text-neutral-10/35">{eq.mid}</span>
        <span className="text-primary-40">{eq.rhs}</span>
      </div>
      <div
        className={`mt-2.5 font-mono text-sm text-secondary-40 flex items-center gap-2 transition-all duration-300 ${
          showSol ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        }`}
        key={`sol-${i}`}
      >
        <span className="text-neutral-10/35">→</span>
        <span>{eq.sol}</span>
      </div>
    </div>
  );
}

/* ============================================================
   ConstantTicker
   ============================================================ */
function ConstantTicker({ idx = 0 }: { idx?: number }) {
  const c = CONSTANTS[idx % CONSTANTS.length];
  const [n, setN] = useState(4);

  useEffect(() => {
    const id = setInterval(() => {
      setN((v) => (v >= c.digits.length ? 4 : v + 1));
    }, 280);
    return () => clearInterval(id);
  }, [c.digits.length]);

  return (
    <div className="flex items-baseline gap-1.5 font-mono text-[13px] tabular-nums text-neutral-10/70">
      <span className="text-base font-medium" style={{ color: c.color }}>
        {c.sym}
      </span>
      <span className="text-neutral-10/35">=</span>
      <span className="tracking-[-0.02em] flex items-baseline">
        {c.digits.slice(0, n)}
        <span className="inline-block w-1.5 h-[13px] ml-0.5 bg-primary-base animate-bm-blink self-center" />
      </span>
    </div>
  );
}

/* ============================================================
   FloatingSymbols
   ============================================================ */
function FloatingSymbols({ count = 8 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        sym: FLOAT_SYMBOLS[i % FLOAT_SYMBOLS.length],
        top: 8 + Math.random() * 80,
        left: 4 + Math.random() * 92,
        size: 18 + Math.random() * 28,
        delay: Math.random() * 6,
        dur: 14 + Math.random() * 10,
        color: ACCENT_COLORS[i % 3]
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute font-mono font-light opacity-[0.13] select-none animate-bm-float"
          style={{
            top: `${it.top}%`,
            left: `${it.left}%`,
            fontSize: `${it.size}px`,
            color: it.color,
            animationDelay: `${it.delay}s`,
            animationDuration: `${it.dur}s`
          }}
        >
          {it.sym}
        </span>
      ))}
    </div>
  );
}

/* ============================================================
   Header
   ============================================================ */
function Header() {
  const [active, setActive] = useState("projeto");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-35% 0px -55% 0px" }
    );
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-8 px-[clamp(20px,5vw,64px)] py-[18px] bg-white/85 backdrop-blur-[14px] border-b border-neutral-10/[8%]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 grid place-items-center bg-neutral-95 border border-neutral-10/[8%] rounded-[10px]">
            <Image src="/logo-bg-transparent.svg" alt="" width={28} height={28} priority />
          </div>
          <div className="grid leading-[1.05]">
            <span className="text-sm font-semibold tracking-[-0.01em]">Base Matemática</span>
            <span className="font-mono text-xs text-neutral-10/55 mt-1 tracking-[0.02em]">
              projeto de apoio acadêmico
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-7 justify-self-center max-[700px]:hidden">
          {NAV_LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`relative py-1.5 text-[13px] font-medium transition-colors
                after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[-2px]
                after:h-px after:bg-neutral-10 after:transition-transform after:duration-200
                after:ease-out after:origin-left
                ${
                  active === id
                    ? "text-primary-base after:scale-x-100 after:bg-primary-base"
                    : "text-neutral-10/55 hover:text-neutral-10 after:scale-x-0"
                }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex gap-2.5 items-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-[9px] rounded-full text-[13px] font-medium text-neutral-10 bg-transparent border border-neutral-10/[12%] hover:bg-primary-base hover:text-white transition-all active:translate-y-px whitespace-nowrap"
          >
            Login
          </Link>
          <button
            className="hidden max-[700px]:flex items-center justify-center w-9 h-9 rounded-lg border border-neutral-10/[12%] hover:bg-neutral-10/5 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={16} strokeWidth={2.5} /> : <Menu size={16} strokeWidth={2.5} />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="hidden max-[700px]:flex flex-col gap-1 sticky top-[62px] z-40 bg-white/95 backdrop-blur-[14px] border-b border-neutral-10/[8%] px-5 py-3">
          {NAV_LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active === id
                  ? "text-primary-base bg-primary-95"
                  : "text-neutral-10/55 hover:text-neutral-10 hover:bg-neutral-10/5"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}

/* ============================================================
   Hero
   ============================================================ */
function Hero() {
  return (
    <section
      id="projeto"
      className="relative border-b border-neutral-10/[8%] py-[clamp(64px,8vw,110px)] pb-[clamp(80px,10vw,140px)] [background-image:radial-gradient(circle,rgba(26,28,29,0.22)_0.8px,transparent_0.8px)] [background-size:22px_22px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,white_0%,rgba(255,255,255,0.4)_60%,transparent_100%)] pointer-events-none" />
      <FloatingSymbols count={8} />

      <div className="relative z-[2] grid grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)] gap-[clamp(32px,5vw,80px)] items-end max-[880px]:grid-cols-1">
        <div className="relative">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-10/55">
            <span className="text-neutral-10 font-medium">01 / 04</span>
            <span className="opacity-40">·</span>
            <span>antes do login</span>
          </div>

          <h1 className="text-[clamp(40px,6vw,72px)] font-normal leading-[1.02] tracking-[-0.025em] mt-6 max-w-[18ch] text-balance">
            Apoio em{" "}
            <em className="not-italic font-medium relative bg-gradient-to-r from-primary-40 to-tertiary-40 bg-clip-text text-transparent after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-1 after:h-2 after:bg-secondary-95 after:z-[-1] after:rounded">
              matemática básica
            </em>{" "}
            para todos os cursos do campus.
          </h1>

          <p className="mt-6 max-w-[56ch] text-[clamp(15px,1.4vw,18px)] leading-[1.65] text-neutral-10/70">
            O Projeto Base Matemática fortalece a aprendizagem de estudantes que precisam de uma base mais sólida no
            início da trajetória acadêmica com materiais claros, monitores presentes e o acesso por convite do tutor.
          </p>

          <div className="flex flex-wrap gap-3 mt-9">
            <a
              href="#participar"
              className="inline-flex items-center gap-2 px-[22px] py-[13px] rounded-full text-sm font-medium bg-primary-base text-white hover:bg-primary-40 transition-colors active:translate-y-px"
            >
              Quero participar
              <ArrowRight size={16} strokeWidth={2} />
            </a>
            <a
              href="#cursos"
              className="inline-flex items-center gap-2 px-[22px] py-[13px] rounded-full text-sm font-medium text-neutral-10 bg-transparent border border-neutral-10/[12%] hover:bg-neutral-10/5 transition-colors active:translate-y-px"
            >
              Ver cursos atendidos
            </a>
          </div>

          <div className="flex items-center flex-wrap gap-6 mt-14 pt-6 border-t border-neutral-10/[8%]">
            <div className="grid gap-1">
              <span className="font-mono text-sm font-medium">UFC</span>
              <span className="text-[11px] text-neutral-10/55 tracking-[0.02em]">Campus Russas</span>
            </div>
            <div className="w-px h-7 bg-neutral-10/[8%]" />
            <div className="grid gap-1">
              <span className="font-mono text-sm font-medium">5 cursos</span>
              <span className="text-[11px] text-neutral-10/55 tracking-[0.02em]">do campus</span>
            </div>
            <div className="w-px h-7 bg-neutral-10/[8%]" />
            <ConstantTicker idx={0} />
          </div>
        </div>

        <div className="grid gap-4">
          <EquationCycler />
          <div className="border border-neutral-10/[8%] rounded-[14px] bg-neutral-base p-5 grid gap-2.5">
            {[
              { key: "f(x)", val: "aprendizado contínuo" },
              { key: "∂", val: "acompanhamento próximo" },
              { key: "∑", val: "trilhas estruturadas" }
            ].map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[48px_1fr] items-center gap-2 py-1.5 border-b border-dashed border-neutral-10/[8%] text-[13px] last:border-b-0"
              >
                <span className="font-mono text-sm text-primary-40 font-medium">{row.key}</span>
                <span className="text-neutral-10/70">{row.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute left-0 right-0 bottom-4 pointer-events-none opacity-45 z-0">
        <SineWave color="var(--color-primary-base)" height={64} amp={10} freq={0.022} speed={0.014} />
      </div>
    </section>
  );
}

/* ============================================================
   Pillars
   ============================================================ */
function Pillars() {
  return (
    <section className="relative py-[clamp(64px,8vw,110px)] border-b border-neutral-10/[8%]">
      <div className="grid gap-3 mb-12">
        <span className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-10/55">
          <span className="text-neutral-10 font-medium">02 / 04</span>
          <span className="opacity-40">·</span>
          <span>como o projeto funciona</span>
        </span>
        <h2 className="text-[clamp(30px,4vw,44px)] font-normal leading-[1.05] tracking-[-0.02em] mt-4 max-w-[22ch] text-balance">
          Três princípios, uma proposta clara.
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-px bg-neutral-10/[8%] border border-neutral-10/[8%] rounded-[18px] overflow-hidden max-[880px]:grid-cols-1">
        {PILLARS.map((p, i) => (
          <article
            key={p.title}
            className="bg-neutral-base p-[32px_28px_24px] grid gap-3.5 relative transition-colors hover:bg-neutral-95"
          >
            <div className={`w-[46px] h-[46px] rounded-[12px] grid place-items-center font-mono text-lg font-medium ${TONE_CLASSES[p.tone]}`}>
              <span>{p.tag}</span>
            </div>
            <div className="absolute top-7 right-7 font-mono text-[11px] text-neutral-10/35 tracking-[0.08em]">
              0{i + 1}
            </div>
            <h3 className="text-[22px] font-medium tracking-[-0.01em] m-0">{p.title}</h3>
            <p className="m-0 text-sm leading-[1.65] text-neutral-10/70">{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   CoursesOrbital
   ============================================================ */
function CoursesOrbital() {
  const cx = 300;
  const cy = 310;
  const orbitR = 170;
  const nodeR = 28;
  const labelR = 225;

  const nodes = COURSES.map((c, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / COURSES.length;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const textAnchor: "start" | "end" | "middle" = cos > 0.25 ? "start" : cos < -0.25 ? "end" : "middle";

    return {
      ...c,
      x: cx + orbitR * cos,
      y: cy + orbitR * sin,
      lx: cx + labelR * cos,
      ly: cy + labelR * sin,
      textAnchor
    };
  });

  return (
    <div className="flex justify-center w-full">
      <svg
        viewBox="-48 0 696 600"
        className="w-full max-w-[620px] overflow-visible"
        role="img"
        aria-label="Diagrama orbital dos cursos atendidos pelo projeto"
      >
        <circle cx={cx} cy={cy} r={orbitR + 52} fill="none" stroke="rgba(56,88,183,0.10)" strokeWidth={1} strokeDasharray="2 6" />
        <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke="rgba(56,88,183,0.20)" strokeWidth={1} strokeDasharray="5 8" />
        <circle cx={cx} cy={cy} r={54} fill="none" stroke="rgba(56,88,183,0.12)" strokeWidth={0.75} strokeDasharray="2 5" />

        {nodes.map((c) => (
          <line
            key={`l-${c.name}`}
            x1={cx} y1={cy} x2={c.x} y2={c.y}
            stroke="rgba(56,88,183,0.16)" strokeWidth={0.85} strokeDasharray="3 6"
          />
        ))}

        {nodes.map((c) => (
          <g key={c.name}>
            <circle cx={c.x} cy={c.y} r={nodeR} fill={ORBITAL_FILL[c.tone]} stroke="rgba(26,28,29,0.09)" strokeWidth={0.8} />
            <g transform={`translate(${c.x - 10} ${c.y - 10})`} aria-hidden>
              <c.Icon size={20} strokeWidth={2} color={ORBITAL_TEXT[c.tone]} />
            </g>
            {c.lines.map((line, li) => (
              <text
                key={line}
                x={c.lx}
                y={c.ly - (c.lines.length - 1) * 8 + li * 16}
                textAnchor={c.textAnchor}
                fontSize={14}
                fontFamily="inherit"
                fill="rgba(26,28,29,0.62)"
                fontWeight={500}
              >
                {line}
              </text>
            ))}
          </g>
        ))}

        <circle cx={cx} cy={cy} r={52} fill="white" stroke="rgba(26,28,29,0.1)" strokeWidth={1} />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="inherit" fill="#1A1C1D" letterSpacing={-0.5}>
          UFC
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={12} fontFamily="ui-monospace, monospace" fill="rgba(26,28,29,0.42)" letterSpacing={0.3}>
          Campus Russas
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
   Cursos
   ============================================================ */
function Cursos() {
  return (
    <section
      id="cursos"
      className="relative py-[clamp(64px,8vw,110px)] border-b border-neutral-10/[8%] [background-image:radial-gradient(circle,rgba(26,28,29,0.22)_0.8px,transparent_0.8px)] [background-size:22px_22px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,white_0%,rgba(255,255,255,0.4)_60%,transparent_100%)] pointer-events-none" />

      <div className="relative z-[1] grid gap-3 mb-12">
        <span className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-10/55">
          <span className="text-neutral-10 font-medium">03 / 04</span>
          <span className="opacity-40">·</span>
          <span>para quem é o projeto</span>
        </span>
        <h2 className="text-[clamp(30px,4vw,44px)] font-normal leading-[1.05] tracking-[-0.02em] max-w-[22ch] text-balance mt-4">
          Aberto a todos os cursos do Campus Russas.
        </h2>
        <p className="mt-2 max-w-[60ch] text-neutral-10/70 text-[15px] leading-[1.6]">
          A base matemática sustenta áreas diferentes, da computação à engenharia. Por isso o projeto recebe estudantes
          de todos os cursos da unidade.
        </p>
      </div>

      <div className="relative z-[1]">
        <CoursesOrbital />
      </div>

      <div className="relative z-[1] mt-5 flex items-center gap-3 text-[13px] text-neutral-10/55">
        <span className="font-mono text-xs tracking-[0.04em]">∀ curso ∈ Campus Russas</span>
        <span className="opacity-40">·</span>
        <span>todos são bem-vindos</span>
      </div>
    </section>
  );
}

/* ============================================================
   PersonCard
   ============================================================ */
function PersonCard({ p }: { p: Person }) {
  return (
    <article className="bg-neutral-100 border border-primary-30 rounded-[18px] p-7 grid gap-[18px] relative transition-all hover:border-neutral-10/[12%] hover:-translate-y-0.5">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3.5">
        <div className="relative w-14 h-14 rounded-full bg-primary-95 text-primary-40 grid place-items-center text-[22px] font-medium">
          <span>{p.initial}</span>
          <svg
            className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] animate-bm-spin-slow"
            viewBox="0 0 100 100"
            aria-hidden
          >
            <circle cx={50} cy={50} r={46} fill="none" stroke="var(--color-primary-base)" strokeWidth={0.6} strokeDasharray="2 4" />
          </svg>
        </div>
        <div className="grid gap-0.5">
          <h3 className="m-0 text-lg font-medium tracking-[-0.01em] leading-[1.2]">{p.name}</h3>
          <span className="text-xs text-neutral-10/55 font-mono tracking-[0.02em]">{p.role}</span>
        </div>
        <div className="font-mono text-[11px] text-neutral-10/35">{p.idx}</div>
      </div>

      <p className="m-0 text-sm leading-[1.65] text-neutral-10/70">{p.desc}</p>

      <div className="w-fit flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary-95 text-secondary-40 text-xs font-medium">
        <GraduationCap size={14} strokeWidth={2} />
        <span>{p.course}</span>
      </div>

      {p.links.map((link) => (
        <a
          key={link.key}
          className="w-fit flex gap-2.5 items-center p-2 rounded-lg transition-colors hover:underline"
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
        >
          <span className="inline-block text-sm text-neutral-10/70">{link.val}</span>
          <ArrowUpRight width={18} height={18} />
        </a>
      ))}
    </article>
  );
}

/* ============================================================
   Pessoas
   ============================================================ */
function Pessoas() {
  return (
    <section id="pessoas" className="relative py-[clamp(64px,8vw,110px)] border-b border-neutral-10/[8%]">
      <div className="grid gap-3 mb-12">
        <span className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.08em] uppercase text-neutral-10/55">
          <span className="text-neutral-10 font-medium">04 / 04</span>
          <span className="opacity-40">·</span>
          <span>quem está por trás</span>
        </span>
        <h2 className="text-[clamp(30px,4vw,44px)] font-normal leading-[1.05] tracking-[-0.02em] mt-4 max-w-[22ch] text-balance">
          As pessoas que acompanham o projeto.
        </h2>
        <p className="mt-2 max-w-[60ch] text-neutral-10/70 text-[15px] leading-[1.6]">
          Coordenação acadêmica e monitores estudantes — todos próximos do dia a dia do aluno.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 max-[1000px]:grid-cols-2 max-[700px]:grid-cols-1">
        {PEOPLE.map((p) => (
          <PersonCard key={p.name} p={p} />
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   Participar
   ============================================================ */
function Participar() {
  return (
    <section
      id="participar"
      className="relative py-[clamp(64px,8vw,110px)] overflow-hidden [background-image:radial-gradient(circle,rgba(26,28,29,0.22)_0.8px,transparent_0.8px)] [background-size:22px_22px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,white_0%,rgba(255,255,255,0.4)_60%,transparent_100%)] pointer-events-none" />

      <div className="relative z-[1] max-w-[980px]">
        <div className="text-neutral-10/55">
          <span className="font-mono text-xs tracking-[0.04em]">→ próximo passo</span>
        </div>

        <h2 className="text-[clamp(36px,5vw,60px)] font-normal leading-[1.02] tracking-[-0.025em] mt-4 max-w-[16ch]">
          Faça parte do projeto.
        </h2>

        <p className="mt-6 max-w-[56ch] text-[clamp(15px,1.3vw,17px)] leading-[1.65] text-neutral-10/70">
          O acesso à plataforma acontece por convite do tutor. Para entrar na lista de interessados, preencha o
          formulário ou nos siga no Instagram para acompanhar as próximas chamadas.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-5 max-[800px]:grid-cols-1">
          <a
            href="https://forms.gle/wVbLf4tmTjnadwPy9"
            target="_blank"
            className="grid gap-3.5 p-7 bg-primary-base text-white border border-primary-base rounded-[18px] transition-all hover:bg-primary-40 hover:border-primary-40 hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.08em] uppercase">
              <span className="text-white/55">01</span>
              <span className="px-2.5 py-1 bg-white/10 rounded-full text-white">formulário</span>
            </div>
            <h3 className="m-0 text-[22px] font-medium tracking-[-0.01em] text-white">Quero entrar na lista</h3>
            <p className="m-0 text-base leading-[1.6] text-neutral-base max-w-[38ch]">
              Preencha o formulário de interesse — em breve você receberá o convite do tutor para acessar a plataforma.
            </p>
            <span className="flex items-center gap-2 font-mono text-sm mt-1 text-neutral-base">
              Abrir formulário
              <ArrowUpRight width={18} height={18} />
            </span>
          </a>

          <a
            href="https://www.instagram.com/projetobasematematica"
            target="_blank"
            rel="noreferrer"
            className="grid gap-3.5 p-7 bg-neutral-base border border-neutral-10/[8%] rounded-[18px] transition-all hover:border-primary-base hover:-translate-y-0.5 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.08em] uppercase">
              <span className="text-neutral-10/35">02</span>
              <span className="px-2.5 py-1 bg-primary-80 rounded-full text-neutral-100">instagram</span>
            </div>
            <h3 className="m-0 text-[22px] font-medium tracking-[-0.01em]">Acompanhe o projeto</h3>
            <p className="m-0 text-base leading-[1.6] text-neutral-10/70 max-w-[38ch]">
              No Instagram saem avisos, novas chamadas e novidades. É o jeito mais simples de ficar por dentro.
            </p>
            <span className="flex items-center gap-2 font-mono text-sm mt-1 text-neutral-10">
              @projetobasematematica
              <ArrowUpRight width={18} height={18} />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function Footer() {
  return (
    <footer className="px-[clamp(20px,5vw,64px)] pt-12 pb-8 border-t border-neutral-10/[8%] bg-white">
      <div className="grid grid-cols-3 items-center gap-4 w-[min(94vw,1280px)] mx-auto max-[700px]:grid-cols-1">
        <div className="flex items-center gap-2.5 font-medium text-sm">
          <Image src="/logo-bg-transparent.svg" alt="" width={22} height={22} />
          <span>Base Matemática</span>
        </div>
        <div className="justify-self-center flex items-center gap-2 font-mono text-xs text-neutral-10/55">
          <span>UFC · Campus Russas</span>
          <span className="opacity-40">·</span>
          <span>5 cursos atendidos</span>
        </div>
        <div className="justify-self-end font-mono text-[13px] text-neutral-10/35 tracking-[0.1em]">
          Σ · ∫ · ∂ · π · φ
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Export
   ============================================================ */
export function LandingPage() {
  return (
    <div className="relative min-h-screen isolate bg-white">
      <Header />
      <main className="w-[min(94vw,1280px)] mx-auto px-[clamp(8px,2vw,16px)]">
        <Hero />
        <Pillars />
        <Cursos />
        <Pessoas />
        <Participar />
      </main>
      <Footer />
    </div>
  );
}
