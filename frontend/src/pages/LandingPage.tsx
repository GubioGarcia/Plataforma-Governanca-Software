import Box from '@mui/material/Box';
import LandingCabecalho from '../features/landing/LandingCabecalho';
import SecaoHero from '../features/landing/SecaoHero';
import SecaoProblema from '../features/landing/SecaoProblema';
import SecaoFuncionalidades from '../features/landing/SecaoFuncionalidades';
import SecaoComoFunciona from '../features/landing/SecaoComoFunciona';
import SecaoDiferencial from '../features/landing/SecaoDiferencial';
import SecaoCapturas from '../features/landing/SecaoCapturas';
import LandingRodape from '../features/landing/LandingRodape';

/**
 * Página pública de apresentação. Não chama a API (o AuthProvider só tenta
 * restaurar sessão se houve login antes neste navegador).
 */
export default function LandingPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'clip' }}>
      <LandingCabecalho />
      <main>
        <SecaoHero />
        <SecaoProblema />
        <SecaoFuncionalidades />
        <SecaoComoFunciona />
        <SecaoDiferencial />
        <SecaoCapturas />
      </main>
      <LandingRodape />
    </Box>
  );
}
