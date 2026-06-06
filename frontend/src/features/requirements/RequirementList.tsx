import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FlagIcon from '@mui/icons-material/Flag';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  listarStatusRequisito,
  listarPrioridades,
  listarRequisitosPorProjeto,
  criarRequisito,
  atualizarRequisito,
  deletarRequisito,
} from '../../services/requirementService';
import type { RequisitoAPI, StatusRequisitoAPI, PrioridadeAPI, TipoRequisito } from '../../types/requirementAPI';

const STATUS_NAME_COLOR_MAP: Record<string, string> = {
  TOTAL: '#374151',
  RASCUNHO: '#6B7280',
  EM_ANALISE: '#3B82F6',
  EM_VALIDACAO: '#D97706',
  APROVADO: '#059669',
  VALIDADO: '#7C3AED',
  REPROVADO: '#DC2626',
};

const RANDOM_COLORS = ['#0891B2', '#BE185D', '#B45309', '#15803D', '#7C2D12', '#4338CA'];

function colorForStatus(nomeUpper: string, index: number): string {
  const key = nomeUpper.replace(/\s/g, '_');
  return STATUS_NAME_COLOR_MAP[key] ?? RANDOM_COLORS[index % RANDOM_COLORS.length];
}

const TIPO_LABELS: Record<string, string> = {
  FUNCIONAL: 'Funcional',
  NAO_FUNCIONAL: 'Não Funcional',
  REGRA_NEGOCIO: 'Negócio',
  TECNICO: 'Técnico',
};

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  FUNCIONAL: { bg: '#EFF6FF', color: '#3B82F6' },
  NAO_FUNCIONAL: { bg: '#FDF4FF', color: '#9333EA' },
  REGRA_NEGOCIO: { bg: '#FFF7ED', color: '#EA580C' },
  TECNICO: { bg: '#F0FDF4', color: '#16A34A' },
};

const PRIORIDADE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  BAIXA:   { bg: '#F0FDF4', color: '#16A34A', border: '#16A34A44' },
  MEDIA:   { bg: '#FFFBEB', color: '#D97706', border: '#D9770644' },
  ALTA:    { bg: '#FFF7ED', color: '#EA580C', border: '#EA580C44' },
  CRITICA: { bg: '#FEF2F2', color: '#DC2626', border: '#DC262644' },
};

const EMPTY_FORM = { titulo: '', descricao: '', tipoRequisito: 'FUNCIONAL' as TipoRequisito, prioridadeId: '' };
type ReqForm = typeof EMPTY_FORM;

