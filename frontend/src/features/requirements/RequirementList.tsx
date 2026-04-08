import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import TablePagination from '@mui/material/TablePagination';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import StatusChip from '../../components/common/StatusChip';
import CommentThread from './CommentThread';
import ValidationBar from '../wiki/ValidationBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { mockRequirements } from '../../mocks/requirements';
import { mockComments } from '../../mocks/comments';
import type { Requisito, StatusRequisito, TipoRequisito } from '../../types/requirement';
import type { Comentario } from '../../types/comment';
import { usePermissions } from '../../hooks/usePermissions';
import { useSnackbar } from '../../context/SnackbarContext';

const DETAIL_WIDTH = 420;

const STATUS_ORDER: StatusRequisito[] = ['RASCUNHO', 'EM_ANALISE', 'EM_VALIDACAO', 'APROVADO', 'REPROVADO', 'VALIDADO'];

const EMPTY_FORM = { titulo: '', descricao: '', tipo: 'FUNCIONAL' as TipoRequisito };
type ReqForm = typeof EMPTY_FORM;

export default function RequirementList() {
  const { projectId } = useParams();
  const { canEdit, canSendToValidation, canVote, canValidateFinal, user } = usePermissions();
  const { notify } = useSnackbar();

  const [requirements, setRequirements] = useState<Requisito[]>(
    mockRequirements.filter((r) => r.projetoId === Number(projectId))
  );
  const [comments, setComments] = useState<Record<number, Comentario[]>>(mockComments);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [historyReq, setHistoryReq] = useState<Requisito | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusRequisito | 'ALL'>('ALL');
  const [tipoFilter, setTipoFilter] = useState<TipoRequisito | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const selected = requirements.find((r) => r.id === selectedId) ?? null;
  const selectedComments = selectedId ? (comments[selectedId] ?? []) : [];

  const filtered = requirements.filter((r) => {
    const matchSearch =
      r.titulo.toLowerCase().includes(search.toLowerCase()) ||
      r.descricao.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchTipo = tipoFilter === 'ALL' || r.tipo === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });
  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Summary counts
  const totalByStatus = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = requirements.filter((r) => r.status === s).length;
    return acc;
  }, {});

  // Comments
  const handleAddComment = (text: string) => {
    if (!selectedId || !user) return;
    const newComment: Comentario = {
      id: Date.now(),
      texto: text,
      userId: user.id,
      userName: user.nome,
      requisitoId: selectedId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setComments((prev) => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), newComment] }));
  };

  const updateRequisito = (updated: Partial<Requisito>) => {
    setRequirements((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...updated } : r)));
  };

  const handleMoveToAnalysis = () => { updateRequisito({ status: 'EM_ANALISE' }); notify('Requisito movido para Análise'); };
  const handleSendToValidation = () => { updateRequisito({ status: 'EM_VALIDACAO' }); notify('Requisito enviado para Validação'); };
  const handleValidate = () => { updateRequisito({ status: 'VALIDADO' }); notify('Requisito validado!', 'success'); };

  const handleVote = (voto: 'APROVADO' | 'REPROVADO') => {
    if (!selected || !user) return;
    const newVotos = (selected.votos ?? []).map((v) =>
      v.userId === user.id ? { ...v, voto, votadoEm: new Date().toISOString() } : v
    );
    const aprovados = newVotos.filter((v) => v.voto === 'APROVADO').length;
    const total = selected.totalStakeholders ?? 0;
    const newStatus: StatusRequisito = aprovados >= Math.ceil(total / 2) ? 'APROVADO' : selected.status;
    updateRequisito({ votos: newVotos, status: newStatus });
  };

  const handleDeleteComment = (id: number) => {
    if (!selectedId) return;
    setComments((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? []).filter((c) => c.id !== id),
    }));
  };

  // ── Create / Edit dialog ──────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ReqForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<ReqForm>>({});

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  }

  function openEdit(r: Requisito, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(r.id ?? null);
    setForm({ titulo: r.titulo, descricao: r.descricao, tipo: r.tipo });
    setFormErrors({});
    setFormOpen(true);
  }

  function handleSaveForm() {
    const e: Partial<ReqForm> = {};
    if (!form.titulo.trim()) e.titulo = 'Título obrigatório';
    if (!form.descricao.trim()) e.descricao = 'Descrição obrigatória';
    if (Object.keys(e).length) { setFormErrors(e); return; }

    if (editingId !== null) {
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, titulo: form.titulo.trim(), descricao: form.descricao.trim(), tipo: form.tipo, updatedAt: new Date().toISOString() }
            : r
        )
      );
    } else {
      const nextId = Math.max(0, ...requirements.map((r) => r.id ?? 0)) + 1;
      const nextNum = requirements.length + 1;
      const novo: Requisito = {
        id: nextId,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        tipo: form.tipo,
        status: 'RASCUNHO',
        versao: `v${nextNum}.0`,
        projetoId: Number(projectId),
        totalComentarios: 0,
        votos: [],
        totalStakeholders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRequirements((prev) => [...prev, novo]);
    }
    setFormOpen(false);
    notify(editingId !== null ? 'Requisito atualizado' : 'Requisito criado com sucesso');
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Requisito | null>(null);

  function openDelete(r: Requisito, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteTarget(r);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setRequirements((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
    notify('Requisito excluído', 'info');
  }

  const userVoto = selected?.votos?.find((v) => v.userId === user?.id);
  const jaVotou = Boolean(userVoto?.voto);
  const responderam = selected?.votos?.filter((v) => v.voto !== null).length ?? 0;
  const totalStake = selected?.totalStakeholders ?? 0;
  const participacao = totalStake > 0 ? Math.round((responderam / totalStake) * 100) : 0;

  const panelOpen = Boolean(selected);
  const listCols = panelOpen ? '60px 1fr 120px 88px' : '60px 1fr 120px 130px 64px 88px';
  const listHeaders = panelOpen ? ['ID', 'Título', 'Status', 'Ações'] : ['ID', 'Título', 'Tipo', 'Status', 'Versão', 'Ações'];

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
    {/* ── Left: list ── */}
    <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Requisitos</Typography>
          <Typography variant="body2">Lista de requisitos do projeto com fluxo de aprovação</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={openCreate}>
          Novo Requisito
        </Button>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {([
          { label: 'Total',        value: requirements.length,                filter: 'ALL',           color: '#374151' },
          { label: 'Rascunho',     value: totalByStatus['RASCUNHO'] ?? 0,     filter: 'RASCUNHO',      color: '#6B7280' },
          { label: 'Em Análise',   value: totalByStatus['EM_ANALISE'] ?? 0,   filter: 'EM_ANALISE',    color: '#3B82F6' },
          { label: 'Em Validação', value: totalByStatus['EM_VALIDACAO'] ?? 0, filter: 'EM_VALIDACAO',  color: '#D97706' },
          { label: 'Aprovado',     value: totalByStatus['APROVADO'] ?? 0,     filter: 'APROVADO',      color: '#059669' },
          { label: 'Validado',     value: totalByStatus['VALIDADO'] ?? 0,     filter: 'VALIDADO',      color: '#7C3AED' },
        ] as const).map((s) => {
          const isActive = statusFilter === s.filter;
          return (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={s.label}>
              <Box
                onClick={() => { setStatusFilter(s.filter as StatusRequisito | 'ALL'); setPage(0); }}
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
                <Typography variant="h5" sx={{ fontWeight: 700, color: s.color, mb: 0.25 }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>{s.label}</Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar por título ou descrição..."
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
          <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusRequisito | 'ALL'); setPage(0); }}>
            <MenuItem value="ALL">Todos os status</MenuItem>
            <MenuItem value="RASCUNHO">Rascunho</MenuItem>
            <MenuItem value="EM_ANALISE">Em Análise</MenuItem>
            <MenuItem value="EM_VALIDACAO">Em Validação</MenuItem>
            <MenuItem value="APROVADO">Aprovado</MenuItem>
            <MenuItem value="REPROVADO">Reprovado</MenuItem>
            <MenuItem value="VALIDADO">Validado</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select label="Tipo" value={tipoFilter} onChange={(e) => { setTipoFilter(e.target.value as TipoRequisito | 'ALL'); setPage(0); }}>
            <MenuItem value="ALL">Todos os tipos</MenuItem>
            <MenuItem value="FUNCIONAL">Funcional</MenuItem>
            <MenuItem value="NAO_FUNCIONAL">Não-Funcional</MenuItem>
          </Select>
        </FormControl>
        {(statusFilter !== 'ALL' || tipoFilter !== 'ALL' || search) && (
          <Button size="small" color="inherit" onClick={() => { setStatusFilter('ALL'); setTipoFilter('ALL'); setSearch(''); setPage(0); }}>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Table header — adaptive */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: listCols,
              px: 2,
              py: 0.75,
              bgcolor: 'background.default',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {listHeaders.map((h) => (
              <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {h}
              </Typography>
            ))}
          </Box>

          {paginated.map((r) => (
            <Box
              key={r.id}
              onClick={() => setSelectedId(selectedId === r.id ? null : (r.id ?? null))}
              sx={{
                display: 'grid',
                gridTemplateColumns: listCols,
                alignItems: 'center',
                px: 2,
                py: 1.25,
                border: selectedId === r.id ? '1.5px solid' : '1px solid',
                borderColor: selectedId === r.id ? 'primary.main' : 'divider',
                borderRadius: 1.5,
                bgcolor: selectedId === r.id ? 'primary.main' : 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: selectedId === r.id ? 'primary.main' : 'background.default',
                  borderColor: selectedId === r.id ? 'primary.main' : 'divider',
                },
                transition: 'all 0.12s',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: selectedId === r.id ? 'primary.contrastText' : 'text.disabled' }}>
                #{r.id}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, color: selectedId === r.id ? 'primary.contrastText' : 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.titulo}</Typography>
                {!panelOpen && (
                  <Typography variant="caption" sx={{ color: selectedId === r.id ? 'rgba(255,255,255,0.7)' : 'text.disabled', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.descricao}
                  </Typography>
                )}
              </Box>
              {!panelOpen && (
                <Chip
                  label={r.tipo === 'FUNCIONAL' ? 'Funcional' : 'Não-Funcional'}
                  size="small"
                  sx={{
                    bgcolor: r.tipo === 'FUNCIONAL' ? '#EFF6FF' : '#FDF4FF',
                    color: r.tipo === 'FUNCIONAL' ? '#3B82F6' : '#9333EA',
                    fontWeight: 600,
                    fontSize: 11,
                    height: 22,
                    width: 'fit-content',
                  }}
                />
              )}
              <StatusChip status={r.status} />
              {!panelOpen && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{r.versao}</Typography>
              )}
              <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={(e) => openEdit(r, e)} sx={{ color: selectedId === r.id ? 'rgba(255,255,255,0.8)' : undefined }}>
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton size="small" color={selectedId === r.id ? 'inherit' : 'error'} sx={{ color: selectedId === r.id ? 'rgba(255,255,255,0.8)' : undefined }} onClick={(e) => openDelete(r, e)}>
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {filtered.length} de {requirements.length} requisito{requirements.length !== 1 ? 's' : ''}{!panelOpen && ' — clique em uma linha para ver detalhes'}
        </Typography>
        {filtered.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_e, newPage) => setPage(newPage)}
            rowsPerPageOptions={[5, 10, 25]}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{ p: 0, '& .MuiTablePagination-toolbar': { minHeight: 36, p: 0 }, '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '12px' } }}
          />
        )}
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId !== null ? 'Editar Requisito' : 'Novo Requisito'}</DialogTitle>
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
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as TipoRequisito }))}
            >
              <MenuItem value="FUNCIONAL">Funcional</MenuItem>
              <MenuItem value="NAO_FUNCIONAL">Não-Funcional</MenuItem>
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
          <Button onClick={() => setFormOpen(false)} color="inherit" size="small">Cancelar</Button>
          <Button onClick={handleSaveForm} variant="contained" size="small">
            {editingId !== null ? 'Salvar' : 'Criar Requisito'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir requisito"
        message={`Deseja excluir "${deleteTarget?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* History Dialog */}
      <Dialog open={historyReq !== null} onClose={() => setHistoryReq(null)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}
        >
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.3 }}>Histórico de Versões</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{historyReq?.titulo}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setHistoryReq(null)} sx={{ mt: -0.5, mr: -0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {(!historyReq?.historico || historyReq.historico.length === 0) ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
              Nenhum histórico disponível para este requisito.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {historyReq.historico.slice().reverse().map((v, i, arr) => (
                <Box key={v.versao} sx={{ display: 'flex', gap: 2 }}>
                  {/* Timeline indicator */}
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }}
                  >
                    <Box
                      sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: i === 0 ? 'primary.main' : 'background.default',
                        border: '2px solid',
                        borderColor: i === 0 ? 'primary.main' : 'divider',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: i === 0 ? 'primary.contrastText' : 'text.secondary', fontSize: 9, lineHeight: 1 }}
                      >
                        {v.versao}
                      </Typography>
                    </Box>
                    {i < arr.length - 1 && (
                      <Box sx={{ width: 2, flex: 1, minHeight: 16, bgcolor: 'divider', my: 0.5 }} />
                    )}
                  </Box>
                  {/* Content */}
                  <Box sx={{ flex: 1, pb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{v.versao}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                        {new Date(v.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>por {v.changedBy}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, lineHeight: 1.7 }}>
                      {v.descricaoMudanca}
                    </Typography>
                    {v.statusAnterior && v.statusNovo && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusChip status={v.statusAnterior} />
                        <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <StatusChip status={v.statusNovo} />
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHistoryReq(null)} color="inherit" size="small">Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>{/* end left column */}

    {/* ── Right: detail panel (inline, sem overlay) ── */}
    {selected && (
      <Box
        sx={{
          width: DETAIL_WIDTH,
          flexShrink: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Panel header — sticky */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            bgcolor: 'background.paper',
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, bgcolor: 'background.default', px: 1, py: 0.25, borderRadius: 0.5 }}>
                REQ #{selected.id}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{selected.versao}</Typography>
            </Box>
            <Typography variant="h6" sx={{ lineHeight: 1.4, fontWeight: 700 }}>{selected.titulo}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title="Histórico de versões">
              <IconButton size="small" onClick={() => setHistoryReq(selected)}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={(e) => openEdit(selected, e)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={(e) => openDelete(selected, e)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton onClick={() => setSelectedId(null)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Panel scrollable content */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5 }}>
              {/* Meta chips + date */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusChip status={selected.status} />
                <Chip
                  label={selected.tipo === 'FUNCIONAL' ? 'Funcional' : 'Não-Funcional'}
                  size="small"
                  sx={{
                    bgcolor: selected.tipo === 'FUNCIONAL' ? '#EFF6FF' : '#FDF4FF',
                    color: selected.tipo === 'FUNCIONAL' ? '#3B82F6' : '#9333EA',
                    fontSize: '11px',
                    height: 22,
                    fontWeight: 600,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
                  {new Date(selected.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
              </Box>

              {/* Descrição */}
              <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>Descrição</Typography>
              <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.8, color: 'text.primary' }}>{selected.descricao}</Typography>

              {/* Validation progress */}
              {(selected.status === 'EM_VALIDACAO' || selected.status === 'APROVADO' || selected.status === 'VALIDADO') && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.75 }}>Participação</Typography>
                  <ValidationBar
                    participacao={participacao}
                    totalStakeholders={totalStake}
                    responderam={responderam}
                    votos={selected.votos?.map((v) => ({ userId: v.userId, userName: v.userName, voto: v.voto, votadoEm: v.votadoEm }))}
                  />
                </Box>
              )}

              {/* Action buttons — grouped */}
              {((canEdit && selected.status === 'RASCUNHO') ||
                (canSendToValidation && ['EM_ANALISE', 'REPROVADO'].includes(selected.status)) ||
                (canVote && selected.status === 'EM_VALIDACAO') ||
                (canValidateFinal && selected.status === 'APROVADO')) && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mb: 3,
                    p: 1.5,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  {canEdit && selected.status === 'RASCUNHO' && (
                    <Button size="small" variant="outlined" color="info" onClick={handleMoveToAnalysis} sx={{ fontSize: '12px' }}>
                      Mover para Análise
                    </Button>
                  )}
                  {canSendToValidation && ['EM_ANALISE', 'REPROVADO'].includes(selected.status) && (
                    <Button size="small" variant="contained" startIcon={<SendIcon sx={{ fontSize: 13 }} />} onClick={handleSendToValidation} sx={{ fontSize: '12px' }}>
                      Enviar para Validação
                    </Button>
                  )}
                  {canVote && selected.status === 'EM_VALIDACAO' && !jaVotou && (
                    <>
                      <Button size="small" variant="outlined" color="success" startIcon={<ThumbUpIcon sx={{ fontSize: 13 }} />} onClick={() => handleVote('APROVADO')} sx={{ fontSize: '12px' }}>
                        Aprovar
                      </Button>
                      <Button size="small" variant="outlined" color="error" startIcon={<ThumbDownIcon sx={{ fontSize: 13 }} />} onClick={() => handleVote('REPROVADO')} sx={{ fontSize: '12px' }}>
                        Reprovar
                      </Button>
                    </>
                  )}
                  {jaVotou && selected.status === 'EM_VALIDACAO' && (
                    <Chip
                      label={`Seu voto: ${userVoto?.voto}`}
                      size="small"
                      sx={{
                        bgcolor: userVoto?.voto === 'APROVADO' ? '#F0FDF4' : '#FEF2F2',
                        color: userVoto?.voto === 'APROVADO' ? '#16A34A' : '#DC2626',
                        fontWeight: 600,
                        fontSize: '11px',
                      }}
                    />
                  )}
                  {canValidateFinal && selected.status === 'APROVADO' && (
                    <Button size="small" variant="contained" color="secondary" startIcon={<CheckCircleIcon sx={{ fontSize: 13 }} />} onClick={handleValidate} sx={{ fontSize: '12px' }}>
                      Validar Final
                    </Button>
                  )}
                </Box>
              )}

              <Divider sx={{ mb: 2.5 }} />

              {/* Comments */}
              <CommentThread comments={selectedComments} onAddComment={handleAddComment} onDeleteComment={handleDeleteComment} />
            </Box>
          </Box>
        )}

    </Box>
  );
}
