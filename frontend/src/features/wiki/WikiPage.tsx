import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import WikiSection from './WikiSection';
import { mockWiki } from '../../mocks/wiki';
import { usePermissions } from '../../hooks/usePermissions';
import type { WikiProjeto, WikiSection as WikiSectionType } from '../../types/wiki';

const SECTIONS: { key: keyof Omit<WikiProjeto, 'id' | 'projetoId' | 'createdAt' | 'updatedAt' | 'stakeholderParticipacao'>; title: string; icon: string }[] = [
  { key: 'objetivo', title: 'Objetivo Geral', icon: '🎯' },
  { key: 'objetivosEspecificos', title: 'Objetivos Específicos', icon: '📌' },
  { key: 'kpis', title: 'KPIs / Indicadores de Sucesso', icon: '📊' },
  { key: 'restricoes', title: 'Restrições do Projeto', icon: '🚧' },
];

function createEmptyWiki(projectId: number): WikiProjeto {
  const emptySection = (): WikiSectionType => ({
    status: 'RASCUNHO',
    conteudo: '',
    totalStakeholders: 0,
    aprovacoes: 0,
    reprovacoes: 0,
    votos: [],
  });
  return {
    id: Date.now(),
    projetoId: projectId,
    stakeholderParticipacao: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    objetivo: emptySection(),
    objetivosEspecificos: emptySection(),
    kpis: emptySection(),
    restricoes: emptySection(),
  };
}

export default function WikiPage() {
  const { projectId } = useParams();
  const { canEdit } = usePermissions();
  const initial = mockWiki[Number(projectId)];
  const [wiki, setWiki] = useState<WikiProjeto | undefined>(initial);

  const handleCreateWiki = () => setWiki(createEmptyWiki(Number(projectId)));

  if (!wiki) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h2" sx={{ mb: 0.5 }}>WIKI do Projeto</Typography>
        <Typography variant="body2" sx={{ mb: 4 }}>Documentação central do projeto.</Typography>
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            border: '2px dashed #E8EAED',
            borderRadius: 2,
            bgcolor: '#FAFBFC',
          }}
        >
          <AutoStoriesIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
            WIKI ainda não criada
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3, maxWidth: 400, mx: 'auto' }}>
            Crie a WIKI para documentar objetivos, KPIs e restrições do projeto.
            Os stakeholders poderão colaborar e validar cada seção.
          </Typography>
          {canEdit ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateWiki}>
              Criar WIKI do Projeto
            </Button>
          ) : (
            <Typography variant="body2" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
              Aguardando um Gestor ou Analista criar a WIKI.
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  const handleUpdateSection = (key: string, updated: WikiSectionType) => {
    setWiki((prev) => (prev ? { ...prev, [key]: updated } : prev));
  };

  // Calcula participação geral baseado em todas as seções que foram ao menos para EM_VALIDACAO
  const allVotos = [wiki.objetivo, wiki.objetivosEspecificos, wiki.kpis, wiki.restricoes]
    .filter((s) => s.status !== 'RASCUNHO')
    .flatMap((s) => s.votos);

  const uniqueStakeholders = new Set(allVotos.map((v) => v.userId)).size || wiki.objetivo.totalStakeholders;
  const stakeholdersQueResponderam = new Set(
    allVotos.filter((v) => v.voto !== null).map((v) => v.userId)
  ).size;

  const participacaoGeral =
    uniqueStakeholders > 0 ? Math.round((stakeholdersQueResponderam / uniqueStakeholders) * 100) : 0;

  return (
    <Box sx={{ p: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="h2" sx={{ mb: 0.5 }}>WIKI do Projeto</Typography>
          <Typography variant="body2">
            Documentação central do projeto. Cada seção precisa ser validada pelos stakeholders antes de ser aprovada.
          </Typography>
        </Box>
      </Box>

      {/* Global participation KPI */}
      <Box
        sx={{
          p: 2.5,
          bgcolor: '#FAFBFC',
          border: '1px solid #E8EAED',
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Participação Geral dos Stakeholders
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 700,
              color: participacaoGeral >= 60 ? '#16A34A' : '#D97706',
            }}
          >
            {participacaoGeral}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={participacaoGeral}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: '#E8EAED',
            '& .MuiLinearProgress-bar': {
              bgcolor: participacaoGeral >= 60 ? '#16A34A' : '#D97706',
              borderRadius: 4,
            },
          }}
        />
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
          Meta: 80% de participação dos stakeholders nas validações
        </Typography>
      </Box>

      {/* Sections */}
      {SECTIONS.map(({ key, title, icon }) => (
        <WikiSection
          key={key}
          title={title}
          icon={icon}
          section={wiki[key] as WikiSectionType}
          onUpdate={(updated) => handleUpdateSection(key, updated)}
        />
      ))}
    </Box>
  );
}
