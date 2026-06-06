import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TablePagination from '@mui/material/TablePagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import ptBr from 'dayjs/locale/pt-br';
import EmptyState from '../../components/common/EmptyState';
import { listarAuditoriasPorProjeto } from '../../services/auditService';
import type { AuditoriaAPI, AcaoAuditoria } from '../../types/auditoriaAPI';

dayjs.locale(ptBr);

// ─── Labels e cores por ação ─────────────────────────────────────────────────

const ACAO_LABELS: Record<AcaoAuditoria, string> = {
  CRIACAO:  'Criação',
  EDICAO:   'Edição',
  EXCLUSAO: 'Exclusão',
};

const ACAO_COLORS: Record<AcaoAuditoria, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  CRIACAO:  'info',
  EDICAO:   'warning',
  EXCLUSAO: 'error',
};

// ─── Labels por entidade ──────────────────────────────────────────────────────

const ENTIDADE_LABELS: Record<string, string> = {
  PROJETO:           'PROJETO',
  REQUISITO:         'REQUISITO',
  EVENTO:            'EVENTO',
  WIKI_DESCRICAO:    'WIKI',
  WIKI_PROBLEMA:     'WIKI',
  WIKI_PUBLICO:      'WIKI',
  WIKI_OBJETIVOS:    'WIKI',
  WIKI_RESTRICOES:   'WIKI',
  COMENTARIO:        'COMENTÁRIO',
};

// ─── Labels por campo ────────────────────────────────────────────────────────

const CAMPO_LABELS: Record<string, string> = {
  nome:                      'Nome',
  descricao:                 'Descrição',
  status:                    'Status',
  ativo:                     'Estado',
  tipo:                      'Tipo',
  prioridade:                'Prioridade',
  criterio_aceite:           'Critério de aceite',
  criterio_aceite_descricao: 'Desc. Critério de aceite',
  descricao_problema:        'Problema',
  publico_alvo:              'Público-alvo',
  objetivo_geral:            'Objetivo geral',
  objetivos_especificos:     'Objetivos específicos',
  kpis:                      'KPIs',
  restricoes_prazo:          'Restrições de prazo',
  restricoes_orcamento:      'Restrições de orçamento',
  tecnologias_obrigatorias:  'Tecnologias obrigatórias',
  regulamentacoes:           'Regulamentações',
  dataHoraInicio:            'Data/hora início',
  dataHoraFim:               'Data/hora fim',
};

function campoLabel(campo: string): string {
  return CAMPO_LABELS[campo] ?? campo;
}

