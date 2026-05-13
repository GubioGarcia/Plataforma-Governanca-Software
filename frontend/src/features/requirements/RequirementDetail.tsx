import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FlagIcon from '@mui/icons-material/Flag';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { CommentSection } from '../comments';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  buscarRequisitoPorId,
  listarCriteriosPorRequisito,
  criarCriterioAceite,
  atualizarCriterioAceite,
  deletarCriterioAceite,
  listarStatusRequisito,
  listarPrioridades,
  atualizarRequisito,
} from '../../services/requirementService';
import type { RequisitoAPI, CriterioAceiteAPI, StatusRequisitoAPI, PrioridadeAPI, TipoRequisito } from '../../types/requirementAPI';

const TIPO_LABELS: Record<string, string> = {
  FUNCIONAL: 'Funcional',
  NAO_FUNCIONAL: 'Não Funcional',
  REGRA_NEGOCIO: 'Negócio',
  TECNICO: 'Técnico',
};

const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  FUNCIONAL:     { bg: '#EFF6FF', color: '#3B82F6' },
  NAO_FUNCIONAL: { bg: '#FDF4FF', color: '#9333EA' },
  REGRA_NEGOCIO: { bg: '#FFF7ED', color: '#EA580C' },
  TECNICO:       { bg: '#F0FDF4', color: '#16A34A' },
};

const PRIORIDADE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  BAIXA:   { bg: '#F0FDF4', color: '#16A34A', border: '#16A34A44' },
  MEDIA:   { bg: '#FFFBEB', color: '#D97706', border: '#D9770644' },
  ALTA:    { bg: '#FFF7ED', color: '#EA580C', border: '#EA580C44' },
  CRITICA: { bg: '#FEF2F2', color: '#DC2626', border: '#DC262644' },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const EMPTY_CRITERIO = { nome: '', descricao: '' };

