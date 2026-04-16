# Alterações Realizadas na Sessão de Desenvolvimento

Data: 15/04/2026  
Projeto: Plataforma Governança Software (TCC)

---

## 1. Tela de Login — Botão de Visualizar Senha

**Arquivo:** `frontend/src/pages/LoginPage.tsx`

Adicionado botão de olho (show/hide) nos campos de senha do formulário de login e do formulário de cadastro.

**O que foi feito:**
- Importados `Visibility`, `VisibilityOff` do `@mui/icons-material` e `IconButton`, `InputAdornment` do MUI
- Criados dois estados booleanos: `mostrarSenhaLogin` e `mostrarSenhaCad`
- Os campos de senha passaram a usar `type={mostrarSenha ? 'text' : 'password'}`
- O `endAdornment` com o `IconButton` foi injetado via `slotProps.input.endAdornment` (compatível com MUI v7, que removeu o `InputProps` legado)
- Corrigido alinhamento do ícone: em vez de misturar estilos de camadas diferentes em `slotProps`, foi adotada a abordagem via `sx` no `TextField` com seletores CSS do MUI (`& .MuiOutlinedInput-root` e `& .MuiOutlinedInput-input`), que é mais robusta no MUI v7

---

## 2. Botão "Voltar" nas Páginas Internas

### OrgDashboard

**Arquivo:** `frontend/src/features/organizations/OrgDashboard.tsx`

Adicionado botão "Voltar às organizações" no topo da página do dashboard da organização, redirecionando para `/organizations` via `useNavigate`.

### ProjectList

**Arquivo:** `frontend/src/features/projects/ProjectList.tsx`

Adicionado botão "Voltar às organizações" no topo da listagem de projetos, também redirecionando para `/organizations`.

---

## 3. Integração Backend ↔ Frontend

### 3.1 Tipos TypeScript criados

**`frontend/src/types/organizacao.ts`** — criado do zero:
```typescript
export type PlanoAPI = 'BASICO' | 'PREMIUM' | string;

export interface OrganizacaoAPI {
  id: string;
  nome: string;
  descricao: string;
  plano: PlanoAPI;
  ativo: boolean;
  criadoPor: string;
  dataCriacao: string;
  dataAtualizacao: string;
  totalProjetosAtivos: number;
}

export interface CriarOrganizacaoRequest { nome: string; descricao: string; plano: PlanoAPI; }
export interface AtualizarOrganizacaoRequest { nome: string; descricao: string; plano: PlanoAPI; }
```

**`frontend/src/types/projeto.ts`** — criado do zero:
```typescript
export interface StatusProjetoAPI { id: string; nome: string; descricao: string; ordem: number; }

export interface ProjetoAPI {
  id: string;
  organizacaoId: string;
  organizacaoNome: string;
  nome: string;
  descricao: string;
  status: StatusProjetoAPI;
  ativo: boolean;
  criadoPorId: string;
  criadoPorNome: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface CriarProjetoRequest { organizacaoId: string; nome: string; descricao: string; }
export interface AtualizarProjetoRequest { nome: string; descricao: string; statusId?: string; }
```

### 3.2 Serviços de API criados

**`frontend/src/services/organizacaoService.ts`** — criado do zero:

| Função | Método | Endpoint |
|---|---|---|
| `listarOrganizacoes(ativo?)` | GET | `/api/organizacao` |
| `buscarOrganizacao(id)` | GET | `/api/organizacao/{id}` |
| `criarOrganizacao(data)` | POST | `/api/organizacao` |
| `atualizarOrganizacao(id, data)` | PUT | `/api/organizacao/{id}` |
| `inativarOrganizacao(id)` | DELETE | `/api/organizacao/{id}` |

**`frontend/src/services/projetoService.ts`** — criado do zero:

