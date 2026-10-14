import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useAuth } from '../../context/useAuth';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  listarUsuarios,
  obterAcessosUsuario,
  removerUsuario,
  type AcessosUsuario,
  type UsuarioBackend,
} from '../../services/userService';
import { PAPEL_ORGANIZACAO_LABEL, PAPEL_PROJETO_LABEL } from '../../types/acesso';
import { extractApiErrorMessage } from '../../utils/apiError';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

/**
 * Usuários da plataforma (Admin da Plataforma): lista as contas ativas, mostra
 * onde cada pessoa atua (papéis reais por organização e projeto) e exclui a conta.
 * Papéis se dão por organização e projeto, nas telas de membros e participantes.
 */
export default function UsersPage() {
  const { user } = useAuth();
  const { notify } = useSnackbar();

  const [users, setUsers] = useState<UsuarioBackend[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [search, setSearch] = useState('');

  const [acessosDe, setAcessosDe] = useState<UsuarioBackend | null>(null);
  const [acessos, setAcessos] = useState<AcessosUsuario | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<UsuarioBackend | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const lista = await listarUsuarios(true);
      setUsers([...lista].sort((a, b) => a.nome.localeCompare(b.nome)));
    } catch (err) {
      setFetchError(true);
      notify(extractApiErrorMessage(err, 'Não foi possível carregar os usuários.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { carregar(); }, [carregar]);

  async function abrirAcessos(u: UsuarioBackend) {
    setAcessosDe(u);
    setAcessos(null);
    try {
      setAcessos(await obterAcessosUsuario(u.id));
    } catch (err) {
      setAcessosDe(null);
      notify(extractApiErrorMessage(err, 'Não foi possível carregar os acessos do usuário.'), 'error');
    }
  }

  async function handleExcluir() {
    if (!deleteTarget) return;
    setExcluindo(true);
    try {
      await removerUsuario(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      notify('Usuário excluído');
      setDeleteTarget(null);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erro ao excluir usuário'), 'error');
    } finally {
      setExcluindo(false);
    }
  }

  const termo = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo),
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1100, mx: 'auto', width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <PeopleIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
        <Typography variant="h2">Usuários da plataforma</Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Contas ativas e onde cada pessoa atua. Os papéis são dados em cada organização e projeto.
      </Typography>

      {/* Busca + contador */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Pesquise por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ maxWidth: 480, width: '100%' }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} />,
            },
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Usuários ativos <strong>{users.length}</strong>
          </Typography>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && fetchError && (
        <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
          <Typography sx={{ mb: 2 }}>Não foi possível carregar os usuários.</Typography>
          <Button variant="outlined" onClick={carregar}>Tentar novamente</Button>
        </Box>
      )}

      {!loading && !fetchError && (
        <Grid container spacing={2}>
          {filtered.map((u) => {
            const souEu = u.id === user?.id;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={u.id}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 44, height: 44, fontSize: 16 }}>
                        {initials(u.nome)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                          {u.nome}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
                          {u.email}
                        </Typography>
                      </Box>
                      {souEu && <Chip label="Você" size="small" sx={{ height: 20, fontSize: 11 }} />}
                    </Box>

                    <Divider sx={{ mb: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {!souEu && (
                        <Tooltip title="Excluir usuário">
                          <IconButton size="small" color="error" aria-label="Excluir usuário" onClick={() => setDeleteTarget(u)}>
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Button
                        size="small"
                        variant="text"
                        sx={{ fontSize: '12px', px: 1, minWidth: 'auto' }}
                        onClick={() => abrirAcessos(u)}
                      >
                        ver acessos
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {filtered.length === 0 && (
            <Grid size={12}>
              <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                <PersonOffIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography>Nenhum usuário encontrado</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Dialog — Onde a pessoa atua */}
      <Dialog open={!!acessosDe} onClose={() => setAcessosDe(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>{acessosDe?.nome}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            {acessosDe?.email} · papéis em cada organização e projeto
          </Typography>
          {!acessos && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          )}
          {acessos && acessos.organizacoes.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Não participa de nenhuma organização nem projeto.
            </Typography>
          )}
          {acessos?.organizacoes.map((o, idx) => (
            <Box key={o.id}>
              <Box sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                  <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.nome}</Typography>
                  <Chip size="small" label={o.papel ? PAPEL_ORGANIZACAO_LABEL[o.papel] : 'Convidado em projetos'}
                    sx={{ height: 20, fontSize: 11 }} />
                  {!o.ativo && <Chip size="small" label="Inativa" sx={{ height: 20, fontSize: 11 }} />}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 3.5 }}>
                  {o.projetos.length === 0 && (
                    <Typography variant="caption" color="text.disabled">Nenhum projeto</Typography>
                  )}
                  {o.projetos.map((p) => (
                    <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderOpenIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" sx={{ flex: 1, minWidth: 0 }} noWrap>
                        {p.nome}{!p.ativo && ' (inativo)'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {p.papeis.map((x) => PAPEL_PROJETO_LABEL[x]).join(' + ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {idx < acessos.organizacoes.length - 1 && <Divider />}
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setAcessosDe(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog — Confirmar exclusão */}
      <Dialog open={!!deleteTarget} onClose={() => !excluindo && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir usuário</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Excluir a conta de <strong>{deleteTarget?.nome}</strong>? A pessoa não consegue mais entrar e as
            sessões abertas são encerradas. O que ela registrou (requisitos, comentários, histórico) é mantido.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" color="inherit" onClick={() => setDeleteTarget(null)} disabled={excluindo}>Cancelar</Button>
          <Button size="small" variant="contained" color="error" onClick={handleExcluir} disabled={excluindo}>
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
