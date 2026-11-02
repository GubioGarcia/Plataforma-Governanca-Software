import { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { DESTINO_PADRAO } from '../../utils/sessao';

/**
 * Telas públicas de entrada (landing, login, cadastro): quem já tem sessão vai
 * direto para a plataforma.
 */
export default function RotaPublica({ children, destino = DESTINO_PADRAO }: { children: React.ReactNode; destino?: string }) {
  const { isAuthenticated, carregando, saiu, confirmarSaida } = useAuth();

  // Chegou aqui depois do "Sair": a marca já cumpriu o papel. A partir de agora uma
  // rota protegida (ex.: o link "Área administrativa") pede login com ?next=.
  useEffect(() => {
    if (saiu && !isAuthenticated) confirmarSaida();
  }, [saiu, isAuthenticated, confirmarSaida]);

  // Só acontece se houve login antes neste navegador (restaurando pelo cookie)
  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) return <Navigate to={destino} replace />;

  return <>{children}</>;
}
