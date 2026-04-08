import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChecklistIcon from '@mui/icons-material/Checklist';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import { useSnackbar } from '../../context/SnackbarContext';
import { mockProjects } from '../../mocks/projects';
import type { Projeto, StatusProjeto } from '../../types/project';

export default function ProjectList() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const { notify } = useSnackbar();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusProjeto | 'ALL'>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [projects, setProjects] = useState<Projeto[]>(mockProjects);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuProjectId, setMenuProjectId] = useState<number | null>(null);

  // Edit state
  const [editingProject, setEditingProject] = useState<Projeto | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'PLANEJAMENTO' as StatusProjeto });

  const orgProjects = projects.filter((p) => p.organizacaoId === Number(orgId));

  const filtered = orgProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statsTotal = orgProjects.length;
  const statsInDev = orgProjects.filter((p) => p.status === 'EM_DESENVOLVIMENTO').length;
  const statsPlanning = orgProjects.filter((p) => p.status === 'PLANEJAMENTO').length;

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuProjectId(null);
  };

  const openEditProject = () => {
    const proj = projects.find((p) => p.id === menuProjectId);
    if (!proj) return;
    setEditingProject(proj);
    setEditForm({ name: proj.name, description: proj.description ?? '', status: proj.status });
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editingProject) return;
    setProjects((prev) => prev.map((p) => p.id === editingProject.id
      ? { ...p, name: editForm.name.trim(), description: editForm.description.trim(), status: editForm.status, updatedAt: new Date().toISOString() }
      : p
    ));
    setEditingProject(null);
    notify('Projeto atualizado com sucesso');
  };

  const handleDeleteProject = () => {
    setProjects((prev) => prev.filter((p) => p.id !== menuProjectId));
    handleMenuClose();
    notify('Projeto excluído', 'info');
  };

  const handleArchiveProject = () => {
    setProjects((prev) =>
      prev.map((p) => (p.id === menuProjectId ? { ...p, status: 'CANCELADO' as StatusProjeto } : p))
    );
    handleMenuClose();
    notify('Projeto arquivado', 'warning');
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const newProject: Projeto = {
      id: Date.now(),
      organizacaoId: Number(orgId),
      name: form.name.trim(),
      description: form.description.trim(),
      status: 'PLANEJAMENTO',
      totalStakeholders: 0,
      totalRequisitos: 0,
      requisitosAprovados: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    setForm({ name: '', description: '' });
    setDialogOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
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

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        {[
          { label: 'Total', value: statsTotal, color: '#3F51B5', bg: '#EEF2FF' },
          { label: 'Em Desenvolvimento', value: statsInDev, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Planejamento', value: statsPlanning, color: '#3B82F6', bg: '#EFF6FF' },
        ].map((s) => (
          <Box
            key={s.label}
            sx={{
              px: 2.5,
              py: 1.5,
              bgcolor: s.bg,
              borderRadius: 2,
              border: `1px solid ${s.color}22`,
            }}
          >
            <Typography sx={{ fontSize: '22px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </Typography>
            <Typography variant="caption" sx={{ color: s.color, opacity: 0.8 }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusProjeto | 'ALL')}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="ALL">Todos os status</MenuItem>
          <MenuItem value="PLANEJAMENTO">Planejamento</MenuItem>
          <MenuItem value="EM_DESENVOLVIMENTO">Em Desenvolvimento</MenuItem>
          <MenuItem value="CONCLUIDO">Concluído</MenuItem>
          <MenuItem value="CANCELADO">Cancelado</MenuItem>
        </Select>
      </Box>

      {/* Projects list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum projeto encontrado"
          description="Tente ajustar os filtros ou crie um novo projeto."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((project) => {
            const approvedPct =
              project.totalRequisitos && project.totalRequisitos > 0
                ? Math.round(((project.requisitosAprovados ?? 0) / project.totalRequisitos) * 100)
                : 0;

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
                        <Typography variant="h5">{project.name}</Typography>
                        <StatusChip status={project.status} />
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
                        {project.description}
                      </Typography>

                      {/* Meta info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <GroupIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">
                            {project.totalStakeholders ?? 0} stakeholders
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <ChecklistIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption">
                            {project.totalRequisitos ?? 0} requisitos
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CheckCircleIcon sx={{ fontSize: 14, color: '#16A34A' }} />
                          <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600 }}>
                            {project.requisitosAprovados ?? 0} aprovados ({approvedPct}%)
                          </Typography>
                        </Box>
                        <Typography variant="caption">
                          Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}
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
        <MenuItem onClick={handleArchiveProject}>Arquivar</MenuItem>
        <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>Excluir</MenuItem>
      </Menu>

      {/* Create Project Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Projeto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome do projeto"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            autoFocus
            required
            placeholder="Ex: Sistema de Gestão de Requisitos"
          />
          <TextField
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            placeholder="Descreva o objetivo do projeto..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!form.name.trim()}>Criar</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={Boolean(editingProject)} onClose={() => setEditingProject(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Projeto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome do projeto"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            autoFocus
            required
          />
          <TextField
            label="Descrição"
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />
          <Select
            value={editForm.status}
            onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as StatusProjeto }))}
            size="small"
            fullWidth
          >
            <MenuItem value="PLANEJAMENTO">Planejamento</MenuItem>
            <MenuItem value="EM_DESENVOLVIMENTO">Em Desenvolvimento</MenuItem>
            <MenuItem value="CONCLUIDO">Concluído</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingProject(null)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editForm.name.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
