import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
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

export default function ProjectList() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { notify } = useSnackbar();

  const [projects, setProjects] = useState<ProjetoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '' });

  // Edit state
  const [editingProject, setEditingProject] = useState<ProjetoAPI | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', descricao: '' });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setFetchError(false);
      const data = await listarProjetosPorOrg(orgId);
      setProjects(data);
    } catch {
      setFetchError(true);
      notify('Não foi possível conectar ao servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [orgId]);

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.descricao ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'TODOS' || (p.status?.nome ?? '') === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProjectId(null);
  };

  const openEditProject = () => {
    const proj = projects.find((p) => p.id === menuProjectId);
    if (!proj) return;
    setEditingProject(proj);
    setEditForm({ nome: proj.nome, descricao: proj.descricao ?? '' });
    handleMenuClose();
  };

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

  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
      {/* Botão Voltar */}
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

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Projetos</Typography>
          <Typography variant="body2">Gerencie os projetos da organização</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setDialogOpen(true)}>
          Novo Projeto
        </Button>
      </Box>

      {/* Summary chips */}
      {!loading && !fetchError && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: projects.length, bg: '#EEF2FF', color: 'text.primary' },
            {
              label: 'Em Desenvolvimento',
              value: projects.filter((p) => p.status?.nome === 'EM_DESENVOLVIMENTO').length,
              bg: '#FFFBEB',
              color: '#D97706',
            },
            {
              label: 'Planejamento',
              value: projects.filter((p) => p.status?.nome === 'PLANEJAMENTO').length,
              bg: '#EFF6FF',
              color: '#3B82F6',
            },
            {
              label: 'Concluído',
              value: projects.filter((p) => p.status?.nome === 'CONCLUIDO').length,
              bg: '#F0FDF4',
              color: '#16A34A',
            },
          ].map((chip) => (
            <Box
              key={chip.label}
              sx={{
                px: 2.5,
                py: 1.5,
                borderRadius: 2,
                bgcolor: chip.bg,
                minWidth: 90,
                textAlign: 'center',
                cursor: 'pointer',
                border: statusFilter === chip.label || (chip.label === 'Total' && statusFilter === 'TODOS')
                  ? `2px solid ${chip.color === 'text.primary' ? '#6366F1' : chip.color}`
                  : '2px solid transparent',
              }}
              onClick={() =>
                setStatusFilter(
                  chip.label === 'Total' ? 'TODOS'
                  : chip.label === 'Em Desenvolvimento' ? 'EM_DESENVOLVIMENTO'
                  : chip.label === 'Planejamento' ? 'PLANEJAMENTO'
                  : 'CONCLUIDO'
                )
              }
            >
              <Typography variant="h4" sx={{ color: chip.color, lineHeight: 1.2 }}>{chip.value}</Typography>
              <Typography variant="caption" color="text.secondary">{chip.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Search + Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          placeholder="Buscar projeto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: 340 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="TODOS">Todos os status</MenuItem>
            <MenuItem value="EM_DESENVOLVIMENTO">Em Desenvolvimento</MenuItem>
            <MenuItem value="PLANEJAMENTO">Planejamento</MenuItem>
            <MenuItem value="CONCLUIDO">Concluído</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Projects list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : fetchError ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>Servidor indisponível</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Não foi possível carregar os projetos. Verifique a conexão com o backend.</Typography>
          <Button variant="outlined" onClick={fetchProjects}>Tentar novamente</Button>
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Tente ajustar a busca ou crie um novo projeto."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((project) => (
            <Card
              key={project.id}
              sx={{
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
              }}
              onClick={() => navigate(`/organizations/${orgId}/projects/${project.id}`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
                      <Typography variant="h5">{project.nome}</Typography>
                      <StatusChip status={project.status?.nome ?? 'N/A'} />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        maxWidth: '80%',
                      }}
                    >
                      {project.descricao}
                    </Typography>

                    {/* Stats row — campos sem API ficam zerados por enquanto */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <PeopleIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="caption">0 stakeholders</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <ListAltIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                        <Typography variant="caption">0 requisitos</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <CheckCircleIcon sx={{ fontSize: 15, color: '#16A34A' }} />
                        <Typography variant="caption" sx={{ color: '#16A34A' }}>0 aprovados (0%)</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                         Criado em {new Date(project.dataCriacao ?? '').toLocaleDateString('pt-BR')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                    <Tooltip title="Mais opções">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAnchor(e.currentTarget);
                          setMenuProjectId(project.id);
                        }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button
                      endIcon={<ArrowForwardIcon />}
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/organizations/${orgId}/projects/${project.id}`);
                      }}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      Ver Projeto
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 160 } } }}
      >
        <MenuItem
          onClick={() => {
            if (menuProjectId) navigate(`/organizations/${orgId}/projects/${menuProjectId}`);
            handleMenuClose();
          }}
        >
          Ver Projeto
        </MenuItem>
        <MenuItem onClick={openEditProject}>
          <EditIcon fontSize="small" sx={{ mr: 1, fontSize: 16 }} />
          Editar
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>Inativar</MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Projeto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome do projeto"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            fullWidth
            autoFocus
            required
            placeholder="Ex.: Sistema de Gestão"
          />
          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!form.nome.trim()}>Criar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={Boolean(editingProject)} onClose={() => setEditingProject(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Projeto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome do projeto"
            value={editForm.nome}
            onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
            fullWidth
            autoFocus
            required
          />
          <TextField
            label="Descrição"
            value={editForm.descricao}
            onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingProject(null)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editForm.nome.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
