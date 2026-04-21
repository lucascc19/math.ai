# Status da Plataforma

Ultima atualizacao: 2026-04-20

## Visao geral

Este documento resume o estado atual da plataforma `Projeto Base Matemática`, com foco em:

- o que ja foi implementado
- o que ja funciona, mas ainda esta simplificado
- o que ainda falta para a plataforma evoluir para producao

---

## 1. O que ja foi implementado

### 1.1 Base do projeto

- Next.js 15 (App Router) + TypeScript + pnpm
- Tailwind CSS com paleta completa (`primary`, `secondary`, `tertiary`, `neutral`)
- shadcn/ui
- TanStack React Query
- Zustand
- React Hook Form + Zod
- Prisma + PostgreSQL
- Vitest + Playwright
- Estrutura compativel com deploy na Vercel

### 1.2 Interface publica e navegacao

- Landing page em `/`
- Header com links de secao e CTA de login
- Tela de login em `/login`
- Tela informativa em `/cadastro` explicando que o acesso e liberado por convite
- Tela de recuperacao de senha em `/esqueci-senha`
- Tela de redefinicao de senha em `/redefinir-senha?token=...`
- Tela de aceite de convite em `/convite/[token]`
- Area do aluno em `/aluno` protegida por sessao e papel `STUDENT`
- Pagina de trilhas do aluno em `/aluno/trilhas`
- Pagina de detalhe de trilha em `/aluno/trilhas/[skillId]`
- `/dashboard` mantido apenas como rota de compatibilidade, redirecionando para a home correta da role
- Area admin em `/admin/*` protegida por papel `ADMIN`
- Area tutor em `/tutor/*` protegida por papel `TUTOR` ou `ADMIN`
- Redirecionamentos automáticos para rotas privadas/publicas conforme sessao

### 1.3 Design e experiencia

- Fonte Lexend
- Dark mode com alternancia light/dark/system
- Script anti-FOUC no `app/layout.tsx`
- Layouts responsivos para desktop, tablet e mobile
- Shell lateral padronizada para `ADMIN`, `TUTOR` e `STUDENT`
- Sidebar recolhivel no desktop, com tooltips no modo compacto
- Menu de conta na sidebar com nome, role e acao de logout
- Navegacao lateral do aluno com entradas dedicadas para `Visao geral` e `Trilhas`
- Botoes, cards e secoes principais padronizados com raio de 16px

### 1.4 Autenticacao e sessao

- Hash de senha com `scrypt` + salt por usuario
- Sessao com cookie `httpOnly`, `sameSite=lax`, `secure` em producao
- Token opaco de 32 bytes, armazenado em banco por SHA-256
- TTL de 30 dias, validado a cada request
- Logout da sessao atual
- Logout em todos os dispositivos (`/api/auth/logout-all`)
- Recuperacao de senha:
  - `POST /api/auth/password-reset/request` gera token unico com TTL de 1h
  - `POST /api/auth/password-reset/confirm` valida token, troca senha e revoga sessoes
  - tokens armazenados como hash SHA-256 + uso unico (`usedAt`)
- Onboarding por convite:
  - cadastro publico desativado
  - `POST /api/invitations` cria convite com TTL de 3 dias
  - `GET /api/invitations/resolve?token=...` resolve estado do convite
  - `POST /api/invitations/accept` cria a conta apenas no aceite
  - `POST /api/invitations/[id]/revoke` revoga convite pendente
  - `POST /api/invitations/[id]/resend` gera novo token para reenvio
  - `DELETE /api/invitations/[id]` exclui convite definitivamente
  - `DELETE /api/invitations` remove convites que nao estao mais pendentes
  - aceite abre sessao imediatamente apos criar a conta
- Rate limiting em memoria:
  - login: 5 tentativas / 15 min por IP
  - reset de senha: 3 / hora (request) + 5 / hora (confirm) por IP
  - convites: 10 / hora (create), 30 / hora (resolve), 5 / hora (accept)

### 1.5 RBAC (Role-Based Access Control)

- Tres papeis: `STUDENT`, `TUTOR`, `ADMIN`
- Matriz de permissoes centralizada em `lib/server/permissions.ts`
- `requireActor(action?)` no backend e `requirePageRole(...)` em Server Components
- Scope rules:
  - `TUTOR` ve apenas alunos vinculados
  - `TUTOR` so edita rascunhos
  - `ADMIN` tem visao global
  - desativar usuario invalida todas as suas sessoes
