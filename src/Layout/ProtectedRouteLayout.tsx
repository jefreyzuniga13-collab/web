import { Navigate, Outlet } from 'react-router-dom'
import { useSelector }      from 'react-redux'
import type { RootState }   from '@/Context/index'
import { getRoleFromToken } from '@/Utils/jwt'

/**
 * Permite el acceso sólo a los roles indicados.
 */
const ProtectedRouteLayout= ({ roles }: { roles: string[] })=> {
  const token = useSelector((s: RootState) => s.auth.accessToken)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const role = getRoleFromToken(token)
  if (!role || !roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

export default ProtectedRouteLayout;