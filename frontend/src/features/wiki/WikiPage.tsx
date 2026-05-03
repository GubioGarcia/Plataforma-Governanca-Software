import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import CompassCalibrationIcon from '@mui/icons-material/CompassCalibration';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SettingsIcon from '@mui/icons-material/Settings';
import { useSnackbar } from '../../context/SnackbarContext';
import { fetchProjectWiki } from '../../services/wikiService';
import type { WikiProjetoApi } from '../../types/wiki';

// ── Card header com label centralizada tipo protótipo ──────────────────────
interface WikiCardProps {
  label: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onEdit: () => void;
}

function WikiCard({ label, icon, title, subtitle, children, onEdit }: WikiCardProps) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #E8EAED',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Tag label centrada */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2 }}>
        <Box
          sx={{
            border: '1px solid #3F51B5',
            borderRadius: 1,
            px: 2,
            py: 0.25,
            display: 'inline-flex',
          }}
        >
          <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#3F51B5' }}>{label}</Typography>
        </Box>
        <Tooltip title="Editar">
          <IconButton size="small" onClick={onEdit} sx={{ color: '#3F51B5' }}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Icon + title + subtitle */}
      <Box sx={{ px: 3, pt: 1.5, pb: 1, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ color: '#3F51B5', mt: 0.25, flexShrink: 0 }}>{icon}</Box>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '22px', color: '#111827' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mt: 0.25 }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mx: 3 }} />

      {/* Conteúdo */}
      <Box sx={{ px: 3, py: 2.5 }}>{children}</Box>
    </Box>
  );
}

// ── Linha de informação (label: valor) ─────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1.25, borderBottom: '1px solid #F3F4F6', '&:last-child': { borderBottom: 'none' } }}>
      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#111827', minWidth: 200, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
        {value}
      </Typography>
    </Box>
  );
}

// ── Bloco de texto livre ───────────────────────────────────────────────────
function ContentBlock({ value }: { value?: string }) {
  if (!value) {
    return (
      <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#9CA3AF' }}>
        Nenhuma informação cadastrada.
      </Typography>
    );
  }
  return (
    <Typography sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-line', lineHeight: 1.75 }}>
      {value}
    </Typography>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────
export default function WikiPage() {
  const { orgId, projectId } = useParams();
  const navigate = useNavigate();
  const { notify } = useSnackbar();
  const [wiki, setWiki] = useState<WikiProjetoApi | null>(null);
  const [loading, setLoading] = useState(true);

  const base = `/organizations/${orgId}/projects/${projectId}/wiki`;

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetchProjectWiki(projectId)
      .then((data) => setWiki(data))
      .catch((err) => {
        if (err?.response?.status !== 404) {
          notify('Falha ao carregar a Wiki do projeto', 'error');
        }
      })
      .finally(() => setLoading(false));
  }, [projectId, notify]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!wiki) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <AutoStoriesIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#374151', mb: 1 }}>Wiki ainda não disponível</Typography>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          A Wiki é criada automaticamente junto com o projeto.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

        {/* 1 — Descrição Geral do Produto */}
        <WikiCard
          label="Descrição Geral do Produto"
          icon={<AutoStoriesIcon sx={{ fontSize: 30 }} />}
          title={wiki.projetoNome ?? '—'}
          subtitle={wiki.projetoDescricao ?? ''}
          onEdit={() => navigate(`${base}/descricao`)}
        >
          <InfoRow label="Objetivo principal" value={wiki.objetivoGeral} />
          <InfoRow label="Problema a ser resolvido" value={wiki.descricaoProblema} />
        </WikiCard>

        {/* 2 — Problema de Negócio */}
        <WikiCard
          label="Problema de Negócio"
          icon={<CompassCalibrationIcon sx={{ fontSize: 30 }} />}
          title="Problema / Oportunidade"
          subtitle="Contexto atual, Dor do cliente, Impacto se não for atendido"
          onEdit={() => navigate(`${base}/problema`)}
        >
          <ContentBlock value={wiki.descricaoProblema} />
        </WikiCard>

        {/* 3 — Público-Alvo */}
        <WikiCard
          label="Público-Alvo"
          icon={<PeopleAltIcon sx={{ fontSize: 30 }} />}
          title="Usuários do Sistema"
          subtitle="Descritivo dos usuários finais do sistema"
          onEdit={() => navigate(`${base}/publico`)}
        >
          <ContentBlock value={wiki.publicoAlvo} />
        </WikiCard>

        {/* 4 — Objetivos do Projeto */}
        <WikiCard
          label="Objetivos do Projeto"
          icon={<EmojiObjectsIcon sx={{ fontSize: 30 }} />}
          title="Objetivos"
          subtitle="Objetivo geral, Objetivos específicos e Indicadores de sucesso (KPIs)"
          onEdit={() => navigate(`${base}/objetivos`)}
        >
          <InfoRow label="Objetivo geral" value={wiki.objetivoGeral} />
          <InfoRow label="Objetivos específicos" value={wiki.objetivosEspecificos} />
          <InfoRow label="Indicadores de Sucesso (KPIs)" value={wiki.kpis} />
        </WikiCard>

        {/* 5 — Restrições */}
        <WikiCard
          label="Restrições"
          icon={<ReportProblemIcon sx={{ fontSize: 30 }} />}
          title="Restrições do projeto"
          subtitle="Quais limitações externas ou condições obrigatórias influenciam o desenvolvimento do produto"
          onEdit={() => navigate(`${base}/restricoes`)}
        >
          <InfoRow label="Prazo" value={wiki.restricoesPrazo} />
          <InfoRow label="Orçamento" value={wiki.restricoesOrcamento} />
          <InfoRow label="Tecnologias obrigatórias" value={wiki.tecnologiasObrigatorias} />
          <InfoRow label="Regulamentações" value={wiki.regulamentacoes} />
        </WikiCard>

      </Box>
    </Box>
  );
}