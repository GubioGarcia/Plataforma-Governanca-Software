import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import { mockOrganizations } from '../../mocks/organizations';
import type { Organizacao, PlanoOrganizacao } from '../../types/organization';

export default function OrganizationList() {
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const [orgs, setOrgs] = useState<Organizacao[]>(mockOrganizations);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', plano: 'FREE' as PlanoOrganizacao });

  // Edit state
  const [editingOrg, setEditingOrg] = useState<Organizacao | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', plano: 'FREE' as PlanoOrganizacao });
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuOrgId, setMenuOrgId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleMenuClose = () => { setMenuAnchor(null); setMenuOrgId(null); };

  const openEdit = (org: Organizacao) => {
    setEditingOrg(org);
    setEditForm({ name: org.name, description: org.description ?? '', plano: org.plano });
    handleMenuClose();
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim() || !editingOrg) return;
    setOrgs((prev) => prev.map((o) => o.id === editingOrg.id ? { ...o, ...editForm, name: editForm.name.trim(), description: editForm.description.trim(), updatedAt: new Date().toISOString() } : o));
    setEditingOrg(null);
    notify('Organização atualizada com sucesso');
  };

  const handleDeleteOrg = () => {
    setOrgs((prev) => prev.filter((o) => o.id !== menuOrgId));
    handleMenuClose();
    setDeleteConfirmOpen(false);
    notify('Organização excluída', 'info');
  };

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const newOrg: Organizacao = {
      id: Date.now(),
      name: form.name.trim(),
      description: form.description.trim(),
      plano: form.plano,
      totalProjetos: 0,
      totalMembros: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrgs((prev) => [...prev, newOrg]);
    setForm({ name: '', description: '', plano: 'FREE' });
    setDialogOpen(false);
    notify('Organização criada com sucesso');
  };

  return (
    <Box sx={{ flexGrow: 1, p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Suas Organizações</Typography>
          <Typography variant="body2">Selecione uma organização para acessar seus projetos e configurações.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setDialogOpen(true)}>
          Nova Organização
        </Button>
      </Box>

      <Grid container spacing={3}>
        {orgs.map((org) => (
          <Grid key={org.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, transform 0.15s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' },
              }}
              onClick={() => navigate(`/organizations/${org.id}/projects`)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BusinessIcon sx={{ color: 'primary.main', fontSize: 22 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StatusChip status={org.plano as PlanoOrganizacao} />
                    <Tooltip title="Mais opções">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuOrgId(org.id); }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ mb: 0.5 }}>{org.name}</Typography>
                <Typography variant="body2" sx={{ mb: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '40px' }}>
                  {org.description}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <FolderIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="caption">{org.totalProjetos ?? 0} projeto{org.totalProjetos !== 1 ? 's' : ''}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <GroupIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="caption">{org.totalMembros ?? 0} membro{org.totalMembros !== 1 ? 's' : ''}</Typography>
                  </Box>
                </Box>
                <Button endIcon={<ArrowForwardIcon />} size="small" variant="outlined" fullWidth sx={{ borderRadius: 2 }}>
                  Acessar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Create new org card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            onClick={() => setDialogOpen(true)}
            sx={{
              cursor: 'pointer',
              border: '2px dashed #E8EAED',
              boxShadow: 'none',
              bgcolor: 'transparent',
              transition: 'border-color 0.15s, background 0.15s',
              '&:hover': { borderColor: 'primary.main', bgcolor: '#F8FAFF' },
              height: '100%',
              minHeight: 200,
            }}
          >
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3, gap: 1 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AddIcon sx={{ color: '#9CA3AF', fontSize: 22 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#6B7280' }}>Criar organização</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Org context menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 160 } } }}
      >
        <MenuItem onClick={() => { const org = orgs.find((o) => o.id === menuOrgId); if (org) openEdit(org); }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          Editar
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setDeleteConfirmOpen(true)} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Excluir
        </MenuItem>
      </Menu>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Excluir organização"
        message="Esta ação é irreversível. Todos os projetos e dados associados serão perdidos."
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDeleteOrg}
        onCancel={() => { setDeleteConfirmOpen(false); handleMenuClose(); }}
      />

      {/* Edit Organization Dialog */}
      <Dialog open={Boolean(editingOrg)} onClose={() => setEditingOrg(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Organização</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome da organização"
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
          <FormControl fullWidth>
            <InputLabel>Plano</InputLabel>
            <Select
              label="Plano"
              value={editForm.plano}
              onChange={(e) => setEditForm((f) => ({ ...f, plano: e.target.value as PlanoOrganizacao }))}
            >
              <MenuItem value="FREE">Free</MenuItem>
              <MenuItem value="PRO">Pro</MenuItem>
              <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingOrg(null)} color="inherit">Cancelar</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editForm.name.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Create Organization Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Organização</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome da organização"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            autoFocus
            required
            placeholder="Ex.: TechCorp Ltda"
          />
          <TextField
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
            placeholder="Descreva brevemente a organização..."
          />
          <FormControl fullWidth>
            <InputLabel>Plano</InputLabel>
            <Select
              label="Plano"
              value={form.plano}
              onChange={(e) => setForm((f) => ({ ...f, plano: e.target.value as PlanoOrganizacao }))}
            >
              <MenuItem value="FREE">Free</MenuItem>
              <MenuItem value="PRO">Pro</MenuItem>
              <MenuItem value="ENTERPRISE">Enterprise</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancelar</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!form.name.trim()}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
