import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/Context';

interface ProtectedRouteLayoutProps {
  roles: string[];
}

export default function ProtectedRouteLayout({ roles }: ProtectedRouteLayoutProps) {
  const { isAuthenticated, checkingSession, roles: userRoles = [] } = useSelector(
    (state: RootState & { auth: RootState['auth'] & { roles?: string[] } }) => state.auth
  );

  if (checkingSession) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasRole = userRoles.some(role => roles.includes(role));

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}