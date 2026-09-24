import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CustomLoader from '@/Components/Common/CustomLoader';
import type { RootState } from '@/Context';

export default function PublicRoute() {
  const location = useLocation();
  const { isAuthenticated, checkingSession } = useSelector((state: RootState) => state.auth);

  if (checkingSession && !isAuthenticated) {
    return <CustomLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/chat" state={{ from: location }} replace />;
  }

  return <Outlet />;
}