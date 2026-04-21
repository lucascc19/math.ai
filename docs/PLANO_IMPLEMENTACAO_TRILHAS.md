# Plano de implementacao das trilhas

Data: 2026-04-20

Documento base relacionado:

- [ESTRUTURA_TRILHAS_E_LICOES.md](C:/Users/lucas/source/repos/math.ai/docs/ESTRUTURA_TRILHAS_E_LICOES.md)

## Objetivo

Transformar o cadastro atual de trilhas e licoes em um sistema mais:

- flexivel para varios temas de matematica
- amigavel para professores/autores
- compativel com Markdown e formulas
- preparado para evolucao pedagogica sem reescrever tudo

## Status atual do plano

### Fase 1

Status: concluida.

Ja entregue:

- expansao do modelo `SkillTrack` com campos editoriais ricos
- expansao do modelo `Lesson` com campos de authoring e tipo de licao
- nova migration criada para os campos ricos
- seed adaptada para popular os novos campos
- schemas Zod e tipos TS atualizados
- contratos do CRUD de conteudo atualizados
- refatoracao do painel admin para formularios mais semanticos
- criacao de `Textarea` para conteudo longo
- renderizacao real de Markdown com formulas usando KaTeX
- melhoria da experiencia do aluno para consumir os novos campos ricos
- rodada de validacao local com build aprovado
- polimento final de textos e labels nas telas alteradas

### Fase 2

Status: concluida funcionalmente.

Ja entregue:

- criacao de `TrackModule` na modelagem
- migration para introduzir modulos e associar licoes existentes a um modulo padrao
- seed adaptada para criar modulo padrao por trilha
- schemas e tipos atualizados para `trackModuleId`
- CRUD base de modulos implementado
- reordenacao de modulos implementada
- reordenacao de licoes dentro do modulo implementada
- editor admin adaptado para `trilha -> modulo -> licao`
- criacao de licao contextual ao modulo implementada
- edicao de licao com troca de modulo implementada
- area do aluno adaptada para percorrer modulos explicitamente
- detalhe da trilha do aluno exibindo a estrutura por modulos
- listagem geral do aluno exibindo o modulo atual
- detalhe da trilha reorganizado para priorizar visao geral, pre-requisitos, objetivos e modulos
- licoes do aluno navegaveis a partir dos modulos, com abertura do conteudo na propria tela
- reindexacao automatica ao mover ou excluir licoes entre modulos
- remocao da rota antiga de reorder por trilha
- build de producao validado com sucesso apos essas mudancas

Pendente nesta fase:

- aplicar a migration localmente onde ainda nao foi aplicada
- validar o fluxo completo no admin com criacao, reordenacao e movimentacao entre modulos
- validar a progressao do aluno com trilhas que tenham varios modulos
- registrar uma rodada final de validacao local com o ambiente completo

### Fase 3

Status: iniciada.

### Fase 4

Status: nao iniciada.

## Diagnostico consolidado

Hoje o sistema ainda esta centrado em:

- `SkillTrack` como trilha
- `Lesson` diretamente ligada a trilha
- progresso por `lessonIndex`
- fluxo linear de estudo

Arquivos centrais desta evolucao:

