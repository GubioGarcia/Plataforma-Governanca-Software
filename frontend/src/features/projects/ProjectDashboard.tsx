import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import StatusChip from '../../components/common/StatusChip';
import { mockProjects } from '../../mocks/projects';
import { mockRequirements } from '../../mocks/requirements';
import { mockEvents } from '../../mocks/events';
import { mockWiki } from '../../mocks/wiki';
import { mockStakeholders } from '../../mocks/stakeholders';
import { mockAudit } from '../../mocks/audit';

export default function ProjectDashboard() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const base = `/organizations/${orgId}/projects/${projectId}`;

  const project = mockProjects.find((p) => p.id === Number(projectId));
  const requirements = mockRequirements.filter((r) => r.projetoId === Number(projectId));
  const events = mockEvents.filter((e) => String(e.projetoId) === String(projectId));
  const wiki = mockWiki[Number(projectId)];
  const stakeholders = mockStakeholders.filter((s) => s.projetoId === Number(projectId));

  const parseOptionalDate = (value?: string | number | Date) => {
    if (!value) return null;
    return new Date(value);
  };

  const recentActivity = [...mockAudit]
    .filter((a) => (a.projetoId ?? 1) === Number(projectId))
    .sort((a, b) => {
      const dateA = parseOptionalDate(a.data);
      const dateB = parseOptionalDate(b.data);
      return (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    })
    .slice(0, 5);

  if (!project) return null;

  const reqByStatus = {
    rascunho: requirements.filter((r) => r.status === 'RASCUNHO').length,
    emAnalise: requirements.filter((r) => r.status === 'EM_ANALISE').length,
    emValidacao: requirements.filter((r) => r.status === 'EM_VALIDACAO').length,
    aprovado: requirements.filter((r) => r.status === 'APROVADO').length,
    validado: requirements.filter((r) => r.status === 'VALIDADO').length,
  };
  const total = requirements.length || 1;

  const nextEvents = [...events]
    .filter((e) => {
      const eventDate = parseOptionalDate(e.dataHoraInicio);
      return eventDate !== null && eventDate >= new Date();
    })
    .sort((a, b) => {
      const dateA = parseOptionalDate(a.dataHoraInicio);
      const dateB = parseOptionalDate(b.dataHoraInicio);
      return (dateA?.getTime() ?? 0) - (dateB?.getTime() ?? 0);
    })
    .slice(0, 3);

  const topStakeholders = [...stakeholders]
    .sort((a, b) => (b.totalInteracoes ?? 0) - (a.totalInteracoes ?? 0))
    .slice(0, 4);

  const activityColor: Record<string, string> = {
    CRIADO: '#16A34A', APROVADO: '#3F51B5', REPROVADO: '#DC2626',
    ATUALIZADO: '#D97706', STATUS_ALTERADO: '#7C3AED', REMOVIDO: '#6B7280',
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Project header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h2">{project.name}</Typography>
          <StatusChip status={project.status} size="medium" />
        </Box>
        <Typography variant="body2" sx={{ maxWidth: 640 }}>
          {project.description}
        </Typography>
      </Box>

      {/* Sections */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* KPI cards */}
      <Grid container spacing={3}>
        {[
          { icon: <ChecklistIcon />, label: 'Total de Requisitos', value: requirements.length, color: '#3F51B5', bg: '#EEF2FF' },
          { icon: <ChecklistIcon />, label: 'Aprovados / Validados', value: reqByStatus.aprovado + reqByStatus.validado, color: '#16A34A', bg: '#F0FDF4' },
          { icon: <ChecklistIcon />, label: 'Em Validação', value: reqByStatus.emValidacao, color: '#D97706', bg: '#FFFBEB' },
          { icon: <AutoStoriesIcon />, label: 'Participação WIKI', value: `${wiki?.stakeholderParticipacao ?? 0}%`, color: '#7C3AED', bg: '#EDE9FE' },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '10px',
                    bgcolor: kpi.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                    '& .MuiSvgIcon-root': { color: kpi.color, fontSize: 20 },
                  }}
                >
                  {kpi.icon}
                </Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 700, color: kpi.color, lineHeight: 1 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption">{kpi.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} alignItems="stretch">
        {/* Quick access */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>Acesso Rápido</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { icon: <AutoStoriesIcon sx={{ fontSize: 18 }} />, label: 'WIKI do Projeto', desc: 'Objetivo, KPIs, restrições', to: `${base}/wiki`, color: '#7C3AED' },
                  { icon: <ChecklistIcon sx={{ fontSize: 18 }} />, label: 'Requisitos', desc: `${requirements.length} requisitos`, to: `${base}/requirements`, color: '#3F51B5' },
                  { icon: <EventNoteIcon sx={{ fontSize: 18 }} />, label: 'Eventos', desc: `${events.length} eventos`, to: `${base}/events`, color: '#3B82F6' },
                  { icon: <FolderOpenIcon sx={{ fontSize: 18 }} />, label: 'Arquivos', desc: 'Repositório de documentos', to: `${base}/files`, color: '#D97706' },
                ].map((item) => (
                  <Box
                    key={item.label}
                    onClick={() => navigate(item.to)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box
                      sx={{
                        width: 34, height: 34, borderRadius: '8px',
                        bgcolor: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '& .MuiSvgIcon-root': { color: item.color },
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{item.label}</Typography>
                      <Typography variant="caption">{item.desc}</Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Próximos eventos */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Próximos Eventos</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate(`${base}/events`)}
                  sx={{ fontSize: '12px' }}
                >
                  Ver todos
                </Button>
              </Box>

              {nextEvents.length === 0 ? (
                <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  Nenhum evento próximo
                </Typography>
              ) : (
                <List dense disablePadding>
                  {nextEvents.map((event, idx) => (
                    <Box key={event.id}>
                      <ListItem disableGutters sx={{ py: 1.5 }}>
                        <Box sx={{ mr: 1.5 }}>
                          <Box
                            sx={{
                              width: 38, height: 38, borderRadius: '8px',
                              bgcolor: '#EEF2FF', display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'primary.main', lineHeight: 1 }}>
                              {event.dataHoraInicio ? new Date(event.dataHoraInicio).toLocaleDateString('pt-BR', { day: '2-digit' }) : '--'}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: 'primary.main', lineHeight: 1 }}>
                              {event.dataHoraInicio ? new Date(event.dataHoraInicio).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase() : '---'}
                            </Typography>
                          </Box>
                        </Box>
                        <ListItemText
                          primary={event.nome}
                          secondary={(event.tipo ?? 'REUNIAO').charAt(0) + (event.tipo ?? 'REUNIAO').slice(1).toLowerCase()}
                          primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
                          secondaryTypographyProps={{ fontSize: '12px' }}
                        />
                      </ListItem>
                      {idx < nextEvents.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Requirements funnel + Stakeholder summary */}
      <Grid container spacing={3} alignItems="stretch">
        {/* Requirements Status Funnel */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h5">Funil de Requisitos</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate(`${base}/requirements`)}
                  sx={{ fontSize: '12px' }}
                >
                  Ver requisitos
                </Button>
              </Box>
              {[
                { label: 'Rascunho', count: reqByStatus.rascunho, color: '#94A3B8', bg: '#F1F5F9' },
                { label: 'Em Análise', count: reqByStatus.emAnalise, color: '#3B82F6', bg: '#EFF6FF' },
                { label: 'Em Validação', count: reqByStatus.emValidacao, color: '#D97706', bg: '#FFFBEB' },
                { label: 'Aprovado', count: reqByStatus.aprovado, color: '#16A34A', bg: '#F0FDF4' },
                { label: 'Validado', count: reqByStatus.validado, color: '#7C3AED', bg: '#EDE9FE' },
              ].map((step) => (
                <Box key={step.label} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 500, color: step.color }}>{step.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {step.count} / {requirements.length}
                    </Typography>
                  </Box>
                  <Tooltip title={`${Math.round((step.count / total) * 100)}%`} placement="top">
                    <LinearProgress
                      variant="determinate"
                      value={(step.count / total) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: step.bg,
                        '& .MuiLinearProgress-bar': { bgcolor: step.color, borderRadius: 4 },
                      }}
                    />
                  </Tooltip>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Stakeholder Summary */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <GroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="h5">Stakeholders</Typography>
                </Box>
                <Chip label={stakeholders.length} size="small" sx={{ bgcolor: '#EEF2FF', color: '#3F51B5', fontWeight: 700 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {topStakeholders.map((s) => (
                  <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '13px', bgcolor: '#3F51B5' }}>
                      {s.userName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.userName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                        {s.papel.charAt(0) + s.papel.slice(1).toLowerCase()}
                      </Typography>
                    </Box>
                    <Tooltip title={`${s.totalInteracoes} interações`}>
                      <Chip label={s.totalInteracoes} size="small" variant="outlined" sx={{ fontSize: '11px', height: 20 }} />
                    </Tooltip>
                  </Box>
                ))}
              </Box>
              {topStakeholders.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  Nenhum stakeholder
                </Typography>
              )}
              {stakeholders.length > 4 && (
                <Button
                  size="small"
                  fullWidth
                  sx={{ mt: 1.5, fontSize: '12px' }}
                  onClick={() => navigate(`${base}/stakeholders`)}
                >
                  Ver todos ({stakeholders.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="h5">Atividade Recente</Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate(`${base}/audit`)}
                  sx={{ fontSize: '12px' }}
                >
                  Log completo
                </Button>
              </Box>
              {recentActivity.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                  Nenhuma atividade registrada
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {recentActivity.map((entry, idx) => {
                    const color = activityColor[entry.acao] ?? '#6B7280';
                    return (
                      <Box key={entry.id}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
                          <Box sx={{ mt: 0.25 }}>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: `${color}20`, fontSize: '12px' }}>
                              {entry.userName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </Avatar>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                              {entry.descricao}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                              {entry.userName} · {entry.data ? new Date(entry.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Data indisponível'}
                            </Typography>
                          </Box>
                          <Chip
                            label={entry.entityType}
                            size="small"
                            sx={{ bgcolor: `${color}15`, color, fontWeight: 600, fontSize: '10px', height: 20 }}
                          />
                        </Box>
                        {idx < recentActivity.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      </Box>
    </Box>
  );
}
