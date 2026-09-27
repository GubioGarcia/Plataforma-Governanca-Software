# Frontend — Plataforma de Governança de Projetos de Software

## Descrição

Este módulo contém a **interface web** da Plataforma de Governança de Projetos de Software.

A aplicação permite que gestores, equipe técnica e stakeholders:

- gerenciem organizações, projetos, membros e convites
- registrem a visão do produto (wiki), requisitos e critérios de aceite
- aprovem requisitos ou façam solicitações ao gestor do projeto
- acompanhem a matriz de rastreabilidade e a modelagem de dados
- registrem eventos, arquivos e comentários
- acompanhem auditoria e indicadores de engajamento

O frontend se comunica com a API backend por meio de **requisições HTTP REST** e adapta as telas ao papel do usuário em cada organização/projeto.

---

## Tecnologias

- React 19 + TypeScript
- Vite 7
- Material UI (MUI) v7
- React Router DOM v7
- TanStack React Query v5
- React Hook Form + Zod
- Axios
- Day.js
- Playwright (testes ponta a ponta)
- ESLint
- Docker

### Plugins utilizados

- @vitejs/plugin-react

---

## Estrutura do Projeto

```
src/
  components/   # componentes reutilizáveis (common/) e layouts (layout/: AppShell, ProjectShell, guardas de rota)
  config/       # instância do Axios (token em memória + renovação da sessão)
  context/      # AuthContext (sessão e /me), SnackbarContext, ThemeContext
  features/     # uma pasta por funcionalidade: organizations, projects, requirements, wiki,
                #   traceability, datamodel, events, files, stakeholders, solicitations,
                #   audit, analytics, comments, users
  hooks/        # usePermissions, useAcessoRota, usePendencias
  pages/        # login, perfil, página não encontrada
  services/     # comunicação com a API (um arquivo por domínio)
  theme/        # tema MUI (claro/escuro)
  types/        # tipos da API (acesso.ts: papéis e permissões)
  utils/        # funções utilitárias
e2e/            # testes ponta a ponta com Playwright
```

---

## Autenticação e controle de acesso

- O **login é feito pela API** (`POST /api/auth/login`). O token de acesso fica **só em memória**; a sessão é mantida por um refresh token em cookie `HttpOnly`, então recarregar a página não desloga.
- O interceptor do Axios (`config/axios.ts`) renova a sessão automaticamente ao receber 401 (uma renovação por vez) e avisa o `AuthContext`, que recarrega as permissões.
- `AuthContext` carrega `GET /api/auth/me`: organizações e projetos do usuário, com o papel e as permissões em cada um.
- `usePermissions` expõe `pode(permissão)` no contexto da rota atual (projeto, senão organização) e `podeNaOrganizacao`/`podeNoProjeto` para itens de listas. Botões e menus aparecem só para quem pode usá-los.
- `GuardaOrganizacao` e `ProjectShell` só abrem organização/projeto em que o usuário participa; quem foi removido vê a tela de "sem acesso".
- O sino de pendências (`usePendencias`) mostra convites recebidos, solicitações a responder e pedidos próprios aguardando resposta.

O backend confere todas as permissões novamente — a interface apenas evita mostrar o que o usuário não pode fazer.

---

## Configuração

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8081/api` | Endereço da API. No Docker é `/api` (o nginx encaminha ao backend) |

No Docker Compose a variável é definida em tempo de build (`infrastructure/docker-compose.yml`).

---

## Executar o projeto

Com o backend e o Keycloak no ar (`docker compose up -d` em `infrastructure/`), para desenvolvimento com recarga automática:

```bash
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (o Vite encaminha `/api` para `http://localhost:8081`).

---

## Build para produção

Para gerar a build do projeto:

```bash
npm run build
```

Para visualizar a build:

```bash
npm run preview
```

---

## Qualidade de código (ESLint)

O projeto utiliza ESLint configurado para TypeScript.

Para aplicações em produção, recomenda-se habilitar regras mais rigorosas com verificação de tipos:

- recommendedTypeChecked
- strictTypeChecked
- stylisticTypeChecked

Também é possível utilizar plugins adicionais:

- eslint-plugin-react-x
- eslint-plugin-react-dom

---

## Testes ponta a ponta da interface (Playwright)

A pasta `e2e/` testa a interface num navegador real (Chromium) contra o ambiente Docker, cobrindo as regras de autorização: sessão, organização e membros, o que cada papel vê dentro do projeto, solicitações, convites, participantes e perfil.

Cada arquivo de teste cria pela API um cenário descartável (organização, dois projetos e as pessoas Dono, Gestor, Membro, convidado e estranho) e apaga tudo no fim (Keycloak e banco). Por isso os arquivos rodam em paralelo e não mexem nos dados da demo.

Pré-requisitos: ambiente no ar (`docker compose up -d` em `infrastructure/`) e o navegador instalado uma vez:

```bash
npx playwright install chromium
```

Executar:

```bash
npm run test:e2e          # todos, sem janela
npx playwright test --headed          # vendo o navegador
npm run test:e2e:ui       # modo interativo
npx playwright show-report e2e-report # relatório (com trace e captura das falhas)
```

Variáveis de ambiente opcionais: `E2E_BASE_URL` (padrão `http://localhost`), `E2E_API_URL`, `E2E_KEYCLOAK_URL`, `E2E_KC_ADMIN_USER`/`E2E_KC_ADMIN_PASS`, `E2E_PG_CONTAINER`.

---

## Executar com Docker

O frontend pode ser executado via Docker Compose (definido na pasta infrastructure). A imagem gera a build e a serve com nginx; o acesso é por `http://localhost`:

```bash
docker compose up -d --build frontend
```

---

## Integração com Backend

O frontend consome a API do backend utilizando requisições REST (`src/services/`). Principais integrações:

- sessão: login, renovação, logout e `/me`
- organizações, projetos, membros, participantes e convites
- visão do produto, requisitos, critérios de aceite, aprovação e solicitações
- rastreabilidade, modelagem de dados e exportação CSV
- eventos, arquivos (upload/download), comentários, auditoria e analytics

---

## Licença

Este módulo faz parte da **Plataforma de Governança de Projetos de Software** e está protegido pela licença proprietária definida no repositório principal.
