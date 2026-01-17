import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand persist hydration
  useEffect(() => {
    // Use a timeout to ensure localStorage is read
    const timer = setTimeout(() => setIsHydrated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isHydrated) {
    return null; // Show nothing while hydrating
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is specified, check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.includes(user.role)) {
      // User doesn't have required role - redirect to dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
