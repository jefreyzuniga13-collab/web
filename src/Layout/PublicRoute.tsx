import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { RootState } from '@/Context/index'

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export default function PublicRoute() {
  const accessToken = useAppSelector(state => state.auth.accessToken)
  const location = useLocation()

  if (accessToken) {
    return <Navigate to="/chat" state={{ from: location }} replace />
  }

  return <Outlet />
}