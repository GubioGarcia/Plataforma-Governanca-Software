import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link as RouterLink } from 'react-router-dom';
import { ETIQUETA, papelMilimetrado } from '../../theme/tokens';
import visaoGeral from '../../assets/landing/visao-geral.jpg';
import { corDestaque } from './cores';

export default function SecaoHero() {
  return (
    <Box
      component="section"
      aria-labelledby="hero-titulo"
      sx={(theme) => ({ ...papelMilimetrado(theme, 28), pt: { xs: 6, md: 10 }, pb: { xs: 6, md: 8 }, overflow: 'hidden' })}
    >
      <Container maxWidth="lg">
        <Box sx={{ maxWidth: 780, mx: 'auto', textAlign: 'center' }}>
          <Typography sx={{ ...ETIQUETA, color: corDestaque, mb: 2 }}>Discovery e elicitação de requisitos</Typography>
          <Typography
            id="hero-titulo"
            component="h1"
            sx={{ fontSize: { xs: 32, sm: 40, md: 52 }, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', mb: 2.5 }}
          >
            Gestão das fases iniciais de projetos de software
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: { xs: 17, md: 19 }, lineHeight: 1.6, mb: 4 }}>
            Requisitos validados de forma contínua entre gestores e stakeholders, com a visão do produto,
            as decisões e o impacto nos dados reunidos num só lugar.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button component={RouterLink} to="/cadastro" variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ px: 3.5, py: 1.4, fontSize: 16 }}>
              Criar conta
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" size="large" sx={{ px: 3.5, py: 1.4, fontSize: 16, color: corDestaque, borderColor: corDestaque }}>
              Entrar
            </Button>
          </Box>
        </Box>

        <Box
          sx={(theme) => ({
            mt: { xs: 5, md: 8 },
            mx: 'auto',
            maxWidth: 1080,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.35 : 0.18)}`,
            bgcolor: 'background.paper',
          })}
        >
          <Box
            component="img"
            src={visaoGeral}
            alt="Visão geral de um projeto na plataforma: total de requisitos, aprovados, em revisão, interações e acesso rápido aos módulos"
            sx={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </Box>
      </Container>
    </Box>
  );
}
