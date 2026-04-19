# Projeto Base Matematica

Sistema full-stack inicial para apoio a alunos com TDAH e TEA em matematica basica.

## Stack escolhida

- Next.js + TypeScript
- Tailwind CSS
- Componentes locais no estilo shadcn/ui
- Zustand
- TanStack React Query
- React Hook Form + zod
- Prisma
- Vitest + Playwright

## Decisoes importantes

- `Next.js` foi escolhido no lugar de `Vite` porque o projeto precisa de front, backend e deploy simples na Vercel.
- `fetch` nativo foi preferido no lugar de `axios` para reduzir bundle, evitar dependencia extra e aproveitar melhor o runtime do Next.
- Prisma esta preparado para `PostgreSQL`, ideal para deploy gratuito em `Neon` ou `Supabase`.

## O que mudou na primeira feature

- autenticacao com senha no proprio app
- sessao persistida em cookie `httpOnly`
- progresso, respostas e acessibilidade vinculados ao usuario autenticado
- logout invalida a sessao atual

## Credenciais iniciais

- usuario demo: `aluno@basematematica.dev`
- senha demo: `demo12345`

## Proximos passos

- trocar a autenticacao nativa por `Auth.js` ou `Clerk` quando o ambiente permitir instalar dependencias
- criar CRUD administrativo completo para trilhas e licoes
- ampliar analytics, relatorios e revisoes adaptativas

## Rodando com banco real

```powershell
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm dev
```

## Variaveis de ambiente

- `DATABASE_URL`
- `AUTH_SECRET`
