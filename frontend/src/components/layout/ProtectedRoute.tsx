import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/UseAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Roles mínimas exigidas para acessar esta rota. Se omitido, qualquer autenticado pode acessar. */
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Não autenticado: redireciona para login preservando a rota original
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Autenticado mas sem a role necessária: redireciona para página inicial
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(
      (role) => user?.roles.includes(role) || user?.role === role,
    );
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}