| Função | Método | Endpoint |
|---|---|---|
| `listarProjetosPorOrg(orgId, ativo?)` | GET | `/api/projeto/organizacao/{orgId}` |
| `buscarProjeto(id)` | GET | `/api/projeto/{id}` |
| `criarProjeto(data)` | POST | `/api/projeto` |
| `atualizarProjeto(id, data)` | PUT | `/api/projeto/{id}` |
| `inativarProjeto(id)` | DELETE | `/api/projeto/{id}` |

### 3.3 Páginas refatoradas para usar dados reais

**`frontend/src/features/organizations/OrganizationList.tsx`**
- Removidos todos os dados mock (`mockOrganizations`, tipos `Organizacao`, `PlanoOrganizacao`)
- Passou a usar `listarOrganizacoes()`, `criarOrganizacao()`, `atualizarOrganizacao()`, `inativarOrganizacao()`
- Adicionado estado `fetchError` com tela "Servidor indisponível" e botão "Tentar novamente"
- Planos ajustados para `BASICO` / `PREMIUM` (valores reais do backend)

**`frontend/src/features/projects/ProjectList.tsx`**
- Removidos todos os dados mock
- Passou a usar `listarProjetosPorOrg(orgId)` e demais funções do `projetoService`
- Adicionado estado `fetchError` com tela de erro e retry
- Acesso seguro a campos opcionais: `p.status?.nome ?? 'N/A'`

**`frontend/src/features/organizations/OrgDashboard.tsx`**
- Reescrito completamente: removidos mocks, adicionado carregamento real via `Promise.all`
- Busca organização + projetos em paralelo
- Exibe spinner durante carregamento e mensagem se organização não for encontrada

### 3.4 Correções em serviços existentes

**`frontend/src/services/userService.ts`**
- Corrigida a função `atualizarUsuario`: a assinatura passou de `(id, data)` para `(data)` e a URL de `PUT /api/usuario/${id}` para `PUT /api/usuario/atualizar` (o backend usa o JWT para identificar o usuário, não o ID na URL)

**`frontend/src/features/users/UsersPage.tsx`**
- Corrigido o call site da função `atualizarUsuario` na linha correspondente ao `handleSaveEdit`

### 3.5 StatusChip atualizado

**`frontend/src/components/common/StatusChip.tsx`**
- Adicionados ao mapa de configuração os valores: `BASICO`, `PREMIUM`, `ATIVO`, `ARQUIVADO`

---

## 4. Infraestrutura

### 4.1 Variáveis de ambiente

**`infrastructure/.env`** — criado:
- Variáveis do PostgreSQL, Keycloak, porta do backend (8081) e porta do nginx (80)

**`frontend/.env`** — criado:
- `VITE_API_URL=/api` — todas as chamadas de API passam pelo proxy do Vite (dev) ou pelo nginx (produção)
- `VITE_KEYCLOAK_URL` e `VITE_KEYCLOAK_REALM` para referência futura

### 4.2 Dockerfile do Keycloak Init

**`infrastructure/docker/keycloak-init/Dockerfile`**
- Alterada imagem base de `python:3.12-alpine` para `python:3.12-slim`
- Motivo: Alpine apresentou bug de encoding no `apk add` impedindo a instalação de `curl` e `bash`, inviabilizando o build do container

---

## 5. Roteamento de Requisições

```
Frontend (dev)  →  /api/*  →  Vite proxy  →  http://localhost:8081/*
Frontend (prod) →  /api/*  →  nginx       →  http://backend:8081/*
```

Nenhuma URL de backend está hardcoded no código React. Toda configuração fica nas variáveis de ambiente.

---

## 6. Resiliência — App não quebra sem backend

Todas as páginas principais tratam falha de conexão:

| Página | Comportamento sem backend |
|---|---|
| `OrganizationList` | Tela "Servidor indisponível" + botão Tentar novamente |
| `ProjectList` | Tela "Servidor indisponível" + botão Tentar novamente |
| `OrgDashboard` | Tela "Organização não encontrada" |

Campos opcionais do backend (como `status`) acessados com `?.` e `?? 'N/A'` para evitar crash em dados incompletos.
