import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FolderIcon from '@mui/icons-material/Folder';
import StatusChip from '../../components/common/StatusChip';
import type { OrganizacaoAPI } from '../../types/organizacao';
import type { ProjetoAPI } from '../../types/projeto';
import { buscarOrganizacao } from '../../services/organizacaoService';
import { listarProjetosPorOrg } from '../../services/projetoService';

export default function OrgDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<OrganizacaoAPI | null>(null);
  const [projects, setProjects] = useState<ProjetoAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    const fetchData = async () => {
      try {
        const [orgData, projetosData] = await Promise.all([
          buscarOrganizacao(orgId),
          listarProjetosPorOrg(orgId),
        ]);
        setOrg(orgData);
        setProjects(projetosData);
      } catch {
        // org permanece null — será exibida mensagem de não encontrada
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orgId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!org) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Organização não encontrada.
        </Typography>
      </Box>
    );
  }

  const totalProjetos = projects.length;
  const totalAtivos = projects.filter((p) => p.ativo).length;

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Botão Voltar */}
      <Box sx={{ mb: 1 }}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/organizations')}
          sx={{ color: 'text.secondary', pl: 0 }}
        >
          Voltar às organizações
        </Button>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 4,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BusinessIcon sx={{ color: 'primary.contrastText', fontSize: 30 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h2">{org.nome}</Typography>
              <StatusChip status={org.plano} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
              {org.descricao}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(`/organizations/${orgId}/projects`)}
        >
          Ver Projetos
        </Button>
      </Box>

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Projetos',    value: totalProjetos, icon: <FolderIcon />,       color: '#3B82F6' },
          { label: 'Ativos',     value: totalAtivos,   icon: <CheckCircleIcon />,   color: '#059669' },
          { label: 'Requisitos', value: 0,             icon: <AssignmentIcon />,    color: '#D97706' },
        ].map((kpi) => (
          <Grid size={{ xs: 6, sm: 3 }} key={kpi.label}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}
                >
                  {kpi.label}
                </Typography>
                <Box sx={{ color: kpi.color, display: 'flex' }}>{kpi.icon}</Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Projects grid */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Projetos da Organização
          </Typography>
          <Grid container spacing={2}>
            {projects.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  Nenhum projeto nesta organização ainda.
                </Typography>
              </Grid>
            ) : (
              projects.map((p) => (
                <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                      transition: 'all 0.15s',
                    }}
                    onClick={() => navigate(`/organizations/${orgId}/projects/${p.id}`)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {p.nome}
                      </Typography>
                      <StatusChip status={p.status?.nome ?? 'N/A'} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, flex: 1 }}>
                      {p.descricao.length > 110 ? p.descricao.slice(0, 110) + '…' : p.descricao}
                    </Typography>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        </Grid>

        {/* Recent activity — sem endpoint disponível ainda */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Atividade Recente
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              Nenhuma atividade disponível.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