- Permissoes de convite:
  - `ADMIN` pode convidar `ADMIN`, `TUTOR` e `STUDENT`
  - `TUTOR` pode convidar apenas `STUDENT`
  - `TUTOR` lista/revoga apenas os proprios convites

### 1.6 Acessibilidade

- Ajuste de tamanho do texto
- Ajuste de espacamento entre blocos
- Modos de foco `calmo`, `guiado`, `contraste`
- Botao flutuante no canto inferior direito abrindo dialog de acessibilidade
- Persistencia por usuario em `AccessibilityProfile`

### 1.7 Sistema pedagogico

- Trilhas iniciais de Adicao, Subtracao, Multiplicacao e Divisao
- Licoes com enunciado, historia, explicacao, resposta, nivel, meta, dica e passos guiados
- `LessonActivity` introduzido como unidade propria de atividade dentro da licao
- Tipos de atividade previstos: `NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE` e `SHORT_TEXT`
- Progressao por acertos, tentativas, streak e dominio
- Submissao de resposta com feedback contextual
- Area do aluno filtrando apenas conteudo publicado
- Trilhas com estrutura `trilha -> modulo -> licao`
- Conteúdo rico em trilhas e licoes com Markdown e formulas

### 1.8 CRUD de conteudo (admin)

- `/admin/conteudo` lista trilhas com status e contador de licoes
- Criacao e edicao de trilhas
- Publicacao/despublicacao
- Exclusao de trilha e licao
- CRUD de modulos
- Reordenacao de modulos
- Reordenacao de licoes por modulo
- Movimentacao de licoes entre modulos com reindexacao automatica
- Edicao de varias atividades por licao no painel admin
- Rotas REST para tracks e lessons no namespace `/api/admin/content/*`

### 1.9 Painel administrativo

- Guard de papel `ADMIN` no layout `/admin`
- Home operacional em `/admin` com visao geral
- Navegacao interna: Usuários, Convites, Vínculos, Conteúdo
- `/admin/usuarios`:
  - lista com filtros por papel e status
  - alterar papel
  - ativar/desativar conta
  - formulario rapido de convite
- `/admin/convites`:
  - criar convite para `ADMIN`, `TUTOR` e `STUDENT`
  - selecionar tutor opcional em convite de aluno
  - listar convites
  - filtrar por status e papel
  - copiar link gerado
  - reenviar convite com novo link
  - revogar convite pendente
  - excluir convite definitivamente
  - limpar convites que nao estao mais pendentes
- `/admin/vinculos`: associar tutor a aluno, listar vinculos, desvincular

### 1.10 Painel do tutor

- Guard de papel `TUTOR` ou `ADMIN` em `/tutor`
- Home operacional em `/tutor` com visao geral do papel
- `/tutor/alunos`: lista de alunos vinculados
- `/tutor/alunos/[studentId]`: perfil do aluno com totais, precisao e progresso por trilha
- `/tutor/convites`:
  - criar convite para aluno
  - vinculo tutor-aluno opcional no convite
  - listar apenas convites emitidos pelo tutor
  - reenviar convite com novo link
  - revogar convite pendente
  - excluir convite definitivamente
  - limpar convites que nao estao mais pendentes

### 1.11 Area do aluno

- Home principal do aluno em `/aluno`
- Area dedicada de trilhas em `/aluno/trilhas`
- Pagina de detalhe por trilha em `/aluno/trilhas/[skillId]`
- Mesmo layout lateral de `ADMIN` e `TUTOR`, com conteudo especifico da role
- Visao geral do aluno simplificada para:
  - tentativas
  - precisao geral
  - trilhas ativas
  - ritmo semanal
- Acesso as trilhas por dois caminhos:
  - item `Trilhas` na sidebar
  - CTA `Abrir trilhas` na visao geral
- Lista de trilhas com cards clicaveis levando para a pagina de detalhe
- Lista de trilhas exibindo modulo atual e licao atual
- Pagina de detalhe da trilha exibindo:
  - visao geral da trilha
  - publico e nivel
  - pre-requisitos
  - objetivos
  - modulos com licoes clicaveis
  - conteudo da licao selecionada na propria tela
- Resposta interativa da atividade principal da licao com suporte inicial a `NUMERIC` e `MULTIPLE_CHOICE`

### 1.12 Backend

