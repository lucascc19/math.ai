# Estrutura proposta para trilhas e lições

Data: 2026-04-20

## Contexto atual

Hoje a plataforma trabalha com um modelo simples e linear:

- `SkillTrack` representa uma trilha
- `Lesson` pertence diretamente a uma trilha
- a progressão do aluno usa `lessonIndex`
- o admin cadastra a lição por um formulário com campos fixos

Isso funciona para o MVP, mas cria algumas limitações:

- a trilha fica rígida demais para assuntos amplos como trigonometria
- não existe uma camada intermediária para agrupar subtemas
- conteúdos comuns a várias trilhas precisam ser duplicados
- o formulário de lição mistura metadados, pedagogia e conteúdo em uma única tela
- o conteúdo textual não foi pensado para fórmulas matemáticas

## Princípios para a próxima evolução

### 1. Trilha não deve ser sinônimo de assunto

Uma trilha deve representar um percurso pedagógico com começo, meio e fim.

Exemplos:

- `Fundamentos de trigonometria`
- `Trigonometria para triângulos retângulos`
- `Preparação para funções trigonométricas`

Isso é melhor do que usar apenas `Trigonometria`, porque o percurso fica claro para aluno e professor.

### 2. Conteúdo reutilizável deve existir fora da trilha

Quando um conteúdo aparece em mais de um percurso, ele não deve nascer “preso” a uma única trilha.

Exemplos:

- `Razão`
- `Proporção`
- `Leitura de ângulos`
- `Operações com frações`

Esses conteúdos devem ser unidades reutilizáveis associadas a diferentes trilhas.

### 3. O cadastro precisa separar estrutura de conteúdo e experiência de edição

Hoje o modelo do banco força a interface a ser um formulário grande e pouco intuitivo.

O ideal é separar:

- metadados da trilha
- organização curricular
- conteúdo autoral da lição
- configuração pedagógica
- publicação

### 4. Matemática precisa de suporte nativo a Markdown e fórmulas

Campos como explicação, contexto, dica e enunciado se beneficiam de:

- Markdown
- LaTeX inline e em bloco
- listas
- tabelas
- observações didáticas

## Modelo conceitual recomendado

## Níveis de organização

Sugestão de hierarquia:

1. `Domínio`
2. `Trilha`
3. `Módulo`
4. `Lição`
5. `Item avaliativo` ou `atividade`

### Domínio

Macrotema da matemática.

Exemplos:

- Aritmética
- Álgebra
- Geometria
- Trigonometria

### Trilha

Percurso pedagógico voltado para um objetivo de aprendizagem.

Exemplos:

- `Introdução à trigonometria no triângulo retângulo`
- `Seno, cosseno e tangente na prática`

### Módulo

Agrupador de lições dentro da trilha.

Exemplos:

- `Pré-requisitos`
- `Razões trigonométricas`
- `Problemas aplicados`

### Lição

Unidade de estudo.

Ela pode conter:

- explicação
- exemplos resolvidos
- dica
- atividade principal
- passos guiados

### Item avaliativo

Questão ou exercício específico.

Isso permite, no futuro:

- uma lição com múltiplos exercícios
- variações por dificuldade
- banco de questões
- reaproveitamento em revisão adaptativa

## Recomendação prática para este projeto

Para não complicar demais de uma vez, a melhor evolução é:

1. manter `trilha`
2. adicionar `módulo`
3. transformar a lição em conteúdo mais rico
4. preparar o terreno para reaproveitamento entre trilhas

Em outras palavras: não precisa pular direto para um LMS complexo, mas vale sair do modelo “trilha -> lição simples” para “trilha -> módulos -> lições”.

## Conceito pedagógico recomendado

## O que é uma trilha

Use trilha quando existir:

- objetivo pedagógico claro
- sequência recomendada
- critério de conclusão
- público ou nível esperado

Campos sugeridos:

- `slug`
- `title`
- `shortDescription`
- `longDescriptionMd`
- `estimatedMinutes`
- `difficulty`
- `domainId`
- `coverVariant`
- `status`
- `targetAudience`
- `prerequisiteSummaryMd`
- `learningOutcomesMd`

## O que é um módulo

Use módulo para organizar um assunto macro sem perder clareza.

Exemplo para trigonometria:

- Trilha: `Fundamentos de trigonometria`
- Módulo 1: `Ângulos e medidas`
- Módulo 2: `Triângulo retângulo`
- Módulo 3: `Razões trigonométricas`
- Módulo 4: `Problemas aplicados`

Campos sugeridos:

- `trackId`
- `title`
- `descriptionMd`
- `orderIndex`
- `estimatedMinutes`
- `isOptional`

## O que é uma lição

A lição deve ser uma unidade ensinável, não apenas uma pergunta.

Ela deve permitir:

- contexto
- teoria
- exemplo resolvido
- exercício
- resposta esperada
- dica
- passos guiados

Campos sugeridos:

- `moduleId`
- `slug`
- `title`
- `summary`
- `contentMd`
- `instructionMd`
- `teacherNotesMd`
- `difficulty`
- `lessonType`
- `estimatedMinutes`
- `orderIndex`
- `status`

`lessonType` pode começar simples:

- `EXPLANATION`
- `PRACTICE`
- `QUIZ`
- `REVIEW`

## Reaproveitamento entre trilhas

Esse é um dos pontos mais importantes.

Se um conteúdo pode aparecer em mais de uma trilha, há dois caminhos.

### Caminho 1. Reuso por referência

Criar uma entidade de biblioteca, por exemplo `ContentUnit`, e associá-la a várias trilhas/módulos.

Vantagens:

- evita duplicação
- centraliza manutenção

Desvantagens:

- aumenta complexidade do modelo
- exige cuidado com progresso do aluno

### Caminho 2. Reuso editorial assistido

Manter a lição dentro da trilha, mas permitir:

- duplicar lição
- clonar para outra trilha
- criar a partir de template

Vantagens:

- implementação mais simples
- menor impacto no progresso atual

Desvantagens:

- continua existindo duplicação

## Recomendação

No curto prazo, adote o caminho 2.

No médio prazo, evolua para um modelo híbrido:

- `LessonTemplate` ou `ContentUnit` como biblioteca
- `TrackLesson` como instância ordenada dentro da trilha

Assim você reaproveita o conteúdo sem perder flexibilidade de sequência por trilha.

## Proposta de UX para criação de trilhas

O fluxo de cadastro atual pede poucos campos da trilha e joga toda a complexidade nas lições.

Uma experiência melhor seria em etapas.

## Etapa 1. Criar trilha

Campos:

- nome
- slug
- descrição curta
- descrição completa em Markdown
- tempo estimado
- nível
- domínio
- objetivos de aprendizagem
- pré-requisitos

## Etapa 2. Montar estrutura

Ao criar a trilha, o professor vê um construtor de estrutura:

- adicionar módulo
- reordenar módulos
- adicionar lição dentro do módulo
- duplicar lição
- mover lição entre módulos

## Etapa 3. Editar lição em painel mais semântico

Em vez de um grid de `inputs`, use seções:

### Bloco 1. Identificação

- título
- slug
- tipo de lição
- dificuldade
- tempo estimado

### Bloco 2. Conteúdo do aluno

- resumo
- conteúdo em Markdown
- instrução da atividade
- dica

### Bloco 3. Avaliação

- tipo de resposta
- resposta correta
- critérios de validação
- feedback correto
- feedback de erro

### Bloco 4. Apoio pedagógico

- objetivo da lição
- pré-requisitos
- notas do professor
- tags

### Bloco 5. Publicação

- rascunho/publicado
- pré-visualização

## Markdown para conteúdo matemático

Faz bastante sentido usar Markdown.

Sugestão:

- `summary`: texto curto simples
- `contentMd`: Markdown completo
- `instructionMd`: Markdown curto para o enunciado
- `teacherNotesMd`: Markdown interno

### Sintaxe recomendada

- texto em Markdown normal
- fórmulas inline com `$...$`
- fórmulas em bloco com `$$...$$`

Exemplo:

```md
## Definição

Em um triângulo retângulo:

$$
\sin(\theta) = \frac{\text{cateto oposto}}{\text{hipotenusa}}
$$

### Exemplo

Se o cateto oposto mede 3 e a hipotenusa mede 5, então:

$$
\sin(\theta) = \frac{3}{5}
$$
```

### Benefícios

- facilita fórmulas
- permite copiar conteúdo de materiais externos
- simplifica revisão editorial
- abre caminho para preview ao vivo

## Proposta de modelagem de dados

## Fase 1. Melhorar sem quebrar muito

Adicionar em `SkillTrack`:

- `shortDescription`
- `longDescriptionMd`
- `difficulty`
- `targetAudience`
- `learningOutcomesMd`
- `prerequisiteSummaryMd`

Criar `TrackModule`:

- `id`
- `skillTrackId`
- `title`
- `descriptionMd`
- `orderIndex`
- `estimatedMinutes`
- `status`

Evoluir `Lesson`:

- trocar `skillTrackId` por `trackModuleId`
- `summary`
- `contentMd`
- `instructionMd`
- `teacherNotesMd`
- `lessonType`
- `estimatedMinutes`

Campos atuais que podem ser mantidos temporariamente:

- `title`
- `level`
- `goal`
- `tip`
- `orderIndex`
- `status`

Campos atuais que merecem revisão:

- `prompt`
- `story`
- `explanation`
- `answer`

Eles hoje estão acoplados a uma lição do tipo “pergunta com resposta inteira”.

## Fase 2. Evoluir avaliação

