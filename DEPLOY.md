# Deploy e Desenvolvimento

Guia prático para rodar o projeto em dev e publicar em produção. Cobre também o fluxo de mudanças no Prisma.

## Ambientes

| Ambiente | Banco | Usado por |
|---|---|---|
| Dev (local) | Postgres via Docker (`docker-compose.yml`) | Você na sua máquina |
| Produção | Supabase | Deploy (ex.: Vercel) |

O `.env` **sempre** aponta para Docker local. A URL do Supabase fica nas variáveis de ambiente do provedor de deploy, nunca commitada.

## Variáveis de ambiente

| Variável | Dev | Produção |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/base_matematica` | URL do **pooler** do Supabase (porta 6543, com `?pgbouncer=true`) |
| `DIRECT_URL` | (não usa) | URL de **conexão direta** do Supabase (porta 5432) — necessária só se for rodar migrations contra prod |
| `AUTH_SECRET` | qualquer string forte | string forte e secreta |
| `SEED_ADMIN_EMAIL` | opcional (default `admin@basematematica.dev`) | não usar em prod |
| `SEED_ADMIN_PASSWORD` | opcional (default `admin12345`) | não usar em prod |

## Setup inicial (primeira vez)

```bash
pnpm install
cp .env.example .env        # Windows: Copy-Item .env.example .env
docker compose up -d
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
```

Credenciais semeadas em dev:
- Aluno: `aluno@basematematica.dev` / `demo12345`
- Admin: `admin@basematematica.dev` / `admin12345`

## Dia a dia (dev)

```bash
docker compose up -d   # garantir Postgres rodando (só se derrubou a máquina)
pnpm dev               # Next.js em http://localhost:3000
```

Comandos úteis:

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe o Next.js em modo dev com hot reload |
| `pnpm build` | Build de produção (só compila) |
| `pnpm start` | Roda o build compilado |
| `pnpm lint` | Checa lint |
| `pnpm test` | Roda os testes unitários (Vitest) |
| `pnpm test:e2e` | Roda os e2e (Playwright) |
| `pnpm prisma studio` | UI do banco em `localhost:5555` |
| `pnpm db:seed` | Recria usuários seed (não apaga dados existentes; faz upsert) |

## Mudanças no schema Prisma

Sempre que você editar `prisma/schema.prisma` (adicionar campo, model, enum etc.):

### 1. Em dev

```bash
pnpm prisma migrate dev --name descricao-curta-da-mudanca
```

O que esse comando faz:
1. Gera a migration SQL em `prisma/migrations/`
2. Aplica no banco Docker local
3. Regenera o Prisma Client

> ⚠️ **Commite a pasta da migration gerada.** Sem o SQL commitado, produção não consegue aplicar depois.

Reinicie o `pnpm dev` (Next.js guarda o client em memória).

### 2. Testar localmente

```bash
pnpm dev
```

Valide o fluxo tocado pela mudança.

### 3. Publicar em produção

Duas opções dependendo do pipeline.

#### Opção A — aplicar no CI/deploy (recomendado)

No provedor (Vercel, Render, etc.), configure o comando de build para aplicar migrations antes:

```bash
pnpm prisma migrate deploy && pnpm build
```

`migrate deploy` aplica **todas as migrations pendentes** no banco apontado por `DATABASE_URL` — sem perguntar, sem shadow DB, ideal pra prod.

#### Opção B — aplicar manualmente

Rode localmente com a URL de produção exportada, **apontando pro direct URL** (não o pooler):

```bash
DATABASE_URL="<direct-url-supabase>" pnpm prisma migrate deploy
```

Depois faça o deploy normal do app.

> Nunca rode `prisma migrate dev` contra produção — esse comando pode resetar dados em caso de drift de schema.

## Deploy em produção

### 1. Banco no Supabase

1. Crie um projeto no Supabase.
2. Pegue a connection string em **Project Settings → Database → Connection string**.
3. Você vai usar **duas URLs**:
   - **Pooler** (porta 6543, com `?pgbouncer=true`) → `DATABASE_URL` em runtime
   - **Direct** (porta 5432) → `DIRECT_URL`, usada para migrations

Se ainda não configurou o `DIRECT_URL` no schema, adicione em `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

E rode `pnpm prisma generate` depois. Sem isso, o `migrate deploy` tentará rodar DDL pelo pooler e vai falhar.

### 2. Deploy na Vercel (sugestão)

1. Conecte o repositório no dashboard da Vercel.
2. Em **Settings → Environment Variables**, configure:
   - `DATABASE_URL` → URL do pooler do Supabase
   - `DIRECT_URL` → URL de conexão direta do Supabase
   - `AUTH_SECRET` → string forte e única para prod
3. Em **Settings → General → Build & Development Settings**, sobrescreva o **Build Command**:
   ```bash
   pnpm prisma generate && pnpm prisma migrate deploy && pnpm build
   ```
4. Trigger do deploy: push para a branch configurada (ex.: `main`).

### 3. Primeira carga de dados

O seed não roda automaticamente em prod. Para criar um admin inicial, uma vez:

```bash
DATABASE_URL="<direct-url-prod>" SEED_ADMIN_EMAIL="admin@seudominio.com" SEED_ADMIN_PASSWORD="<senha-forte>" pnpm db:seed
```

Depois altere a senha via UI (quando existir) ou diretamente no banco.

## Troubleshooting

### `The column X does not exist in the current database`
Prisma Client conhece a coluna, mas o banco em que você está conectado não tem. Causas comuns:
- Rodou `migrate dev` em um banco e o app está conectado em outro (conferir `DATABASE_URL` no shell vs `.env`).
- Migration marcada como aplicada mas o SQL não rodou. Confira com:
  ```bash
  pnpm prisma migrate status
  ```
  Se detectar drift, veja próxima entrada.

### Drift entre `_prisma_migrations` e schema real
```bash
pnpm prisma migrate resolve --rolled-back <nome-da-migration>
pnpm prisma migrate deploy
```

### `EPERM: operation not permitted` no `prisma generate` (Windows)
DLL do Prisma travada por processo node ativo.
```bash
# pare o pnpm dev
taskkill /F /IM node.exe    # ou Get-Process node | Stop-Process -Force
pnpm prisma generate
```

### Shell tem `DATABASE_URL` vazando
Se você exportou a URL de prod no shell antes e esqueceu, ela sobrescreve o `.env`. Em cada terminal novo que vai tocar no Prisma:
```bash
unset DATABASE_URL
```
Depois rode os comandos normais.

### Docker derrubou sozinho (reboot da máquina)
```bash
docker compose up -d
```

## Checklist antes de fazer push pra main

- [ ] `pnpm prisma migrate dev` rodado e pasta da migration commitada
- [ ] `pnpm build` roda sem erro localmente
- [ ] `pnpm lint` passa
- [ ] `pnpm test` passa
- [ ] Testou o fluxo tocado em `localhost:3000`