/** Gera a descrição legível de uma auditoria */
function buildDescricao(a: AuditoriaAPI): string {
  const acao = ACAO_LABELS[a.acao] ?? a.acao;
  const campo = campoLabel(a.campoAlterado ?? '');

  if (a.acao === 'CRIACAO') {
    const entidade = ENTIDADE_LABELS[a.entidadeTipo] ?? a.entidadeTipo;
    return `${entidade} criado${a.valorNovo ? `: "${a.valorNovo}"` : ''}`;
  }

  if (a.acao === 'EXCLUSAO') {
    const entidade = ENTIDADE_LABELS[a.entidadeTipo] ?? a.entidadeTipo;
    return `${entidade} excluído${a.valorAnterior ? ` "${a.valorAnterior}"` : ''}`;
  }

  if (a.valorAnterior && a.valorNovo) {
    const ant = a.valorAnterior.length > 40 ? a.valorAnterior.slice(0, 40) + '…' : a.valorAnterior;
    const nov = a.valorNovo.length > 40 ? a.valorNovo.slice(0, 40) + '…' : a.valorNovo;
    return `${campo} alterado de "${ant}" para "${nov}"`;
  }
  if (a.valorNovo) return `${campo} definido: "${a.valorNovo}"`;
  if (a.valorAnterior) return `${campo} removido`;
  return `${acao} em ${campo}`;
}

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export default function AuditLog() {
  const { projectId } = useParams<{ projectId: string }>();
  const [auditorias, setAuditorias] = useState<AuditoriaAPI[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterAcao, setFilterAcao]     = useState<string>('');
  const [filterEntidade, setFilterEntidade] = useState<string>('');
  const [search, setSearch]             = useState('');
  const [dateFrom, setDateFrom]         = useState<Dayjs | null>(null);
  const [dateTo, setDateTo]             = useState<Dayjs | null>(null);
  const [page, setPage]                 = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(10);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const data = await listarAuditoriasPorProjeto(projectId);
      setAuditorias(data);
    } catch {
      // mantém lista vazia
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Entidades únicas para filtro ───────────────────────────────────────────
  const entidadeOpcoes = [...new Set(auditorias.map((a) => a.entidadeTipo))].sort();

  // ── Filtragem ──────────────────────────────────────────────────────────────
  const filtered = auditorias
    .filter((a) => !filterAcao     || a.acao         === filterAcao)
    .filter((a) => !filterEntidade || a.entidadeTipo === filterEntidade)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const desc = buildDescricao(a).toLowerCase();
      return (
        (a.usuarioNome ?? '').toLowerCase().includes(q) ||
        desc.includes(q) ||
        (a.campoAlterado ?? '').toLowerCase().includes(q)
      );
    })
    .filter((a) => {
      const d = dayjs(a.dataAlteracao);
      if (dateFrom && d.isBefore(dateFrom.startOf('day'))) return false;
      if (dateTo   && d.isAfter(dateTo.endOf('day')))      return false;
      return true;
    });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };
  const handleClearSearch = () => { setSearch(''); setPage(0); };
  const handleFilterAcao = (v: string) => { setFilterAcao(v); setPage(0); };
  const handleFilterEntidade = (v: string) => { setFilterEntidade(v); setPage(0); };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ mb: 0.5 }}>Auditoria</Typography>
          <Typography variant="body2">Registro de todas as ações realizadas no projeto</Typography>
        </Box>

        {/* Filters row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Buscar por usuário ou descrição..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 280, flex: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <DatePicker
            label="De"
            value={dateFrom}
            onChange={(v) => { setDateFrom(v); setPage(0); }}
            maxDate={dateTo ?? undefined}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />

          <DatePicker
            label="Até"
            value={dateTo}
            onChange={(v) => { setDateTo(v); setPage(0); }}
            minDate={dateFrom ?? undefined}
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />

          <Select
            size="small"
            value={filterEntidade}
            onChange={(e) => handleFilterEntidade(e.target.value)}
            displayEmpty
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas as entidades</MenuItem>
            {entidadeOpcoes.map((e) => (
              <MenuItem key={e} value={e}>{ENTIDADE_LABELS[e] ?? e}</MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={filterAcao}
            onChange={(e) => handleFilterAcao(e.target.value)}
            displayEmpty
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas as ações</MenuItem>
            {(Object.entries(ACAO_LABELS) as [AcaoAuditoria, string][]).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Results count */}
        {!loading && (
          <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
            {filtered.length} {filtered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
          </Typography>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={<ManageSearchIcon sx={{ fontSize: 64 }} />}
            title="Nenhum registro encontrado"
            description="Tente ajustar os filtros para encontrar o que procura."
          />
        )}

        {!loading && filtered.length > 0 && (
          <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.paper' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Entidade</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((entry) => {
                  const descricao = buildDescricao(entry);
                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {new Date(entry.dataAlteracao).toLocaleString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {entry.usuarioNome ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ACAO_LABELS[entry.acao] ?? entry.acao}
                          color={ACAO_COLORS[entry.acao] ?? 'default'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ENTIDADE_LABELS[entry.entidadeTipo] ?? entry.entidadeTipo}
                          size="small"
                          variant="filled"
                          sx={{
                            fontWeight: 600,
                            fontSize: 11,
                            bgcolor: 'action.hover',
                            color: 'text.primary',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 340,
                            whiteSpace: 'pre-line',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            color: 'text.primary',
                          }}
                        >
                          {descricao}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
}