Separar a parte avaliativa em outra entidade:

- `LessonActivity`
- `ActivityOption`
- `ActivityAnswer`

Tipos possíveis:

- resposta numérica
- múltipla escolha
- verdadeiro ou falso
- resposta textual curta

## Fase 3. Reuso real

Criar biblioteca de conteúdo:

- `ContentUnit`
- `TrackContentReference`

Ou então:

- `LessonTemplate`
- `TrackLesson`

## Impacto no progresso do aluno

Hoje o progresso depende de `lessonIndex`, então ele pressupõe uma sequência linear simples.

Se você adicionar módulos e reaproveitamento, o ideal é migrar para progresso baseado em item explícito.

Exemplo:

- `TrackProgress`
  - `currentTrackLessonId`
  - `completedLessons`
  - `mastery`

Ou:

- `LessonProgress`
  - `userId`
  - `lessonId`
  - `status`
  - `attempts`
  - `mastery`

Recomendação:

- curto prazo: manter lógica linear, agora por módulo + ordem
- médio prazo: introduzir `LessonProgress`

## Proposta de UX da tela de admin

## Problema da tela atual

A tela atual em `components/admin/track-detail-panel.tsx` trata a lição como um conjunto de inputs rasos:

- `title`
- `prompt`
- `story`
- `explanation`
- `answer`
- `level`
- `goal`
- `tip`
- `orderIndex`

Isso fica ruim para:

- conteúdo longo
- matemática com fórmulas
- revisão editorial
- reaproveitamento

## Sugestão de interface

### Painel lateral de estrutura

À esquerda:

- módulos
- lições por módulo
- status
- tempo
- drag and drop futuro

### Editor principal

À direita:

- abas `Conteúdo`, `Atividade`, `Metadados`, `Pré-visualização`

### Preview em tempo real

Mostrar a renderização do Markdown com fórmulas.

### Templates rápidos

Botões como:

- `Lição expositiva`
- `Exercício guiado`
- `Lista curta`
- `Revisão`

Cada template já preenche a estrutura básica do editor.

## Estrutura editorial mínima recomendada

Se quiser algo objetivo e sustentável, eu sugiro padronizar cada lição com:

1. `Título`
2. `Resumo`
3. `Objetivo`
4. `Explicação em Markdown`
5. `Exemplo resolvido`
6. `Atividade`
7. `Dica`
8. `Feedback/solução`

Isso já organiza bem matemática sem exigir uma arquitetura enorme logo de início.

## Caminho de implementação recomendado

## Sprint 1. Melhorar conceito e authoring sem mudar toda a pedagogia

- adicionar campos ricos em trilha
- permitir Markdown nas descrições
- trocar `Input` por `Textarea` ou editor para campos longos
- reorganizar o formulário de lição por seções
- adicionar preview

## Sprint 2. Introduzir módulos

- criar tabela `TrackModule`
- atualizar CRUD admin
- exibir trilha com módulos
- manter progressão linear dentro da ordem dos módulos e lições

## Sprint 3. Preparar tipos de atividade

- separar conteúdo de avaliação
- permitir mais de um formato de resposta

## Sprint 4. Reuso entre trilhas

- duplicar/clonar lições
- depois evoluir para biblioteca reutilizável

## Decisões recomendadas agora

Para este projeto, eu seguiria estas decisões:

1. `Trilha` deve ser um percurso pedagógico, não apenas um tema macro.
2. `Tema macro` deve virar domínio ou categoria.
3. `Trigonometria` faz mais sentido como domínio ou como trilha-mãe conceitual, e não como uma única trilha linear gigante.
4. `Subconteúdos` devem ser organizados em módulos.
5. `Conteúdos compartilhados` devem começar com duplicação assistida e, depois, evoluir para biblioteca.
6. `Markdown + LaTeX` deve ser adotado como padrão para conteúdo textual.
7. A `lição` deve deixar de ser só uma pergunta com resposta inteira e passar a ser uma unidade de ensino mais completa.

## Relação com a implementação atual

Os pontos do código que mais serão impactados nessa evolução são:

- `prisma/schema.prisma`
- `lib/schemas.ts`
- `lib/server/content.ts`
- `lib/server/app-data.ts`
- `components/admin/track-detail-panel.tsx`

## Próximo passo sugerido

Antes de sair implementando tudo, vale fechar estas três decisões de produto:

1. Se `trilha` vai significar percurso pedagógico ou macroassunto.
2. Se na primeira fase já entra `módulo`.
3. Se a primeira melhoria do editor será com `Markdown + preview` antes da remodelagem completa do banco.

Minha recomendação:

- decidir que trilha = percurso pedagógico
- já incluir módulo na modelagem
- fazer primeiro a melhoria editorial com Markdown e preview

Esse caminho entrega valor rápido sem exigir uma reescrita total do produto.
