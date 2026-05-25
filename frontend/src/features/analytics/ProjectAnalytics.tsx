import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PendingIcon from '@mui/icons-material/Pending';
import { buscarResumoPorProjeto } from '../../services/interacaoService';
import type { ResumoInteracaoProjeto } from '../../types/interacao';
import { listarRequisitosPorProjeto } from '../../services/requirementService';
import type { RequisitoAPI } from '../../types/requirementAPI';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  VALIDADO:     { label: 'Validado',     color: '#7C3AED', bg: '#EDE9FE', icon: <AssignmentTurnedInIcon sx={{ fontSize: 14 }} /> },
  APROVADO:     { label: 'Aprovado',     color: '#16A34A', bg: '#DCFCE7', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  EM_VALIDACAO: { label: 'Em Validação', color: '#D97706', bg: '#FEF3C7', icon: <HourglassTopIcon sx={{ fontSize: 14 }} /> },
  EM_ANALISE:   { label: 'Em Análise',   color: '#3B82F6', bg: '#EFF6FF', icon: <PendingIcon sx={{ fontSize: 14 }} /> },
  RASCUNHO:     { label: 'Rascunho',     color: '#6B7280', bg: '#F3F4F6', icon: <EditNoteIcon sx={{ fontSize: 14 }} /> },
  REPROVADO:    { label: 'Reprovado',    color: '#DC2626', bg: '#FEE2E2', icon: <ThumbDownIcon sx={{ fontSize: 14 }} /> },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; bg: string;
}) {
  return (
    <Card sx={{ flex: 1, minWidth: 150 }} elevation={0} variant="outlined">
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

function BarSection({ title, subtitle, data }: {
  title: string;
  subtitle?: string;
  data: { label: string; value: number; color: string; bg: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card elevation={0} variant="outlined" sx={{ flex: '1 1 260px' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>{subtitle}</Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {data.filter((d) => d.value > 0).map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <Box key={d.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                    <Typography variant="body2">{d.label}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: d.color }}>
                    {d.value} ({pct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{ height: 6, borderRadius: 3, bgcolor: d.bg, '& .MuiLinearProgress-bar': { bgcolor: d.color, borderRadius: 3 } }}
                />
              </Box>
            );
          })}
          {data.every((d) => d.value === 0) && (
            <Typography variant="body2" color="text.disabled">Sem dados</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function avatarColor(name: string) {
  const COLORS = ['#3F51B5','#059669','#7C3AED','#D97706','#0891B2','#DC2626'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProjectAnalytics() {
  const { projectId } = useParams<{ projectId: string }>();

  const [resumo, setResumo]   = useState<ResumoInteracaoProjeto | null>(null);
  const [reqs, setReqs]       = useState<RequisitoAPI[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [r, req] = await Promise.allSettled([
        buscarResumoPorProjeto(projectId),
        listarRequisitosPorProjeto(projectId),
      ]);
      if (r.status === 'fulfilled')   setResumo(r.value);
      if (req.status === 'fulfilled') setReqs(req.value);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Derived: requisitos ───────────────────────────────────────────────────
  const total = reqs.length;
  const aprovados = reqs.filter((r) => r.statusNome === 'APROVADO' || r.statusNome === 'VALIDADO').length;
  const pendentes = reqs.filter((r) => r.statusNome === 'EM_VALIDACAO' || r.statusNome === 'EM_ANALISE').length;
  const aprovPct = total > 0 ? Math.round((aprovados / total) * 100) : 0;

  // status breakdown
  const statusCounts: Record<string, number> = {};
  reqs.forEach((r) => { if (r.statusNome) statusCounts[r.statusNome] = (statusCounts[r.statusNome] ?? 0) + 1; });
  const reqStatusData = Object.entries(STATUS_CFG).map(([key, cfg]) => ({
    label: cfg.label, value: statusCounts[key] ?? 0, color: cfg.color, bg: cfg.bg,
  }));

  // type breakdown
  const funcional    = reqs.filter((r) => r.tipoRequisito === 'FUNCIONAL').length;
  const naoFuncional = reqs.filter((r) => r.tipoRequisito === 'NAO_FUNCIONAL').length;
  const reqTypeData = [
    { label: 'Funcional',     value: funcional,    color: '#3F51B5', bg: '#EEF2FF' },
    { label: 'Não Funcional', value: naoFuncional, color: '#0891B2', bg: '#E0F2FE' },
  ];

  // ── Derived: interações ───────────────────────────────────────────────────
  const totalInteracoes = resumo?.totalInteracoes ?? 0;
  const membros         = resumo?.porUsuario ?? [];
  const maxInt          = Math.max(...membros.map((m) => m.totalInteracoes), 1);
  const modulos         = resumo?.interacoesPorModulo ?? {};

  const moduloData = [
    { label: 'WIKI',        value: modulos['WIKI']       ?? 0, color: '#0891B2', bg: '#E0F2FE' },
    { label: 'Requisitos',  value: modulos['REQUISITO']  ?? 0, color: '#7C3AED', bg: '#EDE9FE' },
    { label: 'Comentários', value: modulos['COMENTARIO'] ?? 0, color: '#059669', bg: '#DCFCE7' },
    { label: 'Eventos',     value: modulos['EVENTO']     ?? 0, color: '#D97706', bg: '#FEF3C7' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <BarChartIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="h2">Analytics do Projeto</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Visão consolidada de requisitos, stakeholders e documentação.
        </Typography>
      </Box>

      {/* KPI row */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <KpiCard
          icon={<AssignmentTurnedInIcon />}
          label="Total de Requisitos"
          value={total}
          sub={`${aprovados} aprovados / validados`}
          color="#3F51B5" bg="#EEF2FF"
        />
        <KpiCard
          icon={<CheckCircleIcon />}
          label="Aprovação"
          value={`${aprovPct}%`}
          sub={`${pendentes} pendentes`}
          color="#16A34A" bg="#DCFCE7"
        />
        <KpiCard
          icon={<PeopleIcon />}
          label="Stakeholders"
          value={membros.length}
          sub={`${totalInteracoes} interações`}
          color="#D97706" bg="#FEF3C7"
        />
        <KpiCard
          icon={<AutoStoriesIcon />}
          label="Interações WIKI"
          value={modulos['WIKI'] ?? 0}
          sub="ações na documentação"
          color="#0891B2" bg="#E0F2FE"
        />
        <KpiCard
          icon={<HourglassTopIcon />}
          label="Interações Requisitos"
          value={modulos['REQUISITO'] ?? 0}
          sub="ações em requisitos"
          color="#7C3AED" bg="#EDE9FE"
        />
      </Box>

      {/* Charts row */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <BarSection
          title="Requisitos por Status"
          subtitle={`Distribuição dos ${total} requisitos do projeto`}
          data={reqStatusData}
        />
        <BarSection
          title="Requisitos por Tipo"
          subtitle="Classificação por categoria"
          data={reqTypeData}
        />
        <BarSection
          title="Interações por Módulo"
          subtitle="Distribuição das ações por área"
          data={moduloData}
        />
      </Box>

      {/* Engajamento por stakeholder */}
      {membros.length > 0 && (
        <Card elevation={0} variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
              Engajamento por Stakeholder
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
              Total de interações nos módulos de WIKI e Requisitos
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...membros]
                .sort((a, b) => b.totalInteracoes - a.totalInteracoes)
                .map((m) => {
                  const pct = Math.round((m.totalInteracoes / maxInt) * 100);
                  const color = avatarColor(m.usuarioNome);
                  const inits = m.usuarioNome.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
                  return (
                    <Box key={m.usuarioId}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.75 }}>
                        {m.usuarioUrlFoto ? (
                          <Avatar src={m.usuarioUrlFoto} sx={{ width: 32, height: 32 }} />
                        ) : (
                          <Avatar sx={{ width: 32, height: 32, fontSize: '12px', fontWeight: 700, bgcolor: color, flexShrink: 0 }}>
                            {inits}
                          </Avatar>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.usuarioNome}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                              {m.totalInteracoes} interações
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 6, borderRadius: 3, bgcolor: '#EEF2FF', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main', borderRadius: 3 } }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.75, ml: 1 }}>
                          <Tooltip title={`Wiki: ${m.interacoesWiki}`}>
                            <Chip label={`W: ${m.interacoesWiki}`} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: '#E0F2FE', color: '#0891B2', cursor: 'default' }} />
                          </Tooltip>
                          <Tooltip title={`Requisitos: ${m.interacoesRequisito}`}>
                            <Chip label={`R: ${m.interacoesRequisito}`} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: '#EDE9FE', color: '#7C3AED', cursor: 'default' }} />
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
