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
import { buscarResumoPorProjeto } from '../../services/interacaoService';
import type { ResumoInteracaoProjeto } from '../../types/interacao';
import { listarRequisitosPorProjeto, listarStatusRequisito } from '../../services/requirementService';
import type { RequisitoAPI, StatusRequisitoAPI } from '../../types/requirementAPI';
import {
  MODULOS_INTERACAO,
  STATUS_DECIDIDOS,
  interacoesPorModulo,
  requisitosPorStatus,
  requisitosPorTipo,
  type Fatia,
} from '../../utils/indicadores';

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
  data: Fatia[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <Card elevation={0} variant="outlined" sx={{ flex: '1 1 260px' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>{title}</Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>{subtitle}</Typography>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Todas as opções aparecem, inclusive as com zero */}
          {data.map((d) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            return (
              <Box key={d.chave}>
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
          {data.length === 0 && (
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
  const [statuses, setStatuses] = useState<StatusRequisitoAPI[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [r, req, st] = await Promise.allSettled([
        buscarResumoPorProjeto(projectId),
        listarRequisitosPorProjeto(projectId),
        listarStatusRequisito(),
      ]);
      if (r.status === 'fulfilled')   setResumo(r.value);
      if (req.status === 'fulfilled') setReqs(req.value);
      if (st.status === 'fulfilled')  setStatuses(st.value);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Derived: requisitos ───────────────────────────────────────────────────
  const total = reqs.length;
  const aprovados = reqs.filter((r) => r.statusNome === 'APROVADO').length;
  const pendentes = reqs.filter((r) => !STATUS_DECIDIDOS.includes(r.statusNome ?? '')).length;
  const aprovPct = total > 0 ? Math.round((aprovados / total) * 100) : 0;

  const reqStatusData = requisitosPorStatus(reqs, statuses);
  const reqTypeData   = requisitosPorTipo(reqs);

  // ── Derived: interações ───────────────────────────────────────────────────
  // Inclui quem já saiu do projeto: as ações continuam no histórico
  const totalInteracoes = resumo?.totalInteracoes ?? 0;
  const membros         = resumo?.porUsuario ?? [];
  const maxInt          = Math.max(...membros.map((m) => m.totalInteracoes), 1);
  const modulos         = resumo?.interacoesPorModulo ?? {};
  const moduloData      = interacoesPorModulo(modulos);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 }, overflowY: 'auto' }}>
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
          sub={`${aprovados} aprovado${aprovados !== 1 ? 's' : ''}`}
          color="#3F51B5" bg="#EEF2FF"
        />
        <KpiCard
          icon={<CheckCircleIcon />}
          label="Aprovação"
          value={`${aprovPct}%`}
          sub={`${pendentes} aguardando decisão`}
          color="#16A34A" bg="#DCFCE7"
        />
        <KpiCard
          icon={<PeopleIcon />}
          label="Pessoas que interagiram"
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
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
              Engajamento por Stakeholder
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
              Total de interações em todos os módulos (inclui quem já saiu do projeto)
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 }, mb: 0.75 }}>
                        {m.usuarioUrlFoto ? (
                          <Avatar src={m.usuarioUrlFoto} sx={{ width: 32, height: 32 }} />
                        ) : (
                          <Avatar sx={{ width: 32, height: 32, fontSize: '12px', fontWeight: 700, bgcolor: color, flexShrink: 0 }}>
                            {inits}
                          </Avatar>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.25 }}>
                            {/* Nome numa linha só (no celular ficava uma palavra por linha) */}
                            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 0 }} noWrap title={m.usuarioNome}>{m.usuarioNome}</Typography>
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
                        {/* Um chip por módulo com interação: a soma bate com o total */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 0.5, ml: { xs: 0, sm: 1 }, flexShrink: 0, maxWidth: { xs: 96, sm: 'none' } }}>
                          {MODULOS_INTERACAO.filter((mod) => Number(m[mod.campo] ?? 0) > 0).map((mod) => (
                            <Tooltip key={mod.chave} title={`${mod.label}: ${m[mod.campo]}`}>
                              <Chip label={`${mod.sigla}: ${m[mod.campo]}`} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: mod.bg, color: mod.color, cursor: 'default' }} />
                            </Tooltip>
                          ))}
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
