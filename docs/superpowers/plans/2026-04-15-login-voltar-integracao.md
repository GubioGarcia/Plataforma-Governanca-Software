# Login Show/Hide, Botão Voltar e Integração Backend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar show/hide senha no login, botão Voltar nas páginas internas, e integrar OrganizationList, OrgDashboard e ProjectList com a API real (backend Spring Boot já 100% funcional).

**Architecture:** Backend já funciona — nenhuma mudança Java necessária. Toda a implementação é frontend-only: novos tipos alinhados com backend, dois novos service files, e atualização de três componentes para substituir dados mockados por chamadas reais à API via axios.

**Tech Stack:** React 18, TypeScript, MUI v6, React Router v6, Axios (já configurado com interceptor Bearer)

---

## Mapa de Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `frontend/src/pages/LoginPage.tsx` | Modificar | Adicionar toggle show/hide nos 2 campos de senha |
| `frontend/src/features/organizations/OrgDashboard.tsx` | Modificar | Botão Voltar + dados reais da API |
| `frontend/src/features/projects/ProjectList.tsx` | Modificar | Botão Voltar + dados reais da API |
| `frontend/src/features/organizations/OrganizationList.tsx` | Modificar | Dados reais da API (replace mock) |
| `frontend/src/components/common/StatusChip.tsx` | Modificar | Adicionar entradas BASICO e PREMIUM |
| `frontend/src/types/organizacao.ts` | Criar | Tipos OrganizacaoAPI e PlanoAPI alinhados ao backend |
| `frontend/src/types/projeto.ts` | Criar | Tipos ProjetoAPI e StatusProjetoAPI alinhados ao backend |
| `frontend/src/services/organizacaoService.ts` | Criar | CRUD de organizações via API |
| `frontend/src/services/projetoService.ts` | Criar | CRUD de projetos via API |
| `frontend/src/services/userService.ts` | Modificar | Corrigir URL de atualizarUsuario |

---

## Task 1: Show/Hide Senha no LoginPage

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1.1: Adicionar estado e imports**

Abra `frontend/src/pages/LoginPage.tsx`. Logo após os imports existentes de MUI, adicione:

```typescript
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
```

Dentro do componente `LoginPage`, após os states existentes de login, adicione:

```typescript
const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);
const [mostrarSenhaCad,   setMostrarSenhaCad]   = useState(false);
```

- [ ] **Step 1.2: Atualizar campo de senha do modo LOGIN**

Localize o `<TextField>` de senha no modo login (tem `type="password"` e `autoComplete="current-password"`). Substitua **somente** os props `type` e `InputProps` desse campo:

```tsx
<TextField
  label="Senha"
  type={mostrarSenhaLogin ? 'text' : 'password'}
  size="medium"
  fullWidth
  value={senha}
  onChange={(e) => { setSenha(e.target.value); setErro(''); }}
  autoComplete="current-password"
  disabled={loading}
  error={!!erro}
  helperText={erro || undefined}
  InputProps={{
    sx: inputSx,
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={() => setMostrarSenhaLogin((v) => !v)}
          disabled={loading}
          edge="end"
          size="small"
          sx={{ color: 'text.secondary' }}
          tabIndex={-1}
        >
          {mostrarSenhaLogin ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </InputAdornment>
    ),
  }}
  slotProps={{ input: { sx: autoFillSx } }}
/>
```

> Nota: o import de `IconButton` já existe no arquivo (`import Button from '@mui/material/Button'`), mas `IconButton` precisa ser importado separadamente: `import IconButton from '@mui/material/IconButton';`

- [ ] **Step 1.3: Adicionar import de IconButton se não existir**

Verifique se `IconButton` está nos imports. Se não, adicione:

```typescript
import IconButton from '@mui/material/IconButton';
```

- [ ] **Step 1.4: Atualizar campo de senha do modo CADASTRO**

Localize o `<TextField>` de senha no modo cadastro (tem `autoComplete="new-password"` e `label="Senha *"`). Atualize somente `type` e `InputProps`:

```tsx
<TextField
  label="Senha *"
  type={mostrarSenhaCad ? 'text' : 'password'}
  size="medium"
  fullWidth
  value={cadSenha}
  onChange={(e) => { setCadSenha(e.target.value); setCadErros((p) => ({ ...p, senha: undefined })); }}
  autoComplete="new-password"
  disabled={loading}
  error={!!cadErros.senha}
  helperText={cadErros.senha || 'Mínimo 8 caracteres com letras e números'}
  InputProps={{
    sx: { ...inputSx, height: 'auto', py: 1.5 },
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={() => setMostrarSenhaCad((v) => !v)}
          disabled={loading}
          edge="end"
          size="small"
          sx={{ color: 'text.secondary' }}
          tabIndex={-1}
        >
          {mostrarSenhaCad ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </InputAdornment>
    ),
  }}
  slotProps={{ input: { sx: autoFillSx } }}
/>
```

