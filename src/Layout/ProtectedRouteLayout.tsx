import { Navigate, Outlet } from 'react-router-dom'
import { useSelector }      from 'react-redux'
import type { RootState }   from '@/Context/index'
import { getRolesFromStoredToken } from '@/Utils/jwt'

interface ProtectedRouteLayoutProps {
  roles: string[]
}

const ProtectedRouteLayout: React.FC<ProtectedRouteLayoutProps> = ({ roles }) => {
  const token = useSelector((state: RootState) => state.auth.accessToken)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const userRoles = getRolesFromStoredToken()
  console.log('Roles desde el token:', userRoles);
  const hasRole = userRoles.some(r => roles.includes(r))

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRouteLayout