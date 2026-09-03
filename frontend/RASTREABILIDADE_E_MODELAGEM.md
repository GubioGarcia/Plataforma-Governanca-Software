# Rastreabilidade e Modelagem de Dados

Documentação das duas evoluções pedidas pela banca após a apresentação do TCC: a **matriz de rastreabilidade dinâmica** entre requisitos e o **módulo de modelagem de dados** vinculado ao cadastro de requisitos.

---

## O que a banca pediu

**Matriz de rastreabilidade dinâmica**
> Desenvolver uma matriz de rastreabilidade entre requisitos, capaz de mapear tanto relações diretas entre requisitos quanto relações indiretas decorrentes do compartilhamento de entidades/tabelas de dados. A matriz deve ser dinâmica, atualizando-se automaticamente conforme alterações no status ou conteúdo dos requisitos, de modo a evidenciar o impacto de uma mudança sobre os demais requisitos relacionados.

**Modelagem de dados nos requisitos**
> Implementar um módulo de modelagem de dados vinculado ao cadastro de requisitos, permitindo que, ao definir um requisito que manipule dados ou tabelas, o usuário visualize a estrutura do objeto (entidade) envolvido e seus relacionamentos com as demais entidades do sistema.

---

## O que foi implementado

Do estudo de evolução, foram implementadas as opções **2B** (cadastro de entidades + diff antes/depois + diagrama ER) e **1B** (vínculo direto + vínculo indireto por entidade compartilhada). Como as opções são incrementais, isso entrega a **1A** e a **2A** por completo. Ficam como trabalhos futuros a **1C** (impacto transitivo pela cadeia de chaves estrangeiras) e a **2C** (editor visual de modelagem).

### Telas novas

```
Projeto
├── WIKI
├── Requisitos
│   └── Detalhe do requisito
│       ├── Modelagem de dados      ← card novo
│       └── Rastreabilidade         ← card novo
├── Rastreabilidade                 ← tela nova
├── Modelo de Dados                 ← tela nova
├── Eventos
├── Arquivos
├── Stakeholders
├── Analytics
└── Auditoria
```

| Tela | Rota | O que faz |
|---|---|---|
| Matriz de Rastreabilidade | `.../traceability` | Grid requisito × requisito com as duas camadas de relação |
| Modelo de Dados | `.../data-model` | Entidades, atributos, relacionamentos e diagrama ER do projeto |
| Card de rastreabilidade | dentro do requisito | Vínculos diretos (com CRUD) e relacionados indiretos |
| Card de modelagem | dentro do requisito | Diff estado atual × proposto e diagrama com destaque |

---

## As duas camadas de relação

Este é o conceito central da matriz. Uma relação entre dois requisitos pode existir por dois motivos completamente diferentes:

### Camada direta

Alguém cadastrou. É um registro em `VinculoRequisito` (requisito de origem, requisito de destino e um tipo). Os tipos disponíveis vêm do enum `TipoVinculoRequisito` do backend:

| Tipo | Sigla na matriz | Significado |
|---|---|---|
| `DEPENDE_DE` | DEP | O requisito de origem precisa que o de destino exista |
| `IMPACTA` | IMP | Uma mudança na origem afeta o destino |
| `DUPLICA` | DUP | Os dois descrevem a mesma necessidade |
| `CONFLITA` | CFL | Os dois se contradizem |

### Camada indireta

**Ninguém cadastrou.** Ela existe porque dois requisitos declararam impacto sobre a **mesma entidade de dados**. Se o REQ-001 adiciona `cpf` em `Cliente` e o REQ-004 adiciona `data_nascimento` em `Cliente`, os dois aparecem relacionados sem que ninguém tenha ligado um ao outro.

Tecnicamente, não é uma tabela. É o cruzamento de dois registros de `ImpactoDados` que apontam para a mesma `EntidadeDados` — no backend, um `JOIN`; no protótipo, a função `derivarRelacoesIndiretas` em `utils/traceability.ts`.

A consequência prática é importante: **a relação indireta some sozinha quando o impacto some.** Não existe nada para manter sincronizado, e é isso que atende ao pedido de a matriz ser "dinâmica".

### Como as duas aparecem na tela

| | Marcador | Leitura |
|---|---|---|
| Direta | quadrado preenchido com a sigla | alguém especificou essa ligação |
| Indireta | anel vazado | derivada do modelo de dados |

A distinção é de **forma**, não só de cor — funciona impresso em preto e branco e para quem não distingue as cores.

---

## Análise de impacto de mudança

Ao clicar em um requisito, um painel lateral mostra tudo o que uma mudança nele alcança, agrupado por número de saltos.

O algoritmo é uma **busca em largura (BFS)** sobre um grafo cujas arestas são as duas camadas somadas — `analisarImpacto`, em `utils/traceability.ts`. A travessia é não-direcionada (sobe e desce o grafo), limitada a 3 saltos por padrão, e devolve para cada requisito alcançado: a distância em saltos, o caminho percorrido e o motivo do último salto.

```
REQ-001 (alterado)
├── 1 salto  REQ-002   IMPACTA        REQ-001 → REQ-002
├── 1 salto  REQ-003   DEPENDE DE     REQ-001 → REQ-003
└── 1 salto  REQ-004   INDIRETO       REQ-001 → REQ-004   (compartilha Cliente)
```

### Por que BFS e não uma tabela de impactos

O grafo é **recalculado a cada leitura**. Não existe cache, tabela materializada nem job de recomputo — logo, não existe a possibilidade de a matriz ficar um passo atrás do estado real dos requisitos, que é exatamente o que a banca cobrou ao pedir algo que "atualiza automaticamente".

No backend, essa mesma travessia será uma consulta `WITH RECURSIVE` no PostgreSQL. A implementação em TypeScript é o espelho dela: para a escala de um TCC (dezenas a poucas centenas de requisitos por projeto), ambas respondem em milissegundos.

---

## O diff antes/depois do schema

O card de modelagem no detalhe do requisito mostra a entidade afetada em duas colunas: **estado atual** e **estado proposto**, no formato de um diff de código.

```
ESTADO ATUAL                       ESTADO PROPOSTO
  id     UUID NOT NULL               id     UUID NOT NULL
  nome   VARCHAR(150) NOT NULL       nome   VARCHAR(150) NOT NULL
  email  VARCHAR(150) NOT NULL       email  VARCHAR(150) NOT NULL
  —                                + cpf    VARCHAR(11) NOT NULL
```

### Como o estado atual é reconstruído

O modelo armazenado representa o **estado proposto** (o resultado depois de aplicar os impactos). O estado *atual* é obtido **revertendo** os impactos daquele requisito, a partir dos campos `valor_anterior` e `valor_novo` de `ImpactoDados` — função `construirDiff`, em `utils/dataModel.ts`:

| Operação do requisito | Reversão para chegar ao estado atual |
|---|---|
| `ADICAO_ATRIBUTO` | o atributo não existia |
| `ALTERACAO_ATRIBUTO` | o atributo tinha o `valor_anterior` |
| `REMOCAO_ATRIBUTO` | o atributo ainda existia |
| `CRIACAO_ENTIDADE` | a entidade inteira não existia |

É o mesmo princípio que o módulo de **Auditoria** já usa na plataforma (guardar valor anterior e valor novo por campo), aplicado ao schema em vez de a um campo qualquer.

---

## O diagrama ER

Gerado com **Mermaid** a partir do estado atual do modelo — `gerarErDiagram`, em `utils/dataModel.ts`, monta o código `erDiagram` e o componente `ErDiagram.tsx` o renderiza em SVG, com zoom, ajuste à tela e destaque opcional de uma entidade.

Não há motor de diagramação próprio nem posicionamento manual: as entidades e as chaves estrangeiras cadastradas viram o diagrama automaticamente.

---

## Arquitetura no frontend

### Onde os dados vivem hoje

Os módulos `datamodel` e `traceability` já têm **entities e repositories** no backend (PR #9), mas **ainda não têm controllers REST**. Enquanto isso, os dados são servidos por um repositório de protótipo em `localStorage`.

```
Tela  →  Service  →  prototypeStore (localStorage)     ← hoje
Tela  →  Service  →  axios → API REST                  ← quando os endpoints existirem
```

Os serviços já expõem as **assinaturas da API planejada**. Quando os endpoints subirem, muda apenas o corpo de cada função em `dataModelService.ts` e `traceabilityService.ts` — os tipos, os utilitários e as telas continuam iguais.

O `prototypeStore` semeia um cenário de demonstração na primeira abertura (entidades `Cliente`, `Endereco`, `Pedido`, `ItemPedido`, `Produto`, mais vínculos e impactos distribuídos entre os primeiros requisitos do projeto) e suporta criação e remoção reais por cima dele. Cada tela tem um botão **↺** que restaura esse cenário — útil antes de apresentar.

### Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `types/traceability.ts` | Espelha `VinculoRequisito` e `TipoVinculoRequisito`; tipos das projeções derivadas |
| `types/dataModel.ts` | Espelha `EntidadeDados`, `AtributoEntidade`, `RelacionamentoEntidade` e `ImpactoDados` |
| `utils/traceability.ts` | Deriva as relações, monta a matriz e roda a BFS da análise de impacto |
| `utils/dataModel.ts` | Constrói o diff antes/depois e gera o código do diagrama ER |
| `services/prototypeStore.ts` | Persistência local enquanto não há API |
| `services/traceabilityService.ts` | CRUD de vínculos, no contrato da API planejada |
| `services/dataModelService.ts` | CRUD de entidades, atributos e impactos |
| `mocks/traceability.ts` | Cenário de vínculos da demonstração |
| `mocks/dataModel.ts` | Cenário do modelo de dados da demonstração |
| `features/traceability/TraceabilityMatrix.tsx` | Tela da matriz |
| `features/traceability/ImpactAnalysisDrawer.tsx` | Painel de análise de impacto |
| `features/traceability/TraceabilityCard.tsx` | Card no detalhe do requisito |
| `features/datamodel/DataModelPage.tsx` | Tela do modelo de dados |
| `features/datamodel/ErDiagram.tsx` | Renderizador do diagrama, com zoom e destaque |
| `features/datamodel/DataImpactCard.tsx` | Card de diff no detalhe do requisito |
| `components/common/PageHeading.tsx` | Cabeçalho das telas novas |
| `components/common/MetricBand.tsx` | Faixa de leituras numéricas |
| `components/common/AnimacoesGlobais.tsx` | Keyframes compartilhados |
| `theme/tokens.ts` | Fonte de dados, etiquetas e papel milimetrado |

Os dois cards conversam entre si: alterar um impacto de dados recalcula as relações indiretas do card de rastreabilidade ao lado, via a prop `versaoDados`.

---

## Design das telas

As duas telas fugiram do visual padrão do MUI de propósito, buscando o vocabulário do próprio assunto — rastreabilidade é referência cruzada, coordenada, schema.

- **Tipografia com dois papéis.** JetBrains Mono em toda a camada de dados (códigos de requisito, tipos de coluna, contagens, caminhos percorridos); Inter nos títulos e no texto corrido. É o pareamento das ferramentas de engenharia.
- **Marcadores plotados** em vez de células coloridas: cheio para direto, anel vazado para indireto.
- **Faixa de leituras única** dividida por filetes, no lugar de quatro cartões repetidos.
- **Onda de propagação.** Ao abrir a análise de impacto, a linha e a coluna do requisito pulsam **na ordem dos saltos** — a busca em largura fica visível na tela, e não só no painel lateral.
- **Plotagem inicial.** As células entram em varredura diagonal, como um plotter desenhando a grade.

Tudo respeita `prefers-reduced-motion` (quem pediu menos movimento no sistema recebe as telas paradas) e funciona nos temas claro e escuro, com a paleta derivada do tema.

---

## Dependências adicionadas

| Biblioteca | Versão | Para quê |
|---|---|---|
| `mermaid` | `^11.17.2` | Geração do diagrama entidade-relacionamento |
| `@fontsource/jetbrains-mono` | `^5.3.0` | Fonte monoespaçada da camada de dados |

> **Rode `npm install` antes de subir o projeto pela primeira vez após esta mudança.** Sem isso o Vite falha na importação.

---

## Como testar

### Sem backend — modo de demonstração

Há uma entrada de demonstração que monta o app inteiro com a API simulada e
um usuário já autenticado, para percorrer todas as telas sem subir o backend
e o Keycloak:

1. `cd frontend && npm install`
2. `npm run dev`
3. Abra **http://localhost:5173/demo/**

O menu lateral do projeto dá acesso a tudo, inclusive às duas telas novas. Os
dados são simulados em memória (`demo/dados.ts`) e voltam ao original a cada
recarga; vínculos e modelo de dados persistem no `localStorage`, como no app
real. O código vive em `frontend/demo/` e não entra no bundle de produção.

### Com backend

1. `cd frontend && npm install`
2. `npm run dev`
3. Faça login e entre em um projeto que tenha **pelo menos dois requisitos** cadastrados.
4. Menu lateral → **Rastreabilidade**
   - Clique em um código à esquerda para ver a análise de impacto.
   - Clique em uma célula vazia para criar um vínculo; em uma célula com marcador, para ver a relação.
   - Alterne o filtro entre diretos e indiretos.
5. Menu lateral → **Modelo de Dados**
   - Navegue pelas entidades e acompanhe o destaque no diagrama.
   - Cadastre uma entidade ou um atributo.
6. Abra um requisito e role até os cards de **Modelagem de dados** e **Rastreabilidade**.

O botão **↺** de cada tela restaura o cenário de demonstração.

---

## O que falta

| Item | Onde |
|---|---|
| Services, controllers e DTOs dos dois módulos | backend |
| Migrations das novas tabelas | backend |
| Troca do `prototypeStore` pelas chamadas HTTP | `dataModelService.ts`, `traceabilityService.ts` |
| Opção 1C — impacto transitivo pela cadeia de FKs | o dado de `RelacionamentoEntidade` já está disponível |
| Opção 2C — editor visual de modelagem | trabalho futuro |
