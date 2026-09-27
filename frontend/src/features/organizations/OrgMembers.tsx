import { useCallback, useEffect, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import {
  cancelarConvite,
  convidarParaOrganizacao,
  listarConvitesOrganizacao,
  listarMembrosOrganizacao,
  promoverNaOrganizacao,
  removerDaOrganizacao,
  type Convite,
  type PapelConvite,
  type Participante,
} from '../../services/acessoService';
import { isApiError } from '../../services/userService';
import { PAPEL_ORGANIZACAO_LABEL, type PapelOrganizacao } from '../../types/acesso';
import { useAuth } from '../../context/useAuth';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';

const PAPEL_COR: Record<PapelOrganizacao, { bg: string; color: string }> = {
  DONO:   { bg: '#EDE9FE', color: '#7C3AED' },
  GESTOR: { bg: '#EFF6FF', color: '#2563EB' },
  MEMBRO: { bg: '#F3F4F6', color: '#4B5563' },
};

function mensagemErro(err: unknown, padrao: string) {
  return isApiError(err) ? err.response?.data?.detail ?? padrao : padrao;
}

function initials(nome: string) {
  return nome.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

/** Papel do participante na organização (cada um tem exatamente um). */
function papelNaOrganizacao(p: Participante): PapelOrganizacao {
  return (p.vinculos[0]?.papel as PapelOrganizacao) ?? 'MEMBRO';
}

/**
 * Membros da organização (Dono, Gestores, Membros) e convites pendentes.
 * Convidar: ORG_INVITE_USER · elevar Membro a Gestor: ORG_PROMOTE_USER · remover: ORG_REMOVE_USER (só o Dono).
 */
export default function OrgMembers({ orgId, onMudou }: { orgId: string; onMudou?: (total: number) => void }) {
  const { user } = useAuth();
  const { notify } = useSnackbar();
  const { podeNaOrganizacao } = usePermissions();

  const podeConvidar = podeNaOrganizacao(orgId, 'ORG_INVITE_USER');
  const podePromover = podeNaOrganizacao(orgId, 'ORG_PROMOTE_USER');
  const podeRemover  = podeNaOrganizacao(orgId, 'ORG_REMOVE_USER');

  const [membros, setMembros] = useState<Participante[]>([]);
  const [convites, setConvites] = useState<Convite[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<PapelConvite>('MEMBRO');
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [removerAlvo, setRemoverAlvo] = useState<Participante | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lista, pendentes] = await Promise.all([
        listarMembrosOrganizacao(orgId),
        podeConvidar ? listarConvitesOrganizacao(orgId).catch(() => []) : Promise.resolve([]),
      ]);
      // Dono, depois Gestores, depois Membros; em cada grupo por nome
      const ordem: PapelOrganizacao[] = ['DONO', 'GESTOR', 'MEMBRO'];
      lista.sort((a, b) =>
        ordem.indexOf(papelNaOrganizacao(a)) - ordem.indexOf(papelNaOrganizacao(b)) || a.nome.localeCompare(b.nome));
      setMembros(lista);
      setConvites(pendentes);
      onMudou?.(lista.length);
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao carregar os membros da organização'), 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, podeConvidar, notify, onMudou]);

  useEffect(() => { load(); }, [load]);

  function openConvite() {
    setEmail('');
    setPapel('MEMBRO');
    setApiError(null);
    setDialogOpen(true);
  }

  async function handleConvidar() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setApiError('Informe um e-mail válido.');
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      await convidarParaOrganizacao(orgId, email.trim(), papel);
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
    try {
      await promoverNaOrganizacao(orgId, p.usuarioId);
      notify(`${p.nome} agora é Gestor da organização`, 'success');
      load();
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao promover membro'), 'error');
    }
  }

  async function handleRemover() {
    if (!removerAlvo) return;
    try {
      await removerDaOrganizacao(orgId, removerAlvo.usuarioId);
      notify(`${removerAlvo.nome} foi removido da organização`, 'info');
      load();
    } catch (err) {
      notify(mensagemErro(err, 'Erro ao remover membro'), 'error');
    } finally {
      setRemoverAlvo(null);
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Membros</Typography>
        {podeConvidar && (
          <Button size="small" variant="outlined" startIcon={<PersonAddIcon />} onClick={openConvite}>
            Convidar
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : (
          <>
            {membros.map((p, i) => {
              const papelOrg = papelNaOrganizacao(p);
              const cor = PAPEL_COR[papelOrg];
              const ehVoce = p.usuarioId === user?.id;
              return (
                <Box key={p.usuarioId}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25 }}>
                    <Avatar src={p.urlMidiaPerfil ?? undefined} sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: cor.color }}>
                      {initials(p.nome)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.nome}{ehVoce && <Typography component="span" variant="caption" color="text.secondary"> (você)</Typography>}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.email}
                      </Typography>
                    </Box>
                    <Chip label={PAPEL_ORGANIZACAO_LABEL[papelOrg]} size="small"
                      sx={{ bgcolor: cor.bg, color: cor.color, fontWeight: 600, fontSize: 11, height: 22 }} />
                    {podePromover && papelOrg === 'MEMBRO' && (
                      <Tooltip title="Elevar a Gestor da organização">
                        <IconButton size="small" onClick={() => handlePromover(p)}><UpgradeIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {podeRemover && papelOrg !== 'DONO' && (
                      <Tooltip title="Remover da organização">
                        <IconButton size="small" color="error" onClick={() => setRemoverAlvo(p)}>
                          <PersonRemoveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  {i < membros.length - 1 && <Divider />}
                </Box>
              );
            })}
            {membros.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Nenhum membro.
              </Typography>
            )}
          </>
        )}
      </Paper>

      {podeConvidar && convites.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Convites pendentes
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {convites.map((c) => (
              <Chip
                key={c.id}
                size="small"
                label={`${c.email} · ${c.projetoNome ? `projeto ${c.projetoNome}` : c.papel === 'GESTOR' ? 'Gestor' : 'Membro'}`}
                onDelete={() => handleCancelarConvite(c.id)}
                deleteIcon={<Tooltip title="Cancelar convite"><CloseIcon /></Tooltip>}
              />
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PersonAddIcon sx={{ color: 'primary.main' }} />
          Convidar para a organização
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            A pessoa verá o convite ao entrar na plataforma com este e-mail (quem ainda não tem conta se
            cadastra com o mesmo e-mail). Membros participam de todos os projetos como Stakeholder Técnico;
            Gestores gerenciam todos os projetos da organização.
          </Typography>
          <TextField label="E-mail" type="email" size="small" fullWidth autoFocus value={email}
            onChange={(e) => { setEmail(e.target.value); setApiError(null); }} />
          <TextField select label="Papel" size="small" fullWidth value={papel}
            onChange={(e) => setPapel(e.target.value as PapelConvite)}>
            <MenuItem value="MEMBRO">Membro</MenuItem>
            <MenuItem value="GESTOR">Gestor</MenuItem>
          </TextField>
          {apiError && (
            <Box sx={{ bgcolor: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 1, px: 2, py: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 500 }}>{apiError}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" size="small" disabled={saving}>Cancelar</Button>
          <Button onClick={handleConvidar} variant="contained" size="small" disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}>
            {saving ? 'Enviando...' : 'Convidar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removerAlvo)}
        title="Remover da organização"
        message={`Remover ${removerAlvo?.nome ?? ''} da organização? A pessoa sai de todos os projetos dela e perde o acesso na próxima ação.`}
        confirmLabel="Remover"
        onConfirm={handleRemover}
        onCancel={() => setRemoverAlvo(null)}
      />
    </>
  );
}
