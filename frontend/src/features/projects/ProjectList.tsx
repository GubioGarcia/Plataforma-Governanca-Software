import { useState, useEffect, useCallback } from 'react';
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
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import type { ProjetoAPI, StatusProjetoAPI } from '../../types/projeto';
import {
  listarProjetosPorOrg,
  criarProjeto,
  atualizarProjeto,
  inativarProjeto,
  ativarProjeto,
  listarStatusProjeto,
  listarRequisitosResumoPorProjeto,
} from '../../services/projetoService';

interface ReqResumo { total: number; aprovados: number }

export default function ProjectList() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { notify } = useSnackbar();

  const [projects, setProjects] = useState<ProjetoAPI[]>([]);
  const [statusOptions, setStatusOptions] = useState<StatusProjetoAPI[]>([]);
  const [reqResumos, setReqResumos] = useState<Record<string, ReqResumo>>({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '' });

  // Inactive projects panel
  const [inactiveOpen, setInactiveOpen] = useState(false);
  const [inactiveProjects, setInactiveProjects] = useState<ProjetoAPI[]>([]);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [reactivateTarget, setReactivateTarget] = useState<ProjetoAPI | null>(null);

  // Edit state
  const [editingProject, setEditingProject] = useState<ProjetoAPI | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', descricao: '' });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);

  const fetchReqResumos = useCallback(async (projs: ProjetoAPI[]) => {
    const results: Record<string, ReqResumo> = {};
    await Promise.all(
      projs.map(async (p) => {
        try {
          results[p.id] = await listarRequisitosResumoPorProjeto(p.id);
        } catch {
          results[p.id] = { total: 0, aprovados: 0 };
        }
      })
    );
    setReqResumos(results);
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setFetchError(false);
      const [data, statuses] = await Promise.all([
        listarProjetosPorOrg(orgId, true),
        listarStatusProjeto(),
      ]);
      // Sort status by ordem
      const sorted = [...statuses].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      setStatusOptions(sorted);
      setProjects(data);
      // Fetch req resumos in background
      fetchReqResumos(data);
    } catch {
      setFetchError(true);
      notify('Não foi possível conectar ao servidor.', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, notify, fetchReqResumos]);

  const fetchInactiveProjects = async () => {
    if (!orgId) return;
    try {
      setLoadingInactive(true);
      const data = await listarProjetosPorOrg(orgId, false);
      setInactiveProjects(data.filter((p) => p.ativo === false || p.ativo === undefined ? true : false).length > 0
        ? data.filter((p) => p.ativo === false)
        : data);
    } catch {
      notify('Erro ao carregar projetos inativos', 'error');
    } finally {
      setLoadingInactive(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleOpenInactive = () => {
    setInactiveOpen(true);
    fetchInactiveProjects();
  };

  const handleReactivate = async () => {
    if (!reactivateTarget) return;
    try {
      await ativarProjeto(reactivateTarget.id);
      notify('Projeto reativado com sucesso');
      setReactivateTarget(null);
      fetchInactiveProjects();
      fetchProjects();
    } catch {
      notify('Erro ao reativar projeto', 'error');
    }
  };

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.descricao ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'TODOS' || (p.status?.id ?? '') === statusFilter || (p.status?.nome ?? '') === statusFilter;
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

  const STATUS_CARD_STYLES: Record<string, { color: string; bg: string }> = {
    TOTAL:      { color: '#374151', bg: '#EEF2FF' },
    RASCUNHO:   { color: '#6B7280', bg: '#F3F4F6' },
    EM_REVISAO: { color: '#3B82F6', bg: '#EFF6FF' },
    APROVADO:   { color: '#16A34A', bg: '#F0FDF4' },
    EM_ANDAMENTO: { color: '#D97706', bg: '#FEF3C7' },
    EM_TESTE:   { color: '#4338CA', bg: '#E0E7FF' },
    CONCLUIDO:  { color: '#15803D', bg: '#ECFDF5' },
    REPROVADO:  { color: '#DC2626', bg: '#FEE2E2' },
    ARQUIVADO:  { color: '#475569', bg: '#F8FAFC' },
    CANCELADO:  { color: '#991B1B', bg: '#FEE2E2' },
  };

  function getStatusStyle(statusNome?: string) {
    const key = statusNome?.toUpperCase() ?? 'TOTAL';
    return STATUS_CARD_STYLES[key] ?? STATUS_CARD_STYLES.TOTAL;
  }

  const summaryCards = [
    { label: 'Total', value: projects.length, filterId: 'TODOS', ...getStatusStyle('TOTAL') },
    ...statusOptions.map((s) => ({
      label: s.nome.replace(/_/g, ' '),
      value: projects.filter((p) => p.status?.id === s.id).length,
      filterId: s.id,
      ...getStatusStyle(s.nome),
    })),
  ];

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
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<HistoryIcon />}
            size="small"
            onClick={handleOpenInactive}
            color="inherit"
          >
            Projetos Inativos
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setDialogOpen(true)}>
            Novo Projeto
          </Button>
        </Box>
      </Box>

      {/* Summary chips — driven by statusOptions from API */}
      {!loading && !fetchError && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {summaryCards.map((chip) => {
            const isActive = statusFilter === chip.filterId;
            return (
              <Box
                key={chip.filterId}
                sx={{
                  px: 2.5,
                  py: 1.5,
                  borderRadius: 2,
                  bgcolor: isActive ? `${chip.color}0F` : chip.bg,
                  minWidth: 110,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: isActive ? `${chip.color}55` : 'divider',
                  borderTop: `3px solid ${chip.color}`,
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: `${chip.color}10`,
                    borderColor: `${chip.color}55`,
                  },
                }}
                onClick={() => setStatusFilter(chip.filterId)}
              >
                <Typography variant="h4" sx={{ color: chip.color, lineHeight: 1.2 }}>{chip.value}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', fontSize: 11 }}>
                  {chip.label.toLowerCase()}
                </Typography>
              </Box>
            );
          })}
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
            {statusOptions.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.nome.replace(/_/g, ' ')}
              </MenuItem>
            ))}
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
          {filtered.map((project) => {
            const resumo = reqResumos[project.id];
            const total = resumo?.total ?? 0;
            const aprovados = resumo?.aprovados ?? 0;
            const pct = total > 0 ? Math.round((aprovados / total) * 100) : 0;

            return (
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

                      {/* Stats row — requisitos via API */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PeopleIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                          <Typography variant="caption">0 stakeholders</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <ListAltIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                          <Typography variant="caption">{total} requisito{total !== 1 ? 's' : ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CheckCircleIcon sx={{ fontSize: 15, color: '#16A34A' }} />
                          <Typography variant="caption" sx={{ color: '#16A34A' }}>
                            {aprovados} aprovado{aprovados !== 1 ? 's' : ''} ({pct}%)
                          </Typography>
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
            );
          })}
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

      {/* Reactivate confirm */}
      <ConfirmDialog
        open={Boolean(reactivateTarget)}
        title="Reativar projeto"
        message={`Deseja reativar o projeto "${reactivateTarget?.nome}"?`}
        confirmLabel="Reativar"
        confirmColor="primary"
        onConfirm={handleReactivate}
        onCancel={() => setReactivateTarget(null)}
      />

      {/* Inactive Projects Dialog */}
      <Dialog open={inactiveOpen} onClose={() => setInactiveOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon fontSize="small" />
          Projetos Inativos
        </DialogTitle>
        <DialogContent>
          {loadingInactive ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : inactiveProjects.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Nenhum projeto inativo encontrado.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              {inactiveProjects.map((proj) => (
                <Box
                  key={proj.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{proj.nome}</Typography>
                      <Chip label="Inativo" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontSize: 11, height: 20 }} />
                      {proj.status && <StatusChip status={proj.status.nome} />}
                    </Box>
                    {proj.descricao && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{proj.descricao}</Typography>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CheckCircleIcon />}
                    color="success"
                    onClick={() => setReactivateTarget(proj)}
                    sx={{ whiteSpace: 'nowrap', ml: 2 }}
                  >
                    Reativar
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInactiveOpen(false)} color="inherit">Fechar</Button>
        </DialogActions>
      </Dialog>

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