import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { corDestaque } from './cores';

/** Rodapé das páginas públicas (landing e privacidade). */
export default function LandingRodape() {
  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', py: 4 }}>
      <Container
        maxWidth="lg"
        sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
      >
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          Projeto de TCC — Engenharia de Software, Faculdade SENAI Fatesg
        </Typography>
        <Box component="nav" aria-label="Rodapé" sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Link component={RouterLink} to="/privacidade" underline="hover" sx={{ fontSize: 14, color: corDestaque }}>
            Política de privacidade
          </Link>
          {/* A proteção é do backend: o link só leva ao login, e quem não é admin não vê nada */}
          <Link component={RouterLink} to="/admin" underline="hover" sx={{ fontSize: 14, color: 'text.secondary' }}>
            Área administrativa
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
