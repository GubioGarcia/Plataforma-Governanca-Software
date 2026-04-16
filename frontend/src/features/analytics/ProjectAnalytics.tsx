import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PendingIcon from '@mui/icons-material/Pending';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { mockRequirements } from '../../mocks/requirements';
import { mockStakeholders } from '../../mocks/stakeholders';
import { mockWiki } from '../../mocks/wiki';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  VALIDADO:      { label: 'Validado',       color: '#7C3AED', bg: '#EDE9FE', icon: <AssignmentTurnedInIcon sx={{ fontSize: 14 }} /> },
  APROVADO:      { label: 'Aprovado',       color: '#16A34A', bg: '#DCFCE7', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  EM_VALIDACAO:  { label: 'Em Validação',   color: '#D97706', bg: '#FEF3C7', icon: <HourglassTopIcon sx={{ fontSize: 14 }} /> },
  EM_ANALISE:    { label: 'Em Análise',     color: '#3B82F6', bg: '#EFF6FF', icon: <PendingIcon sx={{ fontSize: 14 }} /> },
  RASCUNHO:      { label: 'Rascunho',       color: '#6B7280', bg: '#F3F4F6', icon: <EditNoteIcon sx={{ fontSize: 14 }} /> },
  REPROVADO:     { label: 'Reprovado',      color: '#DC2626', bg: '#FEE2E2', icon: <ThumbDownIcon sx={{ fontSize: 14 }} /> },
};

const WIKI_SECTION_LABEL: Record<string, string> = {
  objetivo: 'Objetivo Geral',
  objetivosEspecificos: 'Objetivos Específicos',
  kpis: 'KPIs',
  restricoes: 'Restrições',
};

