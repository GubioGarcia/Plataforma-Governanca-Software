import {
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import { listarAuditorias } from '../../services/auditService';
import type { AcaoAuditoria, AuditoriaAPI } from '../../types/auditoriaAPI';

// ─── constantes ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 4;

const CAMPO_LABELS: Record<string, string> = {
  titulo:                    'Nome',
  descricao:                 'Descrição',
  tipo:                      'Tipo',
  status:                    'Status',
  prioridade:                'Prioridade',
  versao:                    'Versão',
  ativo:                     'Estado',
  nome:                      'Nome',
  criterio_aceite:           'Critério de Aceite',
  criterio_aceite_descricao: 'Desc. Critério de Aceite',
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

/**
 * Metadados visuais por tipo de ação.
 * Cada ação tem: label em PT-BR, cor do texto/ícone, cor de fundo do badge e ícone MUI.
 */
const ACAO_CONFIG: Record<
  AcaoAuditoria,
  { label: string; color: string; bgLight: string; bgDark: string; Icon: React.ElementType }
> = {
  CRIACAO: {
    label:   'Criação',
    color:   '#16A34A',
    bgLight: '#F0FDF4',
    bgDark:  '#052E16',
    Icon:    AddCircleOutlineIcon,
  },
  EDICAO: {
    label:   'Edição',
    color:   '#2563EB',
    bgLight: '#EFF6FF',
    bgDark:  '#1E3A5F',
    Icon:    EditOutlinedIcon,
  },
  EXCLUSAO: {
    label:   'Exclusão',
    color:   '#DC2626',
    bgLight: '#FEF2F2',
    bgDark:  '#450A0A',
    Icon:    DeleteOutlineIcon,
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function campoLabel(campo: string): string {
  return CAMPO_LABELS[campo] ?? campo;
}

// ─── tipos públicos ───────────────────────────────────────────────────────────

interface Props {
  entidadeTipo: string;
  entidadeId: string;
}

export interface AuditCardHandle {
  reload: () => void;
}

// ─── componente principal ─────────────────────────────────────────────────────

const AuditCard = forwardRef<AuditCardHandle, Props>(function AuditCard(
  { entidadeTipo, entidadeId },
  ref,
) {
  const [auditorias, setAuditorias] = useState<AuditoriaAPI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarAuditorias(entidadeTipo, entidadeId);
      setAuditorias(data);
      setPage(0);
    } catch {
      // silencioso — card exibe estado vazio
    } finally {
      setLoading(false);
    }
  }, [entidadeTipo, entidadeId]);

  useImperativeHandle(ref, () => ({ reload: load }), [load]);
  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(auditorias.length / PAGE_SIZE);
  const paginated  = auditorias.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>

        {/* ── Cabeçalho ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
            Alterações
          </Typography>

          {/* Contador de registros totais */}
          {!loading && auditorias.length > 0 && (
            <Tooltip title={`${auditorias.length} alteração${auditorias.length !== 1 ? 'ões' : ''} no total`}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: '50%',
                  minWidth: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  px: 0.5,
                  cursor: 'default',
                }}
              >
                {auditorias.length}
              </Box>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ── Loading ── */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={22} />
          </Box>
        )}

        {/* ── Estado vazio ── */}
        {!loading && auditorias.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 3,
              border: '1.5px dashed',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <HistoryIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 13 }}>
              Nenhuma alteração registrada.
            </Typography>
          </Box>
        )}

        {/* ── Entradas ── */}
        {!loading && auditorias.length > 0 && (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {paginated.map((a) => (
                <AuditEntry key={a.id} entry={a} />
              ))}
            </Box>

            {/* ── Paginação ── */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mt: 2,
                  pt: 1.5,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
                  {page + 1} de {totalPages}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Página anterior">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 0}
                        sx={{ width: 28, height: 28 }}
                      >
                        <ChevronLeftIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Próxima página">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages - 1}
                        sx={{ width: 28, height: 28 }}
                      >
                        <ChevronRightIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});

export default AuditCard;

// ─── AuditEntry ───────────────────────────────────────────────────────────────

function AuditEntry({ entry }: { entry: AuditoriaAPI }) {
  const cfg = ACAO_CONFIG[entry.acao] ?? ACAO_CONFIG.EDICAO;
  const { label, color, bgLight, Icon } = cfg;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        '&:hover': { borderColor: 'primary.light' },
        transition: 'border-color 0.12s',
      }}
    >
      {/* ── Linha topo: campo + badge de ação ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.75,
        }}
      >
        {/* Nome do campo alterado */}
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            color: 'text.secondary',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {campoLabel(entry.campoAlterado)}
        </Typography>

        {/* Badge da ação: ícone + label colorido */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            bgcolor: bgLight,
            border: `1px solid ${color}22`,
            borderRadius: 1,
            px: 0.75,
            py: 0.3,
          }}
        >
          <Icon sx={{ fontSize: 11, color }} />
          <Typography
            variant="caption"
            sx={{ fontSize: 10, fontWeight: 700, color, lineHeight: 1 }}
          >
            {label}
          </Typography>
        </Box>
      </Box>

      {/* ── Valores anterior / novo ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, mb: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', minWidth: 52, fontSize: 11, flexShrink: 0 }}
          >
            Anterior:
          </Typography>
          <Tooltip title={entry.valorAnterior ?? ''} placement="top">
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontStyle: entry.valorAnterior ? 'normal' : 'italic',
                fontSize: 11,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                textDecoration: entry.valorAnterior ? 'line-through' : 'none',
                textDecorationColor: 'rgba(107,114,128,0.4)',
              }}
            >
              {entry.valorAnterior ?? '—'}
            </Typography>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', minWidth: 52, fontSize: 11, flexShrink: 0 }}
          >
            Alterado:
          </Typography>
          <Tooltip title={entry.valorNovo ?? ''} placement="top">
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: 11,
                maxWidth: 160,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                fontStyle: entry.valorNovo ? 'normal' : 'italic',
              }}
            >
              {entry.valorNovo ?? '—'}
            </Typography>
          </Tooltip>
        </Box>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* ── Metadados: autor + data ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        {entry.usuarioNome && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PersonIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
              {entry.usuarioNome}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
            {formatDateTime(entry.dataAlteracao)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
