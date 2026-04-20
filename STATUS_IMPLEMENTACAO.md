# Status da Plataforma

Última atualização: 2026-04-20

## Visão geral

Este documento resume o estado atual da plataforma `Projeto Base Matemática`, com foco em:

- o que já foi implementado
- o que está funcional, mas ainda simplificado
- o que ainda precisa ser desenvolvido para a plataforma evoluir para produção

---

## 1. O que já foi implementado

### 1.1 Base do projeto

- Next.js 15 (App Router) + TypeScript + pnpm
- Tailwind CSS com paleta completa (`primary`, `secondary`, `tertiary`, `neutral` em escalas T0–T100)
- shadcn/ui (componentes enxutos, customizáveis)
- TanStack React Query (mutations e cache)
- Zustand (estado global cliente)
- React Hook Form + Zod (forms e validação)
- Prisma + PostgreSQL (Docker local, Supabase em produção)
- Vitest + Playwright (testes unitários e E2E)
- Estrutura compatível com deploy na Vercel

### 1.2 Interface pública e navegação

- Landing page em `/` com apresentação do projeto, monitores, professor coordenador e Instagram
- Header com links de seção e botões de login/cadastro
- Tela de login em `/login`
- Tela de cadastro em `/cadastro`
- Tela de recuperação de senha em `/esqueci-senha`
- Tela de definição de nova senha em `/redefinir-senha?token=...`
- Dashboard em `/dashboard` (protegido por sessão)
- Área admin em `/admin/*` (protegida por papel ADMIN)
- Área tutor em `/tutor/*` (protegida por papel TUTOR ou ADMIN)
- Redirecionamentos automáticos (usuário logado não vê login/cadastro; não-logado não acessa rotas privadas)

### 1.3 Design e experiência

- Fonte Lexend
- Dark mode com alternância light/dark/system (componente segmentado)
- Script anti-FOUC no `app/layout.tsx`
- Paleta Axioma Suave com contraste WCAG em dark mode (sem opacity modifiers em textos escuros)
- Layouts responsivos para desktop, tablet e mobile
- Animação `math-float` e elementos decorativos controlados pela preferência `reducedMotion`

### 1.4 Autenticação e sessão

- Hash de senha com `scrypt` + salt por usuário
- Sessão com cookie `httpOnly`, `sameSite=lax`, `secure` em produção
- Token opaco de 32 bytes; armazenado em banco por SHA-256
- TTL de 30 dias, validado a cada request
- Logout da sessão atual
- **Logout em todos os dispositivos** (`/api/auth/logout-all`) com UI no painel do aluno
- **Recuperação de senha**
  - `POST /api/auth/password-reset/request` gera token único com TTL de 1h
  - `POST /api/auth/password-reset/confirm` valida, troca senha e revoga todas as sessões
  - tokens armazenados como hash SHA-256 + uso único (`usedAt`)
  - link é logado no servidor (SMTP pendente)
- **Rate limiting** (sliding window em memória)
  - login: 5 tentativas/15min por IP
  - cadastro: 3/hora por IP
  - reset de senha: 3/hora (request) + 5/hora (confirm) por IP

### 1.5 RBAC (Role-Based Access Control)

- Três papéis: `STUDENT`, `TUTOR`, `ADMIN`
- Matriz de permissões definida em `lib/server/permissions.ts` com 22 actions
- `requireActor(action?)` no backend e `requirePageRole(...)` em Server Components
- Scope rules enforced:
  - TUTOR vê apenas alunos vinculados (tabela `TutorStudent`)
  - TUTOR só edita rascunhos próprios; publicação/desativação é restrita ao ADMIN
  - ADMIN vê tudo globalmente
  - desativar um usuário (`active=false`) invalida todas as suas sessões
- Proteções:
  - `ForbiddenError` (403) e `NotFoundError` (404) tipados
  - `ACCOUNT_DEACTIVATED` limpa cookie e encerra sessão

### 1.6 Acessibilidade

- Ajuste de tamanho do texto (16–22 px)
- Ajuste de espaçamento entre blocos (24–40 px)
- Toggle de leitura guiada
- Modo minimalista
- Redução de animações extras
- Modo de foco: `calmo`, `guiado`, `contraste`
- Persistência por usuário (`AccessibilityProfile`)

### 1.7 Sistema pedagógico

