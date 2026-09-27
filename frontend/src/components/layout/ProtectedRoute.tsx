import { Box, CircularProgress } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Exige o Admin da Plataforma (grupo /_admin). */
  requireAdminPlataforma?: boolean;
}

export default function ProtectedRoute({ children, requireAdminPlataforma }: ProtectedRouteProps) {
  const { isAuthenticated, carregando, user } = useAuth();
  const location = useLocation();

  // Restaurando a sessão pelo cookie de refresh (abertura/recarga da página)
  if (carregando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Não autenticado: redireciona para login preservando a rota original
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdminPlataforma && !user?.adminPlataforma) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
