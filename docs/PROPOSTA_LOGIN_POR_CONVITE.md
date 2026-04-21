# Proposta: acesso por convite

## Objetivo

Trocar o modelo de cadastro aberto por um modelo de **acesso controlado por convite**.

Na prática:

- o usuário **não cria conta livremente**
- o usuário **só entra na plataforma se tiver recebido um convite**
- o **login continua existindo**, mas apenas **depois** que a conta foi ativada pelo fluxo de convite

Isso mantém a autenticação simples e reaproveita quase toda a base já implementada, mudando principalmente o **onboarding**.

---

## Por que essa mudança faz sentido

Para o contexto da plataforma, convite resolve bem alguns problemas:

- evita entrada descontrolada de usuários
- permite que admin e tutor acompanhem quem foi chamado
- facilita separar melhor quem entra como `STUDENT`, `TUTOR` ou `ADMIN`
- abre espaço para vincular aluno e tutor já no momento da entrada
- reduz abuso em cadastro público

---

## Decisões já fechadas

Estas decisões já foram definidas para a primeira versão:

1. `TUTOR` poderá convidar `STUDENT`.
2. `ADMIN` poderá convidar `ADMIN`, `TUTOR` e `STUDENT`.
3. Convite para e-mail já existente será bloqueado.
4. O vínculo tutor-aluno no convite será opcional.
5. Todo convite terá validade padrão de 3 dias.
6. A conta será criada apenas no aceite do convite.

---

## Recomendação de produto

### Regra principal

O sistema deixa de ter **cadastro aberto** em `/cadastro`.

Novo comportamento:

- `/login` continua existindo
- `/cadastro` deixa de ser público
- o usuário acessa um link do tipo `/convite/[token]`
- ao aceitar o convite, define nome e senha
- depois disso, passa a usar `/login` normalmente

### Modelo recomendado

Adotar o fluxo abaixo na primeira versão:

- `ADMIN` pode convidar `ADMIN`, `TUTOR` e `STUDENT`
- `TUTOR` pode convidar `STUDENT`
- o papel do usuário vem sempre do convite
- o usuário não escolhe `role` no onboarding

### Regra de vínculo

Quando o convite for criado para um aluno:

- o usuário entra como `STUDENT`
- o vínculo `TutorStudent` pode ou não vir embutido no convite
- se o convite trouxer um tutor associado, o vínculo é criado automaticamente no aceite
- se o convite não trouxer tutor, o aluno entra normalmente sem associação inicial

Isso vale tanto para convites emitidos por `ADMIN` quanto por `TUTOR`.

---

## Fluxo recomendado

### 1. Emissão do convite

Admin ou tutor informa:

- nome opcional
- e-mail do convidado
- papel permitido no convite
- tutor responsável, se fizer sentido

O sistema gera:

- token único
- registro de convite com status
- link de aceite
- expiração automática em **3 dias**

### 2. Entrega

Versão inicial:

- mostrar link no painel admin/tutor
- permitir copiar manualmente

Versão seguinte:

- enviar por e-mail transacional

### 3. Aceite do convite

Usuário abre o link e vê:

- e-mail pré-preenchido e travado
- papel que receberá
- formulário para definir nome e senha

Ao concluir:

- convite é marcado como usado
- conta é criada
- sessão é aberta
- dados iniciais do usuário são criados
- vínculo tutor-aluno é criado, se houver

### 4. Login recorrente

Depois do aceite:

- usuário entra só por `/login`
- não precisa mais do link de convite

---

## Decisão adotada: conta criada apenas no aceite

Foi decidido seguir a **Opção A**.

### Opção escolhida

Fluxo:

- sistema salva apenas o convite
- usuário define senha ao aceitar
- a conta `User` só nasce no final

### Por que essa opção é a melhor para o projeto atual

- o modelo fica mais limpo
- evita usuário "fantasma" que nunca entrou
- reduz ambiguidade entre convite pendente e conta ativa
- encaixa melhor no schema atual, em que `User` já representa uma conta pronta para autenticar

### Consequências dessa decisão

- o convite passa a ser a fonte da verdade do onboarding
- `User` continua representando apenas conta válida para autenticação
- relatórios de onboarding devem olhar para `Invitation`, não para `User`
- evita estados intermediários como "usuário criado, mas não ativado"

---

## Modelo de dados sugerido

Adicionar uma tabela `Invitation`.

Campos sugeridos:

- `id`
- `email`
- `role`
- `tokenHash`
- `invitedByUserId`
- `tutorId` opcional
- `expiresAt`
- `usedAt`
- `revokedAt`
- `createdAt`
- `metadata` opcional

### Interpretação dos campos

