# Plano técnico: login por convite

## Objetivo

Implementar um fluxo de acesso por convite sem reescrever a autenticação atual.

Diretriz principal:

- manter login por e-mail e senha
- remover cadastro público
- criar onboarding por convite
- criar a conta `User` apenas no aceite do convite

Este plano foi desenhado para encaixar no código atual da aplicação, especialmente em:

- [prisma/schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
- [lib/server/auth.ts](C:/Users/lucas/source/repos/math.ai/lib/server/auth.ts)
- [lib/server/app-data.ts](C:/Users/lucas/source/repos/math.ai/lib/server/app-data.ts)
- [lib/server/admin.ts](C:/Users/lucas/source/repos/math.ai/lib/server/admin.ts)
- [lib/server/permissions.ts](C:/Users/lucas/source/repos/math.ai/lib/server/permissions.ts)
- [lib/api.ts](C:/Users/lucas/source/repos/math.ai/lib/api.ts)

---

## Decisões fechadas

- `ADMIN` pode convidar `ADMIN`, `TUTOR` e `STUDENT`
- `TUTOR` pode convidar `STUDENT`
- convite para e-mail já existente é bloqueado
- vínculo tutor-aluno no convite é opcional
- convite expira em 3 dias
- a conta só é criada no aceite do convite

---

## Arquitetura alvo

### Fluxo final

1. Admin ou tutor emite um convite.
2. O sistema cria um registro `Invitation` com token opaco hasheado.
3. O convidado acessa `/convite/[token]`.
4. O sistema valida o convite e mostra formulário de aceite.
5. O convidado informa nome e senha.
6. O sistema cria `User`, inicializa dados, opcionalmente cria `TutorStudent`, marca `usedAt` e abre sessão.
7. A partir daí, o usuário entra via `/login`.

### Princípio de reaproveitamento

Reaproveitar o que já existe:

- `hashPassword`
- `createSession`
- `setSessionCookie`
- `initializeUserData`
- padrão de hash com `AUTH_SECRET`

Substituir apenas o onboarding:

- `registerUser()` deixa de ser o caminho normal de entrada
- `POST /api/auth/register` sai do fluxo público
- o novo fluxo passa por `Invitation`

---

## Mudanças no banco de dados

### Nova modelagem

Adicionar ao [prisma/schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma):

```prisma
model Invitation {
  id              String   @id @default(cuid())
  email           String
  role            Role
  tokenHash       String   @unique
  invitedByUserId String
  tutorId         String?
  expiresAt       DateTime
  usedAt          DateTime?
  revokedAt       DateTime?
  createdAt       DateTime @default(now())

  invitedBy       User     @relation("InvitationCreator", fields: [invitedByUserId], references: [id], onDelete: Cascade)
  tutor           User?    @relation("InvitationTutor", fields: [tutorId], references: [id], onDelete: SetNull)

  @@index([email])
  @@index([expiresAt])
  @@index([invitedByUserId])
  @@index([tutorId])
}
```

### Ajustes no `User`

Adicionar relações reversas ao model `User`:

```prisma
sentInvitations   Invitation[] @relation("InvitationCreator")
tutorInvitations  Invitation[] @relation("InvitationTutor")
```

### Observações de modelagem

- não é necessário persistir `status`; ele pode ser derivado de `usedAt`, `revokedAt` e `expiresAt`
- `tutorId` só faz sentido em convite para `STUDENT`
- `Invitation.email` não deve ser `@unique`, porque o mesmo e-mail pode receber novos convites no futuro

### Migration esperada

Criar uma migration dedicada, por exemplo:

- `add-invitations`

---

## Mudanças de domínio e serviços

### Novo módulo de convites

Criar um novo arquivo:

- [lib/server/invitations.ts](C:/Users/lucas/source/repos/math.ai/lib/server/invitations.ts)

Responsabilidades:

- gerar token opaco de convite
- hashear token com a mesma estratégia usada em auth/reset
- emitir convite
- validar convite por token
- listar convites
- revogar convite
- aceitar convite

### Funções sugeridas

- `createInvitation(input, actor)`
- `listInvitations(filters, actor)`
- `getInvitationByToken(token)`
- `acceptInvitation(input)`
- `revokeInvitation(invitationId, actor)`
- `getInvitationStatus(invitation)`

### Reuso técnico recomendado

Hoje `lib/server/auth.ts` já tem `hashValue`, mas ele está privado ao módulo. Há duas opções:

1. extrair a função de hash para um helper compartilhado
2. criar em `lib/server/invitations.ts` uma função equivalente baseada no mesmo `AUTH_SECRET`

Recomendação:

- extrair um helper compartilhado, por exemplo em `lib/server/token-hash.ts`

Isso evita duplicação entre sessão, reset de senha e convite.

---

## Mudanças nas permissões

### Expandir RBAC

Atualizar [lib/server/permissions.ts](C:/Users/lucas/source/repos/math.ai/lib/server/permissions.ts).

Adicionar novas actions:

- `invite.create.admin`
- `invite.create.tutor`
- `invite.create.student`
- `invite.list`
- `invite.revoke`

### Mapeamento sugerido

`ADMIN`:

- todas as actions de convite

`TUTOR`:

- `invite.create.student`
- `invite.list`

`STUDENT`:

- nenhuma

### Regras de escopo

Além do `can(...)`, será preciso reforçar regras no serviço:

- `TUTOR` só pode listar convites emitidos por ele
- `TUTOR` só pode revogar convites emitidos por ele
- `TUTOR` não pode criar convite para `ADMIN` ou `TUTOR`
- `ADMIN` pode listar todos os convites

---

## Mudanças de validação

### Novos schemas

Atualizar [lib/schemas.ts](C:/Users/lucas/source/repos/math.ai/lib/schemas.ts).

Adicionar:

- `invitationRoleSchema`
- `createInvitationSchema`
- `acceptInvitationSchema`
- `listInvitationsQuerySchema` se quiser tipar filtros

### Formato sugerido

`createInvitationSchema`:

- `email`
- `role`
- `name` opcional
- `tutorId` opcional

Regras refinadas no serviço:

- se `role !== STUDENT`, `tutorId` deve ser ignorado ou rejeitado
- se emissor for `TUTOR`, `role` deve ser obrigatoriamente `STUDENT`

`acceptInvitationSchema`:

- `token`
- `name`
- `password`

### Destino do schema atual de registro

`registerSchema` e `RegisterInput` podem:

- ser removidos depois da migração do frontend
- ou mantidos temporariamente enquanto o fluxo é substituído

Recomendação:

- manter temporariamente e remover ao fim da implementação para evitar quebra em etapas intermediárias

---

## Mudanças em backend HTTP

### Endpoints novos

Criar endpoints para convites:

- `POST /api/invitations`
- `GET /api/invitations`
- `POST /api/invitations/accept`
- `GET /api/invitations/resolve?token=...`
- `POST /api/invitations/[invitationId]/revoke`

### Responsabilidades por endpoint

`POST /api/invitations`

- criar convite
- exigir autenticação
- aplicar RBAC
- aplicar rate limit de emissão

`GET /api/invitations`

- listar convites
- aplicar filtros por status, role, emissor
- respeitar escopo do ator

`GET /api/invitations/resolve?token=...`

- validar token
- retornar payload seguro para renderizar a tela de aceite
- nunca retornar `tokenHash`

`POST /api/invitations/accept`

- validar token
- validar expiração/revogação/uso
- checar se e-mail continua sem conta
- criar `User`
- criar `TutorStudent` se aplicável
- marcar `usedAt`
- abrir sessão

`POST /api/invitations/[invitationId]/revoke`

- revogar convite ainda pendente
- impedir revogação de convite já usado

### Endpoints antigos a revisar

[app/api/auth/register/route.ts](C:/Users/lucas/source/repos/math.ai/app/api/auth/register/route.ts):

- remover do fluxo público
- opção A: deletar endpoint
- opção B: manter temporariamente retornando `403`

Recomendação:

- após migrar UI, trocar para `403` com mensagem explícita e depois remover

[app/api/admin/tutors/route.ts](C:/Users/lucas/source/repos/math.ai/app/api/admin/tutors/route.ts):

- substituir criação direta de tutor por criação de convite de tutor

---

## Mudanças nos serviços existentes

### `lib/server/admin.ts`

Hoje [lib/server/admin.ts](C:/Users/lucas/source/repos/math.ai/lib/server/admin.ts) tem `createTutor(input)` criando usuário diretamente com senha.

Plano:

- descontinuar `createTutor`
- introduzir algo como `createInvitationAsAdmin`
- manter `setUserRole`, `setUserActive`, `linkTutorToStudent` e `unlinkTutorFromStudent`

### `lib/server/app-data.ts`

Hoje [lib/server/app-data.ts](C:/Users/lucas/source/repos/math.ai/lib/server/app-data.ts) concentra `loginUser` e `registerUser`.

Plano:

- manter `loginUser`
- descontinuar `registerUser`
- não misturar `acceptInvitation` com `app-data`

Recomendação:

- `acceptInvitation` deve viver em `lib/server/invitations.ts`, porque pertence ao domínio de onboarding controlado

### `lib/server/auth.ts`

Possíveis ajustes:

- extrair `hashValue` para helper compartilhado
- manter criação de sessão como está

---

## Mudanças na camada cliente

### API client

Atualizar [lib/api.ts](C:/Users/lucas/source/repos/math.ai/lib/api.ts).

Adicionar:

- `api.invitations.resolve(token)`
- `api.invitations.accept(input)`
- `api.admin.createInvitation(input)` ou um namespace comum
- `api.admin.listInvitations(...)`
- `api.admin.revokeInvitation(invitationId)`
- `api.tutor.createInvitation(input)`
- `api.tutor.listInvitations(...)`

Recomendação:

- usar um namespace único `api.invitations`
- o backend resolve escopo pelo ator autenticado

Exemplo:

- `api.invitations.create`
- `api.invitations.list`
- `api.invitations.resolve`
- `api.invitations.accept`
- `api.invitations.revoke`

### Formulários de autenticação

Atualizar [components/auth-form.tsx](C:/Users/lucas/source/repos/math.ai/components/auth-form.tsx).

Mudanças:

- remover o modo `register`
- manter apenas `login`
- remover link “Cadastre-se”
- substituir por mensagem como “Seu acesso é liberado por convite”

### Página `/cadastro`

Atualizar [app/cadastro/page.tsx](C:/Users/lucas/source/repos/math.ai/app/cadastro/page.tsx).

Opções:

1. redirecionar para `/login`
2. transformar em página informativa sobre acesso por convite

Recomendação:

- manter a rota e transformá-la em página informativa para não quebrar links antigos

### Página de aceite do convite

Criar:

- `app/convite/[token]/page.tsx`
- possivelmente `components/invitation-accept-form.tsx`

Comportamento:

- resolver convite no server component ou via fetch inicial
- renderizar estado válido, expirado, revogado ou usado
- no estado válido, permitir definir nome e senha

### Login

Atualizar [app/login/page.tsx](C:/Users/lucas/source/repos/math.ai/app/login/page.tsx) e [components/auth-form.tsx](C:/Users/lucas/source/repos/math.ai/components/auth-form.tsx) para refletir o novo texto de produto.

---

## Mudanças no painel admin

### Substituir criação direta de tutor

Hoje [components/admin/users-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/users-panel.tsx) permite “Criar tutor” com senha manual.

Plano:

- substituir o `CreateTutorForm` por `CreateInvitationForm`
- permitir escolher `role` entre `ADMIN`, `TUTOR` e `STUDENT`
- permitir `tutorId` apenas quando `role === STUDENT`

### Evolução de navegação

Criar uma área dedicada:

- `app/admin/convites/page.tsx`

E incluir link no layout admin:

- [app/admin/layout.tsx](C:/Users/lucas/source/repos/math.ai/app/admin/layout.tsx)

Conteúdo da página:

- formulário de novo convite
- tabela/lista de convites
- filtros por status e role
- ação de copiar link
- ação de revogar

### Decisão de UX

Na V1, vale manter em `/admin/usuarios` um CTA rápido de convite, mas a listagem completa deve viver em `/admin/convites`.

---

## Mudanças no painel tutor

### Nova área de convites

Criar:

- `app/tutor/convites/page.tsx`
- `components/tutor/invitations-panel.tsx`

Atualizar navegação em [app/tutor/layout.tsx](C:/Users/lucas/source/repos/math.ai/app/tutor/layout.tsx) para incluir “Convites”.

### Escopo de UX do tutor

- criar convite para `STUDENT`
- ver apenas convites emitidos por ele
- opcionalmente associar um tutor no convite

Como o emissor já é um tutor, a UX recomendada é:

- deixar “vincular comigo” pré-selecionado
- permitir desmarcar

Isso respeita a regra de vínculo opcional.

---

## Regras transacionais do aceite

### Operação crítica

O aceite do convite deve ser uma transação única no banco.

Sequência dentro de `prisma.$transaction`:

1. carregar convite por `tokenHash`
2. validar pendência
3. garantir que o e-mail ainda não existe em `User`
4. criar `User`
5. criar `AccessibilityProfile` e `TrackProgress` via `initializeUserData`
6. criar `TutorStudent` se aplicável
7. atualizar `usedAt`

### Observação importante

`initializeUserData()` hoje faz múltiplos `upsert`s e usa `prisma` diretamente. Há duas abordagens:

1. aceitar que parte da inicialização rode fora da transação principal
2. adaptar `initializeUserData()` para receber um client transacional

Recomendação:

- adaptar `initializeUserData(db, userId)` para aceitar o client do Prisma

Isso deixa o aceite mais consistente e evita conta criada sem dados iniciais.

---

## Rate limiting

### Novos limites

Expandir o padrão já usado em auth/reset.

Endpoints:

- criação de convite
- aceite de convite
- resolução de convite por token

Sugestão inicial:

- emissão: `10/hora` por usuário autenticado
- aceite: `5/hora` por IP
- resolve: `30/hora` por IP

### Arquivos impactados

- criar rate limit nos novos endpoints
- revisar [app/api/auth/register/route.ts](C:/Users/lucas/source/repos/math.ai/app/api/auth/register/route.ts) ao desativar cadastro

---

## Tratamento de erros

### Casos de domínio que devem ter mensagem clara

- convite expirado
- convite revogado
- convite já utilizado
- conta já existente para o e-mail
- papel inválido para o ator
- tutorId inválido

### Implementação sugerida

Criar erros específicos em `lib/server/invitations.ts` ou expandir [lib/server/api-helpers.ts](C:/Users/lucas/source/repos/math.ai/lib/server/api-helpers.ts) para mapear melhor esses cenários.

Recomendação:

- introduzir erros de domínio específicos para convites

Exemplos:

- `InvitationExpiredError`
- `InvitationAlreadyUsedError`
- `InvitationRevokedError`

---

## Testes

### Testes de serviço

Criar testes para:

- emissão por admin de `ADMIN`, `TUTOR` e `STUDENT`
- emissão por tutor apenas de `STUDENT`
- bloqueio para e-mail já existente
- bloqueio de `tutorId` em convite que não seja `STUDENT`
- aceite com criação de usuário
- aceite com criação opcional de `TutorStudent`
- falha em convite expirado
- falha em convite revogado
- falha em convite já usado

### Testes de API

Cobrir:

- `POST /api/invitations`
- `GET /api/invitations`
- `GET /api/invitations/resolve`
- `POST /api/invitations/accept`
- `POST /api/invitations/[id]/revoke`

### E2E

Adicionar fluxos:

1. admin cria convite de tutor, convidado aceita e faz login
2. tutor cria convite de aluno com vínculo opcional, convidado aceita
3. rota `/cadastro` não cria mais conta
4. usuário sem convite não consegue onboarding

---

## Rollout recomendado

### Etapa 1: backend e modelo

- migration `Invitation`
- serviço de convites
- novos schemas
- novos endpoints
- testes de serviço/API

### Etapa 2: aceite público

- rota `/convite/[token]`
- form de aceite
- textos atualizados no login/cadastro

### Etapa 3: admin

- substituir criação direta de tutor por convite
- criar tela `/admin/convites`

### Etapa 4: tutor

- criar tela `/tutor/convites`
- adicionar navegação

### Etapa 5: limpeza

- desativar totalmente `registerUser`
- remover UI residual de cadastro aberto
- remover tipos e schemas obsoletos

---

## Ordem prática de implementação por arquivos

1. [prisma/schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
2. migration Prisma
3. [lib/schemas.ts](C:/Users/lucas/source/repos/math.ai/lib/schemas.ts)
4. novo [lib/server/invitations.ts](C:/Users/lucas/source/repos/math.ai/lib/server/invitations.ts)
5. [lib/server/permissions.ts](C:/Users/lucas/source/repos/math.ai/lib/server/permissions.ts)
6. [lib/server/auth.ts](C:/Users/lucas/source/repos/math.ai/lib/server/auth.ts) ou helper compartilhado
7. novos handlers em `app/api/invitations/*`
8. [lib/api.ts](C:/Users/lucas/source/repos/math.ai/lib/api.ts)
9. novo `app/convite/[token]/page.tsx`
10. novo componente de aceite
11. [components/auth-form.tsx](C:/Users/lucas/source/repos/math.ai/components/auth-form.tsx)
12. [app/cadastro/page.tsx](C:/Users/lucas/source/repos/math.ai/app/cadastro/page.tsx)
13. admin: [components/admin/users-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/users-panel.tsx) e nova área de convites
14. tutor: [app/tutor/layout.tsx](C:/Users/lucas/source/repos/math.ai/app/tutor/layout.tsx) e nova área de convites
15. testes unitários, integração e E2E

---

## Riscos e pontos de atenção

- `initializeUserData()` hoje não é transacional
- criação direta de tutor por senha manual conflita com a nova regra de produto
- links antigos para `/cadastro` precisam continuar úteis
- convites para `ADMIN` exigem cuidado extra de permissão e auditoria
- a UI não deve expor papel ou vínculo como escolha do convidado

---

## Resultado esperado

Ao final, a plataforma passa a ter:

- entrada controlada por convite
- onboarding compatível com as três roles
- governança melhor para admin e tutor
- reaproveitamento quase total da autenticação existente
- base pronta para integrar envio transacional de e-mail depois
