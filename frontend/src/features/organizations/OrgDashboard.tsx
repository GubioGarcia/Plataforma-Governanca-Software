import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import GroupIcon from '@mui/icons-material/Group';
import StatusChip from '../../components/common/StatusChip';
import OrgMembers from './OrgMembers';
import { buscarOrganizacaoPorId } from '../../services/organizacaoService';
import { listarProjetosPorOrg, listarRequisitosResumoPorProjeto } from '../../services/projetoService';
import { isApiError } from '../../services/userService';
import { useSnackbar } from '../../context/SnackbarContext';
import { usePermissions } from '../../hooks/usePermissions';
import { PAPEL_ORGANIZACAO_LABEL, PAPEL_PROJETO_LABEL } from '../../types/acesso';
import type { OrganizacaoAPI } from '../../types/organizacao';
import type { ProjetoAPI } from '../../types/projeto';

interface ReqResumo { total: number; aprovados: number }

export default function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const { organizacaoAtual, podeNaOrganizacao } = usePermissions();

  const [org, setOrg] = useState<OrganizacaoAPI | null>(null);
  const [projects, setProjects] = useState<ProjetoAPI[]>([]);
  const [resumos, setResumos] = useState<Record<string, ReqResumo>>({});
  const [totalMembros, setTotalMembros] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Membros: quem tem papel na organização (convidado só a projetos não vê a lista)
  const veMembros = !!orgId && podeNaOrganizacao(orgId, 'ORG_VIEW_USERS');

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      // O backend já filtra: convidado só recebe os projetos em que participa
      const [o, lista] = await Promise.all([buscarOrganizacaoPorId(orgId), listarProjetosPorOrg(orgId)]);
      setOrg(o);
      setProjects(lista);
      const pares = await Promise.all(
        lista.map(async (p) => [p.id, await listarRequisitosResumoPorProjeto(p.id).catch(() => ({ total: 0, aprovados: 0 }))] as const),
      );
      setResumos(Object.fromEntries(pares));
    } catch (err) {
      notify(isApiError(err) ? err.response?.data?.detail ?? 'Erro ao carregar a organização' : 'Erro ao carregar a organização', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, notify]);

  useEffect(() => { load(); }, [load]);

  const aoMudarMembros = useCallback((total: number) => setTotalMembros(total), []);

  if (loading) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!org || !orgId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">Organização não encontrada.</Typography>
      </Box>
    );
  }

  const totalReqs = Object.values(resumos).reduce((acc, r) => acc + r.total, 0);
  const totalAprovados = Object.values(resumos).reduce((acc, r) => acc + r.aprovados, 0);
  const papelOrg = organizacaoAtual?.papel;
  const papeisPorProjeto = new Map((organizacaoAtual?.projetos ?? []).map((p) => [p.id, p.papeis]));

  const kpis = [
    { label: 'Projetos', value: projects.length, icon: <FolderIcon />, color: '#3B82F6' },
    { label: 'Requisitos', value: totalReqs, icon: <AssignmentIcon />, color: '#D97706' },
    { label: 'Aprovados', value: totalAprovados, icon: <CheckCircleIcon />, color: '#059669' },
    ...(veMembros ? [{ label: 'Membros', value: totalMembros ?? '—', icon: <GroupIcon />, color: '#8B5CF6' }] : []),
  ];

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
      <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BusinessIcon sx={{ color: 'primary.contrastText', fontSize: 30 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="h2">{org.nome}</Typography>
                <StatusChip status={org.plano} />
                {papelOrg && (
                  <Chip label={`Você: ${PAPEL_ORGANIZACAO_LABEL[papelOrg]}`} size="small"
                    sx={{ bgcolor: '#EDE9FE', color: '#7C3AED', fontWeight: 600, fontSize: 11 }} />
                )}
                {org.ativo === false && <Chip label="Inativa" size="small" color="default" />}
              </Box>
              {org.descricao && (
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>{org.descricao}</Typography>
              )}
            </Box>
          </Box>
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => navigate(`/organizations/${orgId}/projects`)}>
            Ver Projetos
          </Button>
        </Box>

        {/* KPIs */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
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

        <Grid container spacing={3}>
          {/* Projetos */}
          <Grid size={{ xs: 12, lg: veMembros ? 7 : 12 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
              {papelOrg ? 'Projetos da Organização' : 'Seus projetos nesta organização'}
            </Typography>
            <Grid container spacing={2}>
              {projects.length === 0 ? (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Nenhum projeto nesta organização ainda.
                  </Typography>
                </Grid>
              ) : (
                projects.map((p) => {
                  const r = resumos[p.id] ?? { total: 0, aprovados: 0 };
                  const progress = r.total > 0 ? Math.round((r.aprovados / r.total) * 100) : 0;
                  const papeis = papeisPorProjeto.get(p.id) ?? [];
                  return (
                    <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                      <Paper
                        variant="outlined"
                        onClick={() => navigate(`/organizations/${orgId}/projects/${p.id}`)}
                        sx={{
                          p: 2.5, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1.5,
                          cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere' }}>
                            {p.nome}
                          </Typography>
                          {p.status && <StatusChip status={p.status.nome} />}
                        </Box>
                        {p.descricao && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, flex: 1, overflowWrap: 'anywhere' }}>
                            {p.descricao.length > 110 ? p.descricao.slice(0, 110) + '…' : p.descricao}
                          </Typography>
                        )}
                        {papeis.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {papeis.map((x) => (
                              <Chip key={x} label={PAPEL_PROJETO_LABEL[x]} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                            ))}
                          </Box>
                        )}
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>Requisitos aprovados</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 11 }}>
                              {r.aprovados}/{r.total} ({progress}%)
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={progress}
                            sx={{ height: 6, borderRadius: 3, bgcolor: 'background.default', '& .MuiLinearProgress-bar': { borderRadius: 3 } }} />
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Grid>

          {/* Membros */}
          {veMembros && (
            <Grid size={{ xs: 12, lg: 5 }}>
              <OrgMembers orgId={orgId} onMudou={aoMudarMembros} />
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}