- [ ] **Step 1.5: Verificar no browser**

Inicie o frontend (`npm run dev` em `frontend/`). Navegue para `/login`. Confirme:
- Ícone de olho aparece nos dois campos de senha
- Clicando alterna entre ocultar e mostrar
- Durante loading (após submit), o botão fica desabilitado

- [ ] **Step 1.6: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/pages/LoginPage.tsx
git commit -m "feat: adiciona toggle show/hide senha na tela de login e cadastro"
```

---

## Task 2: Botão Voltar no OrgDashboard

**Files:**
- Modify: `frontend/src/features/organizations/OrgDashboard.tsx`

- [ ] **Step 2.1: Adicionar import do ícone**

Abra `frontend/src/features/organizations/OrgDashboard.tsx`. Adicione ao bloco de imports de ícones:

```typescript
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
```

- [ ] **Step 2.2: Adicionar botão Voltar no header**

Localize o `<Box sx={{ display: 'flex', alignItems: 'flex-start', ...mb: 4 }}>` que é o header principal. Adicione o botão **antes** do `<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>` que contém o ícone e título da org:

```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
  {/* Linha com botão Voltar */}
  <Box>
    <Button
      variant="text"
      startIcon={<ArrowBackIcon />}
      onClick={() => navigate('/organizations')}
      sx={{ color: 'text.secondary', pl: 0 }}
    >
      Voltar às organizações
    </Button>
  </Box>

  {/* Header original com ícone, nome e botão "Ver Projetos" */}
  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
    {/* ... conteúdo original do header permanece aqui ... */}
  </Box>
</Box>
```

> Atenção: envolva o conteúdo do `<Box mb: 4>` original nessa estrutura de dois boxes aninhados.

- [ ] **Step 2.3: Verificar no browser**

Navegue para `/organizations`, clique em uma organização. Confirme que o botão "Voltar às organizações" aparece no topo e redireciona para `/organizations`.

- [ ] **Step 2.4: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/features/organizations/OrgDashboard.tsx
git commit -m "feat: adiciona botão Voltar no OrgDashboard"
```

---

## Task 3: Botão Voltar no ProjectList

**Files:**
- Modify: `frontend/src/features/projects/ProjectList.tsx`

- [ ] **Step 3.1: Adicionar import do ícone**

Abra `frontend/src/features/projects/ProjectList.tsx`. Adicione ao bloco de imports de ícones:

```typescript
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
```

- [ ] **Step 3.2: Localizar o header da ProjectList**

Localize o `<Box sx={{ ... mb: 4 }}>` que contém o título "Projetos" e o botão "Novo Projeto". Adicione **acima** desse Box:

```tsx
<Box sx={{ mb: 1 }}>
  <Button
    variant="text"
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate('/organizations')}
    sx={{ color: 'text.secondary', pl: 0 }}
  >
    Voltar às organizações
  </Button>
</Box>
```

- [ ] **Step 3.3: Verificar no browser**

Clique em "Acessar" em uma org → vai para `/organizations/:orgId/projects`. Confirme botão Voltar aparece e redireciona para `/organizations`.

- [ ] **Step 3.4: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/features/projects/ProjectList.tsx
git commit -m "feat: adiciona botão Voltar no ProjectList"
```

---

## Task 4: StatusChip — adicionar suporte a BASICO e PREMIUM

**Files:**
- Modify: `frontend/src/components/common/StatusChip.tsx`

- [ ] **Step 4.1: Adicionar entradas no CONFIG**

Abra `frontend/src/components/common/StatusChip.tsx`. No objeto `CONFIG`, na seção `// Plano`, adicione após `ENTERPRISE`:

```typescript
// Plano (backend)
BASICO:   { label: 'Básico',   bg: '#F3F4F6', color: '#6B7280' },
PREMIUM:  { label: 'Premium',  bg: '#EDE9FE', color: '#7C3AED' },
// Projeto (backend)
ATIVO:         { label: 'Ativo',          bg: '#F0FDF4', color: '#16A34A' },
ARQUIVADO:     { label: 'Arquivado',      bg: '#F3F4F6', color: '#6B7280' },
```

> Nota: `RASCUNHO`, `EM_VALIDACAO`, `APROVADO`, `CANCELADO` e `CONCLUIDO` já existem no CONFIG e serão usados para os status de projeto do backend.

