import { useState, useEffect, useCallback } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GroupIcon from '@mui/icons-material/Group';
import HistoryIcon from '@mui/icons-material/History';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import StatusChip from '../../components/common/StatusChip';
import { buscarProjetoPorId } from '../../services/projetoService';
import { listarRequisitosPorProjeto, listarStatusRequisito } from '../../services/requirementService';
import { fetchEventsByProject } from '../../services/eventService';
import { listarAuditoriasPorProjeto } from '../../services/auditService';
import { buscarResumoPorProjeto } from '../../services/interacaoService';
import type { ProjetoAPI } from '../../types/projeto';
import type { RequisitoAPI, StatusRequisitoAPI } from '../../types/requirementAPI';
import type { EventoProjeto } from '../../types/event';
import type { AuditoriaAPI } from '../../types/auditoriaAPI';
import type { ResumoInteracaoProjeto } from '../../types/interacao';
import { usePermissions } from '../../hooks/usePermissions';

const activityColor: Record<string, string> = {
  CRIACAO: '#16A34A',
  EDICAO: '#D97706',
  EXCLUSAO: '#DC2626',
};

export default function ProjectDashboard() {
  const { orgId, projectId } = useParams<{ orgId: string; projectId: string }>();
  const navigate = useNavigate();
  const base = `/organizations/${orgId}/projects/${projectId}`;
  const { isStakeholder, user } = usePermissions();

  const [project, setProject]             = useState<ProjetoAPI | null>(null);
  const [reqs, setReqs]                   = useState<RequisitoAPI[]>([]);
  const [statusRequisito, setStatusRequisito] = useState<StatusRequisitoAPI[]>([]);
  const [events, setEvents]               = useState<EventoProjeto[]>([]);
  const [audit, setAudit]                 = useState<AuditoriaAPI[]>([]);
  const [resumo, setResumo]               = useState<ResumoInteracaoProjeto | null>(null);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [proj, req, ev, aud, res, statuses] = await Promise.allSettled([
        buscarProjetoPorId(projectId),
        listarRequisitosPorProjeto(projectId),
        fetchEventsByProject(projectId),
        listarAuditoriasPorProjeto(projectId),
        buscarResumoPorProjeto(projectId),
        listarStatusRequisito(),
      ]);
      if (proj.status    === 'fulfilled') setProject(proj.value);
      if (req.status     === 'fulfilled') setReqs(req.value);
      if (ev.status      === 'fulfilled') setEvents(ev.value);
      if (aud.status     === 'fulfilled') setAudit(aud.value);
      if (res.status     === 'fulfilled') setResumo(res.value);
      if (statuses.status === 'fulfilled') setStatusRequisito(statuses.value);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Derived: requisitos ───────────────────────────────────────────────────
  // Contagens por status (para os summary cards)
  const reqByStatus = {
    rascunho:    reqs.filter((r) => r.statusNome === 'RASCUNHO').length,
    emAnalise:   reqs.filter((r) => r.statusNome === 'EM_ANALISE').length,
    emValidacao: reqs.filter((r) => r.statusNome === 'EM_VALIDACAO').length,
    aprovado:    reqs.filter((r) => r.statusNome === 'APROVADO').length,
    validado:    reqs.filter((r) => r.statusNome === 'VALIDADO').length,
  };

  // Cores por nome de status (fallback para cinza)
  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    RASCUNHO:      { color: '#94A3B8', bg: '#F1F5F9' },
    EM_ANALISE:    { color: '#3B82F6', bg: '#EFF6FF' },
    EM_VALIDACAO:  { color: '#D97706', bg: '#FFFBEB' },
    APROVADO:      { color: '#16A34A', bg: '#F0FDF4' },
    VALIDADO:      { color: '#7C3AED', bg: '#EDE9FE' },
  };

  // Funil dinâmico baseado na API de status de requisitos
  const funnelSteps = [...statusRequisito]
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((s) => {
      const palette = STATUS_COLORS[s.nome] ?? { color: '#6B7280', bg: '#F9FAFB' };
      const label = s.nome.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        label,
        count: reqs.filter((r) => r.statusNome === s.nome).length,
        color: palette.color,
        bg:    palette.bg,
      };
    });
  const totalReqs = reqs.length || 1;

  // ── Derived: eventos ──────────────────────────────────────────────────────
  const nextEvents = [...events]
    .filter((e) => {
      const d = e.dataHoraInicio ? new Date(e.dataHoraInicio) : null;
      return d !== null && d >= new Date();
    })
    .sort((a, b) => new Date(a.dataHoraInicio!).getTime() - new Date(b.dataHoraInicio!).getTime())
    .slice(0, 3);

  // ── Derived: auditoria ────────────────────────────────────────────────────
  const recentActivity = [...audit]
    .filter((a) => !isStakeholder || a.usuarioId === user?.id)
    .sort((a, b) => new Date(b.dataAlteracao).getTime() - new Date(a.dataAlteracao).getTime())
    .slice(0, 5);

  // ── Derived: interações ───────────────────────────────────────────────────
  const totalInteracoes = resumo?.totalInteracoes ?? 0;
  const membros         = resumo?.porUsuario ?? [];
  const topMembros = [...membros]
    .sort((a, b) => b.totalInteracoes - a.totalInteracoes)
    .slice(0, 4);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Project header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h2">{project?.nome ?? 'Projeto'}</Typography>
          {project?.status && <StatusChip status={project.status.nome} size="medium" />}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          {project?.descricao ?? ''}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* KPI cards */}
        <Grid container spacing={3}>
          {[
            {
              icon: <ChecklistIcon />,
              label: 'Total de Requisitos',
              value: reqs.length,
              color: '#3F51B5',
              bg: '#EEF2FF',
            },
            {
              icon: <ChecklistIcon />,
              label: 'Aprovados / Validados',
              value: reqByStatus.aprovado + reqByStatus.validado,
              color: '#16A34A',
              bg: '#F0FDF4',
            },
            {
              icon: <ChecklistIcon />,
              label: 'Em Validação',
              value: reqByStatus.emValidacao,
              color: '#D97706',
              bg: '#FFFBEB',
            },
            {
              icon: <TouchAppIcon />,
              label: 'Total de Interações Stakeholders',
              value: totalInteracoes,
              color: '#7C3AED',
              bg: '#EDE9FE',
            },
          ].map((kpi) => (
            <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card elevation={0} variant="outlined">
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
                  <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick access + Próximos eventos */}
        <Grid container spacing={3} alignItems="stretch">
          {/* Quick access */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Acesso Rápido</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { icon: <AutoStoriesIcon sx={{ fontSize: 18 }} />, label: 'WIKI do Projeto', desc: 'Objetivo, KPIs, restrições', to: `${base}/wiki`, color: '#7C3AED' },
                    { icon: <ChecklistIcon sx={{ fontSize: 18 }} />, label: 'Requisitos', desc: `${reqs.length} requisito${reqs.length !== 1 ? 's' : ''}`, to: `${base}/requirements`, color: '#3F51B5' },
                    { icon: <EventNoteIcon sx={{ fontSize: 18 }} />, label: 'Eventos', desc: `${events.length} evento${events.length !== 1 ? 's' : ''}`, to: `${base}/events`, color: '#3B82F6' },
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
                        <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
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
            <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
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
                                {event.dataHoraInicio
                                  ? new Date(event.dataHoraInicio).toLocaleDateString('pt-BR', { day: '2-digit' })
                                  : '--'}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: 'primary.main', lineHeight: 1 }}>
                                {event.dataHoraInicio
                                  ? new Date(event.dataHoraInicio).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()
                                  : '---'}
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

        {/* Funil de Requisitos + Stakeholders */}
        <Grid container spacing={3} alignItems="stretch">
          {/* Requirements Status Funnel */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card elevation={0} variant="outlined">
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
                {funnelSteps.map((step) => (
                  <Box key={step.label} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 500, color: step.color }}>{step.label}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {step.count} / {reqs.length}
                      </Typography>
                    </Box>
                    <Tooltip title={`${Math.round((step.count / totalReqs) * 100)}%`} placement="top">
                      <LinearProgress
                        variant="determinate"
                        value={(step.count / totalReqs) * 100}
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
            <Card elevation={0} variant="outlined" sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="h5">Stakeholders</Typography>
                  </Box>
                  <Chip
                    label={membros.length}
                    size="small"
                    sx={{ bgcolor: '#EEF2FF', color: '#3F51B5', fontWeight: 700 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {topMembros.map((m) => {
                    const inits = m.usuarioNome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                    return (
                      <Box key={m.usuarioId} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {m.usuarioUrlFoto ? (
                          <Avatar src={m.usuarioUrlFoto} sx={{ width: 32, height: 32 }} />
                        ) : (
                          <Avatar sx={{ width: 32, height: 32, fontSize: '13px', bgcolor: '#3F51B5' }}>
                            {inits}
                          </Avatar>
                        )}
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.usuarioNome}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                            {m.usuarioEmail}
                          </Typography>
                        </Box>
                        <Tooltip title={`${m.totalInteracoes} interações`}>
                          <Chip label={m.totalInteracoes} size="small" variant="outlined" sx={{ fontSize: '11px', height: 20 }} />
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Box>
                {topMembros.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                    Nenhum stakeholder
                  </Typography>
                )}
                {membros.length > 4 && (
                  <Button
                    size="small"
                    fullWidth
                    sx={{ mt: 1.5, fontSize: '12px' }}
                    onClick={() => navigate(`${base}/stakeholders`)}
                  >
                    Ver todos ({membros.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Atividade Recente */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card elevation={0} variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="h5">Atividade Recente</Typography>
                  </Box>
                  {!isStakeholder && (
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate(`${base}/audit`)}
                    sx={{ fontSize: '12px' }}
                  >
                    Log completo
                  </Button>
                  )}
                </Box>
                {recentActivity.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                    Nenhuma atividade registrada
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {recentActivity.map((entry, idx) => {
                      const color = activityColor[entry.acao] ?? '#6B7280';
                      const name = entry.usuarioNome ?? 'Sistema';
                      const inits = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                      return (
                        <Box key={entry.id}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
                            <Box sx={{ mt: 0.25 }}>
                              {entry.usuarioAvatarUrl ? (
                                <Avatar src={entry.usuarioAvatarUrl} sx={{ width: 30, height: 30 }} />
                              ) : (
                                <Avatar sx={{ width: 30, height: 30, bgcolor: `${color}20`, fontSize: '12px', color }}>
                                  {inits}
                                </Avatar>
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                {entry.campoAlterado
                                  ? `${entry.entidadeTipo} — ${entry.campoAlterado}`
                                  : entry.entidadeTipo}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px' }}>
                                {name} · {new Date(entry.dataAlteracao).toLocaleDateString('pt-BR', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                })}
                              </Typography>
                            </Box>
                            <Chip
                              label={entry.acao}
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
