import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import { listarUsuariosAdmin } from '../../services/adminService';
import { obterAcessosUsuario, removerUsuario, type AcessosUsuario } from '../../services/userService';
import { PADDING_PAGINA, linhaFiltros } from '../../theme/responsivo';
import type { Pagina, UsuarioAdmin } from '../../types/admin';
import { PAPEL_ORGANIZACAO_LABEL, PAPEL_PROJETO_LABEL } from '../../types/acesso';
import { extractApiErrorMessage } from '../../utils/apiError';

type Situacao = 'todas' | 'ativas' | 'inativas';

const formatarData = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

/**
 * Contas da plataforma. O Admin vê onde cada pessoa atua e pode inativar contas;
 * não edita dados de ninguém (RF02) nem dá papel de Admin a alguém.
 */
export default function AdminUsuarios() {
  const { notify } = useSnackbar();

  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [situacao, setSituacao] = useState<Situacao>('ativas');
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(20);
  const [dados, setDados] = useState<Pagina<UsuarioAdmin> | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [acessosDe, setAcessosDe] = useState<UsuarioAdmin | null>(null);
  const [acessos, setAcessos] = useState<AcessosUsuario | null>(null);
  const [inativar, setInativar] = useState<UsuarioAdmin | null>(null);

  // Busca aplicada 300 ms depois da última tecla (e volta para a 1ª página)
  useEffect(() => {
    const t = setTimeout(() => { setBuscaAplicada(busca.trim()); setPagina(0); }, 300);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setDados(await listarUsuariosAdmin({
        pagina, tamanho,
        busca: buscaAplicada || undefined,
        ativo: situacao === 'todas' ? undefined : situacao === 'ativas',
      }));
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível carregar os usuários.'), 'error');
    } finally {
      setCarregando(false);
    }
  }, [pagina, tamanho, buscaAplicada, situacao, notify]);

  useEffect(() => { carregar(); }, [carregar]);

  async function abrirAcessos(u: UsuarioAdmin) {
    setAcessosDe(u);
    setAcessos(null);
    try {
      setAcessos(await obterAcessosUsuario(u.id));
    } catch (err) {
      setAcessosDe(null);
      notify(extractApiErrorMessage(err, 'Não foi possível carregar os acessos do usuário.'), 'error');
    }
  }

  async function confirmarInativacao() {
    if (!inativar) return;
    const alvo = inativar;
    setInativar(null);
    try {
      await removerUsuario(alvo.id);
      notify('Conta inativada');
      carregar();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível inativar a conta.'), 'error');
    }
  }

  return (
    <Box sx={{ p: PADDING_PAGINA, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h2" component="h1">Usuários</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Contas da plataforma e onde cada pessoa atua. Os papéis são dados em cada organização e projeto.
      </Typography>

      <Box sx={{ ...linhaFiltros, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar por nome ou e-mail"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{ input: { startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled', fontSize: 18 }} /> }, htmlInput: { 'aria-label': 'Buscar por nome ou e-mail' } }}
          sx={{ flex: '1 1 260px' }}
        />
        <TextField
          select
          size="small"
          label="Situação"
          value={situacao}
          onChange={(e) => { setSituacao(e.target.value as Situacao); setPagina(0); }}
          sx={{ flex: '0 1 180px' }}
        >
          <MenuItem value="ativas">Ativas</MenuItem>
          <MenuItem value="inativas">Inativas</MenuItem>
          <MenuItem value="todas">Todas</MenuItem>
        </TextField>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Contas da plataforma">
            <TableHead>
              <TableRow>
                <TableCell>Conta</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Criada em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando && !dados && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
              )}
              {dados?.itens.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>Nenhuma conta encontrada</TableCell></TableRow>
              )}
              {dados?.itens.map((u) => (
                <TableRow key={u.id} hover data-email={u.email}>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{u.nome}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip size="small" label={u.ativo ? 'Ativa' : 'Inativa'} color={u.ativo ? 'success' : 'default'} variant="outlined" sx={{ height: 22 }} />
                      {u.adminPlataforma && <Chip size="small" label="Admin" color="primary" variant="outlined" sx={{ height: 22 }} />}
                      {u.propria && <Chip size="small" label="Você" sx={{ height: 22 }} />}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>{formatarData(u.dataCriacao)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button size="small" onClick={() => abrirAcessos(u)}>Ver acessos</Button>
                    {u.ativo && !u.propria && (
                      <Button size="small" color="error" onClick={() => setInativar(u)}>Inativar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={dados?.total ?? 0}
          page={pagina}
          onPageChange={(_, p) => setPagina(p)}
          rowsPerPage={tamanho}
          onRowsPerPageChange={(e) => { setTamanho(Number(e.target.value)); setPagina(0); }}
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        />
      </Paper>

      {/* Onde a pessoa atua */}
      <Dialog open={!!acessosDe} onClose={() => setAcessosDe(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 0.5 }}>{acessosDe?.nome}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            {acessosDe?.email} · papéis em cada organização e projeto
          </Typography>
          {!acessos && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>}
          {acessos && acessos.organizacoes.length === 0 && (
            <Typography variant="body2" color="text.secondary">Não participa de nenhuma organização nem projeto.</Typography>
          )}
          {acessos?.organizacoes.map((o, idx) => (
            <Box key={o.id}>
              <Box sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75, flexWrap: 'wrap' }}>
                  <BusinessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{o.nome}</Typography>
                  <Chip size="small" label={o.papel ? PAPEL_ORGANIZACAO_LABEL[o.papel] : 'Convidado em projetos'} sx={{ height: 20, fontSize: 11 }} />
                  {!o.ativo && <Chip size="small" label="Inativa" sx={{ height: 20, fontSize: 11 }} />}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 3.5 }}>
                  {o.projetos.length === 0 && <Typography variant="caption" color="text.disabled">Nenhum projeto</Typography>}
                  {o.projetos.map((p) => (
                    <Box key={p.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderOpenIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" sx={{ flex: 1, minWidth: 0 }} noWrap>{p.nome}{!p.ativo && ' (inativo)'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{p.papeis.map((x) => PAPEL_PROJETO_LABEL[x]).join(' + ')}</Typography>
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

      <ConfirmDialog
        open={!!inativar}
        title="Inativar conta"
        message={`Inativar a conta de ${inativar?.nome ?? ''}? A pessoa não consegue mais entrar e as sessões abertas são encerradas. O que ela registrou (requisitos, comentários, histórico) é mantido.`}
        confirmLabel="Inativar"
        confirmColor="error"
        onConfirm={confirmarInativacao}
        onCancel={() => setInativar(null)}
      />
    </Box>
  );
}
