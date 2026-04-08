import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { mockProjects } from '../mocks/projects';
import { mockRequirements } from '../mocks/requirements';
import { mockStakeholders } from '../mocks/stakeholders';
import { mockAudit } from '../mocks/audit';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  PLANEJAMENTO:       { label: 'Planejamento',      bg: '#EFF6FF', color: '#2563EB' },
  EM_DESENVOLVIMENTO: { label: 'Em desenvolvimento', bg: '#FFFBEB', color: '#D97706' },
  CONCLUIDO:          { label: 'Concluído',           bg: '#F0FDF4', color: '#16A34A' },
  CANCELADO:          { label: 'Cancelado',           bg: '#FEF2F2', color: '#DC2626' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGestor, isStakeholder, canVote } = usePermissions();

  const activeProjects = mockProjects.filter(
    (p) => p.status === 'EM_DESENVOLVIMENTO' || p.status === 'PLANEJAMENTO',
  );

  const allReqs = mockRequirements;
  const pendingVote = allReqs.filter((r) => {
    if (r.status !== 'EM_VALIDACAO') return false;
    if (!canVote) return false;
    const myVote = r.votos?.find((v) => v.userId === user?.id);
    return !myVote || myVote.voto === null;
  });

  const totalStakeholders = [...new Set(mockStakeholders.map((s) => s.userId))].length;
  const totalValidados = allReqs.filter((r) => r.status === 'VALIDADO').length;

  const recentActivity = mockAudit.slice(0, 6);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
    GESTOR:      { bg: '#EDE9FE', color: '#7C3AED' },
    ANALISTA:    { bg: '#D1FAE5', color: '#059669' },
    STAKEHOLDER: { bg: '#DBEAFE', color: '#2563EB' },
  };
  const roleStyle = ROLE_STYLE[user?.role ?? 'GESTOR'];

  return (
    <Box sx={{ flexGrow: 1, overflowY: 'auto', p: { xs: 2, sm: 4 }, bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>

        {/* ── Cabeçalho de boas-vindas ── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h2">
              {saudacao}, {user?.nome.split(' ')[0]}!
            </Typography>
            <Chip
              label={user?.role}
              size="small"
              sx={{ bgcolor: roleStyle.bg, color: roleStyle.color, fontWeight: 700, fontSize: '11px' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Aqui está um resumo do que está acontecendo na plataforma.
          </Typography>
        </Box>

        {/* ── Cards de métricas ── */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            {
              icon: <FolderOpenIcon />,
              label: 'Projetos ativos',
              value: activeProjects.length,
              color: '#2563EB',
              bg: '#EFF6FF',
              onClick: () => navigate('/organizations'),
            },
            {
              icon: <AssignmentIcon />,
              label: 'Requisitos validados',
              value: totalValidados,
              color: '#16A34A',
              bg: '#F0FDF4',
              onClick: undefined,
            },
            {
              icon: <HowToVoteIcon />,
              label: 'Aguardando seu voto',
              value: pendingVote.length,
              color: pendingVote.length > 0 ? '#D97706' : '#6B7280',
              bg: pendingVote.length > 0 ? '#FFFBEB' : '#F9FAFB',
              onClick: undefined,
            },
            {
              icon: <PeopleIcon />,
              label: 'Stakeholders',
              value: totalStakeholders,
              color: '#7C3AED',
              bg: '#EDE9FE',
              onClick: undefined,
            },
          ].map((stat) => (
            <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
              <Card
                elevation={0}
                onClick={stat.onClick}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  cursor: stat.onClick ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s',
                  '&:hover': stat.onClick ? { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' } : {},
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Box
                    sx={{
                      width: 40, height: 40, borderRadius: 2,
                      bgcolor: stat.bg, color: stat.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      mb: 1.5, '& svg': { fontSize: 20 },
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography sx={{ fontSize: 28, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* ── Projetos ativos ── */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Projetos ativos</Typography>
                  {isGestor && (
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{ fontSize: '12px', color: 'text.secondary' }}
                      onClick={() => navigate('/organizations')}
                    >
                      Ver todos
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {activeProjects.slice(0, 4).map((proj) => {
                    const style = STATUS_STYLE[proj.status];
                    const progress = proj.totalRequisitos
                      ? Math.round(((proj.requisitosAprovados ?? 0) / proj.totalRequisitos) * 100)
                      : 0;
                    return (
                      <Box
                        key={proj.id}
                        sx={{
                          p: 2, borderRadius: 2, border: '1px solid',
                          borderColor: 'divider', cursor: 'pointer',
                          transition: 'background 0.15s',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => navigate(`/organizations/${proj.organizacaoId}/projects/${proj.id}`)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1, mr: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                              {proj.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {proj.totalStakeholders ?? 0} stakeholders · {proj.totalRequisitos ?? 0} requisitos
                            </Typography>
                          </Box>
                          <Chip
                            label={style.label}
                            size="small"
                            sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600, fontSize: '10px', height: 20 }}
                          />
                        </Box>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Requisitos aprovados</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 5, borderRadius: 3,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': { bgcolor: style.color, borderRadius: 3 },
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                  {activeProjects.length === 0 && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
                      Nenhum projeto ativo no momento.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Coluna direita ── */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Pendências de votação */}
            {canVote && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: pendingVote.length > 0 ? '#FCD34D' : 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HowToVoteIcon sx={{ fontSize: 18, color: pendingVote.length > 0 ? '#D97706' : 'text.disabled' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Aguardando validação
                    </Typography>
                    {pendingVote.length > 0 && (
                      <Chip
                        label={pendingVote.length}
                        size="small"
                        sx={{ bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 700, height: 20, fontSize: '11px', ml: 'auto' }}
                      />
                    )}
                  </Box>

                  {pendingVote.length === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                      <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Nenhuma pendência. Tudo em dia!
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {pendingVote.slice(0, 3).map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            p: 1.5, borderRadius: 1.5, bgcolor: '#FFFBEB',
                            border: '1px solid #FCD34D', cursor: 'pointer',
                            '&:hover': { bgcolor: '#FEF3C7' },
                          }}
                          onClick={() => navigate(`/organizations/1/projects/${r.projetoId}/requirements`)}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.4 }}>
                            {r.titulo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#D97706' }}>
                            Clique para votar
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Atividade recente */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', flex: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Atividade recente
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {recentActivity.map((a, idx) => (
                    <Box key={a.id}>
                      <Box sx={{ display: 'flex', gap: 1.5, py: 1.25, alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            width: 28, height: 28, fontSize: '11px', fontWeight: 700,
                            bgcolor: 'primary.main', flexShrink: 0,
                          }}
                        >
                          {initials(a.userName)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ display: 'block', lineHeight: 1.4, color: 'text.primary' }}>
                            {a.descricao}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                            <AccessTimeIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '11px' }}>
                              {timeAgo(a.data)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      {idx < recentActivity.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
