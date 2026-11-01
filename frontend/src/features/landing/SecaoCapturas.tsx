import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Secao from './Secao';
import rastreabilidade from '../../assets/landing/rastreabilidade.jpg';
import modeloDados from '../../assets/landing/modelo-dados.jpg';
import analytics from '../../assets/landing/analytics.jpg';

// Capturas reais do projeto de demonstração (o próprio TCC), sem dados pessoais
const CAPTURAS = [
  {
    src: rastreabilidade,
    titulo: 'Matriz de rastreabilidade',
    legenda: 'Vínculos diretos entre requisitos e relações indiretas por entidade de dados compartilhada.',
    alt: 'Matriz de rastreabilidade com 27 requisitos, vínculos do tipo "depende de" e relações indiretas marcadas por círculos',
  },
  {
    src: modeloDados,
    titulo: 'Modelo de dados',
    legenda: 'Entidades, atributos e chaves estrangeiras com o diagrama entidade-relacionamento gerado na hora.',
    alt: 'Tela de modelo de dados com a lista de entidades e o diagrama entidade-relacionamento do projeto',
  },
  {
    src: analytics,
    titulo: 'Analytics do projeto',
    legenda: 'Requisitos por status e tipo e interações por módulo.',
    alt: 'Painel de analytics com taxa de aprovação, requisitos por status, por tipo e interações por módulo',
  },
];

export default function SecaoCapturas() {
  return (
    <Secao
      id="capturas"
      etiqueta="Na prática"
      titulo="Telas reais da plataforma"
      descricao="Capturas do projeto de demonstração, que registra na própria plataforma o projeto de software deste TCC."
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 3, md: 3 } }}>
        {CAPTURAS.map((c) => (
          <Box component="figure" key={c.titulo} sx={{ m: 0 }}>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Box component="img" src={c.src} alt={c.alt} loading="lazy" sx={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '16 / 10', objectFit: 'cover', objectPosition: 'top left' }} />
            </Box>
            <Box component="figcaption" sx={{ mt: 1.5 }}>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: 16 }}>{c.titulo}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.6 }}>{c.legenda}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Secao>
  );
}