- Trilhas de Adição, Subtração, Multiplicação e Divisão (via seed)
- Lições com enunciado, história, explicação, resposta, nível, meta, dica e passos guiados
- Progressão por acertos, tentativas, streak, domínio
- Submissão de resposta com feedback contextual
- Lista de trilhas e lições filtradas por `status = PUBLISHED` no dashboard (rascunhos invisíveis para alunos/tutores)

### 1.8 CRUD de conteúdo (admin)

- Página `/admin/conteudo` lista todas as trilhas com status (rascunho/publicado) e contador de lições
- Criar nova trilha (começa sempre como rascunho)
- Editar metadados da trilha (slug, nome, descrição, tempo estimado)
- Publicar/despublicar trilha
- Excluir trilha (cascade deleta lições)
- Página `/admin/conteudo/[trackId]` para editar trilha e suas lições
- Criar lições (rascunho) com todos os campos
- Editar lições inline (formulário expansível)
- Publicar/despublicar lição
- Excluir lição
- **Reordenar lições** via setinhas (persiste `orderIndex` em transação)
- Rotas REST espelham o fluxo:
  - `GET/POST /api/admin/content/tracks`
  - `GET/PATCH/DELETE /api/admin/content/tracks/[trackId]`
  - `POST /api/admin/content/tracks/[trackId]/publish` (com `{ publish: boolean }`)
  - `POST /api/admin/content/tracks/[trackId]/reorder`
  - `POST /api/admin/content/lessons`
  - `PATCH/DELETE /api/admin/content/lessons/[lessonId]`
  - `POST /api/admin/content/lessons/[lessonId]/publish`

### 1.9 Painel administrativo

- Guard de papel ADMIN no layout `/admin`
- Navegação interna: Usuários, Vínculos, Conteúdo
- `/admin/usuarios`: lista com filtros por papel e status, criar tutor, alterar papel, ativar/desativar (com revogação de sessões)
- `/admin/vinculos`: associar tutor a aluno, listar vínculos, desvincular
- `/admin/conteudo`: já descrito em 1.8

### 1.10 Painel do tutor

- Guard de papel TUTOR ou ADMIN em `/tutor`
- `/tutor/alunos`: lista alunos vinculados ao tutor atual (ADMIN vê todos via mesmo endpoint)
- `/tutor/alunos/[studentId]`: perfil do aluno com totais, precisão e progresso por trilha
- Métricas reais agregadas a partir de `Attempt` e `TrackProgress`

### 1.11 Dashboard role-aware

- Cabeçalho com botão contextual ("Painel admin" para ADMIN, "Meus alunos" para TUTOR)
- Painéis extras renderizados no rodapé do dashboard quando o usuário tem papel elevado:
  - **Tutor panel**: alunos vinculados, tentativas totais, precisão, alunos em risco (< 3 tentativas) + CTA para `/tutor/alunos`
  - **Admin panel**: usuários ativos/totais, tutores, alunos, vínculos, contagem de trilhas e lições publicadas vs rascunho + CTA para `/admin/usuarios`
- Todos os números vêm de `getAdminSnapshot()` e `getTutorSnapshot(tutorId)` em `lib/server/app-data.ts`

### 1.12 Backend

- API Routes no App Router
- Validação com Zod em todos os endpoints que recebem body
- Helper centralizado `handleError` mapeia `ForbiddenError`, `NotFoundError`, `AUTHENTICATION_REQUIRED`, `ACCOUNT_DEACTIVATED` para status HTTP
- Endpoints funcionais:
  - auth: login, register, logout, logout-all, password-reset (request/confirm)
  - session: answer, accessibility, dashboard
  - admin: users, tutors, user role/active, tutor-links, content (tracks/lessons)
  - tutor: students list, student detail, metrics

### 1.13 Banco de dados

- Schema Prisma com modelos: `User`, `Session`, `AccessibilityProfile`, `SkillTrack`, `Lesson`, `TrackProgress`, `Attempt`, `TutorStudent`, `PasswordResetToken`
- Enums: `Role` (STUDENT/TUTOR/ADMIN), `ContentStatus` (DRAFT/PUBLISHED)
- Migrations aplicadas:
  - initial
  - add-rbac-scope (ativo, role, tutor-student, content status)
  - add-password-reset-token