function KpiCard({ icon, label, value, sub, color = '#3F51B5', bg = '#EEF2FF' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; bg?: string;
}) {
  return (
    <Card sx={{ flex: 1, minWidth: 140 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{label}</Typography>
        </Box>
        <Typography sx={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</Typography>
        {sub && <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

function DonutSection({ title, data }: { title: string; data: { label: string; value: number; color: string; bg: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>{title}</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <Box key={d.label}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                  <Typography variant="body2">{d.label}</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: d.color }}>{d.value} ({pct}%)</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 6, borderRadius: 3,
                  bgcolor: d.bg,
                  '& .MuiLinearProgress-bar': { bgcolor: d.color, borderRadius: 3 },
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function ProjectAnalytics() {
  const { projectId } = useParams();
  const pid = Number(projectId);

  const reqs = useMemo(() => mockRequirements.filter((r) => r.projetoId === pid), [pid]);
  const stakeholders = useMemo(() => mockStakeholders.filter((s) => s.projetoId === pid), [pid]);
  const wiki = mockWiki[pid];

  // Requirements by status
  const reqByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    reqs.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return counts;
  }, [reqs]);

  const reqStatusData = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    label: cfg.label,
    value: reqByStatus[key] ?? 0,
    color: cfg.color,
    bg: cfg.bg,
  })).filter((d) => d.value > 0);

  // Requirements by type
  const funcional = reqs.filter((r) => r.tipo === 'FUNCIONAL').length;
  const naoFuncional = reqs.filter((r) => r.tipo === 'NAO_FUNCIONAL').length;

  const reqTypeData = [
    { label: 'Funcional', value: funcional, color: '#3F51B5', bg: '#EEF2FF' },
    { label: 'Não Funcional', value: naoFuncional, color: '#0891B2', bg: '#E0F2FE' },
  ].filter((d) => d.value > 0);

  // Stakeholder engagement
  const totalInteracoes = stakeholders.reduce((s, st) => s + (st.totalInteracoes ?? 0), 0);
  const maxInteracoes = Math.max(...stakeholders.map((s) => s.totalInteracoes ?? 0), 1);

  // Wiki sections
  const wikiSections = wiki
    ? (['objetivo', 'objetivosEspecificos', 'kpis', 'restricoes'] as const).map((key) => ({
        label: WIKI_SECTION_LABEL[key],
        status: wiki[key]?.status ?? 'RASCUNHO',
        aprovacoes: wiki[key]?.aprovacoes ?? 0,
        total: wiki[key]?.totalStakeholders ?? 0,
      }))
    : [];

  // Voting participation across requirements
  const totalVotos = reqs.reduce((s, r) => s + (r.votos?.filter((v) => v.voto !== null).length ?? 0), 0);
  const totalPossibleVotos = reqs.reduce((s, r) => s + (r.totalStakeholders ?? 0), 0);
  const participacaoPct = totalPossibleVotos > 0 ? Math.round((totalVotos / totalPossibleVotos) * 100) : 0;

  const aprovados = reqs.filter((r) => r.status === 'APROVADO' || r.status === 'VALIDADO').length;
  const pendentes = reqs.filter((r) => r.status === 'EM_VALIDACAO' || r.status === 'EM_ANALISE').length;

  return (
    <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <BarChartIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="h2">Analytics do Projeto</Typography>
        </Box>
        <Typography variant="body2">Visão consolidada de requisitos, stakeholders e documentação.</Typography>
      </Box>

      {/* KPI row */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <KpiCard icon={<AssignmentTurnedInIcon />} label="Total de Requisitos" value={reqs.length} sub={`${aprovados} aprovados / validados`} color="#3F51B5" bg="#EEF2FF" />
        <KpiCard icon={<CheckCircleIcon />} label="Aprovação" value={`${reqs.length > 0 ? Math.round((aprovados / reqs.length) * 100) : 0}%`} sub={`${pendentes} pendentes`} color="#16A34A" bg="#DCFCE7" />
        <KpiCard icon={<PeopleIcon />} label="Stakeholders" value={stakeholders.length} sub={`${totalInteracoes} interações`} color="#D97706" bg="#FEF3C7" />
        <KpiCard icon={<HourglassTopIcon />} label="Participação Votações" value={`${participacaoPct}%`} sub={`${totalVotos} de ${totalPossibleVotos} votos`} color="#7C3AED" bg="#EDE9FE" />
        {wiki && (
          <KpiCard icon={<AutoStoriesIcon />} label="Engajamento WIKI" value={`${wiki.stakeholderParticipacao}%`} sub="participação stakeholders" color="#0891B2" bg="#E0F2FE" />
        )}
      </Box>

      {/* Charts row */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        {/* Requirements by status */}
        <Card sx={{ flex: '1 1 280px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Requisitos por Status</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
              Distribuição dos {reqs.length} requisitos do projeto
            </Typography>
            <DonutSection title="" data={reqStatusData} />
          </CardContent>
        </Card>

        {/* Requirements by type */}
        <Card sx={{ flex: '1 1 280px' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Requisitos por Tipo</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
              Classificação por categoria
            </Typography>
            <DonutSection title="" data={reqTypeData} />
          </CardContent>
        </Card>

        {/* Wiki sections */}
        {wiki && (
          <Card sx={{ flex: '1 1 280px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>WIKI — Seções</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
                Status de validação das seções da WIKI
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {wikiSections.map((sec) => {
                  const cfg = STATUS_CONFIG[sec.status] ?? STATUS_CONFIG.RASCUNHO;
                  const pct = sec.total > 0 ? Math.round((sec.aprovacoes / sec.total) * 100) : 0;
                  return (
                    <Box key={sec.label}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2">{sec.label}</Typography>
                        <Chip
                          label={cfg.label}
                          size="small"
                          sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: '10px', height: 20, px: 0.5 }}
                        />
                      </Box>
                      <Tooltip title={`${sec.aprovacoes} de ${sec.total} stakeholders aprovaram (${pct}%)`}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: cfg.bg,
                            '& .MuiLinearProgress-bar': { bgcolor: cfg.color, borderRadius: 3 },
                          }}
                        />
                      </Tooltip>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Stakeholder engagement table */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>Engajamento por Stakeholder</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
            Total de interações nos módulos de WIKI e Requisitos
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[...stakeholders]
              .sort((a, b) => (b.totalInteracoes ?? 0) - (a.totalInteracoes ?? 0))
              .map((st) => {
                const pct = maxInteracoes > 0 ? Math.round(((st.totalInteracoes ?? 0) / maxInteracoes) * 100) : 0;
                const initials = st.userName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                return (
                  <Box key={st.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.75 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '12px', fontWeight: 700, bgcolor: 'primary.main', flexShrink: 0 }}>
                        {initials}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{st.userName}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                            {st.totalInteracoes ?? 0} interações
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: '#EEF2FF',
                            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 3 },
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.75, ml: 1 }}>
                        <Tooltip title={`Wiki: ${st.interacoesWiki ?? 0}`}>
                          <Chip label={`W: ${st.interacoesWiki ?? 0}`} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: '#E0F2FE', color: '#0891B2', cursor: 'default' }} />
                        </Tooltip>
                        <Tooltip title={`Requisitos: ${st.interacoesRequisitos ?? 0}`}>
                          <Chip label={`R: ${st.interacoesRequisitos ?? 0}`} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: '#EDE9FE', color: '#7C3AED', cursor: 'default' }} />
                        </Tooltip>
                      </Box>
                    </Box>
                    <Divider />
                  </Box>
                );
              })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
