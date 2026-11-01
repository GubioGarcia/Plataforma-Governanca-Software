import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useSnackbar } from '../../context/SnackbarContext';
import {
  atualizarPrioridade, atualizarStatus, criarPrioridade, excluirPrioridade, excluirStatus,
  listarStatus, listarTodasPrioridades, type TipoStatus,
} from '../../services/adminService';
import { PADDING_PAGINA, cabecalhoPagina } from '../../theme/responsivo';
import type { PrioridadeReferencia, StatusReferencia } from '../../types/admin';
import { extractApiErrorMessage } from '../../utils/apiError';

const MOTIVO_SISTEMA = 'Usado pelas regras da plataforma: o nome não pode mudar e o registro não pode ser excluído.';

/** Ação desabilitada com explicação (o Tooltip precisa de um elemento que receba o mouse). */
function AcaoComMotivo({ titulo, motivo, children }: { titulo: string; motivo?: string; children: React.ReactElement }) {
  return (
    <Tooltip title={motivo ?? titulo}>
      <span>{children}</span>
    </Tooltip>
  );
}

// ─── Status (projeto e requisito) ─────────────────────────────────────────────

function TabelaStatus({ tipo }: { tipo: TipoStatus }) {
  const { notify } = useSnackbar();
  const [itens, setItens] = useState<StatusReferencia[] | null>(null);
  const [editando, setEditando] = useState<StatusReferencia | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', ordem: '' });
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<StatusReferencia | null>(null);

  const carregar = useCallback(async () => {
    try {
      setItens(await listarStatus(tipo));
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível carregar os status.'), 'error');
    }
  }, [tipo, notify]);

  useEffect(() => { setItens(null); carregar(); }, [carregar]);

  function abrirEdicao(s: StatusReferencia) {
    setEditando(s);
    setForm({ nome: s.nome, descricao: s.descricao ?? '', ordem: String(s.ordem) });
  }

  async function salvar() {
    if (!editando) return;
    setSalvando(true);
    try {
      await atualizarStatus(tipo, editando.id, {
        nome: form.nome.trim(), descricao: form.descricao.trim() || null, ordem: Number(form.ordem),
      });
      notify('Status atualizado');
      setEditando(null);
      carregar();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível salvar o status.'), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    setExcluindo(null);
    try {
      await excluirStatus(tipo, alvo.id);
      notify('Status excluído');
      carregar();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível excluir o status.'), 'error');
    }
  }

  if (!itens) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>;

  const ordemValida = Number.isInteger(Number(form.ordem)) && Number(form.ordem) > 0;

  return (
    <>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Descrição</TableCell>
                <TableCell align="right">Ordem</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.map((s) => (
                <TableRow key={s.id} hover data-nome={s.nome}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.nome}</Typography>
                      {s.sistema && (
                        <Tooltip title={MOTIVO_SISTEMA}>
                          <Chip size="small" label="Sistema" variant="outlined" sx={{ height: 20, fontSize: 11 }} />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, color: 'text.secondary' }}>{s.descricao}</TableCell>
                  <TableCell align="right">{s.ordem}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" aria-label={`Editar ${s.nome}`} onClick={() => abrirEdicao(s)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <AcaoComMotivo titulo="Excluir" motivo={s.sistema ? MOTIVO_SISTEMA : undefined}>
                      <IconButton size="small" color="error" aria-label={`Excluir ${s.nome}`} disabled={s.sistema} onClick={() => setExcluindo(s)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </AcaoComMotivo>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!editando} onClose={() => !salvando && setEditando(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar status</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            disabled={editando?.sistema}
            helperText={editando?.sistema ? MOTIVO_SISTEMA : 'Gravado em maiúsculas'}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          <TextField label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} multiline minRows={2} />
          <TextField
            label="Ordem" type="number" value={form.ordem}
            onChange={(e) => setForm({ ...form, ordem: e.target.value })}
            error={!ordemValida} helperText={!ordemValida ? 'Número inteiro maior que zero' : ' '}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEditando(null)} disabled={salvando}>Cancelar</Button>
          <Button variant="contained" onClick={salvar} disabled={salvando || !form.nome.trim() || !ordemValida}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!excluindo}
        title="Excluir status"
        message={`Excluir o status ${excluindo?.nome ?? ''}? Só é possível se nenhum registro o usa.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </>
  );
}

// ─── Prioridades ──────────────────────────────────────────────────────────────

const FORM_VAZIO = { codigo: '', nome: '', descricao: '', ordem: '', ativo: true };

function TabelaPrioridades() {
  const { notify } = useSnackbar();
  const [itens, setItens] = useState<PrioridadeReferencia[] | null>(null);
  // null: fechado; 'nova': criação; senão, a prioridade em edição
  const [dialogo, setDialogo] = useState<PrioridadeReferencia | 'nova' | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<PrioridadeReferencia | null>(null);

  const carregar = useCallback(async () => {
    try {
      setItens(await listarTodasPrioridades());
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível carregar as prioridades.'), 'error');
    }
  }, [notify]);

  useEffect(() => { carregar(); }, [carregar]);

  function abrirNova() {
    const proxima = Math.max(0, ...(itens ?? []).map((p) => p.ordem)) + 1;
    setForm({ ...FORM_VAZIO, ordem: String(proxima) });
    setDialogo('nova');
  }

  function abrirEdicao(p: PrioridadeReferencia) {
    setForm({ codigo: p.codigo, nome: p.nome, descricao: p.descricao ?? '', ordem: String(p.ordem), ativo: p.ativo });
    setDialogo(p);
  }

  async function salvar() {
    if (!dialogo) return;
    setSalvando(true);
    try {
      if (dialogo === 'nova') {
        await criarPrioridade({
          codigo: form.codigo.trim(), nome: form.nome.trim(), descricao: form.descricao.trim() || null, ordem: Number(form.ordem),
        });
        notify('Prioridade criada');
      } else {
        await atualizarPrioridade(dialogo.id, { nome: form.nome.trim(), descricao: form.descricao.trim() || null, ativo: form.ativo });
        notify('Prioridade atualizada');
      }
      setDialogo(null);
      carregar();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível salvar a prioridade.'), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    setExcluindo(null);
    try {
      await excluirPrioridade(alvo.id);
      notify('Prioridade excluída');
      carregar();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível excluir a prioridade.'), 'error');
    }
  }

  if (!itens) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>;

  const nova = dialogo === 'nova';
  const ordemValida = Number.isInteger(Number(form.ordem)) && Number(form.ordem) > 0;
  const valido = form.nome.trim() && (!nova || (form.codigo.trim() && ordemValida));

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNova}>Nova prioridade</Button>
      </Box>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Código</TableCell>
                <TableCell align="right">Ordem</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itens.map((p) => (
                <TableRow key={p.id} hover data-nome={p.codigo}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.nome}</Typography>
                    {p.descricao && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 420 }} noWrap>
                        {p.descricao}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontFamily: 'monospace' }}>{p.codigo}</TableCell>
                  <TableCell align="right">{p.ordem}</TableCell>
                  <TableCell>
                    <Chip size="small" label={p.ativo ? 'Ativa' : 'Inativa'} color={p.ativo ? 'success' : 'default'} variant="outlined" sx={{ height: 22 }} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" aria-label={`Editar ${p.nome}`} onClick={() => abrirEdicao(p)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir (só se nenhum requisito a usa)">
                      <IconButton size="small" color="error" aria-label={`Excluir ${p.nome}`} onClick={() => setExcluindo(p)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={!!dialogo} onClose={() => !salvando && setDialogo(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{nova ? 'Nova prioridade' : 'Editar prioridade'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Código" value={form.codigo} disabled={!nova}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            helperText={nova ? 'Identificador estável, em maiúsculas (ex.: URGENTE)' : 'O código não muda depois de criado'}
            slotProps={{ htmlInput: { maxLength: 20 } }}
          />
          <TextField label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} slotProps={{ htmlInput: { maxLength: 50 } }} />
          <TextField label="Descrição" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} multiline minRows={2} />
          {nova ? (
            <TextField
              label="Ordem" type="number" value={form.ordem}
              onChange={(e) => setForm({ ...form, ordem: e.target.value })}
              error={!ordemValida} helperText={!ordemValida ? 'Número inteiro maior que zero' : ' '}
            />
          ) : (
            <FormControlLabel
              control={<Switch checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />}
              label={form.ativo ? 'Ativa (aparece na escolha de prioridade)' : 'Inativa (não aparece em requisitos novos)'}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setDialogo(null)} disabled={salvando}>Cancelar</Button>
          <Button variant="contained" onClick={salvar} disabled={salvando || !valido}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!excluindo}
        title="Excluir prioridade"
        message={`Excluir a prioridade ${excluindo?.nome ?? ''}? Só é possível se nenhum requisito a usa; caso contrário, inative-a.`}
        confirmLabel="Excluir"
        confirmColor="error"
        onConfirm={confirmarExclusao}
        onCancel={() => setExcluindo(null)}
      />
    </>
  );
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

const ABAS = [
  { rotulo: 'Status de projeto', conteudo: <TabelaStatus tipo="status-projeto" /> },
  { rotulo: 'Status de requisito', conteudo: <TabelaStatus tipo="status-requisito" /> },
  { rotulo: 'Prioridades', conteudo: <TabelaPrioridades /> },
];

/** Listas globais usadas por todos os projetos. Os status de sistema têm nome fixo. */
export default function AdminDadosReferencia() {
  const [aba, setAba] = useState(0);

  return (
    <Box sx={{ p: PADDING_PAGINA, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ ...cabecalhoPagina, mb: 2 }}>
        <Box>
          <Typography variant="h2" component="h1">Dados de referência</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Listas usadas por todos os projetos. Os registros marcados como Sistema sustentam regras da plataforma.
          </Typography>
        </Box>
      </Box>
      <Tabs value={aba} onChange={(_, v) => setAba(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        {ABAS.map((a) => <Tab key={a.rotulo} label={a.rotulo} />)}
      </Tabs>
      {/* key: troca de aba remonta a tabela (status de projeto e de requisito usam o mesmo componente) */}
      <Box key={aba}>{ABAS[aba].conteudo}</Box>
    </Box>
  );
}