export default function RequirementList() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();

  const [requirements, setRequirements] = useState<RequisitoAPI[]>([]);
  const [statusList, setStatusList] = useState<StatusRequisitoAPI[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadeAPI[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tipoFilter, setTipoFilter] = useState<TipoRequisito | 'ALL'>('ALL');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReqForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<ReqForm>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RequisitoAPI | null>(null);

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [reqs, statuses, prios] = await Promise.all([
        listarRequisitosPorProjeto(projectId),
        listarStatusRequisito(),
        listarPrioridades(),
      ]);
      setRequirements(reqs);
      setStatusList(statuses);
      setPrioridades(prios);
      // Set default prioridade to "Baixa" (lowest order)
      if (prios.length > 0) {
        const sorted = [...prios].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        const baixa = sorted.find((p) => p.codigo?.toUpperCase() === 'BAIXA') ?? sorted[0];
        setForm((prev) => ({ ...prev, prioridadeId: baixa.id }));
      }
    } catch {
      notify('Erro ao carregar requisitos', 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, notify]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = requirements.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.titulo.toLowerCase().includes(q) ||
      r.descricao.toLowerCase().includes(q) ||
      String(r.versao).includes(q) ||
      r.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || r.statusId === statusFilter;
    const matchTipo = tipoFilter === 'ALL' || r.tipoRequisito === tipoFilter;
    const matchPrioridade = prioridadeFilter === 'ALL' || r.prioridadeId === prioridadeFilter;
    return matchSearch && matchStatus && matchTipo && matchPrioridade;
  });
  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const totalCard = { label: 'Total', value: requirements.length, filter: 'ALL', color: colorForStatus('TOTAL', -1) };
  const statusCards = statusList.map((s, i) => ({
    label: s.nome.replace(/_/g, ' '),
    value: requirements.filter((r) => r.statusId === s.id).length,
    filter: s.id,
    color: colorForStatus(s.nome.toUpperCase(), i),
  }));
  const allCards = [totalCard, ...statusCards];

  function openCreate() {
    setEditingId(null);
    const sorted = [...prioridades].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    const baixa = sorted.find((p) => p.codigo?.toUpperCase() === 'BAIXA') ?? sorted[0];
    setForm({ ...EMPTY_FORM, prioridadeId: baixa?.id ?? '' });
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(r: RequisitoAPI, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(r.id);
    setForm({ titulo: r.titulo, descricao: r.descricao, tipoRequisito: r.tipoRequisito, prioridadeId: r.prioridadeId ?? '' });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSave() {
    const errs: Partial<ReqForm> = {};
    if (!form.titulo.trim()) errs.titulo = 'Título obrigatório';
    if (!form.descricao.trim()) errs.descricao = 'Descrição obrigatória';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    if (!projectId) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await atualizarRequisito(editingId, {
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          tipoRequisito: form.tipoRequisito,
          prioridadeId: form.prioridadeId || undefined,
        });
        setRequirements((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
        notify('Requisito atualizado', 'success');
      } else {
        const novo = await criarRequisito(projectId, {
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim(),
          tipoRequisito: form.tipoRequisito,
          prioridadeId: form.prioridadeId || undefined,
        });
        setRequirements((prev) => [...prev, novo]);
        notify('Requisito criado com sucesso', 'success');
      }
      setFormOpen(false);
    } catch {
      notify('Erro ao salvar requisito', 'error');
    } finally {
      setSaving(false);
    }
  }

  function openDelete(r: RequisitoAPI, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(r);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletarRequisito(deleteTarget.id);
      setRequirements((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      notify('Requisito excluído', 'info');
    } catch {
      notify('Erro ao excluir requisito', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  function goToDetail(r: RequisitoAPI, e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    navigate(`/organizations/${orgId}/projects/${projectId}/requirements/${r.id}`);
  }

  const hasActiveFilters = statusFilter !== 'ALL' || tipoFilter !== 'ALL' || prioridadeFilter !== 'ALL' || search;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Requisitos</Typography>
          <Typography variant="body2" color="text.secondary">
            Lista de requisitos do projeto com fluxo de aprovação
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openCreate} sx={{ display: isStakeholder ? 'none' : undefined }}>
          Novo Requisito
        </Button>
      </Box>

      {/* Summary cards — driven by API */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {allCards.map((s) => {
          const isActive = statusFilter === s.filter;
          return (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={s.label}>
              <Box
                onClick={() => { setStatusFilter(s.filter); setPage(0); }}
                sx={{
                  border: '1px solid',
                  borderColor: isActive ? `${s.color}55` : 'divider',
                  borderTop: `3px solid ${s.color}`,
                  borderRadius: 1.5,
                  p: 1.5,
                  cursor: 'pointer',
                  bgcolor: isActive ? `${s.color}10` : 'background.paper',
                  '&:hover': { bgcolor: `${s.color}08`, borderColor: `${s.color}44` },
                  transition: 'all 0.15s',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: s.color, mb: 0.25 }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, textTransform: 'capitalize' }}>
                  {s.label.toLowerCase()}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar por título, ID ou descrição..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          size="small"
          sx={{ flex: 1, minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
            <MenuItem value="ALL">Todos os status</MenuItem>
            {statusList.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.nome.replace(/_/g, ' ')}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select label="Tipo" value={tipoFilter} onChange={(e) => { setTipoFilter(e.target.value as TipoRequisito | 'ALL'); setPage(0); }}>
            <MenuItem value="ALL">Todos os tipos</MenuItem>
            <MenuItem value="FUNCIONAL">Funcional</MenuItem>
            <MenuItem value="NAO_FUNCIONAL">Não Funcional</MenuItem>
            <MenuItem value="REGRA_NEGOCIO">Negócio</MenuItem>
            <MenuItem value="TECNICO">Técnico</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Prioridade</InputLabel>
          <Select label="Prioridade" value={prioridadeFilter} onChange={(e) => { setPrioridadeFilter(e.target.value); setPage(0); }}>
            <MenuItem value="ALL">Todas as prioridades</MenuItem>
            {prioridades.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {hasActiveFilters && (
          <Button size="small" color="inherit" onClick={() => { setStatusFilter('ALL'); setTipoFilter('ALL'); setPrioridadeFilter('ALL'); setSearch(''); setPage(0); }}>
            Limpar filtros
          </Button>
        )}
      </Box>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<AssignmentIcon sx={{ fontSize: 64 }} />}
          title="Nenhum requisito encontrado"
          description="Tente ajustar os filtros ou adicione um novo requisito."
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {paginated.map((r) => {
            const tipo = TIPO_LABELS[r.tipoRequisito] ?? r.tipoRequisito;
            const tipoColor = TIPO_COLORS[r.tipoRequisito] ?? { bg: '#F3F4F6', color: '#374151' };
            const statusCard = statusList.find((s) => s.id === r.statusId);
            const statusColor = statusCard
              ? colorForStatus(statusCard.nome.toUpperCase(), statusList.indexOf(statusCard))
              : '#6B7280';
            const prioridadeInfo = prioridades.find((p) => p.id === r.prioridadeId);
            const prioColors = prioridadeInfo
              ? (PRIORIDADE_COLORS[prioridadeInfo.codigo] ?? { bg: '#F3F4F6', color: '#374151', border: '#37415144' })
              : null;
            const diasAtualizado = r.dataAtualizacao
              ? Math.floor((Date.now() - new Date(r.dataAtualizacao).getTime()) / 86400000)
              : null;

            return (
              <Box
                key={r.id}
                onClick={(e) => goToDetail(r, e)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2.5,
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': {
                    borderColor: 'primary.light',
                    bgcolor: 'background.default',
                    '& .arrow-icon': { opacity: 1, transform: 'translateX(0)' },
                  },
                  transition: 'all 0.12s',
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                    <Box sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'divider', borderRadius: 0.75, px: 0.75, py: 0.15 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', fontSize: 10 }}>
                        {r.codigo ?? 'REQ-???'}
                      </Typography>
                    </Box>
                    <Chip label={tipo} size="small" sx={{ bgcolor: tipoColor.bg, color: tipoColor.color, fontWeight: 600, fontSize: 11, height: 20 }} />
                    {statusCard && (
                      <Box sx={{ border: '1px solid', borderColor: `${statusColor}44`, bgcolor: `${statusColor}12`, borderRadius: 1, px: 1, py: 0.15 }}>
                        <Typography variant="caption" sx={{ color: statusColor, fontWeight: 600, fontSize: 11 }}>
                          {statusCard.nome.replace(/_/g, ' ')}
                        </Typography>
                      </Box>
                    )}
                    {prioridadeInfo && prioColors && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, border: '1px solid', borderColor: prioColors.border, bgcolor: prioColors.bg, borderRadius: 1, px: 0.75, py: 0.15 }}>
                        <FlagIcon sx={{ fontSize: 11, color: prioColors.color }} />
                        <Typography variant="caption" sx={{ color: prioColors.color, fontWeight: 600, fontSize: 11 }}>
                          {prioridadeInfo.nome}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{r.titulo}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.25, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {r.descricao}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {r.criadoPorNome && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{r.criadoPorNome}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>v{r.versao ?? 1}.0</Typography>
                    </Box>
                    {diasAtualizado !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {diasAtualizado === 0 ? 'Atualizado hoje' : `Atualizado há ${diasAtualizado} dia${diasAtualizado > 1 ? 's' : ''}`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  {!isStakeholder && (
                    <>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={(e) => openEdit(r, e)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={(e) => openDelete(r, e)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                    </>
                  )}
                  <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: 20, color: 'primary.main', opacity: 0, transform: 'translateX(-4px)', transition: 'all 0.15s', ml: 0.5 }} />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {filtered.length} de {requirements.length} requisito{requirements.length !== 1 ? 's' : ''} — clique em um card para ver detalhes
        </Typography>
        {filtered.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_e, p) => setPage(p)}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{ p: 0, '& .MuiTablePagination-toolbar': { minHeight: 36, p: 0 } }}
          />
        )}
      </Box>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Editar Requisito' : 'Novo Requisito'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Título"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            error={!!formErrors.titulo}
            helperText={formErrors.titulo}
            fullWidth
            autoFocus
            placeholder="Ex.: O sistema deve permitir login via SSO"
          />
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select label="Tipo" value={form.tipoRequisito} onChange={(e) => setForm((f) => ({ ...f, tipoRequisito: e.target.value as TipoRequisito }))}>
              <MenuItem value="FUNCIONAL">Funcional</MenuItem>
              <MenuItem value="NAO_FUNCIONAL">Não Funcional</MenuItem>
              <MenuItem value="REGRA_NEGOCIO">Negócio</MenuItem>
              <MenuItem value="TECNICO">Técnico</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Prioridade</InputLabel>
            <Select
              label="Prioridade"
              value={form.prioridadeId}
              onChange={(e) => setForm((f) => ({ ...f, prioridadeId: e.target.value }))}
            >
              {prioridades
                .slice()
                .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                .map((p) => {
                  const colors = PRIORIDADE_COLORS[p.codigo] ?? { bg: '#F3F4F6', color: '#374151', border: '#37415144' };
                  return (
                    <MenuItem key={p.id} value={p.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FlagIcon sx={{ fontSize: 14, color: colors.color }} />
                        {p.nome}
                      </Box>
                    </MenuItem>
                  );
                })}
            </Select>
          </FormControl>
          <TextField
            label="Descrição"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={!!formErrors.descricao}
            helperText={formErrors.descricao}
            fullWidth
            multiline
            rows={4}
            placeholder="Descreva o requisito em detalhes..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit" size="small" disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={saving}>
            {saving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar Requisito'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir requisito"
        message={`Deseja excluir "${deleteTarget?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}