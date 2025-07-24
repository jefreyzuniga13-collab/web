import { type ReactNode, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { setCredentials } from '@/Context/Slices/authSlice'
import type { RootState } from '@/Context/index'

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const dispatch = useDispatch()
  const location = useLocation()
  const { accessToken } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (!accessToken) {
      const stored = localStorage.getItem('auth')
      if (stored) {
        const data = JSON.parse(stored)
        dispatch(setCredentials(data))
      }
    }
  }, [accessToken, dispatch])

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}