- API Routes no App Router
- Validacao com Zod em endpoints com body
- `handleError` centralizado para auth, RBAC e erros de convite
- Endpoints funcionais:
  - auth: login, logout, logout-all, password-reset
  - invitations: create, list, resolve, accept, revoke, resend, delete, cleanup
  - session: answer, accessibility, dashboard
  - admin: users, user role/active, tutor-links, content
  - tutor: students list, student detail, metrics

### 1.13 Banco de dados

- Schema Prisma com modelos:
  - `User`
  - `Session`
  - `Invitation`
  - `AccessibilityProfile`
  - `SkillTrack`
  - `Lesson`
  - `LessonActivity`
  - `TrackProgress`
  - `Attempt`
  - `TutorStudent`
  - `PasswordResetToken`
- Enums:
  - `Role` (`STUDENT`, `TUTOR`, `ADMIN`)
  - `ContentStatus` (`DRAFT`, `PUBLISHED`)
  - `LessonType` (`EXPLANATION`, `PRACTICE`, `QUIZ`, `REVIEW`)
  - `LessonActivityType` (`NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_TEXT`)
- Migrations aplicadas:
  - `initial`
  - `add-rbac-scope`
  - `add-password-reset-token`
  - `add-invitations`

### 1.14 Seed e dados iniciais

- Trilhas e licoes iniciais
- Usuario demo aluno: `aluno@basematematica.dev` / `demo12345`
- Usuario admin seedavel via env vars
- `AccessibilityProfile` default
- `TrackProgress` inicial por usuario

### 1.15 Deploy e configuracao

- `DEPLOY.md` documentado
- `.env.example` com variaveis obrigatorias
- `next.config.ts` com `typedRoutes: true`
- `playwright.config.ts` configurado para rodar E2E locais

### 1.16 Testes e validacao

- Testes unitarios para progresso, schemas e convites
- E2E cobrindo:
  - landing -> login -> rota correta da role
  - admin cria convite -> usuario aceita -> login
  - convite revogado na interface
  - convite expirado na interface
- Typecheck validado durante a implementacao

---

## 2. O que ja funciona, mas ainda esta simplificado

### 2.1 Recuperacao de senha

- Fluxo funcional ponta a ponta no backend
- Formularios UI prontos
- Envio transacional de e-mail pausado por decisao de produto
- Enquanto isso, o link de redefinicao segue disponivel apenas em ambiente local/log tecnico

### 2.2 Convites

- Fluxo de convite funcional ponta a ponta
- Admin e tutor conseguem gerar links e o usuario aceita via `/convite/[token]`
- Fluxo operacional atual: admin ou tutor copia o link gerado e envia manualmente para a pessoa convidada
- Reenvio de convite implementado com emissao de novo token/link
- Revogacao e exclusao definitiva disponiveis na interface
- Limpeza operacional implementada para remover convites que nao estao mais pendentes
- Pendente:
  - envio real por e-mail (pausado por enquanto)

### 2.3 Rate limiting

- Funciona em uma unica instancia (em memoria)
- Pendente para escala: mover para Redis/Upstash

### 2.4 Revisao adaptativa

- Progressao linear com streak e dominio
- Ordem da progressao agora montada por `modulo -> licao`
- Ainda nao ha:
  - fila de revisao por erro recorrente
  - priorizacao por tempo sem praticar
  - recomendacao personalizada mais sofisticada

### 2.5 Admin - permissoes finas

- Admin tem acesso global
- Tutor pode convidar aluno
- Tutor ainda nao tem CRUD de conteudo dedicado

### 2.6 Metricas de engajamento na area do aluno

- Grafico "Ritmo semanal" ainda usa dados estaticos
- A visao geral do aluno foi intencionalmente reduzida para um painel mais enxuto; a exploracao pedagogica agora fica concentrada na area `/aluno/trilhas`
- Pendente alimentar com dados reais de `Attempt`

### 2.7 Conteúdo institucional da landing page

- Estrutura pronta
- Pendente:
  - revisao final do texto institucional
  - links sociais definitivos
  - possivel integracao com agenda/noticias

### 2.8 Testes

- Base de testes melhorou, mas a cobertura ainda nao e alta
- Ainda faltam testes para:
  - reset de senha ponta a ponta
  - rate limiting HTTP real
  - CRUD de conteudo
  - fluxo completo de modulos no admin
  - progressao do aluno em trilhas com varios modulos
  - combinacoes extras de RBAC
  - cenarios adicionais de convite (`used`, `ADMIN`, `TUTOR`, sem convite)
  - acessibilidade ponta a ponta

### 2.9 Fase 2 das trilhas