- [schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
- [schemas.ts](C:/Users/lucas/source/repos/math.ai/lib/schemas.ts)
- [api.ts](C:/Users/lucas/source/repos/math.ai/lib/api.ts)
- [content.ts](C:/Users/lucas/source/repos/math.ai/lib/server/content.ts)
- [app-data.ts](C:/Users/lucas/source/repos/math.ai/lib/server/app-data.ts)
- [content-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/content-panel.tsx)
- [track-detail-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/track-detail-panel.tsx)

Principais limitacoes ainda existentes:

1. A trilha continua linear demais para assuntos amplos.
2. A atividade continua acoplada ao modelo antigo de resposta numerica.
3. Nao existe reaproveitamento real entre trilhas.

## Decisoes de produto assumidas

Este plano continua assumindo:

1. `Trilha` significa percurso pedagogico.
2. `Dominio` ou `categoria` representa o assunto macro.
3. `Modulo` vai organizar subconteudos dentro da trilha.
4. `Licao` deixa de ser apenas uma pergunta e passa a ser uma unidade de ensino.
5. `Markdown + LaTeX` continua sendo o padrao editorial desejado.

## Estrategia de entrega

A recomendacao segue em 4 fases.

## Fase 1. Melhorar o authoring sem quebrar a base

Meta:

- melhorar a criacao de trilhas e licoes
- introduzir conteudo rico
- manter a logica atual de progresso funcionando

### Escopo funcional da fase

Adicionar campos ricos em trilha:

- `shortDescription`
- `longDescriptionMd`
- `difficulty`
- `targetAudience`
- `learningOutcomesMd`
- `prerequisiteSummaryMd`

Evoluir licao com conteudo textual melhor:

- `summary`
- `contentMd`
- `instructionMd`
- `teacherNotesMd`
- `lessonType`
- `estimatedMinutes`

Manter temporariamente:

- `orderIndex`
- `status`
- `level`
- `goal`
- `tip`
- `prompt`
- `story`
- `explanation`
- `answer`

### Implementado na fase 1

Mudancas de banco:

- `SkillTrack` expandido em [schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
- `Lesson` expandida em [schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
- migration criada em [20260420183000_add_rich_track_and_lesson_fields](C:/Users/lucas/source/repos/math.ai/prisma/migrations/20260420183000_add_rich_track_and_lesson_fields/migration.sql)

Compatibilidade:

- `description` foi mantido
- `prompt`, `story`, `explanation` e `answer` foram mantidos
- o backfill inicial replica conteudo antigo para os campos novos

Validacao e tipos:

- `trackDraftSchema` e `trackPatchSchema` atualizados em [schemas.ts](C:/Users/lucas/source/repos/math.ai/lib/schemas.ts)
- `lessonDraftSchema` e `lessonPatchSchema` atualizados em [schemas.ts](C:/Users/lucas/source/repos/math.ai/lib/schemas.ts)
- tipos admin atualizados em [api.ts](C:/Users/lucas/source/repos/math.ai/lib/api.ts)

Backend:

- `listTracksForAdmin` retorna mais campos
- `createDraftTrack` e `updateTrack` adaptados
- CRUD de licoes segue compativel com o modelo atual

UI admin:

- criacao de trilha refeita em blocos
- edicao de trilha refeita em blocos
- criacao e edicao de licao reorganizadas em secoes
- campos longos migrados para `Textarea`
- preview com renderizacao real de Markdown e formulas em [simple-markdown-preview.tsx](C:/Users/lucas/source/repos/math.ai/components/ui/simple-markdown-preview.tsx)
- novo componente de apoio [textarea.tsx](C:/Users/lucas/source/repos/math.ai/components/ui/textarea.tsx)

Area do aluno:

- trilha detalhada adaptada para `longDescriptionMd`, `instructionMd`, `contentMd`, objetivos e pre-requisitos
- listagem de trilhas adaptada para exibir mais contexto pedagogico
- renderizacao real de formulas entregue

### Encerramento da fase 1

A Fase 1 foi considerada concluida porque:

1. o professor consegue criar trilha com descricao rica
2. o professor consegue criar licao com conteudo em Markdown
3. o preview funciona com formulas renderizadas
4. a area do aluno consome os novos campos principais
5. o build de producao foi executado com sucesso

### Criterio de pronto da fase 1

- professor consegue criar trilha com descricao rica
- professor consegue criar licao com conteudo em Markdown
- preview funciona no admin
- area do aluno continua operacional
- ao menos uma rodada de validacao local foi feita apos migration
- build de producao passa

## Fase 2. Introduzir modulos

Meta:

- organizar melhor assuntos amplos
- preparar escalabilidade curricular

### Escopo funcional

Criar `TrackModule` entre trilha e licao.

Estrutura:

- uma trilha possui varios modulos
- um modulo possui varias licoes
- modulo define agrupamento e ordem macro

### Mudancas previstas

Banco:

- criar `TrackModule`
- trocar relacao de `Lesson` para modulo

Migracao:

1. criar `TrackModule`
2. criar modulo padrao para cada trilha existente
3. associar licoes atuais ao modulo padrao
4. depois remover dependencia direta de `skillTrackId` em `Lesson`

Backend:

- CRUD de modulos
- reordenacao de modulos
- mover licao entre modulos

UI admin:

- coluna ou secoes por modulo
- criacao contextual de licao

Area do aluno:

- percorrer modulos e licoes em ordem
- exibir agrupamento por modulo

### Implementado ate agora na fase 2

Banco:

- `TrackModule` criado em [schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
- migration criada em [20260420221000_add_track_modules](C:/Users/lucas/source/repos/math.ai/prisma/migrations/20260420221000_add_track_modules/migration.sql)
- `Lesson` agora referencia `trackModuleId`

Migracao:

- modulo padrao por trilha previsto na migration
- backfill das licoes atuais para o modulo padrao previsto na migration

Backend:

- CRUD base de modulos em [content.ts](C:/Users/lucas/source/repos/math.ai/lib/server/content.ts)
- rotas HTTP para modulos em `app/api/admin/content/modules/*`
- rota de reordenacao de modulos em [tracks/[trackId]/modules/reorder](C:/Users/lucas/source/repos/math.ai/app/api/admin/content/tracks/%5BtrackId%5D/modules/reorder/route.ts)

UI admin:

- painel de detalhe da trilha reorganizado em modulos em [track-detail-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/track-detail-panel.tsx)
- criacao de modulo implementada
- edicao de modulo implementada
- criacao de licao dentro do modulo implementada
- troca de modulo na edicao da licao implementada
- reordenacao visual de modulos implementada
- reordenacao de licoes por modulo implementada
- movimentacao entre modulos com reindexacao implementada

Area do aluno:

- dashboard reorganizado para montar a sequencia a partir de `modulo -> licao` em [app-data.ts](C:/Users/lucas/source/repos/math.ai/lib/server/app-data.ts)
- detalhe da trilha mostra modulos e licoes em [student-track-detail.tsx](C:/Users/lucas/source/repos/math.ai/components/student-track-detail.tsx)
- detalhe da trilha reorganizado para reduzir redundancia e dar foco a visao editorial da trilha
- licoes do modulo passaram a ser clicaveis e exibem o conteudo da licao na propria tela
- listagem geral mostra quantidade de modulos e o modulo atual em [student-tracks.tsx](C:/Users/lucas/source/repos/math.ai/components/student-tracks.tsx)

### Pendencias para concluir a fase 2

1. Aplicar a migration localmente e validar os dados reais.
2. Confirmar que a progressao do aluno continua correta em trilhas com mais de um modulo.
3. Fazer uma rodada de validacao de UX para mover licao entre modulos.
4. Registrar uma rodada final de validacao local com o ambiente completo.

### Criterio de pronto da fase 2

- uma trilha pode ter modulos
- licoes ficam dentro de modulos
- aluno continua avancando em ordem

## Fase 3. Separar conteudo de atividade

Meta:

- deixar a licao mais versatil
- preparar multiplos formatos de exercicio

### Problema atual

Hoje a licao ainda contem diretamente:

- `answer`
- `prompt`
- `explanation`

Isso continua funcionando apenas para um exercicio numerico simples.

### Novo desenho previsto

Manter `Lesson` como unidade pedagogica.

Criar `LessonActivity` como unidade avaliativa.

Campos sugeridos:

- `id`
- `lessonId`
- `type`
- `instructionMd`
- `answerKey`
- `hintMd`
- `feedbackCorrectMd`
- `feedbackIncorrectMd`
- `orderIndex`

Tipos iniciais:

- `NUMERIC`
- `MULTIPLE_CHOICE`
- `TRUE_FALSE`
- `SHORT_TEXT`

### Criterio de pronto da fase 3

- licao pode ter conteudo explicativo independente da atividade
- sistema aceita pelo menos 2 tipos diferentes de resposta

### Implementado ate agora na fase 3

Banco:

- `LessonActivity` criado em [schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)
- migration criada em [20260420233000_add_lesson_activities](C:/Users/lucas/source/repos/math.ai/prisma/migrations/20260420233000_add_lesson_activities/migration.sql)
- `Attempt` agora referencia `activityId` e armazena resposta textual
- backfill previsto para criar uma atividade padrao por licao existente

Backend:

- schemas Zod atualizados para receber `activityId` na submissao e `activities[]` no authoring de licao
- `content.ts` adaptado para criar e atualizar varias atividades por licao
- `app-data.ts` adaptado para avaliar a resposta pela atividade da licao
- avaliacao especifica implementada para `NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE` e `SHORT_TEXT`

UI admin:

- editor da licao adaptado para adicionar, remover e reordenar varias atividades
- suporte inicial de authoring para `NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE` e `SHORT_TEXT`

Area do aluno:

- conteudo da licao separado visualmente da atividade
- resposta interativa da atividade principal implementada
- suporte inicial a `NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE` e `SHORT_TEXT`

### Pendencias para concluir a fase 3

1. Aplicar a migration de `LessonActivity` no ambiente real.
2. Validar o fluxo completo de criacao e edicao de varias atividades no admin.
3. Decidir se o aluno vai consumir apenas a atividade principal ou uma sequencia de atividades por licao.
4. Polir criterios pedagogicos de correcao para `SHORT_TEXT` caso precise aceitar sinonimos ou respostas abertas.

## Fase 4. Reaproveitamento entre trilhas

Meta:

- evitar duplicacao excessiva
- permitir manutencao mais eficiente

### Primeira entrega recomendada

- duplicar licao
- clonar licao para outra trilha
- criar trilha a partir de trilha existente

### Segunda entrega recomendada

- `LessonTemplate` ou `ContentUnit`
- `TrackLesson` como instancia dentro da trilha

### Criterio de pronto da fase 4

- autor consegue reaproveitar conteudo entre trilhas sem recriar tudo manualmente

## Plano tecnico por arquivo

### 1. Prisma

Arquivo:

- [schema.prisma](C:/Users/lucas/source/repos/math.ai/prisma/schema.prisma)

Status:

- expansao de `SkillTrack` implementada
- expansao de `Lesson` implementada
- `TrackModule` implementado
- `LessonActivity` implementado
- revisao de `TrackProgress` pendente

### 2. Seed

Arquivo:

- [seed.ts](C:/Users/lucas/source/repos/math.ai/prisma/seed.ts)

Status:

- novos campos basicos populados
- modulo padrao implementado na seed
- atividade padrao por licao implementada na seed

### 3. Schemas e tipos

Arquivos:

- [schemas.ts](C:/Users/lucas/source/repos/math.ai/lib/schemas.ts)
- [api.ts](C:/Users/lucas/source/repos/math.ai/lib/api.ts)

Status:

- trilha rica implementada
- licao rica implementada
- modulo implementado
- atividade implementada para os tipos iniciais

### 4. Servicos de conteudo

Arquivo:

- [content.ts](C:/Users/lucas/source/repos/math.ai/lib/server/content.ts)

Status:

- CRUD de trilhas mais ricas implementado
- CRUD de licoes mais ricas implementado
- CRUD de modulos implementado
- CRUD inicial de atividades dentro da licao implementado

### 5. Area do aluno

Arquivo:

- [app-data.ts](C:/Users/lucas/source/repos/math.ai/lib/server/app-data.ts)

Status:

- compatibilidade preservada
- consumo real de Markdown implementado
- percurso por modulo implementado
- navegacao do aluno pelos modulos e licoes implementada
- submissao baseada em atividade implementada
- validacao final da progressao por modulo pendente

### 6. Admin

Arquivos:

- [content-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/content-panel.tsx)
- [track-detail-panel.tsx](C:/Users/lucas/source/repos/math.ai/components/admin/track-detail-panel.tsx)

Status:

- editor estruturado implementado
- textos longos implementados
- preview com formulas implementado
- modulos implementados
- templates de licao pendentes

## Migracoes recomendadas

Sequencia sugerida:

1. `add_rich_track_and_lesson_fields`
2. `add_track_modules`
3. `migrate_lessons_to_modules`
4. `add_lesson_activities`
5. `evolve_progress_model`

## Riscos e cuidados

### 1. Progresso do aluno

Risco:

- quebrar o avanco atual ao mudar a ordem estrutural

Mitigacao:

- manter compatibilidade linear nas fases 1 e 2
- so rever progresso profundamente na fase 3 ou 4

### 2. Publicacao parcial

Risco:

- trilha publicada com conteudo rico incompleto

Mitigacao:

- manter regras simples de publicacao
- impedir publicacao sem ao menos uma licao valida publicada no futuro

### 3. Conteúdo legado

Risco:

- trilhas atuais ficarem visualmente pobres na nova UI

Mitigacao:

- migration populando campos novos com base nos antigos
- compatibilidade mantida no aluno

### 4. Escopo grande demais

Risco:

- tentar resolver modelagem curricular completa de uma vez

Mitigacao:

- authoring melhor primeiro
- modulos depois
- atividades depois
- reuso completo por ultimo

## Backlog sugerido

## Epic 1. Authoring com Markdown

1. Expandir `SkillTrack` com campos editoriais.
2. Expandir `Lesson` com conteudo em Markdown.
3. Atualizar validacao Zod e tipos TS.
4. Refatorar formularios admin para blocos semanticos.
5. Adicionar preview.
6. Validar localmente com migration aplicada.
7. Melhorar a area do aluno para consumir os novos campos ricos.

Status da epic:

- concluida

## Epic 2. Modulos

1. Criar `TrackModule`.
2. Migrar licoes existentes para modulo padrao.
3. Implementar CRUD de modulos.
4. Implementar reordenacao por modulo.
5. Adaptar a area do aluno.

Status da epic:

- concluida funcionalmente
- pendente validacao local final da migration e da progressao real

## Epic 3. Atividades

1. Criar `LessonActivity`.
2. Ajustar submissao para atividade.
3. Implementar pelo menos `NUMERIC` e `MULTIPLE_CHOICE`.

## Epic 4. Reaproveitamento

1. Duplicar licao.
2. Clonar para outra trilha.
3. Duplicar trilha.
4. Avaliar biblioteca reutilizavel.

## Ordem recomendada de execucao real

Se a ideia for maximizar valor com menor risco, a ordem continua:

1. executar Fase 2
2. implementar duplicacao/clonagem simples
3. executar Fase 3
4. atacar biblioteca reutilizavel

## Proxima implementacao recomendada

A melhor proxima entrega agora e iniciar a Fase 3:

1. criar `LessonActivity`
2. separar visualmente conteudo de licao e atividade avaliativa
3. implementar pelo menos `NUMERIC` e `MULTIPLE_CHOICE`
4. revisar a submissao do aluno para responder a atividade, e nao mais a licao diretamente

Esse e o melhor caminho para transformar a navegacao por modulos ja consolidada em uma experiencia real de estudo e exercicios.
