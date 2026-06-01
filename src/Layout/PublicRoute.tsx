import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/Context';

export default function PublicRoute() {
  const location = useLocation();
  const { isAuthenticated, checkingSession } = useSelector((state: RootState) => state.auth);

  if (checkingSession) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" state={{ from: location }} replace />;
  }

  return <Outlet />;
}