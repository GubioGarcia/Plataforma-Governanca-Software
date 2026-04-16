# Design: Login Show/Hide Senha, Botão Voltar e Integração Backend

**Data:** 2026-04-15  
**Status:** Aprovado  
**Atualizado com:** Postman collection (backend 100% funcional)

---

## Escopo

Três melhorias na plataforma Discovery:

1. **Show/hide senha** — botão para alternar visibilidade nos campos de senha da tela de login
2. **Botão "Voltar"** — navegação de retorno à listagem de organizações a partir de OrgDashboard e ProjectList
3. **Integração Backend** — substituir mocks por chamadas reais à API para Organização e Projeto

---

## Contexto: Backend está 100% funcional

Confirmado via Postman collection. Todos os endpoints respondem corretamente:

| Endpoint | Status |
|---|---|
| `POST /api/auth/login` | ✓ Funciona |
| `GET /api/auth/me` | ✓ Funciona |
| `POST /api/usuario/cadastrar` | ✓ Funciona (201) |
| `GET /api/usuario` | ✓ Funciona |
| `PUT /api/usuario/atualizar` | ✓ Funciona (usa JWT, não ID na URL) |
| `PATCH /api/usuario/alterarSenha` | ✓ Funciona |
| `DELETE /api/usuario/{id}` | ✓ Funciona (inativa) |
| `POST /api/organizacao` | ✓ Funciona (201) |
| `GET /api/organizacao` | ✓ Funciona |
| `GET /api/organizacao/{id}` | ✓ Funciona |
| `PUT /api/organizacao/{id}` | ✓ Funciona |
| `DELETE /api/organizacao/{id}` | 500 em org inativa/inexistente |
| `POST /api/projeto` | ✓ Funciona (201) |
| `GET /api/projeto/organizacao/{orgId}` | ✓ Funciona |
| `GET /api/projeto/{id}` | ✓ Funciona |
| `PUT /api/projeto/{id}` | ✓ Funciona |
| `DELETE /api/projeto/{id}` | ✓ Funciona (204) |

---

## Feature 1: Show/Hide Senha (Frontend)

**Arquivo:** `frontend/src/pages/LoginPage.tsx`

### Mudanças
- Adicionar `useState` booleano `mostrarSenhaLogin` e `mostrarSenhaCad`
- No campo de senha do modo login: trocar `type="password"` por `type={mostrarSenhaLogin ? 'text' : 'password'}` e adicionar `InputProps.endAdornment` com `InputAdornment` + `IconButton` usando `VisibilityIcon` / `VisibilityOffIcon`
- Repetir para o campo de senha do modo cadastro com `mostrarSenhaCad`
- Sem novas dependências — ícones já estão disponíveis via `@mui/icons-material`

### Comportamento
- Estado de visibilidade começa em `false` (oculto)
- Ícone alterna entre olho aberto e olho fechado conforme estado
- Botão fica `disabled={loading}` para consistência

---

## Feature 2: Botão "Voltar" (Frontend)

**Arquivos:** `frontend/src/features/organizations/OrgDashboard.tsx`, `frontend/src/features/projects/ProjectList.tsx`

### OrgDashboard
- Adicionar botão com `ArrowBackIcon` + texto "Voltar" no header, à esquerda do bloco de título/ícone da org
- `onClick={() => navigate('/organizations')}`
- Variante `outlined` ou `text` (discreto, sem destaque igual ao botão principal "Ver Projetos")

### ProjectList
- Adicionar botão "Voltar" no header da lista de projetos, junto ao título
- `onClick={() => navigate('/organizations')}`

---

## Feature 3: Integração Backend — Organização e Projeto

### 3.1 Desalinhamento de modelos a corrigir

O backend retorna campos em português; o frontend usa inglês. Os IDs são UUID (string) no backend e number no frontend. O plano usa `BASICO|PREMIUM` no backend vs `FREE|PRO|ENTERPRISE` no frontend.

**Estratégia:** criar novos tipos que espelham o backend e adaptar os componentes para usá-los. Manter os tipos legados apenas enquanto houver componentes que não foram migrados.

#### Tipos do backend (a criar em `frontend/src/types/`)

**OrganizacaoBackend:**
```typescript
{
  id: string;           // UUID
  nome: string;
  descricao: string;
  plano: string;        // BASICO | PREMIUM | ...
  ativo: boolean;
  criadoPor: string;
  dataCriacao: string;
  dataAtualizacao: string;
  totalProjetosAtivos: number;
}
```

