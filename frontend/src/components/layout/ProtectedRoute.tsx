import { Box, CircularProgress } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { DESTINO_PADRAO } from '../../utils/sessao';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Exige o Admin da Plataforma (grupo /_admin). */
  requireAdminPlataforma?: boolean;
}

export default function ProtectedRoute({ children, requireAdminPlataforma }: ProtectedRouteProps) {
  const { isAuthenticated, carregando, user, saiu } = useAuth();
  const location = useLocation();

  // Restaurando a sessão pelo cookie de refresh (abertura/recarga da página)
  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Saiu pelo menu: volta para a landing
  if (!isAuthenticated && saiu) {
    return <Navigate to="/" replace />;
  }

  // Não autenticado (sessão expirada, link direto): vai ao login e volta para a rota original depois (?next=)
  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (requireAdminPlataforma && !user?.adminPlataforma) {
    return <Navigate to={DESTINO_PADRAO} replace />;
  }

  return <>{children}</>;
}
