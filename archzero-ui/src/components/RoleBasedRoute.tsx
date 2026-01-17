import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleBasedRoute({ children, allowedRoles }: RoleBasedRouteProps) {
  // Use a single selector to avoid stale closure issues
  const authState = useAuthStore((s) => ({
    user: s.user,
    token: s.token,
    isAuthenticated: s.isAuthenticated
  }));

  const { user, token, isAuthenticated } = authState;

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // TEMPORARILY DISABLE ROLE CHECK FOR DEBUGGING
  // if (!user || !allowedRoles.includes(user.role)) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return <>{children}</>;
}
