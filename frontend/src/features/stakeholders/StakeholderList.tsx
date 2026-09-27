import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CloseIcon from '@mui/icons-material/Close';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { buscarResumoPorProjeto } from '../../services/interacaoService';
import { isApiError } from '../../services/userService';
import {
  cancelarConvite,
  convidarParaProjeto,
  listarConvitesProjeto,
  listarParticipantesProjeto,
  promoverNoProjeto,
  removerDoProjeto,
  type Convite,
  type Participante,
  type PapelConvite,
} from '../../services/acessoService';
import type { ResumoInteracaoUsuario } from '../../types/interacao';
import { PAPEL_PROJETO_LABEL, type PapelNoProjeto } from '../../types/acesso';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#3F51B5', '#059669', '#7C3AED', '#D97706',
  '#0891B2', '#DC2626', '#065F46', '#92400E',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function mensagemErro(err: unknown, padrao: string) {
  return isApiError(err) ? err.response?.data?.detail ?? padrao : padrao;
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #E8EAED', height: '100%' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography sx={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, mb: 0.5 }}>
          {value.toLocaleString('pt-BR')}
        </Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}

// ─── Engagement row ───────────────────────────────────────────────────────────

function EngRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>{value}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={max > 0 ? Math.round((value / max) * 100) : 0}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: '#F0F0F0',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

// ─── Membro = participante + engajamento ─────────────────────────────────────

interface Membro {
  participante: Participante;
  interacoes: ResumoInteracaoUsuario | null;
}

const PAPEIS_GESTAO = ['DONO', 'GESTOR'];

// ─── Main component ───────────────────────────────────────────────────────────

