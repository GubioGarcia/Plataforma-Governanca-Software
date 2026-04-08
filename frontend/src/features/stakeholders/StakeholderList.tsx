import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { mockStakeholders } from '../../mocks/stakeholders';
import type { PapelProjeto, StakeholderProjeto } from '../../types/stakeholder';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';

const PAPEIS: PapelProjeto[] = ['GESTOR', 'ANALISTA', 'STAKEHOLDER'];

const EMPTY_FORM = { userName: '', userEmail: '', empresa: '', papel: 'STAKEHOLDER' as PapelProjeto };
type FormData = typeof EMPTY_FORM;

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

const paperColors: Record<PapelProjeto, string> = {
  GESTOR: '#3F51B5',
  ANALISTA: '#059669',
  STAKEHOLDER: '#7C3AED',
};

export default function StakeholderList() {
  const { projectId } = useParams();
  const { canManageMembers } = usePermissions();
  const { notify } = useSnackbar();

  const [members, setMembers] = useState<StakeholderProjeto[]>(
    mockStakeholders.filter((s) => s.projetoId === Number(projectId))
  );

  const [search, setSearch] = useState('');
  const filtered = members.filter((s) =>
    s.userName.toLowerCase().includes(search.toLowerCase()) ||
    s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
    (s.empresa ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalInteracoes = members.reduce((acc, s) => acc + (s.totalInteracoes ?? 0), 0);

  // ── Add / Edit dialog ─────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StakeholderProjeto | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(sh: StakeholderProjeto) {
    setEditing(sh);
    setForm({ userName: sh.userName, userEmail: sh.userEmail, empresa: sh.empresa ?? '', papel: sh.papel });
    setErrors({});
    setDialogOpen(true);
  }

  function validate() {
    const e: Partial<FormData> = {};
    if (!form.userName.trim()) e.userName = 'Nome obrigatório';
    if (!form.userEmail.trim()) e.userEmail = 'E-mail obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail)) e.userEmail = 'E-mail inválido';
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    if (editing) {
      setMembers((prev) =>
        prev.map((s) =>
          s.id === editing.id
            ? { ...s, userName: form.userName, userEmail: form.userEmail, empresa: form.empresa, papel: form.papel }
            : s
        )
      );
    } else {
      const newId = Math.max(0, ...members.map((s) => s.id ?? 0)) + 1;
      setMembers((prev) => [
        ...prev,
        {
          id: newId,
          projetoId: Number(projectId),
          userId: newId + 100,
          userName: form.userName,
          userEmail: form.userEmail,
          empresa: form.empresa,
          papel: form.papel,
          totalInteracoes: 0,
          interacoesWiki: 0,
          interacoesRequisitos: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
    setDialogOpen(false);
    notify(editing ? 'Membro atualizado' : 'Membro adicionado com sucesso');
  }

  const [removeTarget, setRemoveTarget] = useState<StakeholderProjeto | null>(null);

  function handleRemove() {
    if (!removeTarget) return;
    setMembers((prev) => prev.filter((s) => s.id !== removeTarget.id));
    setRemoveTarget(null);
    notify('Membro removido', 'info');
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Stakeholders</Typography>
          <Typography variant="body2">Membros e participantes do projeto</Typography>
        </Box>
        {canManageMembers && (
          <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openAdd}>Adicionar Membro</Button>
        )}
      </Box>

      {/* Summary row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Total de membros', value: members.length, color: '#3F51B5' },
          { label: 'Total de interações', value: totalInteracoes, color: '#059669' },
          { label: 'Média por membro', value: members.length ? Math.round(totalInteracoes / members.length) : 0, color: '#D97706' },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card elevation={0} sx={{ border: '1px solid #E8EAED' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="h4" sx={{ color: stat.color, fontWeight: 700 }}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <Box
        component="input"
        placeholder="Buscar por nome, e-mail ou empresa..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        sx={{
          width: '100%',
          mb: 3,
          border: '1px solid #D1D5DB',
          borderRadius: 1,
          px: 2,
          py: 1,
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          '&:focus': { borderColor: '#3F51B5' },
        }}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<PeopleIcon sx={{ fontSize: 64 }} />} title="Nenhum membro encontrado" description="Adicione membros ao projeto." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map((sh) => {
            const maxWiki = Math.max(...members.map((s) => s.interacoesWiki ?? 0), 1);
            const maxReq = Math.max(...members.map((s) => s.interacoesRequisitos ?? 0), 1);
            const avatarColor = paperColors[sh.papel] ?? '#9CA3AF';

            return (
              <Card key={sh.id} elevation={0} sx={{ border: '1px solid #E8EAED', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }, transition: 'box-shadow 0.2s' }}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Avatar */}
                    <Avatar sx={{ bgcolor: avatarColor, width: 44, height: 44, fontWeight: 700, fontSize: 16 }}>
                      {initials(sh.userName)}
                    </Avatar>

                    {/* Info */}
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{sh.userName}</Typography>
                        <StatusChip status={sh.papel} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{sh.userEmail}</Typography>
                      {sh.empresa && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <BusinessIcon sx={{ fontSize: 13, color: '#9CA3AF' }} />
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{sh.empresa}</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Actions + interações */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title="Total de interações">
                        <Chip
                          label={`${sh.totalInteracoes ?? 0} interações`}
                          size="small"
                          sx={{ bgcolor: '#F3F4F6', fontWeight: 600 }}
                        />
                      </Tooltip>
                      {canManageMembers && (
                        <Tooltip title="Editar membro">
                          <IconButton size="small" onClick={() => openEdit(sh)}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canManageMembers && (
                        <Tooltip title="Remover membro">
                          <IconButton size="small" color="error" onClick={() => setRemoveTarget(sh)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  {/* Engagement bars */}
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>Engajamento WIKI</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{sh.interacoesWiki ?? 0}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={((sh.interacoesWiki ?? 0) / maxWiki) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#E8EAED', '& .MuiLinearProgress-bar': { bgcolor: '#3F51B5', borderRadius: 3 } }}
                      />
                    </Box>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>Engajamento Requisitos</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>{sh.interacoesRequisitos ?? 0}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={((sh.interacoesRequisitos ?? 0) / maxReq) * 100}
                        sx={{ height: 6, borderRadius: 3, bgcolor: '#E8EAED', '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED', borderRadius: 3 } }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Membro' : 'Adicionar Membro'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <TextField
            label="Nome completo"
            value={form.userName}
            onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
            error={!!errors.userName}
            helperText={errors.userName}
            size="small"
            fullWidth
          />
          <TextField
            label="E-mail"
            value={form.userEmail}
            onChange={(e) => setForm((f) => ({ ...f, userEmail: e.target.value }))}
            error={!!errors.userEmail}
            helperText={errors.userEmail}
            size="small"
            fullWidth
          />
          <TextField
            label="Empresa"
            value={form.empresa}
            onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            select
            label="Papel"
            value={form.papel}
            onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value as PapelProjeto }))}
            size="small"
            fullWidth
          >
            {PAPEIS.map((p) => (
              <MenuItem key={p} value={p}>{p}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" size="small">Cancelar</Button>
          <Button onClick={handleSave} variant="contained" size="small">
            {editing ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Confirm */}
      <ConfirmDialog
        open={!!removeTarget}
        title="Remover membro"
        message={`Deseja remover ${removeTarget?.userName} do projeto?`}
        confirmLabel="Remover"
        confirmColor="error"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </Box>
  );
}
