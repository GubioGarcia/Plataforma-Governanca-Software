import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import Secao from './Secao';
import { corDestaque } from './cores';

const FUNCIONALIDADES: { icone: SvgIconComponent; titulo: string; texto: string }[] = [
  {
    icone: MenuBookOutlinedIcon,
    titulo: 'Visão do produto',
    texto: 'Problema, público-alvo, objetivos, KPIs e restrições registrados numa wiki do projeto.',
  },
  {
    icone: ChecklistIcon,
    titulo: 'Requisitos com aprovação',
    texto: 'Prioridade, critérios de aceite, versões e um fluxo de revisão e aprovação pela gestão.',
  },
  {
    icone: ForumOutlinedIcon,
    titulo: 'Voz dos stakeholders',
    texto: 'Comentários em cada requisito e solicitações formais de mudança, aprovação, evento ou exportação.',
  },
  {
    icone: HubOutlinedIcon,
    titulo: 'Rastreabilidade e dados',
    texto: 'Matriz de vínculos entre requisitos, impacto nas entidades de dados e diagrama entidade-relacionamento.',
  },
  {
    icone: EventNoteOutlinedIcon,
    titulo: 'Eventos e arquivos',
    texto: 'Agenda de reuniões e validações do projeto e um repositório de documentos e protótipos.',
  },
  {
    icone: InsightsOutlinedIcon,
    titulo: 'Auditoria e engajamento',
    texto: 'Histórico de cada alteração e indicadores de quanto cada pessoa participa, por módulo.',
  },
];

export default function SecaoFuncionalidades() {
  return (
    <Secao
      id="funcionalidades"
      etiqueta="Funcionalidades"
      titulo="Tudo o que nasce no discovery, no mesmo ambiente"
      destacada
    >
      <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 3 } }}>
        {FUNCIONALIDADES.map(({ icone: Icone, titulo, texto }) => (
          <Box component="li" key={titulo} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Box
              sx={(theme) => ({
                width: 44, height: 44, borderRadius: 2, mb: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08),
                color: corDestaque(theme),
              })}
            >
              <Icone aria-hidden />
            </Box>
            <Typography component="h3" sx={{ fontWeight: 700, fontSize: 17, mb: 1 }}>{titulo}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 15, lineHeight: 1.6 }}>{texto}</Typography>
          </Box>
        ))}
      </Box>
    </Secao>
  );
}