export default function StakeholderList() {
  const { projectId } = useParams<{ projectId: string }>();
  const { notify } = useSnackbar();
  const { pode } = usePermissions();

  const [membros, setMembros]           = useState<Membro[]>([]);
  const [convites, setConvites]         = useState<Convite[]>([]);
  const [totalInteracoes, setTotal]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');

  // Convite
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [email, setEmail]               = useState('');
  const [papel, setPapel]               = useState<PapelConvite>('STAKEHOLDER');
  const [saving, setSaving]             = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);

  // Remoção
  const [removerAlvo, setRemoverAlvo]   = useState<Participante | null>(null);

  const podeConvidar = pode('PROJETO_INVITE_USER');
  const podePromover = pode('PROJETO_PROMOTE_USER');
  const podeRemover  = pode('PROJETO_REMOVE_USER');

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [participantes, resumo, pendentes] = await Promise.all([
        listarParticipantesProjeto(projectId),
        buscarResumoPorProjeto(projectId).catch(() => null),
        podeConvidar ? listarConvitesProjeto(projectId).catch(() => []) : Promise.resolve([]),
      ]);
      const porUsuario = new Map((resumo?.porUsuario ?? []).map((r) => [r.usuarioId, r]));
      setMembros(participantes.map((p) => ({ participante: p, interacoes: porUsuario.get(p.usuarioId) ?? null })));
      setTotal(resumo?.totalInteracoes ?? 0);
      setConvites(pendentes);
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao carregar os participantes do projeto'), 'error');
    } finally {
      setLoading(false);
    }
  }, [projectId, podeConvidar, notify]);

  useEffect(() => { load(); }, [load]);

  const filtered = membros.filter(({ participante: p }) => {
    const q = search.toLowerCase();
    return !q || p.nome.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

  const totalMembros = membros.length;
  const media = totalMembros > 0 ? Math.round(totalInteracoes / totalMembros) : 0;

  const n = (m: Membro, campo: keyof ResumoInteracaoUsuario) => Number(m.interacoes?.[campo] ?? 0);
  const maxWiki = Math.max(...membros.map((m) => n(m, 'interacoesWiki')), 1);
  const maxReq  = Math.max(...membros.map((m) => n(m, 'interacoesRequisito')), 1);
  const maxCom  = Math.max(...membros.map((m) => n(m, 'interacoesComentario')), 1);

  // ── Ações ────────────────────────────────────────────────────────────────────

  function openConvite() {
    setEmail('');
    setPapel('STAKEHOLDER');
    setApiError(null);
    setDialogOpen(true);
  }

  async function handleConvidar() {
    if (!projectId) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setApiError('Informe um e-mail válido.');
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      await convidarParaProjeto(projectId, email.trim(), papel);
      notify('Convite enviado. A pessoa verá o convite ao entrar na plataforma.', 'success');
      setDialogOpen(false);
      load();
    } catch (err) {
      setApiError(mensagemErro(err, 'Erro ao enviar o convite.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelarConvite(id: string) {
    try {
      await cancelarConvite(id);
      notify('Convite cancelado', 'info');
      load();
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao cancelar o convite'), 'error');
    }
  }

  async function handlePromover(p: Participante) {
    if (!projectId) return;
    try {
      await promoverNoProjeto(projectId, p.usuarioId);
      notify(`${p.nome} agora é Gestor do projeto`, 'success');
      load();
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao promover participante'), 'error');
    }
  }

  async function handleRemover() {
    if (!projectId || !removerAlvo) return;
    try {
      await removerDoProjeto(projectId, removerAlvo.usuarioId);
      notify(`${removerAlvo.nome} foi removido do projeto`, 'info');
      load();
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao remover participante'), 'error');
    } finally {
      setRemoverAlvo(null);
    }
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Stakeholders</Typography>
          <Typography variant="body2" color="text.secondary">
            Participantes do projeto e seus papéis
          </Typography>
        </Box>
        {podeConvidar && (
          <Button variant="contained" startIcon={<PersonAddIcon />} size="small" onClick={openConvite}>
            Convidar
          </Button>
        )}
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={totalMembros}    label="Participantes"       color="#3F51B5" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={totalInteracoes} label="Total de interações" color="#059669" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={media}           label="Média por participante" color="#D97706" />
        </Grid>
      </Grid>

      {/* Convites pendentes */}
      {podeConvidar && convites.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid #E8EAED', mb: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Convites pendentes</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {convites.map((c) => (
                <Chip
                  key={c.id}
                  label={`${c.email} · ${c.papel === 'GESTOR' ? 'Gestor' : 'Stakeholder'}`}
                  onDelete={() => handleCancelarConvite(c.id)}
                  deleteIcon={<Tooltip title="Cancelar convite"><CloseIcon /></Tooltip>}
                  size="small"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar por nome ou e-mail..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<PeopleIcon sx={{ fontSize: 64 }} />}
          title="Nenhum participante encontrado"
          description={membros.length === 0 ? 'Este projeto ainda não tem participantes.' : 'Nenhum participante corresponde à busca.'}
        />
      )}

      {!loading && filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map((m) => {
            const p = m.participante;
            const color = avatarColor(p.nome);
            const papeis = p.vinculos.map((v) => v.papel);
            const ehGestao = papeis.some((x) => PAPEIS_GESTAO.includes(x));
            const diretoNoProjeto = p.vinculos.some((v) => v.origem === 'PROJETO' && v.papel !== 'DONO');
            return (
              <Grid key={p.usuarioId} size={{ xs: 12, md: 6 }}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid #E8EAED',
                    height: '100%',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      {p.urlMidiaPerfil ? (
                        <Avatar src={p.urlMidiaPerfil} sx={{ width: 44, height: 44 }} />
                      ) : (
                        <Avatar sx={{ bgcolor: color, width: 44, height: 44, fontWeight: 700, fontSize: 15 }}>
                          {initials(p.nome)}
                        </Avatar>
                      )}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.2 }}>{p.nome}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {p.email}
                          </Typography>
                        </Box>
                      </Box>

                      {podePromover && !ehGestao && (
                        <Tooltip title="Elevar a Gestor do projeto">
                          <IconButton size="small" onClick={() => handlePromover(p)}><UpgradeIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                      {podeRemover && diretoNoProjeto && (
                        <Tooltip title="Remover do projeto">
                          <IconButton size="small" color="error" onClick={() => setRemoverAlvo(p)}>
                            <PersonRemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>

                    {/* Papéis: herdados da organização ou diretos no projeto */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {p.vinculos.map((v) => (
                        <Tooltip key={`${v.papel}-${v.origem}`} title={v.origem === 'ORGANIZACAO' ? 'Herdado da organização' : 'Direto no projeto'}>
                          <Chip
                            size="small"
                            variant={v.origem === 'ORGANIZACAO' ? 'outlined' : 'filled'}
                            label={PAPEL_PROJETO_LABEL[v.papel as PapelNoProjeto] ?? v.papel}
                            sx={{ fontSize: 11, height: 22 }}
                          />
                        </Tooltip>
                      ))}
                      <Chip
                        label={`${n(m, 'totalInteracoes')} interações`}
                        size="small"
                        sx={{ fontWeight: 600, bgcolor: '#F3F4F6', fontSize: 11, height: 22 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <EngRow label="Interações WIKI"        value={n(m, 'interacoesWiki')}      max={maxWiki} color="#3F51B5" />
                      <EngRow label="Interações Requisitos"  value={n(m, 'interacoesRequisito')} max={maxReq}  color="#7C3AED" />
                      {n(m, 'interacoesComentario') > 0 && (
                        <EngRow label="Interações Comentários" value={n(m, 'interacoesComentario')} max={maxCom} color="#059669" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Dialog: Convidar ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ color: 'primary.main' }} />
          Convidar para o projeto
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            A pessoa verá o convite ao entrar na plataforma com este e-mail (quem ainda não tem conta
            se cadastra com o mesmo e-mail). O acesso vale só para este projeto.
          </Typography>

          <TextField
            label="E-mail"
            type="email"
            size="small"
            fullWidth
            autoFocus
            value={email}
            onChange={(e) => { setEmail(e.target.value); setApiError(null); }}
          />

          <TextField
            select
            label="Papel"
            size="small"
            fullWidth
            value={papel}
            onChange={(e) => setPapel(e.target.value as PapelConvite)}
          >
            <MenuItem value="STAKEHOLDER">Stakeholder (técnico e cliente)</MenuItem>
            {podePromover && <MenuItem value="GESTOR">Gestor do projeto</MenuItem>}
          </TextField>

          {apiError && (
            <Box sx={{ bgcolor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 1, px: 2, py: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 500 }}>{apiError}</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" size="small" disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConvidar}
            variant="contained"
            size="small"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}
          >
            {saving ? 'Enviando...' : 'Convidar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removerAlvo)}
        title="Remover do projeto"
        message={`Remover ${removerAlvo?.nome ?? ''} deste projeto? Ele perde o acesso na próxima ação.`}
        confirmLabel="Remover"
        onConfirm={handleRemover}
        onCancel={() => setRemoverAlvo(null)}
      />
    </Box>
  );
}