- PostgreSQL local via Docker em dev; Supabase preparado para prod

### 1.14 Seed e dados iniciais

- Trilhas e lições iniciais (publicadas)
- Usuário demo aluno: `aluno@basematematica.dev` / `demo12345`
- Usuário admin seedável via env vars (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME)
- `AccessibilityProfile` com defaults
- `TrackProgress` inicial por usuário

### 1.15 Deploy e configuração

- `DEPLOY.md` com instruções para setup local (Docker) e produção (Supabase + Vercel)
- `.env.example` com variáveis obrigatórias
- `next.config.ts` com `typedRoutes: true`

### 1.16 Testes e validação

- Testes unitários para regras de progresso, schemas e currículo
- E2E inicial: landing → login → responder atividade
- Build `next build` validado

---

## 2. O que já funciona, mas ainda está simplificado

### 2.1 Recuperação de senha

- Funciona ponta a ponta no backend (token único, TTL, revogação de sessões)
- Formulários UI prontos (`/esqueci-senha` e `/redefinir-senha`)
- **Pendente**: integração com serviço de e-mail (SMTP ou provider transacional — Resend, SES, SendGrid). Hoje o link aparece no console do servidor

### 2.2 Rate limiting

- Funciona em uma única instância (em memória)
- **Pendente** para escalar: mover para Redis/Upstash ao ter múltiplas instâncias/edge runtime

### 2.3 Revisão adaptativa

- Progressão linear por trilha com streak e domínio
- **Ainda não há**:
  - fila de revisão por erro recorrente
  - priorização por tempo sem praticar
  - recomendação personalizada mais sofisticada (SRS, intervalos, etc)

### 2.4 Admin — permissões finas

- Admin tem acesso global
- Tutor pode criar rascunhos, mas **a UI de CRUD de conteúdo hoje está restrita à área /admin**. Expor para TUTOR em uma área dedicada (`/tutor/conteudo`) é um passo futuro

### 2.5 Métricas de engajamento no dashboard

- Gráfico "Ritmo semanal" com dados estáticos (`chartData` fixo)
- **Pendente**: alimentar com dados reais de `Attempt` agregados por dia

### 2.6 Conteúdo institucional da landing page

- Estrutura e seções prontas
- **Pendente**:
  - revisão final do texto institucional
  - links sociais reais definitivos (Instagram ok; LinkedIn e outros pendentes de confirmação)
  - possível integração com agenda/notícias do projeto

### 2.7 Testes

- Base criada, mas cobertura ainda baixa.
- **Faltam testes para**:
  - fluxo completo de reset de senha
  - rate limiting (cenário HTTP real)
  - CRUD de conteúdo (criar, publicar, reordenar, deletar)
  - RBAC e scope rules em mais combinações
  - painel admin e tutor (E2E)
  - acessibilidade ponta a ponta

---

## 3. O que ainda precisa ser implementado

### 3.1 Envio transacional de e-mail

Prioridade alta. Necessário para:

- enviar o link de recuperação (já gerado no backend)
- confirmação de conta
- notificações opcionais para tutores e alunos

Opções: Resend, SendGrid, SES, Mailgun. Exige variáveis de ambiente e um adapter em `lib/server/mailer.ts`.

### 3.2 Rate limiting distribuído

- Upstash Redis (ou equivalente) para substituir o store em memória quando houver múltiplas instâncias ou deploy em edge

### 3.3 Confirmação de e-mail

- Novo token (`EmailVerificationToken`) com fluxo similar ao reset
- Estado `emailVerifiedAt` no `User`
- Bloquear certas ações até verificação (opcional)

### 3.4 Painel do tutor expandido

Hoje o tutor vê lista de alunos e detalhe por aluno. A evoluir:

- ranking de habilidades com mais dificuldade no seu grupo
- histórico de sessões por aluno
- comentários/anotações por aluno (precisa de nova tabela)
- comparação com média da turma

### 3.5 CRUD de conteúdo para tutor

- Área `/tutor/conteudo` para tutores criarem rascunhos
- UI reutiliza `ContentPanel`/`TrackDetailPanel` com variante read-only em campos sensíveis
- Admin continua exclusivo em publicar/despublicar/deletar

### 3.6 Revisão adaptativa avançada

