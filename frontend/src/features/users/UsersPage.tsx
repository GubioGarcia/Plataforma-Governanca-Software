import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import type { PapelProjeto } from '../../types/stakeholder';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  cadastrarUsuario,
  listarUsuarios,
  atualizarUsuario,
  removerUsuario,
  isApiError,
} from '../../services/userService';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  papel: PapelProjeto;
  isActive: boolean;
}

interface PermissaoItem {
  id: string;
  label: string;
  isChild?: boolean;
}

interface TabPermissoes {
  id: string;
  label: string;
  permissoes: PermissaoItem[];
}

interface PerfilSistema {
  id: number;
  nome: string;
  descricao: string;
  permissoes: string[];
  isDefault: boolean;
}

// ── Dados Iniciais ─────────────────────────────────────────────────────────────

const INIT_USERS: UsuarioSistema[] = [
  { id: '1', nome: 'João Silva',    email: 'joao.silva@techcorp.com',  papel: 'GESTOR',       isActive: true },
  { id: '2', nome: 'Ana Lima',      email: 'ana.lima@techcorp.com',    papel: 'STAKEHOLDER',  isActive: true },
  { id: '3', nome: 'Pedro Costa',   email: 'pedro.costa@techcorp.com', papel: 'STAKEHOLDER',  isActive: true },
  { id: '4', nome: 'Maria Souza',   email: 'maria.souza@startup.com',  papel: 'ANALISTA',     isActive: true },
  { id: '5', nome: 'Carlos Mendes', email: 'carlos@startup.com',       papel: 'ANALISTA',     isActive: false },
];

// ── Abas de Permissões (inspiradas nas fotos do Fabrix) ───────────────────────

const PERM_TABS: TabPermissoes[] = [
  {
    id: 'projetos',
    label: 'Projetos',
    permissoes: [
      { id: 'ver_projetos',     label: 'Ver projetos' },
      { id: 'criar_projetos',   label: 'Criar projetos',   isChild: true },
      { id: 'editar_projetos',  label: 'Editar projetos',  isChild: true },
      { id: 'arquivar_projetos',label: 'Arquivar projetos',isChild: true },
    ],
  },
  {
    id: 'wiki',
    label: 'Wiki',
    permissoes: [
      { id: 'ver_wiki',          label: 'Ver wiki' },
      { id: 'editar_wiki',       label: 'Editar seções',            isChild: true },
      { id: 'enviar_validacao',  label: 'Enviar para validação',    isChild: true },
      { id: 'validar_final',     label: 'Validação final',          isChild: true },
    ],
  },
  {
    id: 'requisitos',
    label: 'Requisitos',
    permissoes: [
      { id: 'ver_requisitos',    label: 'Ver requisitos' },
      { id: 'criar_requisitos',  label: 'Criar requisitos',         isChild: true },
      { id: 'editar_requisitos', label: 'Editar requisitos',        isChild: true },
      { id: 'aprovar_requisitos',label: 'Aprovar / Reprovar',       isChild: true },
    ],
  },
  {
    id: 'membros',
    label: 'Membros',
    permissoes: [
      { id: 'ver_membros',       label: 'Ver membros' },
      { id: 'adicionar_membros', label: 'Adicionar membros',        isChild: true },
      { id: 'editar_membros',    label: 'Editar membros',           isChild: true },
      { id: 'remover_membros',   label: 'Remover membros',          isChild: true },
    ],
  },
  {
    id: 'eventos',
    label: 'Eventos',
    permissoes: [
      { id: 'ver_eventos',       label: 'Ver eventos' },
      { id: 'criar_eventos',     label: 'Criar eventos',            isChild: true },
      { id: 'editar_eventos',    label: 'Editar eventos',           isChild: true },
    ],
  },
  {
    id: 'arquivos',
    label: 'Arquivos',
    permissoes: [
      { id: 'ver_arquivos',      label: 'Ver arquivos' },
      { id: 'upload_arquivos',   label: 'Upload de arquivos',       isChild: true },
      { id: 'download_arquivos', label: 'Download de arquivos',     isChild: true },
      { id: 'excluir_arquivos',  label: 'Excluir arquivos',         isChild: true },
    ],
  },
  {
    id: 'sistema',
    label: 'Sistema',
    permissoes: [
      { id: 'gerenciar_usuarios',      label: 'Gerenciar Usuários' },
      { id: 'gerenciar_organizacoes',  label: 'Gerenciar Organizações' },
      { id: 'configuracoes_sistema',   label: 'Configurações do Sistema' },
      { id: 'relatorios',              label: 'Relatórios' },
      { id: 'relatorios_projetos',     label: 'Relatórios de projetos',   isChild: true },
      { id: 'relatorios_auditoria',    label: 'Relatório de auditoria',   isChild: true },
      { id: 'relatorios_analytics',    label: 'Analytics e métricas',     isChild: true },
    ],
  },
];