- `invitedByUserId`: quem criou o convite
- `tutorId`: tutor a ser vinculado ao aluno no aceite, quando aplicável
- `role`: papel final da conta que será criada

### Status derivado

- pendente: não usado, não expirado, não revogado
- usado: `usedAt != null`
- expirado: `expiresAt < now`
- revogado: `revokedAt != null`

### Índices úteis

- `email`
- `expiresAt`
- `tokenHash`
- `invitedByUserId`
- `tutorId`

---

## Regras de negócio recomendadas

### Convites

- convite expira em **3 dias**
- convite só pode ser usado uma vez
- convite revogado não pode ser reutilizado
- não permitir dois convites pendentes idênticos para o mesmo e-mail e mesmo papel sem necessidade

### E-mail

- e-mail do convite deve ser o mesmo e-mail da conta criada
- tela de aceite não deve permitir trocar o e-mail

### Papéis

- papel vem do convite, não da escolha do usuário
- usuário não escolhe `role` no onboarding
- `ADMIN` pode convidar `ADMIN`
- `TUTOR` não pode convidar `TUTOR` nem `ADMIN`

### Segurança

- token opaco, armazenado como hash SHA-256, igual à estratégia já usada em sessão/reset
- rate limit no endpoint de aceite
- rate limit também no endpoint de emissão de convite
- mensagens neutras quando possível

### Conta existente

Regra explícita:

- se já existir conta com aquele e-mail, o convite não deve ser criado
- o aceite também deve falhar se surgir uma conta com esse e-mail entre a emissão e o aceite

Essa regra vale para qualquer papel, inclusive `ADMIN`.

### Vínculo tutor-aluno

- o vínculo é opcional no convite
- se `tutorId` vier preenchido e o papel do convite for `STUDENT`, criar `TutorStudent` no aceite
- se `tutorId` vier vazio, não criar vínculo
- se o convite for para `TUTOR` ou `ADMIN`, `tutorId` deve ser ignorado ou rejeitado por validação

---

## Impacto no sistema atual

### O que muda

- remover o cadastro público em `/cadastro`
- trocar `POST /api/auth/register` por `POST /api/invitations/accept`
- criar gestão de convites no painel admin
- criar gestão de convites no painel tutor

### O que reaproveita

- `hashPassword`
- `createSession`
- `setSessionCookie`
- `initializeUserData`
- padrão de token com hash usado no reset de senha
- RBAC já existente

### O que merece ajuste

- `createTutor` hoje pede senha definida pelo admin; com convite, o tutor deveria definir a própria senha
- o rate limit hoje cobre login/cadastro/reset; precisará cobrir emissão e aceite de convite
- os textos da landing/header precisam parar de incentivar cadastro livre
- o fluxo de cadastro atual deve ser removido ou rebaixado para uso interno apenas

---

## Permissões sugeridas

Adicionar ações como:

- `invite.create.admin`
- `invite.create.tutor`
- `invite.create.student`
- `invite.revoke`
- `invite.list`

Mapa inicial:

- `ADMIN`: todas
- `TUTOR`: `invite.create.student` e visualização dos próprios convites
- `STUDENT`: nenhuma

---

## UX recomendada

### Admin

Nova área:

- lista de convites
- status: pendente, usado, expirado, revogado
- filtro por papel, emissor e status
- ação de reenviar/copiar link
- ação de revogar

### Tutor

Versão enxuta:

- convidar aluno
- listar apenas convites emitidos por ele
- opcionalmente indicar um vínculo tutor-aluno já no convite
- ver se o aluno aceitou

### Usuário convidado

Tela simples:

- confirmação de que foi convidado
- nome
- senha
- confirmação de senha
- botão "ativar conta"

---

## Ordem de implementação recomendada

### Fase 1

- criar modelo `Invitation`
- criar serviço de emissão, validação e aceite
- criar tela `/convite/[token]`
- desabilitar cadastro público
- permitir admin convidar `ADMIN`, `TUTOR` e `STUDENT`
- bloquear convite para e-mail já existente
- usar expiração padrão de 3 dias

### Fase 2

- permitir tutor convidar aluno
- permitir vínculo tutor-aluno opcional no convite
- criar vínculo `TutorStudent` no aceite apenas quando o convite trouxer essa associação
- criar listagem de convites por emissor

### Fase 3

- integrar envio de e-mail
- adicionar reenvio, revogação e limpeza de convites expirados
- cobrir com testes de integração e E2E

---

## Recomendação final

A melhor direção é:

- **manter login por e-mail e senha**
- **remover apenas o cadastro aberto**
- **adicionar onboarding por convite**
- **usar convite como ponto de controle de entrada e de papel**
- **criar a conta apenas no aceite do convite**

Isso entrega governança sem exigir reescrever toda a autenticação.