- [ ] **Step 4.2: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/components/common/StatusChip.tsx
git commit -m "feat: adiciona BASICO, PREMIUM e ATIVO ao StatusChip"
```

---

## Task 5: Criar tipos da API

**Files:**
- Create: `frontend/src/types/organizacao.ts` (novo arquivo — não conflita com `organization.ts` existente)
- Create: `frontend/src/types/projeto.ts` (novo arquivo — não conflita com `project.ts` existente)

- [ ] **Step 5.1: Criar `frontend/src/types/organizacao.ts`**

```typescript
/** Tipos alinhados com o backend Spring Boot */

export type PlanoAPI = 'BASICO' | 'PREMIUM' | string;

export interface OrganizacaoAPI {
  id: string;                  // UUID
  nome: string;
  descricao: string;
  plano: PlanoAPI;
  ativo: boolean;
  criadoPor: string;           // UUID do usuário criador
  dataCriacao: string;         // ISO 8601
  dataAtualizacao: string;     // ISO 8601
  totalProjetosAtivos: number;
}

export interface CriarOrganizacaoRequest {
  nome: string;
  descricao: string;
  plano: PlanoAPI;
}

export interface AtualizarOrganizacaoRequest {
  nome: string;
  descricao: string;
  plano: PlanoAPI;
}
```

- [ ] **Step 5.2: Criar `frontend/src/types/projeto.ts`**

```typescript
/** Tipos alinhados com o backend Spring Boot */

export interface StatusProjetoAPI {
  id: string;
  nome: string;
  descricao: string;
  ordem: number;
}

