# Tecnologias do Front-end

Documentação completa de todas as tecnologias, bibliotecas e ferramentas utilizadas no front-end da plataforma Discovery.

---

## Stack Principal

### React 19
- **O que é:** Biblioteca JavaScript para construção de interfaces de usuário baseada em componentes.
- **Por que foi usado:** Padrão de mercado para SPAs (Single Page Applications), ecossistema maduro, suporte a hooks e Context API para gerenciamento de estado.
- **Versão:** `^19.2.0`

### TypeScript 5.9
- **O que é:** Superset do JavaScript que adiciona tipagem estática ao código.
- **Por que foi usado:** Previne erros em tempo de compilação, melhora o autocomplete, facilita a manutenção e documenta interfaces e contratos de dados automaticamente.
- **Versão:** `~5.9.3`

### Vite 7
- **O que é:** Ferramenta de build moderna para projetos web. Substitui o Webpack/Create React App.
- **Por que foi usado:** Servidor de desenvolvimento extremamente rápido (usa ES Modules nativos do browser, sem bundle completo em dev). Build de produção otimizado via Rollup.
- **Versão:** `^7.3.1`
- **Plugin utilizado:** `@vitejs/plugin-react` para suporte ao JSX/TSX com Fast Refresh.

---

## Interface de Usuário (UI)

### Material UI (MUI) v7
- **O que é:** Biblioteca de componentes React baseada no Material Design do Google.
- **Por que foi usado:** Componentes prontos e acessíveis (botões, tabelas, modais, chips, avatars, etc.), sistema de tema customizável, suporte a dark/light mode.
- **Pacotes:**
  - `@mui/material` `^7.3.9` — componentes principais
  - `@mui/icons-material` `^7.3.9` — biblioteca de ícones SVG
  - `@mui/lab` `^7.0.1-beta.23` — componentes experimentais
  - `@mui/x-data-grid` `^8.27.4` — tabelas avançadas com paginação e filtros
  - `@mui/x-date-pickers` `^8.27.2` — seletores de data/hora

### Emotion
- **O que é:** Biblioteca de CSS-in-JS. É a engine de estilização por baixo do MUI.
- **Pacotes:**
  - `@emotion/react` `^11.14.0`
  - `@emotion/styled` `^11.14.1`

### Fontsource Inter
- **O que é:** Pacote npm para incluir a fonte Inter localmente (sem depender do Google Fonts).
- **Versão:** `^5.2.8`
- **Por que foi usado:** A fonte Inter é moderna, legível e amplamente usada em produtos de software.

---

## Roteamento

### React Router DOM v7
- **O que é:** Biblioteca padrão de roteamento para aplicações React.
- **Por que foi usado:** Gerencia navegação entre páginas sem recarregar o browser (SPA), suporte a rotas aninhadas, parâmetros de URL e rotas protegidas.
- **Versão:** `^7.13.1`
- **Padrões usados:**
  - `<BrowserRouter>` — roteamento via URL
  - `useParams()` — leitura de `:orgId`, `:projectId` na URL
  - `useNavigate()` — navegação programática
  - Rotas protegidas via componente `<ProtectedRoute>`

---

## Gerenciamento de Estado e Dados

### TanStack React Query v5
- **O que é:** Biblioteca para busca, cache e sincronização de dados assíncronos (server state).
- **Por que foi usado:** Preparado para quando o back-end for integrado — gerencia loading/error states, cache inteligente e refetch automático.
- **Versão:** `^5.90.21`
- **Status atual:** Configurado mas ainda não utilizado ativamente (dados vêm dos mocks locais).

### Context API (React nativo)
- **O que é:** Mecanismo nativo do React para compartilhar estado global sem bibliotecas externas.
- **Onde é usado:**
  - `AuthContext` — usuário logado, papel (role) e função `switchRole()` para demo
  - `SnackbarContext` — sistema global de notificações toast (fila de mensagens)

---

## Formulários e Validação

### React Hook Form v7
- **O que é:** Biblioteca para gerenciamento de formulários com foco em performance (sem re-renders desnecessários).
- **Versão:** `^7.71.2`

### Zod v4
- **O que é:** Biblioteca de validação de schemas com TypeScript-first.
- **Por que foi usado:** Define e valida a estrutura dos dados dos formulários com type-safety automático.
- **Versão:** `^4.3.6`

### @hookform/resolvers
- **O que é:** Integração entre React Hook Form e bibliotecas de validação (como Zod).
- **Versão:** `^5.2.2`

---

## HTTP e Autenticação

### Axios v1
- **O que é:** Cliente HTTP para fazer requisições a APIs REST.
- **Por que foi usado:** Interceptors configurados para injetar automaticamente o token de autenticação no header das requisições.
- **Versão:** `^1.13.6`
- **Configuração:** `src/config/axios.ts`

### Keycloak JS + @react-keycloak/web
- **O que é:** Keycloak é um servidor de autenticação open-source (SSO). O `keycloak-js` é o cliente JS oficial e o `@react-keycloak/web` é o wrapper para React.
- **Por que foi usado:** Autenticação e autorização empresarial com suporte a OAuth2/OpenID Connect.
- **Versões:**
  - `keycloak-js` `^26.2.3`
  - `@react-keycloak/web` `^3.4.0`
- **Status atual:** Integração configurada em `src/config/keycloak.ts`, mas mockada para o ambiente de desenvolvimento/TCC.

---

## Utilitários

### Day.js v1
- **O que é:** Biblioteca leve de manipulação de datas (alternativa ao Moment.js — apenas ~2kb).
- **Por que foi usado:** Formatação e manipulação de datas nos eventos, audit log e timestamps. Integrado com o MUI X Date Pickers via `AdapterDayjs`.
- **Versão:** `^1.11.19`

---

## Qualidade de Código

### ESLint v9
- **O que é:** Linter para JavaScript/TypeScript — encontra problemas no código estaticamente.
- **Versão:** `^9.39.1`
- **Plugins:**
  - `eslint-plugin-react-hooks` — valida o uso correto dos hooks do React
  - `eslint-plugin-react-refresh` — garante compatibilidade com o Fast Refresh do Vite
  - `typescript-eslint` — regras específicas para TypeScript

---

## Arquitetura do Projeto

```
src/
├── assets/          # Imagens e recursos estáticos
├── components/      # Componentes reutilizáveis (StatusChip, EmptyState, etc.)
│   ├── common/
│   └── layout/      # AppShell, ProjectShell, ProtectedRoute
├── config/          # Configurações globais (axios, keycloak)
├── context/         # Providers de contexto global (Auth, Snackbar)
├── features/        # Módulos de funcionalidade por domínio
│   ├── audit/
│   ├── events/
│   ├── files/
│   ├── organizations/
│   ├── projects/
│   ├── requirements/
│   ├── stakeholders/
│   └── wiki/
├── hooks/           # Custom hooks (usePermissions)
├── mocks/           # Dados mockados para desenvolvimento
├── pages/           # Páginas de nível de rota (Login, 404)
├── theme/           # Configuração do tema MUI (dark/light)
└── types/           # Interfaces e tipos TypeScript globais
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento (Vite, porta 5173) |
| `npm run build` | Compila TypeScript + gera bundle de produção (`dist/`) |
| `npm run preview` | Serve o bundle de produção localmente para teste |
| `npm run lint` | Executa o ESLint em todos os arquivos |