// Permissões padrão por papel (mapeadas a partir de usePermissions)
const ROLE_PERMISSIONS: Record<PapelProjeto, string[]> = {
  GESTOR: [
    'ver_projetos','criar_projetos','editar_projetos','arquivar_projetos',
    'ver_wiki','editar_wiki','enviar_validacao','validar_final',
    'ver_requisitos','criar_requisitos','editar_requisitos','aprovar_requisitos',
    'ver_membros','adicionar_membros','editar_membros','remover_membros',
    'ver_eventos','criar_eventos','editar_eventos',
    'ver_arquivos','upload_arquivos','download_arquivos','excluir_arquivos',
    'gerenciar_usuarios','gerenciar_organizacoes','configuracoes_sistema',
    'relatorios','relatorios_projetos','relatorios_auditoria','relatorios_analytics',
  ],
  ANALISTA: [
    'ver_projetos','editar_projetos',
    'ver_wiki','editar_wiki','enviar_validacao',
    'ver_requisitos','criar_requisitos','editar_requisitos',
    'ver_membros',
    'ver_eventos','criar_eventos','editar_eventos',
    'ver_arquivos','upload_arquivos','download_arquivos',
    'relatorios','relatorios_projetos','relatorios_auditoria','relatorios_analytics',
  ],
  STAKEHOLDER: [
    'ver_projetos',
    'ver_wiki',
    'ver_requisitos','aprovar_requisitos',
    'ver_membros',
    'ver_eventos',
    'ver_arquivos','download_arquivos',
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const PAPEL_STYLE: Record<PapelProjeto, { bg: string; color: string; avatar: string }> = {
  GESTOR:       { bg: '#EDE9FE', color: '#7C3AED', avatar: '#7C3AED' },
  ANALISTA:     { bg: '#D1FAE5', color: '#059669', avatar: '#059669' },
  STAKEHOLDER:  { bg: '#DBEAFE', color: '#2563EB', avatar: '#2563EB' },
};

const PAPEIS: PapelProjeto[] = ['GESTOR', 'ANALISTA', 'STAKEHOLDER'];
const PAPEL_LABELS: Record<PapelProjeto, string> = {
  GESTOR: 'Gestor', ANALISTA: 'Analista', STAKEHOLDER: 'Stakeholder',
};

const EMPTY_FORM = { nome: '', email: '', senha: '', papel: 'STAKEHOLDER' as PapelProjeto, isActive: true };

const INIT_PERFIS: PerfilSistema[] = [
  { id: 1, nome: 'Gestor',      descricao: 'Acesso completo ao sistema e a todos os projetos.', permissoes: [...ROLE_PERMISSIONS.GESTOR],      isDefault: true },
  { id: 2, nome: 'Analista',    descricao: 'Pode editar wiki, requisitos e ver relatórios.',    permissoes: [...ROLE_PERMISSIONS.ANALISTA],    isDefault: true },
  { id: 3, nome: 'Stakeholder', descricao: 'Pode visualizar conteúdo e aprovar requisitos.',    permissoes: [...ROLE_PERMISSIONS.STAKEHOLDER], isDefault: true },
];

// ── Componente Principal ──────────────────────────────────────────────────────

export default function UsersPage() {
  const { isGestor } = usePermissions();
  const { notify } = useSnackbar();

  // view: 'list' | 'user' | 'profiles' | 'profile'
  const [view, setView] = useState<'list' | 'user' | 'profiles' | 'profile'>('list');

  const [users, setUsers] = useState<UsuarioSistema[]>(INIT_USERS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UsuarioSistema | null>(null);
  const [editedUser, setEditedUser] = useState<UsuarioSistema | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activePermTab, setActivePermTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<typeof EMPTY_FORM>>({});

  // Perfis
  const [perfis, setPerfis] = useState<PerfilSistema[]>(INIT_PERFIS);
  const [editedPerfil, setEditedPerfil] = useState<PerfilSistema | null>(null);
  const [activePerfilPermTab, setActivePerfilPermTab] = useState(0);
  const [perfilDialogOpen, setPerfilDialogOpen] = useState(false);
  const [perfilForm, setPerfilForm] = useState({ nome: '', descricao: '' });
  const [deletePerfilTarget, setDeletePerfilTarget] = useState<PerfilSistema | null>(null);

  // Perfis customizados atribuídos por userId
  const [userPerfis, setUserPerfis] = useState<Record<string, number[]>>({});
  const [perfilPickerOpen, setPerfilPickerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioSistema | null>(null);
  const [senhaEdit, setSenhaEdit] = useState('');

  // Permissões adicionais por userId (override do papel padrão)
  const [extraPerms, setExtraPerms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    listarUsuarios()
      .then((list) => {
        setUsers(
          list.map((u) => ({
            id: u.id,
            nome: u.nome,
            email: u.email,
            papel: (u.papel as PapelProjeto) ?? 'STAKEHOLDER',
            isActive: u.ativo ?? true,
          })),
        );
      })
      .catch(() => {
        // mantém dados mock se API falhar
      });
  }, []);

  function getPerms(u: UsuarioSistema): string[] {
    return extraPerms[u.id] ?? [...ROLE_PERMISSIONS[u.papel]];
  }

  function togglePerm(userId: string, permId: string, basePapel: PapelProjeto) {
    const current = extraPerms[userId] ?? [...ROLE_PERMISSIONS[basePapel]];
    const next = current.includes(permId)
      ? current.filter((p) => p !== permId)
      : [...current, permId];
    setExtraPerms((prev) => ({ ...prev, [userId]: next }));
  }

  function openManage(u: UsuarioSistema) {
    setSelected(u);
    setEditedUser({ ...u });
    setActiveTab(0);
    setActivePermTab(0);
    setView('user');
  }

  async function handleSaveUser() {
    if (!selected || !editedUser) return;
    setLoading(true);
    try {
      await atualizarUsuario({
        nome: editedUser.nome,
        email: editedUser.email,
        ...(senhaEdit ? { senha: senhaEdit } : {}),
      });
      setUsers((prev) => prev.map((u) => (u.id === selected.id ? { ...editedUser } : u)));
      notify('Usuário salvo com sucesso');
      setSenhaEdit('');
      setSelected(null);
      setEditedUser(null);
      setView('list');
    } catch {
      notify('Erro ao salvar usuário', 'error');
    } finally {
      setLoading(false);
    }
  }

  function validateForm() {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.nome.trim()) e.nome = 'Nome obrigatório' as any;
    if (!form.email.trim()) e.email = 'E-mail obrigatório' as any;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido' as any;
    if (!form.senha) e.senha = 'Senha obrigatória' as any;
    else if (form.senha.length < 8) e.senha = 'A senha deve ter no mínimo 8 caracteres' as any;
    return e;
  }

  async function handleIncluir() {
    const e = validateForm();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setLoading(true);
    try {
      const created = await cadastrarUsuario({ nome: form.nome, email: form.email, senha: form.senha });
      setUsers((prev) => [...prev, {
        id: created.id,
        nome: created.nome,
        email: created.email,
        papel: form.papel,
        isActive: form.isActive,
      }]);
      setForm(EMPTY_FORM);
      setFormErrors({});
      setDialogOpen(false);
      notify('Usuário incluído com sucesso');
    } catch (err) {
      if (isApiError(err)) {
        const status = err.response?.status;
        if (status === 409) {
          setFormErrors((prev) => ({ ...prev, email: 'E-mail já cadastrado' as any }));
        } else if (status === 422) {
          setFormErrors((prev) => ({ ...prev, senha: 'A senha deve ter no mínimo 8 caracteres' as any }));
        } else {
          notify(err.response?.data?.detail || 'Erro ao incluir usuário', 'error');
        }
      } else {
        notify('Erro ao incluir usuário', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await removerUsuario(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      notify('Usuário removido', 'info');
    } catch {
      notify('Erro ao remover usuário', 'error');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
    }
  }

  // ── Funções de Perfil ──────────────────────────────────────────────────────

  function openPerfilDetail(p: PerfilSistema) {
    setEditedPerfil({ ...p, permissoes: [...p.permissoes] });
    setActivePerfilPermTab(0);
    setView('profile');
  }

  function togglePerfilPerm(permId: string) {
    if (!editedPerfil) return;
    const has = editedPerfil.permissoes.includes(permId);
    setEditedPerfil((prev) =>
      prev ? { ...prev, permissoes: has ? prev.permissoes.filter((p) => p !== permId) : [...prev.permissoes, permId] } : prev,
    );
  }

  function handleSavePerfil() {
    if (!editedPerfil) return;
    setPerfis((prev) => prev.map((p) => (p.id === editedPerfil.id ? { ...editedPerfil } : p)));
    notify('Perfil salvo com sucesso');
    setView('profiles');
    setEditedPerfil(null);
  }

  function handleCriarPerfil() {
    if (!perfilForm.nome.trim()) return;
    const newId = Math.max(0, ...perfis.map((p) => p.id)) + 1;
    setPerfis((prev) => [...prev, { id: newId, nome: perfilForm.nome, descricao: perfilForm.descricao, permissoes: [], isDefault: false }]);
    setPerfilForm({ nome: '', descricao: '' });
    setPerfilDialogOpen(false);
    notify('Perfil criado com sucesso');
  }

  function handleDeletePerfil() {
    if (!deletePerfilTarget) return;
    setPerfis((prev) => prev.filter((p) => p.id !== deletePerfilTarget.id));
    setDeletePerfilTarget(null);
    notify('Perfil removido', 'info');
  }

  function toggleUserPerfil(userId: string, perfilId: number) {
    setUserPerfis((prev) => {
      const current = prev[userId] ?? [];
      const has = current.includes(perfilId);
      return { ...prev, [userId]: has ? current.filter((id) => id !== perfilId) : [...current, perfilId] };
    });
  }

  const filtered = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Vista de detalhe de perfil ────────────────────────────────────────────

  if (view === 'profile' && editedPerfil) {
    const currentPermTab = PERM_TABS[activePerfilPermTab];
    const totalPerms = PERM_TABS.reduce((acc, t) => acc + t.permissoes.length, 0);
    const style = PAPEL_STYLE[editedPerfil.nome.toUpperCase() as PapelProjeto] ?? { bg: '#F3F4F6', color: '#6B7280', avatar: '#6B7280' };

    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Voltar aos perfis">
              <IconButton size="small" onClick={() => { setView('profiles'); setEditedPerfil(null); }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Avatar sx={{ bgcolor: style.avatar, fontWeight: 700, width: 40, height: 40 }}>
              <BadgeIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box>
              <Typography variant="h2">{editedPerfil.nome}</Typography>
              {editedPerfil.isDefault && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Perfil padrão do sistema</Typography>
              )}
            </Box>
          </Box>
          <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSavePerfil} disabled={editedPerfil.isDefault}>
            Salvar
          </Button>
        </Box>

        {/* Info do perfil */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.1em', fontSize: '11px' }}>
              INFORMAÇÕES DO PERFIL
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
              <TextField
                label="Nome do perfil"
                size="small"
                fullWidth
                value={editedPerfil.nome}
                disabled={editedPerfil.isDefault}
                onChange={(e) => setEditedPerfil((p) => p ? { ...p, nome: e.target.value } : p)}
              />
              <TextField
                label="Descrição"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={editedPerfil.descricao}
                disabled={editedPerfil.isDefault}
                onChange={(e) => setEditedPerfil((p) => p ? { ...p, descricao: e.target.value } : p)}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${editedPerfil.permissoes.length} de ${totalPerms} permissões ativas`}
                  size="small"
                  sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600 }}
                />
                {editedPerfil.isDefault && (
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Perfis padrão não podem ser editados
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Permissões */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Permissões do perfil</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activePerfilPermTab} onChange={(_, v) => setActivePerfilPermTab(v)} variant="scrollable" scrollButtons="auto">
                {PERM_TABS.map((tab) => (
                  <Tab key={tab.id} label={tab.label} sx={{ fontSize: '13px', minWidth: 80 }} />
                ))}
              </Tabs>
            </Box>
            <FormGroup>
              {currentPermTab.permissoes.map((perm) => (
                <FormControlLabel
                  key={perm.id}
                  sx={{ ml: perm.isChild ? 3 : 0, mb: 0.25 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={editedPerfil.permissoes.includes(perm.id)}
                      disabled={editedPerfil.isDefault}
                      onChange={() => togglePerfilPerm(perm.id)}
                      sx={{ py: 0.5 }}
                    />
                  }
                  label={<Typography variant="body2">{perm.label}</Typography>}
                />
              ))}
            </FormGroup>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // ── Vista de lista de perfis ──────────────────────────────────────────────

  if (view === 'profiles') {
    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: 'auto', width: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Voltar aos usuários">
              <IconButton size="small" onClick={() => setView('list')}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <BadgeIcon sx={{ color: 'text.secondary', fontSize: 26 }} />
            <Typography variant="h2">Perfis de usuários</Typography>
          </Box>
          {isGestor && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setPerfilForm({ nome: '', descricao: '' }); setPerfilDialogOpen(true); }}>
              Criar perfil
            </Button>
          )}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Os perfis agrupam permissões específicas e podem ser atribuídos a múltiplos usuários.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {perfis.map((p) => {
            const style = PAPEL_STYLE[p.nome.toUpperCase() as PapelProjeto] ?? { bg: '#F3F4F6', color: '#6B7280', avatar: '#6B7280' };
            const totalPerms = PERM_TABS.reduce((acc, t) => acc + t.permissoes.length, 0);
            const usersWithPerfil = users.filter((u) => PAPEL_LABELS[u.papel] === p.nome || u.papel.toLowerCase() === p.nome.toLowerCase());

            return (
              <Card key={p.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Avatar sx={{ bgcolor: style.bg, color: style.color, width: 44, height: 44 }}>
                      <BadgeIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{p.nome}</Typography>
                        {p.isDefault && (
                          <Chip label="Padrão" size="small" sx={{ height: 18, fontSize: '10px', bgcolor: 'action.hover', color: 'text.secondary' }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>{p.descricao}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={`${p.permissoes.length}/${totalPerms} permissões`} size="small" sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '11px', height: 22 }} />
                        <Chip label={`${usersWithPerfil.length} usuário${usersWithPerfil.length !== 1 ? 's' : ''}`} size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontSize: '11px', height: 22 }} />
                      </Box>
                    </Box>
                    {isGestor && (
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Ver permissões">
                          <IconButton size="small" onClick={() => openPerfilDetail(p)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        {!p.isDefault && (
                          <Tooltip title="Excluir perfil">
                            <IconButton size="small" color="error" onClick={() => setDeletePerfilTarget(p)}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Dialog criar perfil */}
        <Dialog open={perfilDialogOpen} onClose={() => setPerfilDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Criar perfil</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
            <TextField label="Nome do perfil *" size="small" fullWidth value={perfilForm.nome} onChange={(e) => setPerfilForm((f) => ({ ...f, nome: e.target.value }))} error={!perfilForm.nome.trim() && perfilForm.nome !== ''} />
            <TextField label="Descrição" size="small" fullWidth multiline rows={2} value={perfilForm.descricao} onChange={(e) => setPerfilForm((f) => ({ ...f, descricao: e.target.value }))} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button size="small" color="inherit" onClick={() => setPerfilDialogOpen(false)}>Cancelar</Button>
            <Button size="small" variant="contained" onClick={handleCriarPerfil} disabled={!perfilForm.nome.trim()}>Criar</Button>
          </DialogActions>
        </Dialog>

        {/* Confirm delete */}
        <Dialog open={!!deletePerfilTarget} onClose={() => setDeletePerfilTarget(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Excluir perfil</DialogTitle>
          <DialogContent>
            <Typography variant="body2">Deseja excluir o perfil <strong>{deletePerfilTarget?.nome}</strong>?</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button size="small" color="inherit" onClick={() => setDeletePerfilTarget(null)}>Cancelar</Button>
            <Button size="small" variant="contained" color="error" onClick={handleDeletePerfil}>Excluir</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ── Vista de detalhe do usuário ───────────────────────────────────────────

  if (selected && editedUser) {
    const perms = getPerms(selected);
    const currentPermTab = PERM_TABS[activePermTab];

    return (
      <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: 'auto', width: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="Voltar">
              <IconButton size="small" onClick={() => { setSelected(null); setEditedUser(null); setView('list'); }}>
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Avatar sx={{ bgcolor: PAPEL_STYLE[selected.papel].avatar, fontWeight: 700, width: 40, height: 40 }}>
              {initials(selected.nome)}
            </Avatar>
            <Typography variant="h2">{selected.nome}</Typography>
          </Box>
          <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSaveUser} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="Acesso do usuário" />
            <Tab label="Permissões e ações" />
          </Tabs>
        </Box>

        {/* Tab 1 — Acesso */}
        {activeTab === 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: '0.1em', fontSize: '11px' }}
              >
                DADOS DE ACESSO
              </Typography>
              <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: 480 }}>
                <TextField
                  label="Nome *"
                  size="small"
                  fullWidth
                  value={editedUser.nome}
                  onChange={(e) => setEditedUser((u) => u ? { ...u, nome: e.target.value } : u)}
                />
                <TextField
                  label="E-mail / Login *"
                  size="small"
                  fullWidth
                  value={editedUser.email}
                  onChange={(e) => setEditedUser((u) => u ? { ...u, email: e.target.value } : u)}
                />
                <TextField
                  label="Nova Senha"
                  helperText="Deixe em branco para manter a senha atual"
                  size="small"
                  fullWidth
                  type="password"
                  autoComplete="new-password"
                  value={senhaEdit}
                  onChange={(e) => setSenhaEdit(e.target.value)}
                  inputProps={{ style: { WebkitBoxShadow: '0 0 0 1000px transparent inset' } }}
                />
                <Box sx={{ pt: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editedUser.isActive}
                        onChange={(e) => setEditedUser((u) => u ? { ...u, isActive: e.target.checked } : u)}
                      />
                    }
                    label="Usuário ativo"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Dialog: selecionar perfis customizados */}
        <Dialog open={perfilPickerOpen} onClose={() => setPerfilPickerOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Adicionar perfil ao usuário</DialogTitle>
          <DialogContent sx={{ pt: '12px !important' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Selecione os perfis customizados para atribuir a <strong>{selected.nome}</strong>.
            </Typography>
            {perfis.filter((p) => !p.isDefault).length === 0 ? (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Nenhum perfil customizado criado ainda.{' '}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: 'primary.main', cursor: 'pointer' }}
                  onClick={() => { setPerfilPickerOpen(false); setView('profiles'); }}
                >
                  Criar perfil
                </Typography>
              </Typography>
            ) : (
              <FormGroup sx={{ gap: 0.5 }}>
                {perfis.filter((p) => !p.isDefault).map((p) => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={(userPerfis[selected.id] ?? []).includes(p.id)}
                        onChange={() => toggleUserPerfil(selected.id, p.id)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nome}</Typography>
                        {p.descricao && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{p.descricao}</Typography>
                        )}
                      </Box>
                    }
                  />
                ))}
              </FormGroup>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button size="small" color="inherit" onClick={() => { setPerfilPickerOpen(false); setView('profiles'); }}>
              Gerenciar perfis
            </Button>
            <Button size="small" variant="contained" onClick={() => setPerfilPickerOpen(false)}>
              Fechar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Tab 2 — Permissões */}
        {activeTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Perfis do usuário */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                      Perfis do usuário
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        label={PAPEL_LABELS[selected.papel]}
                        size="small"
                        sx={{
                          bgcolor: PAPEL_STYLE[selected.papel].bg,
                          color: PAPEL_STYLE[selected.papel].color,
                          fontWeight: 600,
                        }}
                      />
                      {(userPerfis[selected.id] ?? []).map((perfilId) => {
                        const perfil = perfis.find((p) => p.id === perfilId);
                        if (!perfil) return null;
                        return (
                          <Chip
                            key={perfilId}
                            label={perfil.nome}
                            size="small"
                            onDelete={() => toggleUserPerfil(selected.id, perfilId)}
                            sx={{ bgcolor: 'action.selected', fontWeight: 600 }}
                          />
                        );
                      })}
                      {isGestor && (
                        <Chip
                          label="+"
                          size="small"
                          sx={{ cursor: 'pointer', bgcolor: 'action.hover', fontWeight: 700 }}
                          onClick={() => setPerfilPickerOpen(true)}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 260, textAlign: 'right', lineHeight: 1.5 }}>
                    Os perfis permitem agrupar permissões específicas para usuários em comum.{' '}
                    <Typography component="span" variant="caption" sx={{ color: 'primary.main', cursor: 'pointer' }} onClick={() => setView('profiles')}>
                      gerenciar perfis
                    </Typography>
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Permissões adicionais */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Permissões adicionais</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Este usuário possui as permissões padrão do perfil{' '}
                      <strong>{PAPEL_LABELS[selected.papel]}</strong>
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', maxWidth: 260, textAlign: 'right', lineHeight: 1.5 }}>
                    Se necessário, é possível conceder permissões específicas a este usuário, mesmo que não
                    estejam definidas no perfil.
                  </Typography>
                </Box>

                {/* Sub-tabs das permissões */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs
                    value={activePermTab}
                    onChange={(_, v) => setActivePermTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {PERM_TABS.map((tab) => (
                      <Tab key={tab.id} label={tab.label} sx={{ fontSize: '13px', minWidth: 80 }} />
                    ))}
                  </Tabs>
                </Box>

                <FormGroup>
                  {currentPermTab.permissoes.map((perm) => (
                    <FormControlLabel
                      key={perm.id}
                      sx={{ ml: perm.isChild ? 3 : 0, mb: 0.25 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={perms.includes(perm.id)}
                          disabled={!isGestor}
                          onChange={() => togglePerm(selected.id, perm.id, selected.papel)}
                          sx={{ py: 0.5 }}
                        />
                      }
                      label={<Typography variant="body2">{perm.label}</Typography>}
                    />
                  ))}
                </FormGroup>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    );
  }

  // ── Vista de lista ────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
          <Typography variant="h2">Usuários do sistema</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {isGestor && (
            <Button
              variant="text"
              size="small"
              sx={{ color: 'text.secondary', fontSize: '13px' }}
              onClick={() => setView('profiles')}
            >
              Perfil de usuários
            </Button>
          )}
          {isGestor && (
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setDialogOpen(true); }}
            >
              Incluir usuário
            </Button>
          )}
        </Box>
      </Box>

      {/* Busca */}
      <TextField
        placeholder="Pesquise por nome ou login..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 2.5, maxWidth: 480, width: '100%' }}
        slotProps={{
          input: {
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} />,
          },
        }}
      />

      {/* Contadores */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Usuários cadastrados <strong>{users.length}</strong>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Ativos <strong>{users.filter((u) => u.isActive).length}</strong>
          </Typography>
        </Box>
      </Box>

      {/* Grade de usuários */}
      <Grid container spacing={2}>
        {filtered.map((u) => {
          const style = PAPEL_STYLE[u.papel];
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u.id}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  opacity: u.isActive ? 1 : 0.6,
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  {/* Info do usuário */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: style.avatar, fontWeight: 700, width: 44, height: 44, fontSize: 16 }}>
                      {initials(u.nome)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {u.nome}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
                        {u.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  {/* Chips + ação */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={u.papel}
                        size="small"
                        sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '11px', height: 22 }}
                      />
                      {!u.isActive && (
                        <Chip
                          label="INATIVO"
                          size="small"
                          sx={{ bgcolor: 'action.hover', color: 'text.disabled', fontWeight: 600, fontSize: '11px', height: 22 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {isGestor && (
                        <Tooltip title="Remover usuário">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Button
                        size="small"
                        variant="text"
                        sx={{ fontSize: '12px', px: 1, minWidth: 'auto', color: 'primary.main' }}
                        onClick={() => openManage(u)}
                      >
                        gerenciar
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {filtered.length === 0 && (
          <Grid size={12}>
            <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
              <PersonAddIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
              <Typography>Nenhum usuário encontrado</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Dialog — Confirmar remoção */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remover usuário</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Deseja remover o usuário <strong>{deleteTarget?.nome}</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" color="inherit" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancelar</Button>
          <Button size="small" variant="contained" color="error" onClick={handleDeleteUser} disabled={loading}>
            {loading ? 'Removendo...' : 'Remover'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog — Incluir usuário */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Incluir usuário</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Nome completo *"
            size="small"
            fullWidth
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={!!formErrors.nome}
            helperText={formErrors.nome as string}
          />
          <TextField
            label="E-mail / Login *"
            size="small"
            fullWidth
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={!!formErrors.email}
            helperText={formErrors.email as string}
          />
          <TextField
            label="Senha *"
            size="small"
            fullWidth
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.senha}
            onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
            error={!!formErrors.senha}
            helperText={formErrors.senha as string}
          />
          <TextField
            select
            label="Papel"
            size="small"
            fullWidth
            value={form.papel}
            onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value as PapelProjeto }))}
          >
            {PAPEIS.map((p) => (
              <MenuItem key={p} value={p}>{PAPEL_LABELS[p]}</MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            }
            label="Usuário ativo"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" color="inherit" onClick={() => setDialogOpen(false)} disabled={loading}>Cancelar</Button>
          <Button size="small" variant="contained" onClick={handleIncluir} disabled={loading}>
            {loading ? 'Incluindo...' : 'Incluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
