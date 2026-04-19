# Status da Plataforma

## Visao geral

Este documento resume o estado atual da plataforma `Projeto Base Matematica`, com foco em:

- o que ja foi implementado
- o que esta funcional, mas ainda simplificado
- o que ainda precisa ser desenvolvido para a plataforma evoluir para producao

---

## 1. O que ja foi implementado

### 1.1 Base do projeto

- Migracao para `Next.js` com `TypeScript`
- Estrutura full-stack no mesmo projeto
- Configuracao inicial com:
  - `Tailwind CSS`
  - componentes reutilizaveis no estilo `shadcn/ui`
  - `TanStack React Query`
  - `Zustand`
  - `React Hook Form`
  - `zod`
  - `Prisma`
  - `Vitest`
  - `Playwright`
- Preparacao para uso com `pnpm`
- Estrutura compativel com deploy na `Vercel`

### 1.2 Interface publica e navegacao

- Landing page publica em `/`
- Header com:
  - links para secoes da pagina
  - botao de login
  - botao de cadastro
- Tela dedicada de login em `/login`
- Tela dedicada de cadastro em `/cadastro`
- Dashboard do aluno separado em `/dashboard`
- Protecao de rota do dashboard para usuarios autenticados
- Integracao do logo institucional do projeto na home

### 1.3 Conteudo da landing page

A pagina inicial foi reorganizada para exibir apenas informacoes institucionais relevantes antes do login:

- o que e o projeto
- quem sao os monitores:
  - Lucas
  - Gabi
- quem e o professor coordenador:
  - Anderson
- Instagram oficial do projeto:
  - `@projetobasematematica`

Tambem foram adicionados:

- links internos por ancora para facilitar navegacao na home
- cards institucionais mais enxutos
- layout mais limpo e objetivo antes do login

### 1.4 Design e experiencia

- Aplicacao da fonte `Lexend`
- Adocao visual baseada no design system `Axioma Suave`
- Preservacao da paleta do projeto:
  - Primary azul sereno
  - Secondary verde menta
  - Tertiary lilas suave
  - Neutral para superficies e texto
- Preservacao da identidade visual original durante o refinamento da landing
- Interface responsiva com melhor hierarquia visual
- Separacao clara entre area publica e area autenticada

### 1.5 Autenticacao e sessao

- Autenticacao real implementada no proprio app
- Cadastro de novos usuarios com senha
- Login real com verificacao de senha
- Senhas armazenadas com hash
- Sessao persistida por cookie `httpOnly`
- Logout com invalidacao da sessao atual
- Redirecionamento automatico:
  - usuario autenticado nao fica na tela de login/cadastro
  - usuario nao autenticado nao acessa o dashboard
- Novos usuarios cadastrados entram como `STUDENT` por padrao
- Remocao da dependencia do usuario demo como base da sessao principal

### 1.6 Acessibilidade

- Ajuste de tamanho do texto
- Ajuste de espacamento entre blocos
- Leitura guiada
- Modo minimalista
- Reducao de animacoes
- Modo de foco:
  - `calmo`
  - `guiado`
  - `contraste`
- Persistencia das preferencias no backend por usuario autenticado

### 1.7 Sistema pedagogico

- Trilhas iniciais:
  - Adicao
  - Subtracao
  - Multiplicacao
  - Divisao
- Licoes com:
  - enunciado
  - explicacao
  - nivel
  - meta
  - dica
  - passos guiados
- Logica de progressao por:
  - acertos
  - tentativas
  - streak
  - dominio
- Progresso salvo por usuario real

### 1.8 Backend

- Rotas de API implementadas no App Router
- Endpoints funcionais para:
  - dashboard
  - login
  - cadastro
  - logout
  - acessibilidade
  - submissao de resposta
- Validacao com `zod`
- Camada de dominio separada para calculo de progresso
- Uso do usuario autenticado nas rotas protegidas

### 1.9 Banco de dados

- `Prisma schema` implementado
- Modelagem criada para:
  - usuarios
  - sessoes
  - perfil de acessibilidade
  - trilhas
  - licoes
  - progresso por trilha
  - tentativas
- Conexao preparada para PostgreSQL
- Uso com banco Dockerizado
- Migrations aplicadas localmente
- Prisma Client regenerado

### 1.10 Seed e dados iniciais

- Seed para popular:
  - trilhas
  - licoes
  - usuario demo
  - preferencias padrao
  - progresso inicial
- Credenciais demo para ambiente local:
  - `aluno@basematematica.dev`
  - `demo12345`

### 1.11 Testes e validacao

- Testes unitarios para:
  - regras de progresso
  - schemas
  - curriculo
- Teste e2e inicial preparado para:
  - abrir a landing page
  - navegar para login
  - autenticar
  - responder atividade
- Build de producao validado com `next build`

---

## 2. O que ja funciona, mas ainda esta simplificado

### 2.1 Landing page institucional

A home publica ja cumpre seu papel principal de apresentacao, mas ainda pode evoluir.

Estado atual:

- apresenta o projeto
- apresenta os monitores
- apresenta o professor coordenador
- apresenta o Instagram oficial
- direciona para login e cadastro

Ainda nao ha:

- conteudo final revisado pela equipe
- textos definitivos de apresentacao
- links reais preenchidos de todos os perfis sociais
- possivel integracao com noticias, agenda ou destaques do projeto

### 2.2 Autenticacao

Hoje ja existe autenticacao real, mas ainda em uma primeira versao.

