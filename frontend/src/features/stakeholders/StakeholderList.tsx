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
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmptyState from '../../components/common/EmptyState';
import { buscarResumoPorProjeto } from '../../services/interacaoService';
import { cadastrarUsuario, listarUsuarios, isApiError } from '../../services/userService';
import type { UsuarioBackend } from '../../services/userService';
import type { ResumoInteracaoUsuario } from '../../types/interacao';
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

// ─── Formulário de novo stakeholder ──────────────────────────────────────────

interface NovoStakeholderForm {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

const EMPTY_FORM: NovoStakeholderForm = { nome: '', email: '', senha: '', confirmarSenha: '' };

// ─── Main component ───────────────────────────────────────────────────────────

export default function StakeholderList() {
  const { projectId } = useParams<{ projectId: string }>();
  const { notify } = useSnackbar();
  const { isStakeholder } = usePermissions();

  const [membros, setMembros]           = useState<ResumoInteracaoUsuario[]>([]);
  const [totalInteracoes, setTotal]     = useState(0);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [form, setForm]                 = useState<NovoStakeholderForm>(EMPTY_FORM);
  const [formErrors, setFormErrors]     = useState<Partial<NovoStakeholderForm>>({});
  const [saving, setSaving]             = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [resumo, todosUsuarios] = await Promise.all([
        buscarResumoPorProjeto(projectId),
        listarUsuarios(),
      ]);

      // Usuários com interações já estão no resumo
      const comInteracao = resumo.porUsuario;
      const idsComInteracao = new Set(comInteracao.map((u) => u.usuarioId));

      // Montar entradas zeradas para usuários sem nenhuma interação
      const semInteracao: ResumoInteracaoUsuario[] = todosUsuarios
        .filter((u: UsuarioBackend) => !idsComInteracao.has(u.id))
        .map((u: UsuarioBackend) => ({
          usuarioId: u.id,
          usuarioNome: u.nome,
          usuarioEmail: u.email,
          usuarioUrlFoto: u.urlMidiaPerfil ?? null,
          totalInteracoes: 0,
          interacoesWiki: 0,
          interacoesRequisito: 0,
          interacoesComentario: 0,
          interacoesEvento: 0,
        }));

      setMembros([...comInteracao, ...semInteracao]);
      setTotal(resumo.totalInteracoes);
    } catch {
      // mantém vazio
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const filtered = membros.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.usuarioNome.toLowerCase().includes(q) || m.usuarioEmail.toLowerCase().includes(q);
  });

  const totalMembros = membros.length;
  const media = totalMembros > 0 ? Math.round(totalInteracoes / totalMembros) : 0;

  const maxWiki = Math.max(...membros.map((m) => m.interacoesWiki), 1);
  const maxReq  = Math.max(...membros.map((m) => m.interacoesRequisito), 1);
  const maxCom  = Math.max(...membros.map((m) => m.interacoesComentario), 1);

  // ── Dialog helpers ──────────────────────────────────────────────────────────

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setApiError(null);
    setDialogOpen(true);
  }

  function closeAdd() {
    setDialogOpen(false);
  }

  function validate(): boolean {
    const errs: Partial<NovoStakeholderForm> = {};
    if (!form.nome.trim()) errs.nome = 'Nome obrigatório';
    if (!form.email.trim()) {
      errs.email = 'E-mail obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'E-mail inválido';
    }
    if (!form.senha) {
      errs.senha = 'Senha obrigatória';
    } else if (form.senha.length < 8) {
      errs.senha = 'Mínimo de 8 caracteres';
    }
    if (!form.confirmarSenha) {
      errs.confirmarSenha = 'Confirmação obrigatória';
    } else if (form.senha !== form.confirmarSenha) {
      errs.confirmarSenha = 'As senhas não coincidem';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      await cadastrarUsuario({ nome: form.nome, email: form.email, senha: form.senha });
      notify('Stakeholder cadastrado com sucesso!', 'success');
      closeAdd();
      load(); // recarrega a lista de interações (novo membro aparecerá após interagir)
    } catch (err) {
      if (isApiError(err)) {
        setApiError(err.response?.data?.detail ?? 'Erro ao cadastrar usuário.');
      } else {
        setApiError('Erro inesperado. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof NovoStakeholderForm) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setFormErrors((prev) => ({ ...prev, [key]: undefined }));
        setApiError(null);
      },
      error: !!formErrors[key],
      helperText: formErrors[key],
    };
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Stakeholders</Typography>
          <Typography variant="body2" color="text.secondary">
            Membros e participantes do projeto
          </Typography>
        </Box>
        {!isStakeholder && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="small"
          onClick={openAdd}
        >
          Adicionar Stakeholder
        </Button>
        )}
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={totalMembros}    label="Total de membros"    color="#3F51B5" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={totalInteracoes} label="Total de interações" color="#059669" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard value={media}           label="Média por membro"    color="#D97706" />
        </Grid>
      </Grid>

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

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<PeopleIcon sx={{ fontSize: 64 }} />}
          title="Nenhum membro encontrado"
          description={
            membros.length === 0
              ? 'Ainda não há interações registradas neste projeto.'
              : 'Nenhum membro corresponde à busca.'
          }
        />
      )}

      {/* Grid de cards dos membros */}
      {!loading && filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map((m) => {
            const color = avatarColor(m.usuarioNome);
            return (
              <Grid key={m.usuarioId} size={{ xs: 12, md: 6 }}>
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
                    {/* Linha de topo: avatar + info + chip de total */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                      {m.usuarioUrlFoto ? (
                        <Avatar src={m.usuarioUrlFoto} sx={{ width: 44, height: 44 }} />
                      ) : (
                        <Avatar sx={{ bgcolor: color, width: 44, height: 44, fontWeight: 700, fontSize: 15 }}>
                          {initials(m.usuarioNome)}
                        </Avatar>
                      )}

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.2 }}>
                          {m.usuarioNome}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {m.usuarioEmail}
                          </Typography>
                        </Box>
                      </Box>

                      <Tooltip title="Total de interações no projeto">
                        <Chip
                          label={`${m.totalInteracoes} interações`}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: '#F3F4F6', flexShrink: 0 }}
                        />
                      </Tooltip>
                    </Box>

                    {/* Barras de engajamento */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <EngRow label="Interações WIKI"        value={m.interacoesWiki}       max={maxWiki} color="#3F51B5" />
                      <EngRow label="Interações Requisitos"  value={m.interacoesRequisito}  max={maxReq}  color="#7C3AED" />
                      {m.interacoesComentario > 0 && (
                        <EngRow label="Interações Comentários" value={m.interacoesComentario} max={maxCom} color="#059669" />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── Dialog: Adicionar Stakeholder ─────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeAdd} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ color: 'primary.main' }} />
          Adicionar Stakeholder
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Preencha os dados para criar um novo usuário na plataforma. O stakeholder poderá acessar o sistema com as credenciais definidas abaixo.
          </Typography>

          <TextField
            label="Nome completo"
            size="small"
            fullWidth
            autoFocus
            {...field('nome')}
          />

          <TextField
            label="E-mail"
            type="email"
            size="small"
            fullWidth
            {...field('email')}
          />

          <TextField
            label="Senha"
            type="password"
            size="small"
            fullWidth
            {...field('senha')}
            helperText={formErrors.senha ?? 'Mínimo de 8 caracteres'}
          />

          <TextField
            label="Confirmar senha"
            type="password"
            size="small"
            fullWidth
            {...field('confirmarSenha')}
          />

          {apiError && (
            <Box
              sx={{
                bgcolor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: 1,
                px: 2,
                py: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 500 }}>
                {apiError}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={closeAdd} color="inherit" size="small" disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}
          >
            {saving ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