export default function RequirementDetail() {
  const { orgId, projectId, requirementId } = useParams<{
    orgId: string;
    projectId: string;
    requirementId: string;
  }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();

  const [requisito, setRequisito] = useState<RequisitoAPI | null>(null);
  const [criterios, setCriterios] = useState<CriterioAceiteAPI[]>([]);
  const [statusList, setStatusList] = useState<StatusRequisitoAPI[]>([]);
  const [prioridades, setPrioridades] = useState<PrioridadeAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Criterio form
  const [formOpen, setFormOpen] = useState(false);
  const [editingCriterioId, setEditingCriterioId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CRITERIO);
  const [formErrors, setFormErrors] = useState<typeof EMPTY_CRITERIO>({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  // Settings dialog
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    titulo: '',
    descricao: '',
    tipoRequisito: 'FUNCIONAL' as TipoRequisito,
    statusId: '',
    prioridadeId: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<CriterioAceiteAPI | null>(null);

  const load = useCallback(async () => {
    if (!requirementId) return;
    try {
      setLoading(true);
      setError(null);
      const [req, crits, statuses, prios] = await Promise.all([
        buscarRequisitoPorId(requirementId),
        listarCriteriosPorRequisito(requirementId),
        listarStatusRequisito(),
        listarPrioridades(),
      ]);
      setRequisito(req);
      setCriterios(crits);
      setStatusList(statuses);
      setPrioridades(prios);
    } catch {
      setError('Não foi possível carregar o requisito.');
    } finally {
      setLoading(false);
    }
  }, [requirementId]);

  useEffect(() => { load(); }, [load]);

  function openSettings() {
    if (!requisito) return;
    setSettingsForm({
      titulo: requisito.titulo,
      descricao: requisito.descricao,
      tipoRequisito: requisito.tipoRequisito,
      statusId: requisito.statusId ?? '',
      prioridadeId: requisito.prioridadeId ?? '',
    });
    setSettingsOpen(true);
  }

  async function handleSaveSettings() {
    if (!requirementId) return;
    setSavingSettings(true);
    try {
      const payload: Record<string, unknown> = {};
      if (settingsForm.titulo.trim()) payload.titulo = settingsForm.titulo.trim();
      if (settingsForm.descricao.trim()) payload.descricao = settingsForm.descricao.trim();
      if (settingsForm.tipoRequisito) payload.tipoRequisito = settingsForm.tipoRequisito;
      if (settingsForm.statusId) payload.statusId = settingsForm.statusId;
      if (settingsForm.prioridadeId) payload.prioridadeId = settingsForm.prioridadeId;

      const updated = await atualizarRequisito(requirementId, payload);
      setRequisito(updated);
      setSettingsOpen(false);
      notify('Requisito atualizado com sucesso', 'success');
    } catch {
      notify('Erro ao atualizar requisito', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  function openCreate() {
    setEditingCriterioId(null);
    setForm(EMPTY_CRITERIO);
    setFormErrors({ nome: '', descricao: '' });
    setFormOpen(true);
  }

  function openEdit(c: CriterioAceiteAPI) {
    setEditingCriterioId(c.id);
    setForm({ nome: c.nome, descricao: c.descricao });
    setFormErrors({ nome: '', descricao: '' });
    setFormOpen(true);
  }

  async function handleSave() {
    const errs = { nome: '', descricao: '' };
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório';
    if (!form.descricao.trim()) errs.descricao = 'Descrição obrigatória';
    if (errs.nome || errs.descricao) { setFormErrors(errs); return; }

    if (!requirementId) return;
    setSaving(true);
    try {
      if (editingCriterioId) {
        const updated = await atualizarCriterioAceite(editingCriterioId, form);
        setCriterios((prev) => prev.map((c) => (c.id === editingCriterioId ? updated : c)));
        notify('Critério atualizado', 'success');
      } else {
        const novo = await criarCriterioAceite(requirementId, form);
        setCriterios((prev) => [...prev, novo]);
        notify('Critério criado com sucesso', 'success');
      }
      setFormOpen(false);
    } catch {
      notify('Erro ao salvar critério de aceite', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletarCriterioAceite(deleteTarget.id);
      setCriterios((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      notify('Critério excluído', 'info');
    } catch {
      notify('Erro ao excluir critério', 'error');
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !requisito) {
    return (
      <Box sx={{ p: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Typography color="error">{error ?? 'Requisito não encontrado.'}</Typography>
      </Box>
    );
  }

  const tipoLabel = TIPO_LABELS[requisito.tipoRequisito] ?? requisito.tipoRequisito;
  const tipoColor = TIPO_COLORS[requisito.tipoRequisito] ?? { bg: '#F3F4F6', color: '#374151' };
  const prioridadeInfo = prioridades.find((p) => p.id === requisito.prioridadeId);
  const prioColors = prioridadeInfo
    ? (PRIORIDADE_COLORS[prioridadeInfo.codigo] ?? { bg: '#F3F4F6', color: '#374151', border: '#37415144' })
    : null;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Back */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/organizations/${orgId}/projects/${projectId}/requirements`)}
        sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}
      >
        Voltar
      </Button>

      {/* ── Main 70/30 layout ── */}
      <Grid container spacing={3} alignItems="flex-start">

        {/* ── Left: requisito info ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card
            variant="outlined"
            sx={{ borderRadius: 3, mb: 3, position: 'relative', overflow: 'visible' }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Top meta row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11 }}>
                    {requisito.codigo ?? 'REQ-???'}
                  </Typography>
                </Box>
                <Chip
                  label={tipoLabel}
                  size="small"
                  sx={{ bgcolor: tipoColor.bg, color: tipoColor.color, fontWeight: 600, fontSize: 11, height: 22 }}
                />
                {requisito.statusNome && (
                  <Chip
                    label={requisito.statusNome.replace(/_/g, ' ')}
                    size="small"
                    sx={{ bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 600, fontSize: 11, height: 22 }}
                  />
                )}
                {prioridadeInfo && prioColors && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, border: '1px solid', borderColor: prioColors.border, bgcolor: prioColors.bg, borderRadius: 1, px: 0.75, py: 0.25 }}>
                    <FlagIcon sx={{ fontSize: 12, color: prioColors.color }} />
                    <Typography variant="caption" sx={{ color: prioColors.color, fontWeight: 600, fontSize: 11 }}>
                      {prioridadeInfo.nome}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ ml: 'auto' }}>
                  <Tooltip title="Configurações — editar status, tipo, prioridade, título e descrição">
                    <IconButton size="small" onClick={openSettings}>
                      <EditIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Title */}
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                {requisito.titulo}
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.7 }}>
                {requisito.descricao}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {/* Footer meta */}
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {requisito.criadoPorNome && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <PersonIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Criado por <strong>{requisito.criadoPorNome}</strong>
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Atualizado{' '}
                    {requisito.dataAtualizacao
                      ? (() => {
                          const dias = Math.floor(
                            (Date.now() - new Date(requisito.dataAtualizacao).getTime()) /
                              86400000,
                          );
                          return dias === 0 ? 'hoje' : `há ${dias} dia${dias > 1 ? 's' : ''}`;
                        })()
                      : '—'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* ── Critérios de Aceite ── */}
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Critérios de Aceitação
                  </Typography>
                  {criterios.length > 0 && (
                    <Box
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {criterios.length}
                    </Box>
                  )}
                </Box>
                <Tooltip title="Adicionar critério">
                  <IconButton size="small" onClick={openCreate}>
                    <AddIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {criterios.length === 0 ? (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 4,
                    border: '1.5px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <CheckBoxOutlineBlankIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Nenhum critério de aceite cadastrado.
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={openCreate}>
                    Adicionar critério
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {criterios.map((c) => (
                    <Box
                      key={c.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                        '&:hover': { borderColor: 'primary.light', bgcolor: 'primary.50' },
                        transition: 'all 0.12s',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                          <CheckBoxIcon sx={{ fontSize: 18, color: 'success.main', mt: 0.2, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
                            {c.nome}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => openEdit(c)}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(c)}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', pl: 3.25, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
                      >
                        {c.descricao}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, pl: 3.25 }}>
                        {c.criadoPorNome && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {c.criadoPorNome}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                            {formatDate(c.dataAtualizacao)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={openCreate}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Novo critério
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* ── Comentários ── */}
          <Card variant="outlined" sx={{ borderRadius: 3, mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <CommentSection
                entidadeTipo="REQUISITO"
                entidadeId={requirementId!}
                projetoId={projectId!}
                organizacaoId={orgId!}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right sidebar ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Informações */}
          <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Informações
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <InfoRow label="Criado em" value={formatDate(requisito.dataCriacao)} />
              <InfoRow label="Última atualização" value={formatDateTime(requisito.dataAtualizacao)} />
              {requisito.criadoPorNome && (
                <InfoRow label="Criado por" value={requisito.criadoPorNome} />
              )}
              {requisito.solicitadoPorNome && (
                <InfoRow label="Solicitado por" value={requisito.solicitadoPorNome} />
              )}
              {requisito.aprovadoPorNome && (
                <InfoRow label="Aprovado por" value={requisito.aprovadoPorNome} />
              )}
              {requisito.dataAprovacao && (
                <InfoRow label="Data de aprovação" value={formatDate(requisito.dataAprovacao)} />
              )}
            </CardContent>
          </Card>

          {/* Alterações / Versão */}
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Alterações
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  bgcolor: 'background.default',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    Nome
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Versão atual:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    v{requisito.versao ?? 1}.0
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Settings Dialog ── */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon fontSize="small" />
          Configurações do Requisito
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Título"
            value={settingsForm.titulo}
            onChange={(e) => setSettingsForm((f) => ({ ...f, titulo: e.target.value }))}
            fullWidth
            size="small"
          />
          <TextField
            label="Descrição"
            value={settingsForm.descricao}
            onChange={(e) => setSettingsForm((f) => ({ ...f, descricao: e.target.value }))}
            fullWidth
            size="small"
            multiline
            rows={3}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Tipo</InputLabel>
            <Select
              label="Tipo"
              value={settingsForm.tipoRequisito}
              onChange={(e) => setSettingsForm((f) => ({ ...f, tipoRequisito: e.target.value as TipoRequisito }))}
            >
              <MenuItem value="FUNCIONAL">Funcional</MenuItem>
              <MenuItem value="NAO_FUNCIONAL">Não Funcional</MenuItem>
              <MenuItem value="REGRA_NEGOCIO">Negócio</MenuItem>
              <MenuItem value="TECNICO">Técnico</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={settingsForm.statusId}
              onChange={(e) => setSettingsForm((f) => ({ ...f, statusId: e.target.value }))}
            >
              {statusList.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.nome.replace(/_/g, ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Prioridade</InputLabel>
            <Select
              label="Prioridade"
              value={settingsForm.prioridadeId}
              onChange={(e) => setSettingsForm((f) => ({ ...f, prioridadeId: e.target.value }))}
            >
              {prioridades.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: 'text.disabled', mt: -1 }}>
            Alterações registradas em: {new Date().toLocaleString('pt-BR')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSettingsOpen(false)} color="inherit" size="small" disabled={savingSettings}>
            Cancelar
          </Button>
          <Button onClick={handleSaveSettings} variant="contained" size="small" disabled={savingSettings}>
            {savingSettings ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Criterio Form Dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCriterioId ? 'Editar Critério de Aceite' : 'Novo Critério de Aceite'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '16px !important' }}>
          <TextField
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            error={!!formErrors.nome}
            helperText={formErrors.nome}
            fullWidth
            autoFocus
            placeholder="Ex.: Login bem-sucedido com credenciais válidas"
          />
          <TextField
            label="Descrição / Cenário"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            error={!!formErrors.descricao}
            helperText={formErrors.descricao}
            fullWidth
            multiline
            rows={5}
            placeholder={`Dado que...\nQuando...\nEntão...`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)} color="inherit" size="small" disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={saving}>
            {saving ? 'Salvando...' : editingCriterioId ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir critério de aceite"
        message={`Deseja excluir o critério "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <CalendarTodayIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 11 }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ pl: 2.5, fontWeight: 500 }}>
        {value}
      </Typography>
    </Box>
  );
}
