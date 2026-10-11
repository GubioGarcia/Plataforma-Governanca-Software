import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import StatusChip from '../../components/common/StatusChip';
import OrgMembers from './OrgMembers';
import { buscarOrganizacaoPorId } from '../../services/organizacaoService';
import { isApiError } from '../../services/userService';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PAPEL_ORGANIZACAO_LABEL } from '../../types/acesso';
import type { OrganizacaoAPI } from '../../types/organizacao';

interface Props {
  orgId: string;
  /** Indicadores calculados pela lista de projetos (null enquanto carrega). */
  totalProjetos: number | null;
  totalRequisitos: number | null;
  totalAprovados: number | null;
}

/**
 * Parte de cima da tela da organização: dados da organização, indicadores e,
 * para quem tem papel na organização (ORG_VIEW_USERS), membros e convites.
 */
export default function OrgResumo({ orgId, totalProjetos, totalRequisitos, totalAprovados }: Props) {
  const { notify } = useSnackbar();
  const { organizacaoAtual, podeNaOrganizacao } = usePermissions();

  const [org, setOrg] = useState<OrganizacaoAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalMembros, setTotalMembros] = useState<number | null>(null);

  // Membros: quem tem papel na organização (convidado só a projetos não vê a lista)
  const veMembros = podeNaOrganizacao(orgId, 'ORG_VIEW_USERS');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setOrg(await buscarOrganizacaoPorId(orgId));
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao carregar a organização' : 'Erro ao carregar a organização', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, notify]);

  useEffect(() => { load(); }, [load]);

  const aoMudarMembros = useCallback((total: number) => setTotalMembros(total), []);

  const papelOrg = organizacaoAtual?.papel;
  const valor = (v: number | null) => v ?? '—';

  const kpis = [
    { label: 'Projetos', value: valor(totalProjetos), icon: <FolderIcon />, color: '#3B82F6' },
    { label: 'Requisitos', value: valor(totalRequisitos), icon: <AssignmentIcon />, color: '#D97706' },
    { label: 'Aprovados', value: valor(totalAprovados), icon: <CheckCircleIcon />, color: '#059669' },
    ...(veMembros ? [{ label: 'Membros', value: valor(totalMembros), icon: <GroupIcon />, color: '#8B5CF6' }] : []),
  ];

  return (
    <Box>
      {/* Dados da organização */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BusinessIcon sx={{ color: 'primary.contrastText', fontSize: 30 }} />
        </Box>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>{org?.nome ?? 'Organização'}</Typography>
              {org?.plano && <StatusChip status={org.plano} />}
              {papelOrg && (
                <Chip label={`Você: ${PAPEL_ORGANIZACAO_LABEL[papelOrg]}`} size="small"
                  sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: 11 }} />
              )}
              {org?.ativo === false && <Chip label="Inativa" size="small" color="default" />}
            </Box>
            {org?.descricao && (
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 700, overflowWrap: 'anywhere' }}>{org.descricao}</Typography>
            )}
          </Box>
        )}
      </Box>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: veMembros ? 3 : 0 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, sm: 12 / kpis.length }} key={kpi.label}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>
                  {kpi.label}
                </Typography>
                <Box sx={{ color: kpi.color, display: 'flex' }}>{kpi.icon}</Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: kpi.color }}>{kpi.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Membros e convites */}
      {veMembros && <OrgMembers orgId={orgId} onMudou={aoMudarMembros} />}
    </Box>
  );
}
