import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
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
import { mockAudit } from '../../mocks/audit';
import { mockOrganizations } from '../../mocks/organizations';
import { mockProjects } from '../../mocks/projects';

export default function OrgDashboard() {
  const { orgId } = useParams();
  const navigate = useNavigate();

  const org = mockOrganizations.find((o) => o.id === Number(orgId));
  const projects = mockProjects.filter((p) => p.organizacaoId === Number(orgId));
  const recentActivity = mockAudit.slice(0, 8);

  const totalReqs = projects.reduce((acc, p) => acc + (p.totalRequisitos ?? 0), 0);
  const totalAprovados = projects.reduce((acc, p) => acc + (p.requisitosAprovados ?? 0), 0);
  const totalStakeholders = projects.reduce((acc, p) => acc + (p.totalStakeholders ?? 0), 0);

  if (!org) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary">
          Organização não encontrada.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
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
              <Typography variant="h2">{org.name}</Typography>
              <StatusChip status={org.plano} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>
              {org.description}
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
          { label: 'Projetos', value: projects.length, icon: <FolderIcon />, color: '#3B82F6' },
          { label: 'Requisitos', value: totalReqs, icon: <AssignmentIcon />, color: '#D97706' },
          { label: 'Stakeholders', value: totalStakeholders, icon: <GroupIcon />, color: '#8B5CF6' },
          { label: 'Aprovados', value: totalAprovados, icon: <CheckCircleIcon />, color: '#059669' },
        ].map((kpi) => (
          <Grid size={{ xs: 6, sm: 3 }} key={kpi.label}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontSize: 11,
                  }}
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
              projects.map((p) => {
                const total = p.totalRequisitos ?? 0;
                const approved = p.requisitosAprovados ?? 0;
                const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
                return (
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
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1,
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                          {p.name}
                        </Typography>
                        <StatusChip status={p.status} />
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', lineHeight: 1.6, flex: 1, overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                      >
                        {p.description.length > 110
                          ? p.description.slice(0, 110) + '…'
                          : p.description}
                      </Typography>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                            Requisitos aprovados
                          </Typography>
                          <Typography
                          variant="caption"
                          sx={
                            {
                              fontWeight: 700,
                              fontSize: 11,
                              color: progress === 100 ? 'success.main' : 'text.primary',
                            }
                          }
                        >
                            {approved}/{total} ({progress}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'background.default',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Grid>

        {/* Recent activity */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
            Atividade Recente
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                Nenhuma atividade ainda.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {recentActivity.map((a, i) => (
                  <Box key={a.id}>
                    <Box sx={{ py: 1.5, px: 0.5 }}>
                      <Box
                        sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 700, color: 'text.primary', fontSize: 12 }}
                        >
                          {a.userName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
                          {new Date(a.data).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}
                      >
                        {a.descricao}
                      </Typography>
                    </Box>
                    {i < recentActivity.length - 1 && <Divider />}
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
