import { useState } from 'react';
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
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import ptBr from 'dayjs/locale/pt-br';
import StatusChip from '../../components/common/StatusChip';
import EmptyState from '../../components/common/EmptyState';
import { mockAudit } from '../../mocks/audit';
import type { AcaoAuditoria } from '../../types/audit';

dayjs.locale(ptBr);

const ACAO_LABELS: Record<AcaoAuditoria, string> = {
  CRIADO: 'Criação',
  ATUALIZADO: 'Atualização',
  EXCLUIDO: 'Exclusão',
  STATUS_ALTERADO: 'Status alterado',
  APROVADO: 'Aprovação',
  REPROVADO: 'Reprovação',
  VALIDADO: 'Validação',
};

const ACAO_COLORS: Record<AcaoAuditoria, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  CRIADO: 'info',
  ATUALIZADO: 'default',
  EXCLUIDO: 'error',
  STATUS_ALTERADO: 'warning',
  APROVADO: 'success',
  REPROVADO: 'error',
  VALIDADO: 'success',
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

export default function AuditLog() {
  const { projectId } = useParams();
  const [filterAcao, setFilterAcao] = useState<string>('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = mockAudit
    .filter((a) => (a.projetoId ?? 1) === Number(projectId))
    .filter((a) => !filterAcao || a.acao === filterAcao)
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.userName.toLowerCase().includes(q) || a.descricao.toLowerCase().includes(q);
    })
    .filter((a) => {
      const d = dayjs(a.data);
      if (dateFrom && d.isBefore(dateFrom.startOf('day'))) return false;
      if (dateTo && d.isAfter(dateTo.endOf('day'))) return false;
      return true;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(0);
  };

  const handleFilterChange = (value: string) => {
    setFilterAcao(value);
    setPage(0);
  };

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
            value={filterAcao}
            onChange={(e) => handleFilterChange(e.target.value)}
            displayEmpty
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas as ações</MenuItem>
            {Object.entries(ACAO_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </Box>

        {/* Results count */}
        <Typography variant="body2" sx={{ mb: 1.5, color: 'text.secondary' }}>
          {filtered.length} {filtered.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </Typography>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<ManageSearchIcon sx={{ fontSize: 64 }} />}
            title="Nenhum registro encontrado"
            description="Tente ajustar os filtros para encontrar o que procura."
          />
        ) : (
          <Paper elevation={0} sx={{ border: '1px solid #E8EAED', borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Data/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Usuário</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Entidade</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Descrição</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {new Date(entry.data).toLocaleString('pt-BR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {entry.userName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ACAO_LABELS[entry.acao]}
                        color={ACAO_COLORS[entry.acao]}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={entry.entityType} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={entry.descricao} placement="top-start">
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#374151',
                          }}
                        >
                          {entry.descricao}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
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
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count}`
              }
            />
          </Paper>
        )}
      </Box>
    </LocalizationProvider>
  );
}
