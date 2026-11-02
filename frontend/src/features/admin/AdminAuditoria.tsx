import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PersonIcon from '@mui/icons-material/Person';
import { useSnackbar } from '../../context/SnackbarContext';
import { listarAuditoriaAdmin } from '../../services/adminService';
import { PADDING_PAGINA, linhaFiltros } from '../../theme/responsivo';
import type { Pagina } from '../../types/admin';
import type { AcaoAuditoria, AuditoriaAPI } from '../../types/auditoriaAPI';
import { extractApiErrorMessage } from '../../utils/apiError';

// Mesmas cores e ícones do AuditCard dos projetos
const ACAO: Record<AcaoAuditoria, { label: string; color: string; bgLight: string; bgDark: string; Icon: React.ElementType }> = {
  CRIACAO:  { label: 'Criação',  color: '#16A34A', bgLight: '#F0FDF4', bgDark: '#052E16', Icon: AddCircleOutlineIcon },
  EDICAO:   { label: 'Edição',   color: '#2563EB', bgLight: '#EFF6FF', bgDark: '#1E3A5F', Icon: EditOutlinedIcon },
  EXCLUSAO: { label: 'Exclusão', color: '#DC2626', bgLight: '#FEF2F2', bgDark: '#450A0A', Icon: DeleteOutlineIcon },
};

const ENTIDADE: Record<string, string> = {
  USUARIO: 'Conta de usuário',
  STATUS_PROJETO: 'Status de projeto',
  STATUS_REQUISITO: 'Status de requisito',
  PRIORIDADE: 'Prioridade',
  PESQUISA: 'Pesquisa do TCC',
};

const CAMPO: Record<string, string> = {
  nome: 'Nome', descricao: 'Descrição', ordem: 'Ordem', codigo: 'Código', ativo: 'Ativa', situacao: 'Situação',
  coleta: 'Coleta', intervaloMinimo: 'Intervalo mínimo', exportacaoCsv: 'Exportação do CSV',
};

/** Data do filtro (yyyy-mm-dd, horário local) → instante ISO; "até" inclui o dia inteiro. */
function inicioDoDia(data: string, diasAMais = 0): string | undefined {
  if (!data) return undefined;
  const [a, m, d] = data.split('-').map(Number);
  return new Date(a, m - 1, d + diasAMais).toISOString();
}

/** Ações do Admin da Plataforma: contas inativadas e dados de referência alterados. */
export default function AdminAuditoria() {
  const theme = useTheme();
  const escuro = theme.palette.mode === 'dark';
  const { notify } = useSnackbar();

  const [acao, setAcao] = useState<AcaoAuditoria | ''>('');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [pagina, setPagina] = useState(0);
  const [tamanho, setTamanho] = useState(20);
  const [dados, setDados] = useState<Pagina<AuditoriaAPI> | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setDados(await listarAuditoriaAdmin({
        pagina, tamanho, acao: acao || undefined, de: inicioDoDia(de), ate: inicioDoDia(ate, 1),
      }));
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Não foi possível carregar a auditoria.'), 'error');
    } finally {
      setCarregando(false);
    }
  }, [pagina, tamanho, acao, de, ate, notify]);

  useEffect(() => { carregar(); }, [carregar]);

  return (
    <Box sx={{ p: PADDING_PAGINA, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h2" component="h1">Auditoria administrativa</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Ações feitas pela administração da plataforma. O histórico dos projetos fica na auditoria de cada projeto.
      </Typography>

      <Box sx={{ ...linhaFiltros, mb: 2 }}>
        <TextField select size="small" label="Ação" value={acao} onChange={(e) => { setAcao(e.target.value as AcaoAuditoria | ''); setPagina(0); }}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} sx={{ flex: '0 1 180px' }}>
          <MenuItem value="">Todas</MenuItem>
          {(Object.keys(ACAO) as AcaoAuditoria[]).map((a) => <MenuItem key={a} value={a}>{ACAO[a].label}</MenuItem>)}
        </TextField>
        <TextField size="small" type="date" label="De" value={de} onChange={(e) => { setDe(e.target.value); setPagina(0); }}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: '0 1 170px' }} />
        <TextField size="small" type="date" label="Até" value={ate} onChange={(e) => { setAte(e.target.value); setPagina(0); }}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ flex: '0 1 170px' }} />
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {carregando && !dados && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>}
        {dados?.itens.length === 0 && (
          <Typography sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>Nenhuma ação administrativa no período.</Typography>
        )}
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {dados?.itens.map((a) => {
            const cfg = ACAO[a.acao];
            return (
              <Box component="li" key={a.id} sx={{ display: 'flex', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}>
                <Box sx={{ width: 32, height: 32, flexShrink: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: escuro ? cfg.bgDark : cfg.bgLight }}>
                  <cfg.Icon sx={{ fontSize: 18, color: cfg.color }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    <Box component="span" sx={{ color: cfg.color }}>{cfg.label}</Box>
                    {' · '}{ENTIDADE[a.entidadeTipo] ?? a.entidadeTipo}
                    {' · '}{CAMPO[a.campoAlterado] ?? a.campoAlterado}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}>
                    {a.valorAnterior && <Box component="span" sx={{ textDecoration: a.valorNovo ? 'none' : 'line-through' }}>{a.valorAnterior}</Box>}
                    {a.valorAnterior && a.valorNovo && ' → '}
                    {a.valorNovo}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, color: 'text.secondary', flexWrap: 'wrap' }}>
                    <PersonIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption">{a.usuarioNome ?? 'Sistema'}</Typography>
                    <Typography variant="caption">· {new Date(a.dataAlteracao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
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
    </Box>
  );
}