export interface ProjetoAPI {
  id: string;                  // UUID
  organizacaoId: string;       // UUID
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

export interface CriarProjetoRequest {
  organizacaoId: string;
  nome: string;
  descricao: string;
}

export interface AtualizarProjetoRequest {
  nome: string;
  descricao: string;
  statusId?: string;
}
```

- [ ] **Step 5.3: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/types/organizacao.ts Plataforma-Governanca-Software-develop/frontend/src/types/projeto.ts
git commit -m "feat: adiciona tipos OrganizacaoAPI e ProjetoAPI alinhados com backend"
```

---

## Task 6: Criar organizacaoService.ts

**Files:**
- Create: `frontend/src/services/organizacaoService.ts`

- [ ] **Step 6.1: Criar o arquivo**

```typescript
import api from '../config/axios';
import type {
  OrganizacaoAPI,
  CriarOrganizacaoRequest,
  AtualizarOrganizacaoRequest,
} from '../types/organizacao';

/** GET /api/organizacao — lista organizações; filtra por ativo se informado */
export async function listarOrganizacoes(ativo?: boolean): Promise<OrganizacaoAPI[]> {
  const params = ativo !== undefined ? { ativo } : {};
  const res = await api.get<OrganizacaoAPI[]>('/organizacao', { params });
  return res.data;
}

/** GET /api/organizacao/{id} */
export async function buscarOrganizacao(id: string): Promise<OrganizacaoAPI> {
  const res = await api.get<OrganizacaoAPI>(`/organizacao/${id}`);
  return res.data;
}

/** POST /api/organizacao — cria nova organização (201) */
export async function criarOrganizacao(data: CriarOrganizacaoRequest): Promise<OrganizacaoAPI> {
  const res = await api.post<OrganizacaoAPI>('/organizacao', data);
  return res.data;
}

/** PUT /api/organizacao/{id} — atualiza organização */
export async function atualizarOrganizacao(id: string, data: AtualizarOrganizacaoRequest): Promise<OrganizacaoAPI> {
  const res = await api.put<OrganizacaoAPI>(`/organizacao/${id}`, data);
  return res.data;
}

/** DELETE /api/organizacao/{id} — inativa organização */
export async function inativarOrganizacao(id: string): Promise<void> {
  await api.delete(`/organizacao/${id}`);
}
```

- [ ] **Step 6.2: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/services/organizacaoService.ts
git commit -m "feat: cria organizacaoService com CRUD via API"
```

---

## Task 7: Criar projetoService.ts

**Files:**
- Create: `frontend/src/services/projetoService.ts`

- [ ] **Step 7.1: Criar o arquivo**

```typescript
import api from '../config/axios';
import type {
  ProjetoAPI,
  CriarProjetoRequest,
  AtualizarProjetoRequest,
} from '../types/projeto';

/** GET /api/projeto/organizacao/{orgId} — lista projetos de uma organização */
export async function listarProjetosPorOrg(orgId: string, ativo?: boolean): Promise<ProjetoAPI[]> {
  const params = ativo !== undefined ? { ativo } : {};
  const res = await api.get<ProjetoAPI[]>(`/projeto/organizacao/${orgId}`, { params });
  return res.data;
}

/** GET /api/projeto/{id} */
export async function buscarProjeto(id: string): Promise<ProjetoAPI> {
  const res = await api.get<ProjetoAPI>(`/projeto/${id}`);
  return res.data;
}

/** POST /api/projeto — cria novo projeto (201) */
export async function criarProjeto(data: CriarProjetoRequest): Promise<ProjetoAPI> {
  const res = await api.post<ProjetoAPI>('/projeto', data);
  return res.data;
}

/** PUT /api/projeto/{id} — atualiza projeto */
export async function atualizarProjeto(id: string, data: AtualizarProjetoRequest): Promise<ProjetoAPI> {
  const res = await api.put<ProjetoAPI>(`/projeto/${id}`, data);
  return res.data;
}

/** DELETE /api/projeto/{id} — inativa projeto */
export async function inativarProjeto(id: string): Promise<void> {
  await api.delete(`/projeto/${id}`);
}
```

- [ ] **Step 7.2: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/services/projetoService.ts
git commit -m "feat: cria projetoService com CRUD via API"
```

---

## Task 8: Integrar OrganizationList com API

**Files:**
- Modify: `frontend/src/features/organizations/OrganizationList.tsx`

Esta é a tarefa mais extensa. Substituímos completamente os dados mockados por chamadas reais.

- [ ] **Step 8.1: Atualizar imports**

Substitua os imports de tipos e mocks por:

```typescript
import { useState, useEffect } from 'react';
// ... manter todos os imports MUI e ícones existentes ...
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import type { OrganizacaoAPI, PlanoAPI } from '../../types/organizacao';
import {
  listarOrganizacoes,
  criarOrganizacao,
  atualizarOrganizacao,
  inativarOrganizacao,
} from '../../services/organizacaoService';
```

Remova: `import { mockOrganizations } from '../../mocks/organizations';` e `import type { Organizacao, PlanoOrganizacao } from '../../types/organization';`

- [ ] **Step 8.2: Substituir estados**

Substitua:
```typescript
const [orgs, setOrgs] = useState<Organizacao[]>(mockOrganizations);
const [form, setForm] = useState({ name: '', description: '', plano: 'FREE' as PlanoOrganizacao });
// Edit state
const [editingOrg, setEditingOrg] = useState<Organizacao | null>(null);
const [editForm, setEditForm] = useState({ name: '', description: '', plano: 'FREE' as PlanoOrganizacao });
```

Por:
```typescript
const [orgs, setOrgs] = useState<OrganizacaoAPI[]>([]);
const [loading, setLoading] = useState(true);
const [form, setForm] = useState({ nome: '', descricao: '', plano: 'BASICO' as PlanoAPI });

// Edit state
const [editingOrg, setEditingOrg] = useState<OrganizacaoAPI | null>(null);
const [editForm, setEditForm] = useState({ nome: '', descricao: '', plano: 'BASICO' as PlanoAPI });
```

- [ ] **Step 8.3: Adicionar função de fetch e useEffect**

Logo após os estados, adicione:

```typescript
const fetchOrgs = async () => {
  try {
    setLoading(true);
    const data = await listarOrganizacoes();
    setOrgs(data);
  } catch {
    notify('Erro ao carregar organizações', 'error');
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchOrgs(); }, []);
```

- [ ] **Step 8.4: Atualizar openEdit**

```typescript
const openEdit = (org: OrganizacaoAPI) => {
  setEditingOrg(org);
  setEditForm({ nome: org.nome, descricao: org.descricao ?? '', plano: org.plano });
  handleMenuClose();
};
```

- [ ] **Step 8.5: Atualizar handleSaveEdit**

```typescript
const handleSaveEdit = async () => {
  if (!editForm.nome.trim() || !editingOrg) return;
  try {
    await atualizarOrganizacao(editingOrg.id, {
      nome: editForm.nome.trim(),
      descricao: editForm.descricao.trim(),
      plano: editForm.plano,
    });
    notify('Organização atualizada com sucesso');
    setEditingOrg(null);
    fetchOrgs();
  } catch {
    notify('Erro ao atualizar organização', 'error');
  }
};
```

- [ ] **Step 8.6: Atualizar handleDeleteOrg**

```typescript
const handleDeleteOrg = async () => {
  if (!menuOrgId) return;
  try {
    await inativarOrganizacao(menuOrgId);
    notify('Organização inativada', 'info');
    fetchOrgs();
  } catch {
    notify('Erro ao inativar organização', 'error');
  } finally {
    handleMenuClose();
    setDeleteConfirmOpen(false);
  }
};
```

- [ ] **Step 8.7: Atualizar handleCreate**

```typescript
const handleCreate = async () => {
  if (!form.nome.trim()) return;
  try {
    await criarOrganizacao({
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      plano: form.plano,
    });
    setForm({ nome: '', descricao: '', plano: 'BASICO' });
    setDialogOpen(false);
    notify('Organização criada com sucesso');
    fetchOrgs();
  } catch {
    notify('Erro ao criar organização', 'error');
  }
};
```

- [ ] **Step 8.8: Atualizar o JSX do card**

No JSX, cada referência a campos precisa mudar:
- `org.name` → `org.nome`
- `org.description` → `org.descricao`
- `org.totalProjetos` → `org.totalProjetosAtivos`
- `org.plano as PlanoOrganizacao` → `org.plano`
- Na navegação ao clicar: `navigate(`/organizations/${org.id}/projects`)` — mantém igual (id agora é UUID string, mas funciona como param de rota)

Exemplo do Card:
```tsx
<Card
  sx={{ cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' } }}
  onClick={() => navigate(`/organizations/${org.id}/projects`)}
>
  <CardContent sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BusinessIcon sx={{ color: 'primary.main', fontSize: 22 }} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <StatusChip status={org.plano} />
        <Tooltip title="Mais opções">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuOrgId(org.id); }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
    <Typography variant="h5" sx={{ mb: 0.5 }}>{org.nome}</Typography>
    <Typography variant="body2" sx={{ mb: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '40px' }}>
      {org.descricao}
    </Typography>
    <Divider sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <FolderIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
        <Typography variant="caption">{org.totalProjetosAtivos ?? 0} projeto{org.totalProjetosAtivos !== 1 ? 's' : ''}</Typography>
      </Box>
    </Box>
    <Button endIcon={<ArrowForwardIcon />} size="small" variant="outlined" fullWidth sx={{ borderRadius: 2 }}>
      Acessar
    </Button>
  </CardContent>
</Card>
```

- [ ] **Step 8.9: Atualizar menuOrgId para string**

O `menuOrgId` era `number | null`. Mude para `string | null`:

```typescript
const [menuOrgId, setMenuOrgId] = useState<string | null>(null);
```

- [ ] **Step 8.10: Atualizar os dialogs de criar e editar**

No dialog de criação, mude os campos `name`/`description` para `nome`/`descricao` e os options do plano:

```tsx
{/* Create Organization Dialog */}
<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Nova Organização</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
    <TextField
      label="Nome da organização"
      value={form.nome}
      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
      fullWidth autoFocus required placeholder="Ex.: TechCorp Ltda"
    />
    <TextField
      label="Descrição"
      value={form.descricao}
      onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
      fullWidth multiline rows={3} placeholder="Descreva brevemente a organização..."
    />
    <FormControl fullWidth>
      <InputLabel>Plano</InputLabel>
      <Select label="Plano" value={form.plano} onChange={(e) => setForm((f) => ({ ...f, plano: e.target.value as PlanoAPI }))}>
        <MenuItem value="BASICO">Básico</MenuItem>
        <MenuItem value="PREMIUM">Premium</MenuItem>
      </Select>
    </FormControl>
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
    <Button onClick={handleCreate} variant="contained" disabled={!form.nome.trim()}>Criar</Button>
  </DialogActions>
</Dialog>
```

E o dialog de edição analogamente (usando `editForm.nome`, `editForm.descricao`):

```tsx
{/* Edit Organization Dialog */}
<Dialog open={Boolean(editingOrg)} onClose={() => setEditingOrg(null)} maxWidth="sm" fullWidth>
  <DialogTitle>Editar Organização</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
    <TextField
      label="Nome da organização"
      value={editForm.nome}
      onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
      fullWidth autoFocus required
    />
    <TextField
      label="Descrição"
      value={editForm.descricao}
      onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
      fullWidth multiline rows={3}
    />
    <FormControl fullWidth>
      <InputLabel>Plano</InputLabel>
      <Select label="Plano" value={editForm.plano} onChange={(e) => setEditForm((f) => ({ ...f, plano: e.target.value as PlanoAPI }))}>
        <MenuItem value="BASICO">Básico</MenuItem>
        <MenuItem value="PREMIUM">Premium</MenuItem>
      </Select>
    </FormControl>
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={() => setEditingOrg(null)} color="inherit">Cancelar</Button>
    <Button onClick={handleSaveEdit} variant="contained" disabled={!editForm.nome.trim()}>Salvar</Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 8.11: Adicionar estado de loading no JSX**

Logo antes do `<Grid container>`, adicione indicador de carregamento:

```tsx
{loading && (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
)}
{!loading && (
  <Grid container spacing={3}>
    {/* ... conteúdo existente ... */}
  </Grid>
)}
```

Importe `CircularProgress` de `@mui/material/CircularProgress`.

- [ ] **Step 8.12: Atualizar o menu de contexto**

No `<Menu>`, a busca pelo org para editar usa `menuOrgId` (agora string):
```tsx
<MenuItem onClick={() => { const org = orgs.find((o) => o.id === menuOrgId); if (org) openEdit(org); }}>
```
Isso já funciona porque `id` agora é string igual ao `menuOrgId`.

- [ ] **Step 8.13: Verificar no browser com backend rodando**

Com o backend e Keycloak rodando, faça login e acesse `/organizations`. Confirme:
- Lista de organizações reais aparece
- Criar nova organização funciona (aparece na lista após criar)
- Editar funciona
- Inativar funciona

- [ ] **Step 8.14: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/features/organizations/OrganizationList.tsx
git commit -m "feat: integra OrganizationList com API real (remove mocks)"
```

---

## Task 9: Integrar OrgDashboard com API

**Files:**
- Modify: `frontend/src/features/organizations/OrgDashboard.tsx`

- [ ] **Step 9.1: Atualizar imports**

Substitua imports de mocks:

```typescript
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import StatusChip from '../../components/common/StatusChip';
import type { OrganizacaoAPI } from '../../types/organizacao';
import type { ProjetoAPI } from '../../types/projeto';
import { buscarOrganizacao } from '../../services/organizacaoService';
import { listarProjetosPorOrg } from '../../services/projetoService';
```

Remova imports de: `mockAudit`, `mockOrganizations`, `mockProjects`

- [ ] **Step 9.2: Substituir estados e lógica de dados**

Substitua todo o trecho inicial do componente (do `const { orgId }` até o `if (!org)`) por:

```typescript
const { orgId } = useParams<{ orgId: string }>();
const navigate = useNavigate();

const [org, setOrg] = useState<OrganizacaoAPI | null>(null);
const [projects, setProjects] = useState<ProjetoAPI[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!orgId) return;
  const fetchData = async () => {
    try {
      const [orgData, projetosData] = await Promise.all([
        buscarOrganizacao(orgId),
        listarProjetosPorOrg(orgId),
      ]);
      setOrg(orgData);
      setProjects(projetosData);
    } catch {
      // org not found — org permanece null
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [orgId]);
```

- [ ] **Step 9.3: Atualizar KPIs e lógica derivada**

Substitua as linhas de `totalReqs`, `totalAprovados`, `totalStakeholders` (que dependiam dos campos do mock) por:

```typescript
// Dados do backend não incluem totais de requisitos/stakeholders por projeto ainda
const totalProjetos = projects.length;
```

E no KPI row, atualize para mostrar apenas o que a API retorna:

```tsx
{[
  { label: 'Projetos',  value: totalProjetos, icon: <FolderIcon />, color: '#3B82F6' },
  { label: 'Ativos',    value: projects.filter(p => p.ativo).length, icon: <CheckCircleIcon />, color: '#059669' },
].map((kpi) => (
  // ... mesmo JSX de KPI card ...
))}
```

- [ ] **Step 9.4: Atualizar o render de loading e not found**

```tsx
if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
}

if (!org) {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" color="text.secondary">Organização não encontrada.</Typography>
    </Box>
  );
}
```

- [ ] **Step 9.5: Atualizar referências de campos no JSX**

- `org.name` → `org.nome`
- `org.description` → `org.descricao`
- `org.plano` — mantém igual (agora é `BASICO`/`PREMIUM`, StatusChip já suporta)
- `p.name` → `p.nome`
- `p.description` → `p.descricao`
- `p.status` → `p.status.nome` (para usar em StatusChip)
- `p.totalRequisitos` e `p.requisitosAprovados` — remover (backend não retorna esses campos por projeto)
- Substituir a `LinearProgress` e o bloco de progresso por algo simples:

```tsx
{/* Remover bloco de LinearProgress de requisitos aprovados */}
<Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
  <StatusChip status={p.status.nome} />
</Box>
```

- [ ] **Step 9.6: Remover atividade recente (mockAudit)**

O painel "Atividade Recente" usa `mockAudit`. Simplificar:

```tsx
{/* Recent activity — temporariamente desabilitado (sem endpoint ainda) */}
<Grid size={{ xs: 12, lg: 4 }}>
  <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Atividade Recente</Typography>
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
      Nenhuma atividade disponível.
    </Typography>
  </Paper>
</Grid>
```

- [ ] **Step 9.7: Adicionar botão Voltar (se não foi feito na Task 2)**

Se a Task 2 foi feita antes desta integração, verifique que o botão Voltar ainda está presente após as mudanças.

- [ ] **Step 9.8: Verificar no browser**

Com backend rodando, acesse uma organização. Confirme nome, descrição, plano e lista de projetos aparecem com dados reais.

- [ ] **Step 9.9: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/features/organizations/OrgDashboard.tsx
git commit -m "feat: integra OrgDashboard com API real (remove mocks)"
```

---

## Task 10: Integrar ProjectList com API

**Files:**
- Modify: `frontend/src/features/projects/ProjectList.tsx`

- [ ] **Step 10.1: Atualizar imports**

Substitua imports de mocks e tipos antigos:

```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// ... manter todos os imports MUI e ícones ...
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CircularProgress from '@mui/material/CircularProgress';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import { useSnackbar } from '../../context/SnackbarContext';
import type { ProjetoAPI } from '../../types/projeto';
import {
  listarProjetosPorOrg,
  criarProjeto,
  atualizarProjeto,
  inativarProjeto,
} from '../../services/projetoService';
```

Remova: `import { mockProjects } from '../../mocks/projects';` e `import type { Projeto, StatusProjeto } from '../../types/project';`

- [ ] **Step 10.2: Substituir estados**

```typescript
const [projects, setProjects] = useState<ProjetoAPI[]>([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState('');
const [dialogOpen, setDialogOpen] = useState(false);
const [form, setForm] = useState({ nome: '', descricao: '' });

// Edit state
const [editingProject, setEditingProject] = useState<ProjetoAPI | null>(null);
const [editForm, setEditForm] = useState({ nome: '', descricao: '' });
const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
```

Remova `statusFilter` e `setStatusFilter` (simplificação — sem filtro por status por ora).

- [ ] **Step 10.3: Adicionar fetch e useEffect**

```typescript
const fetchProjects = async () => {
  if (!orgId) return;
  try {
    setLoading(true);
    const data = await listarProjetosPorOrg(orgId);
    setProjects(data);
  } catch {
    notify('Erro ao carregar projetos', 'error');
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchProjects(); }, [orgId]);
```

- [ ] **Step 10.4: Substituir filtragem**

Substitua:
```typescript
const orgProjects = projects.filter((p) => p.organizacaoId === Number(orgId));
const filtered = orgProjects.filter(...);
```

Por:
```typescript
const filtered = projects.filter((p) =>
  p.nome.toLowerCase().includes(search.toLowerCase()) ||
  p.descricao.toLowerCase().includes(search.toLowerCase())
);
```

- [ ] **Step 10.5: Atualizar handleCreate**

```typescript
const handleCreate = async () => {
  if (!form.nome.trim() || !orgId) return;
  try {
    await criarProjeto({ organizacaoId: orgId, nome: form.nome.trim(), descricao: form.descricao.trim() });
    setForm({ nome: '', descricao: '' });
    setDialogOpen(false);
    notify('Projeto criado com sucesso');
    fetchProjects();
  } catch {
    notify('Erro ao criar projeto', 'error');
  }
};
```

- [ ] **Step 10.6: Atualizar handleSaveEdit**

```typescript
const handleSaveEdit = async () => {
  if (!editForm.nome.trim() || !editingProject) return;
  try {
    await atualizarProjeto(editingProject.id, { nome: editForm.nome.trim(), descricao: editForm.descricao.trim() });
    notify('Projeto atualizado com sucesso');
    setEditingProject(null);
    fetchProjects();
  } catch {
    notify('Erro ao atualizar projeto', 'error');
  }
};
```

- [ ] **Step 10.7: Atualizar handleDelete do projeto**

```typescript
const handleDeleteProject = async () => {
  if (!menuProjectId) return;
  try {
    await inativarProjeto(menuProjectId);
    notify('Projeto inativado', 'info');
    fetchProjects();
  } catch {
    notify('Erro ao inativar projeto', 'error');
  } finally {
    setMenuAnchor(null);
    setMenuProjectId(null);
  }
};
```

- [ ] **Step 10.8: Atualizar JSX dos cards**

- `p.name` → `p.nome`
- `p.description` → `p.descricao`
- `p.status` (string) → `p.status.nome` (string dentro do objeto)
- Navegação: `navigate(`/organizations/${orgId}/projects/${p.id}`)` — mantém (UUID funciona)
- Remover referências a `p.totalRequisitos`, `p.requisitosAprovados`, `p.totalStakeholders`

Remova o bloco de `LinearProgress` de requisitos (backend não retorna esses dados por projeto).

- [ ] **Step 10.9: Atualizar dialog de criação**

```tsx
<Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Novo Projeto</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
    <TextField
      label="Nome do projeto"
      value={form.nome}
      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
      fullWidth autoFocus required placeholder="Ex.: Sistema de Gestão"
    />
    <TextField
      label="Descrição"
      value={form.descricao}
      onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
      fullWidth multiline rows={3}
    />
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
    <Button onClick={handleCreate} variant="contained" disabled={!form.nome.trim()}>Criar</Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 10.10: Atualizar dialog de edição**

```tsx
<Dialog open={Boolean(editingProject)} onClose={() => setEditingProject(null)} maxWidth="sm" fullWidth>
  <DialogTitle>Editar Projeto</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
    <TextField
      label="Nome do projeto"
      value={editForm.nome}
      onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
      fullWidth autoFocus required
    />
    <TextField
      label="Descrição"
      value={editForm.descricao}
      onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
      fullWidth multiline rows={3}
    />
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={() => setEditingProject(null)} color="inherit">Cancelar</Button>
    <Button onClick={handleSaveEdit} variant="contained" disabled={!editForm.nome.trim()}>Salvar</Button>
  </DialogActions>
</Dialog>
```

- [ ] **Step 10.11: Adicionar loading state no JSX**

```tsx
{loading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
) : filtered.length === 0 ? (
  <EmptyState message="Nenhum projeto encontrado." />
) : (
  <Grid container spacing={3}>
    {filtered.map((p) => (
      // ... cards ...
    ))}
  </Grid>
)}
```

- [ ] **Step 10.12: Verificar no browser com backend rodando**

Confirme:
- Lista de projetos reais aparece para a organização selecionada
- Busca por nome/descrição funciona
- Criar projeto funciona
- Editar projeto funciona
- Inativar projeto funciona

- [ ] **Step 10.13: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/features/projects/ProjectList.tsx
git commit -m "feat: integra ProjectList com API real (remove mocks)"
```

---

## Task 11: Corrigir atualizarUsuario no userService

**Files:**
- Modify: `frontend/src/services/userService.ts`

- [ ] **Step 11.1: Corrigir a URL**

Abra `frontend/src/services/userService.ts`. A função `atualizarUsuario` atualmente usa `PUT /api/usuario/${id}`, mas o backend expõe `PUT /api/usuario/atualizar` (sem ID na URL — usa o JWT para identificar o usuário).

Substitua:
```typescript
/** PUT /api/usuario/{id} — atualiza dados do usuário */
export async function atualizarUsuario(id: string, data: AtualizarUsuarioRequest): Promise<UsuarioBackend> {
  const res = await api.put<UsuarioBackend>(`/usuario/${id}`, data);
  return res.data;
}
```

Por:
```typescript
/** PUT /api/usuario/atualizar — atualiza dados do usuário autenticado (usa JWT, não ID na URL) */
export async function atualizarUsuario(data: AtualizarUsuarioRequest): Promise<UsuarioBackend> {
  const res = await api.put<UsuarioBackend>('/usuario/atualizar', data);
  return res.data;
}
```

> Se `ProfilePage.tsx` ou outro componente chama `atualizarUsuario(id, data)`, atualizar o call site para `atualizarUsuario(data)`.

- [ ] **Step 11.2: Verificar chamadas existentes**

Busque por `atualizarUsuario` no código:

```bash
grep -r "atualizarUsuario" Plataforma-Governanca-Software-develop/frontend/src/
```

Para cada chamada encontrada, remova o argumento `id` se presente.

- [ ] **Step 11.3: Commit**

```bash
git add Plataforma-Governanca-Software-develop/frontend/src/services/userService.ts
git commit -m "fix: corrige URL de atualizarUsuario para /usuario/atualizar (sem id na URL)"
```

---

## Self-Review

### Cobertura do Spec

| Requisito | Task |
|---|---|
| Show/hide senha login | Task 1 |
| Show/hide senha cadastro | Task 1 |
| Botão Voltar no OrgDashboard | Task 2 |
| Botão Voltar no ProjectList | Task 3 |
| StatusChip com BASICO/PREMIUM | Task 4 |
| Tipos backend (OrganizacaoAPI, ProjetoAPI) | Task 5 |
| organizacaoService.ts | Task 6 |
| projetoService.ts | Task 7 |
| OrganizationList integrada | Task 8 |
| OrgDashboard integrado | Task 9 |
| ProjectList integrado | Task 10 |
| Fix userService.atualizarUsuario URL | Task 11 |

### Consistência de tipos

- `OrganizacaoAPI` definida em Task 5, usada em Task 6, 8, 9 ✓
- `ProjetoAPI` definida em Task 5, usada em Task 7, 9, 10 ✓
- `menuOrgId: string | null` definido em Task 8 e usado em Task 8 ✓
- `menuProjectId: string | null` definido em Task 10 e usado em Task 10 ✓
- Campos `nome`/`descricao` consistentes entre form state e API requests ✓

### Sem placeholders

Todas as tasks contêm código real e completo ✓

---

## Ordem Recomendada de Execução

Tasks 1, 2, 3, 4 são independentes e podem ser feitas em qualquer ordem.
Tasks 5 → 6 → 7 devem ser feitas nessa sequência (tipos antes de services).
Task 8, 9, 10 dependem de 5+6+7 estarem prontas.
Task 11 é independente.
