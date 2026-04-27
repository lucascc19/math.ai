# Pendencias consolidadas

Data de consolidacao: 2026-04-27

Este documento substitui os planos e propostas anteriores da pasta `docs/` e concentra apenas o que ainda esta pendente. Itens ja implementados foram removidos para evitar duplicacao e leitura desnecessaria.

## 1. Operacao e validacao

### Validacao funcional

- Validar no admin o fluxo completo de criacao, edicao, reordenacao e movimentacao de licoes entre modulos.
- Confirmar que a progressao do aluno continua correta em trilhas com mais de um modulo.
- Validar o comportamento da UX ao mover licoes entre modulos.
- Registrar uma rodada final de validacao local com ambiente completo, dados reais e migrations aplicadas.

## 2. Conteudo e estrutura pedagogica

### Escopo curricular ainda pendente

- Decidir se `dominio` ou `categoria` entrara como entidade explicita no modelo.
- Confirmar se toda trilha continuara sendo tratada como percurso pedagogico, e nao como macroassunto.
- Revisar se os campos legados da licao (`prompt`, `story`, `explanation`, `answer`) ainda precisam existir apos a migracao editorial.

### Authoring e publicacao

- Definir criterios minimos para considerar trilha, modulo e licao como publicaveis.
- Impedir publicacao de conteudo pedagogicamente incompleto quando essa regra for formalizada.
- Revisar a necessidade de checklist editorial mais forte no fluxo de publicacao.

## 3. Atividades e avaliacao

### Fechamento da fase de atividades

- Validar o fluxo completo de criacao e edicao de varias atividades no admin.
- Decidir se o aluno deve consumir apenas uma atividade principal ou uma sequencia de atividades por licao.
- Refinar os criterios de correcao para `SHORT_TEXT`, especialmente se houver sinonimos, variacoes aceitaveis ou respostas abertas.

### Evolucoes recomendadas

- Definir se a plataforma precisa de mais tipos de atividade alem de `NUMERIC`, `MULTIPLE_CHOICE`, `TRUE_FALSE` e `SHORT_TEXT`.
- Avaliar se atividades futuras exigem feedback adaptativo por tentativa ou por erro comum.

## 4. Reaproveitamento de conteudo

### Primeira entrega

- Duplicar licao.
- Clonar licao para outro modulo.
- Duplicar trilha a partir de uma trilha existente.

### Evolucao posterior

- Avaliar introducao de `LessonTemplate` como entidade persistida, e nao apenas template de formulario.
- Avaliar biblioteca de blocos reutilizaveis.
- Avaliar modelo de conteudo base com instancia dentro da trilha para reduzir duplicacao editorial.

## 5. Progresso do aluno

### Pendencias imediatas

- Confirmar a estabilidade da progressao atual apos a introducao de modulos, atividades e blocos.

### Evolucao estrutural

- Revisar `TrackProgress` para reduzir dependencia de sequencia linear implicita.
- Avaliar migracao para progresso baseado em item explicito, como `LessonProgress`.
- Definir como progresso deve funcionar quando houver reaproveitamento real de conteudo entre trilhas.

## 6. Convites e onboarding controlado

### Produto e fluxo

- Confirmar se o modelo de acesso por convite segue como direcao definitiva de onboarding.
- Desativar por completo qualquer fluxo residual de cadastro publico, se ainda existir comportamento legado.
- Revisar textos de produto para garantir consistencia entre login, cadastro e convite.

### Admin e tutor

- Validar se a criacao de convites substitui integralmente a criacao manual de usuarios sensiveis, como tutor.
- Confirmar o escopo final da gestao de convites no admin e no tutor.

### Robustez tecnica

- Revisar `initializeUserData()` para garantir comportamento transacional no aceite do convite.
- Confirmar cobertura de rate limit para emissao, resolucao e aceite de convites.
- Formalizar erros de dominio especificos para convites, se isso ainda nao estiver estabilizado no backend.

## 7. Testes e cobertura

### Testes de integracao e E2E ainda necessarios

- Cobrir o fluxo real de admin criando convite e usuario aceitando onboarding.
- Cobrir o fluxo de tutor convidando aluno com vinculo opcional.
- Garantir que o caminho antigo de cadastro nao permita criar conta fora do fluxo esperado.
- Cobrir os cenarios de convite expirado, revogado e ja utilizado.

### Regressao geral

- Rodar validacao completa com `lint`, `typecheck`, testes unitarios, testes E2E e build apos as ultimas mudancas estruturais.

## 8. Ordem recomendada

1. Fechar a validacao funcional de modulos, blocos, atividades e progressao.
2. Entregar duplicacao e clonagem simples de conteudo.
3. Fechar regras de atividades e correcao pedagogica.
4. Revisar o modelo de progresso antes de introduzir reaproveitamento estrutural mais avancado.
5. Consolidar o fluxo de convites apenas se ainda houver lacunas funcionais ou de cobertura.