- Fase 2 consolidada funcionalmente
- Compatibilidade antiga de reorder por trilha removida
- Pendentes restantes desta fase ficaram restritos a validacao local completa com migration aplicada e checagem final da progressao real

---

## 3. O que ainda precisa ser implementado

### 3.1 Envio transacional de e-mail

Status atual: pausado.

Necessario no futuro para:

- enviar o link de recuperacao de senha
- enviar convites de acesso
- suportar futuro reenvio de convite
- notificacoes opcionais para tutores e alunos

Decisao atual:

- convites seguem com envio manual do link por admin/tutor
- integracao transacional fica fora do caminho critico por enquanto

Opcoes futuras: Resend, SendGrid, SES, Mailgun. Exige variaveis de ambiente e um adapter em `lib/server/mailer.ts`.

### 3.2 Rate limiting distribuido

- Upstash Redis (ou equivalente)

### 3.3 Confirmacao de e-mail

- `EmailVerificationToken`
- `emailVerifiedAt` em `User`
- bloqueio opcional de certas acoes ate verificacao

### 3.4 Painel do tutor expandido

- ranking de dificuldades do grupo
- histórico de sessoes por aluno
- anotacoes/comentarios
- comparacao com media da turma

### 3.5 CRUD de conteudo para tutor

- area `/tutor/conteudo`
- tutores criando rascunhos em area propria
- admin continua exclusivo em publicar/despublicar/deletar

### 3.6 Revisao adaptativa avancada

- spaced repetition
- revisao automatica de erros recentes
- sugestao da proxima licao baseada em desempenho e ociosidade

### 3.7 Observabilidade

- logs estruturados
- Sentry ou similar
- metricas de uso e erro por rota

### 3.8 Melhorias de produto

- histórico navegavel de sessoes
- relatorios exportaveis (CSV/PDF)
- notificacoes e lembretes
- modo offline (PWA)

### 3.9 Infraestrutura de producao

- deploy final na Vercel
- variaveis separadas por ambiente
- pipeline CI/CD no GitHub
- migrations automatizadas no deploy

### 3.10 Evolucao futura da autenticacao

Avaliar migracao para:

- Auth.js
- Clerk

Ganhos potenciais:

- login social
- MFA
- passkeys
- fluxos gerenciados de onboarding

---

## 4. Prioridade recomendada

Ordem sugerida de evolucao agora:

1. Logs estruturados + Sentry
2. Pipeline CI/CD
3. Cobertura de testes mais profunda
4. CRUD de conteudo para tutor
5. Revisao adaptativa avancada
6. Rate limiting distribuido
7. Confirmacao de e-mail
8. Retomar envio transacional de e-mail quando houver decisao de dominio/remetente

---

## 5. Resumo executivo

### Ja pronto

- Base full-stack moderna
- Landing institucional com dark mode
- Autenticacao real com sessao persistida
- Reset de senha funcional no backend
- Logout em todos os dispositivos
- RBAC completo com scope rules
- Redirecionamento por role para `/admin`, `/tutor` e `/aluno`
- Shell lateral padronizada com sidebar recolhivel e logout por menu de conta
- Area do aluno em `/aluno`
- Area de trilhas do aluno com listagem e detalhe em rotas dedicadas
- Estrutura pedagogica por modulos implementada
- CRUD de conteudo (admin)
- Painel admin de usuarios, vinculos, conteudo e convites
- Painel tutor de alunos e convites
- Onboarding por convite funcional ponta a ponta
- Convites com copia manual de link, reenvio, revogacao, exclusao e limpeza
- Cadastro publico desativado
- Banco modelado com `Invitation`
- Testes unitarios e E2E cobrindo fluxo principal de convite

### Ainda falta para producao plena

- envio transacional de e-mail (pausado)
- rate limiting distribuido
- observabilidade
- CI/CD
- cobertura de testes mais profunda
- revisao adaptativa avancada
- CRUD de conteudo para tutor

---

## 6. Proximo passo recomendado

Como a Fase 2 das trilhas ficou funcionalmente consolidada, o proximo passo recomendado passa a ser:

**iniciar a Fase 3 para separar conteudo de licao e atividade avaliativa**.

Na sequencia:

- criar `LessonActivity`
- suportar ao menos `NUMERIC` e `MULTIPLE_CHOICE`
- adaptar a submissao do aluno para responder a atividade
- ampliar cobertura de testes nessa nova camada

Esse caminho aproveita a navegacao por modulos ja pronta e destrava a experiencia real de exercicios.