- Spaced repetition (SM-2, FSRS ou similar)
- Revisão automática de erros recentes
- Sugestão da próxima lição baseada em performance e tempo ocioso
- Sessões dinâmicas (mix de trilhas)

### 3.7 Observabilidade

- Logs estruturados (pino, winston ou equivalente)
- Sentry ou similar para erro em produção
- Métricas de uso (latência, throughput, erros por rota)
- Dashboard de saúde do serviço

### 3.8 Gamificação leve

- Metas semanais
- Selos/conquistas
- Barra de consistência (streak semanal)
- Celebrações visuais discretas (já existe feedback por resposta)

### 3.9 Melhorias de produto

- Histórico navegável de sessões (aluno)
- Relatórios exportáveis (CSV/PDF) para tutor e admin
- Notificações/lembretes (web push ou e-mail)
- Modo de estudo offline (PWA)

### 3.10 Infraestrutura de produção

- Deploy final na Vercel
- Banco gerenciado (Supabase já preparado)
- Variáveis de ambiente separadas por ambiente (preview/prod)
- Pipeline CI/CD no GitHub (lint + tests + build)
- Migrations automáticas em deploy (ou manual via `prisma migrate deploy`)

### 3.11 Cobertura de testes

- Testes de integração para RBAC e scope
- E2E para admin e tutor
- Testes para CRUD de conteúdo
- Testes para fluxo completo de reset de senha
- Testes de regressão de acessibilidade

### 3.12 Evolução futura da autenticação

Avaliar migração para:

- Auth.js (open source, integra com providers externos)
- Clerk (gerenciado, fluxos prontos)

Ganhos potenciais: login social, MFA, passkeys, fluxos de convite.

---

## 4. Prioridade recomendada

Ordem sugerida para evolução:

1. **Envio transacional de e-mail** (destrava reset de senha para uso real)
2. **Logs estruturados + Sentry** (observabilidade mínima antes de abrir para usuários)
3. **Pipeline CI/CD** (lint + tests + build + deploy preview)
4. **Cobertura de testes** (RBAC, CRUD, E2E completo)
5. **CRUD de conteúdo para tutor** (descentraliza criação)
6. **Revisão adaptativa avançada** (SRS)
7. **Confirmação de e-mail e rate limit distribuído** (quando abrir para público)
8. **Gamificação e relatórios**

---

## 5. Resumo executivo

### Já pronto

- Base full-stack moderna (Next.js 15, Prisma, Tailwind, React Query)
- Landing institucional enxuta com dark mode
- Autenticação real com sessão persistida (scrypt + cookies httpOnly)
- **Reset de senha** funcional no backend (SMTP pendente)
- **Logout em todos os dispositivos**
- **Rate limiting** em memória nos endpoints de auth
- **RBAC completo** com scope rules (STUDENT/TUTOR/ADMIN)
- Dashboard role-aware com snapshots reais de admin e tutor
- **CRUD de conteúdo** (admin): trilhas e lições, publicação, reorder
- Painel admin (usuários, vínculos, conteúdo)
- Painel tutor (lista e detalhe de alunos)
- Acessibilidade configurável por usuário
- Trilhas pedagógicas iniciais (via seed)
- Banco modelado, migrations aplicadas
- `DEPLOY.md` documentado (Docker local, Supabase prod)
- Testes base (unitários + E2E inicial)

### Ainda falta para produção plena

- Envio transacional de e-mail (destrava reset real)
- Rate limiting distribuído para múltiplas instâncias
- Observabilidade (logs, Sentry, métricas)
- CI/CD no GitHub
- Cobertura de testes mais profunda (RBAC, CRUD, E2E)
- Revisão adaptativa avançada
- Gamificação e relatórios
- CRUD de conteúdo para tutor (hoje só admin)

---

## 6. Próximo passo recomendado

Com Fases A (dashboard role-aware), B (CRUD de conteúdo) e C (hardening: rate limit, reset senha, logout all) concluídas, o próximo passo de maior impacto é:

**integrar envio transacional de e-mail** (Resend ou similar) para fechar o ciclo de recuperação de senha — hoje o link só aparece no console.

Em paralelo:

- adicionar logs estruturados + Sentry
- configurar pipeline CI/CD básico no GitHub

Esses três destravam a plataforma para começar a receber usuários reais fora do ambiente de desenvolvimento.