**ProjetoBackend:**
```typescript
{
  id: string;           // UUID
  organizacaoId: string;
  organizacaoNome: string;
  nome: string;
  descricao: string;
  status: { id: string; nome: string; descricao: string; ordem: number };
  ativo: boolean;
  criadoPorId: string;
  criadoPorNome: string;
  dataCriacao: string;
  dataAtualizacao: string;
}
```

### 3.2 Serviços a criar

**`frontend/src/services/organizacaoService.ts`**

| Função | Endpoint | Método |
|---|---|---|
| `listarOrganizacoes(ativo?)` | `GET /api/organizacao` | GET |
| `buscarOrganizacao(id)` | `GET /api/organizacao/{id}` | GET |
| `criarOrganizacao(data)` | `POST /api/organizacao` | POST |
| `atualizarOrganizacao(id, data)` | `PUT /api/organizacao/{id}` | PUT |
| `inativarOrganizacao(id)` | `DELETE /api/organizacao/{id}` | DELETE |

Body de criação/atualização: `{ nome, descricao, plano }`

**`frontend/src/services/projetoService.ts`**

| Função | Endpoint | Método |
|---|---|---|
| `listarProjetosPorOrg(orgId, ativo?)` | `GET /api/projeto/organizacao/{orgId}` | GET |
| `buscarProjeto(id)` | `GET /api/projeto/{id}` | GET |
| `criarProjeto(data)` | `POST /api/projeto` | POST |
| `atualizarProjeto(id, data)` | `PUT /api/projeto/{id}` | PUT |
| `inativarProjeto(id)` | `DELETE /api/projeto/{id}` | DELETE |

Body de criação: `{ organizacaoId, nome, descricao }`
Body de atualização: `{ nome, descricao, statusId? }`

### 3.3 Componentes a integrar

**`OrganizationList.tsx`**
- Substituir `useState(mockOrganizations)` por `useEffect` que chama `listarOrganizacoes()`
- Adicionar estado `loading` e `error`
- Atualizar `handleCreate` para chamar `criarOrganizacao()` e re-buscar lista
- Atualizar `handleSaveEdit` para chamar `atualizarOrganizacao()`
- Atualizar `handleDeleteOrg` para chamar `inativarOrganizacao()`
- Adaptar campos do card: `org.nome`, `org.descricao`, `org.totalProjetosAtivos`
- O plano `BASICO`/`PREMIUM` do backend precisa ser mapeado para `StatusChip` (atualizar `StatusChip` ou o mapeamento de cores)

**`OrgDashboard.tsx`**
- Substituir `mockOrganizations.find()` por `buscarOrganizacao(orgId)`
- Substituir `mockProjects.filter()` por `listarProjetosPorOrg(orgId)`
- Remover dependência de `mockAudit` (manter vazio ou com array local vazio por ora)

**`ProjectList.tsx`**
- Substituir `useState(mockProjects)` por `useEffect` que chama `listarProjetosPorOrg(orgId)`
- Atualizar `handleCreate` para chamar `criarProjeto()`
- Atualizar `handleSaveEdit` para chamar `atualizarProjeto()`
- O status do projeto agora é um objeto `{id, nome}` — usar `projeto.status.nome` para exibição

### 3.4 Mismatch no userService (a corrigir)

O frontend tem `PUT /api/usuario/${id}` mas o backend expõe `PUT /api/usuario/atualizar` (sem ID na URL, usa JWT). Corrigir `userService.ts`:
- `atualizarUsuario()` deve chamar `PUT /api/usuario/atualizar` sem `/{id}`

---

## Fluxo de Dados: OrganizationList (end-to-end)

```
Componente monta
  → GET /api/organizacao (token Bearer via interceptor)
  → Exibe lista de organizações do banco
Usuário clica "Nova Organização" → preenche form
  → POST /api/organizacao { nome, descricao, plano }
  → Re-fetch da lista
Usuário edita → PUT /api/organizacao/{id}
Usuário deleta → DELETE /api/organizacao/{id} → inativa no banco
```

## Fluxo de Dados: ProjectList (end-to-end)

```
Componente monta com orgId da URL
  → GET /api/projeto/organizacao/{orgId}
  → Exibe projetos da organização
Usuário cria projeto
  → POST /api/projeto { organizacaoId, nome, descricao }
  → Re-fetch da lista
```

---

## O que NÃO muda

- `AuthService.ts` e `AuthContext.tsx` — já integrados corretamente
- `userService.ts.cadastrarUsuario()` — já chama `POST /api/usuario/cadastrar` corretamente
- Roteamento (`App.tsx`) — sem novas rotas
- Axios config — CORS e Bearer token já configurados
- Backend — **sem nenhuma alteração necessária**
