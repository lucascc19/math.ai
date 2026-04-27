# Projeto Base Matemática

Sistema full-stack inicial para apoio a alunos com TDAH e TEA em matemática básica.

## Stack escolhida

- Next.js + TypeScript
- Tailwind CSS
- Componentes locais no estilo shadcn/ui
- Zustand
- TanStack React Query
- React Hook Form + zod
- Prisma
- Vitest + Playwright

## Decisões importantes

- `Next.js` foi escolhido no lugar de `Vite` porque o projeto precisa de front, backend e deploy simples na Vercel.
- `fetch` nativo foi preferido no lugar de `axios` para reduzir bundle, evitar dependencia extra e aproveitar melhor o runtime do Next.
- Prisma está preparado para `PostgreSQL`, ideal para deploy gratuito em `Neon` ou `Supabase`.

## O que mudou na primeira feature

- autenticação com senha no próprio app
- sessão persistida em cookie `httpOnly`
- progresso, respostas e acessibilidade vinculados ao usuário autenticado
- logout invalida a sessão atual

## Credenciais iniciais

- usuário demo: `aluno@basematematica.dev`
- senha demo: `demo12345`

## Como rodar localmente

1. Instale as dependências.
2. Copie `.env.example` para `.env`.
3. Suba o banco local com Docker.
4. Gere o Prisma Client, rode as migrations e popule o banco.
5. Inicie o ambiente de desenvolvimento.

```powershell
pnpm install
Copy-Item .env.example .env
docker compose up -d
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm dev
```

## Variáveis de ambiente

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXT_PUBLIC_BASE_URL`
- `MAIL_PROVIDER`
- `MAIL_FROM_EMAIL`
- `MAIL_FROM_NAME`
- `RESEND_API_KEY`

Se `MAIL_PROVIDER` não estiver vazio, o app envia convites e links de recuperação de senha por e-mail. O provider suportado agora é `resend`. Sem provider configurado, o conteúdo do e-mail continua sendo registrado no console em desenvolvimento.

### Testar envio local com Resend

1. Preencha no `.env`:
   - `MAIL_PROVIDER="resend"`
   - `MAIL_FROM_EMAIL`
   - `MAIL_FROM_NAME`
   - `RESEND_API_KEY`
2. Reinicie o `pnpm dev`.
3. Rode `pnpm mail:test seu-email@dominio.com` para validar o envio direto.
4. Depois teste pela UI:
   - `/admin/convites` para convite
   - `/esqueci-senha` para reset de senha

## Estrutura principal

- `app/`: rotas, páginas e APIs no App Router
- `components/`: interface reutilizável e telas principais
- `lib/`: domínio, schemas e serviços de backend
- `prisma/`: schema, migrations e seed
- `tests/`: testes unitários e e2e

## Próximos passos

- finalizar o conteúdo institucional definitivo da landing page
- implementar autorização real por papel
- criar CRUD administrativo completo para trilhas e lições
- ampliar analytics, relatórios e revisões adaptativas