Estado atual:

- login e cadastro funcionam
- a sessao fica persistida por navegador
- o usuario autenticado e usado no dashboard, nas preferencias e nas respostas
- o cadastro cria novos usuarios como `STUDENT`

Ainda nao ha:

- recuperacao de senha
- confirmacao de e-mail
- login social
- politica de senha mais robusta
- gestao administrativa de papeis

### 2.3 Controle de acesso por papel

Ja existe o conceito de papel no banco, mas o uso ainda esta parcial.

Ainda nao ha:

- autorizacao real por papel nas telas de tutor e admin
- area propria para gerenciamento de perfis
- fluxo seguro para promover usuarios a tutor ou admin

### 2.4 Painel do tutor

O painel visual existe, mas os numeros ainda sao estaticos.

Ainda nao ha:

- consultas reais de alunos monitorados
- metricas reais por tutor
- lista de alunos com dificuldades

### 2.5 Painel administrativo

A visao administrativa existe como interface e estrutura conceitual, mas ainda nao existe CRUD real.

Ainda nao ha:

- cadastro de trilhas via painel
- edicao de licoes via UI
- publicacao/rascunho de conteudos

### 2.6 Sistema adaptativo

A progressao ja existe e esta persistida, mas a revisao adaptativa ainda e basica.

Ainda nao ha:

- fila de revisao por erro recorrente
- priorizacao por tempo sem praticar
- recomendacao personalizada mais sofisticada

### 2.7 Testes

A base de testes foi preparada, mas ainda nao cobre tudo que sera critico em producao.

Ainda faltam testes para:

- cadastro e login em cenarios mais completos
- autorizacao por papel
- rotas Prisma em cenarios mais completos
- painel admin
- painel tutor
- acessibilidade ponta a ponta
- multiplos fluxos de sessao

---

## 3. O que ainda precisa ser implementado

### 3.1 Conteudo definitivo da landing page

Substituir os textos temporarios por conteudo oficial do projeto, incluindo:

- descricao final do projeto
- apresentacao final dos monitores
- links sociais reais
- descricao final do professor coordenador

### 3.2 Usuario atual dinamico em toda a plataforma

Com a autenticacao real pronta, a proxima consolidacao e:

- usar o usuario logado em todas as rotas e areas futuras
- propagar corretamente o papel em modulos de tutor e admin
- remover qualquer dependencia residual de dados fixos no frontend

### 3.3 Controle real de acesso por papel

Implementar:

- autorizacao por papel nas rotas
- bloqueio de acesso a areas sensiveis
- estrategia segura para criar tutor e admin

### 3.4 CRUD administrativo completo

Criar area admin para:

- cadastrar trilhas
- editar trilhas
- cadastrar licoes
- editar licoes
- remover conteudos
- reordenar licoes
- gerenciar publicacao

### 3.5 Dashboard real do tutor

Implementar consultas reais para:

- alunos vinculados
- desempenho por aluno
- habilidades com maior dificuldade
- frequencia de uso
- evolucao por periodo

### 3.6 Revisao adaptativa avancada

Implementar:

- revisao por dificuldade recorrente
- revisao por esquecimento
- recomendacao automatica do proximo topico
- reentrada guiada apos erro repetido

### 3.7 Melhorias de produto

Adicionar:

- metas semanais
- historico de sessoes
- relatorios
- gamificacao leve e nao intrusiva
- notificacoes e lembretes

### 3.8 Infraestrutura de producao

Preparar:

- deploy na `Vercel`
- banco em `Neon` ou `Supabase`
- variaveis de ambiente por ambiente
- pipeline no GitHub
- execucao de testes no CI

### 3.9 Observabilidade e seguranca

Adicionar:

- logs estruturados
- tratamento de erro mais robusto
- monitoramento
- rate limiting nas rotas
- validacao de autorizacao por papel

### 3.10 Evolucao futura da autenticacao

Se fizer sentido no roadmap, avaliar migracao para:

- `Auth.js`
- `Clerk`

isso pode facilitar:

- provedores externos
- recuperacao de conta
- fluxos mais robustos de sessao

---

## 4. Prioridade recomendada

Ordem sugerida para evolucao:

1. Conteudo definitivo da landing page
2. Controle real de acesso por papel
3. Usuario atual dinamico em todas as areas futuras
4. CRUD administrativo
5. Dashboard real do tutor
6. Revisao adaptativa avancada
7. Testes mais completos
8. Deploy e CI/CD

---

## 5. Resumo executivo

### Ja pronto

- base full-stack moderna
- landing page institucional enxuta
- login e cadastro separados
- autenticacao real com sessao persistida
- dashboard protegido
- backend com Prisma
- banco modelado
- seed inicial
- acessibilidade configuravel
- trilhas pedagogicas iniciais
- testes base

### Ainda falta para producao

- conteudo final da landing
- links sociais definitivos
- autorizacao real por papel
- CRUD admin
- analytics reais de tutor
- recomendacao adaptativa mais rica
- cobertura de testes mais profunda
- pipeline e deploy final

---

## 6. Proximo passo recomendado

Se a prioridade for evolucao de produto com impacto real, o melhor proximo passo e:

**finalizar o conteudo institucional da landing page e, em seguida, implementar controle real de acesso por papel**

Isso destrava:

- apresentacao publica mais fiel ao projeto
- confianca institucional antes do login
- separacao segura entre aluno, tutor e admin
- base pronta para crescer com usuarios reais e fluxos administrativos
