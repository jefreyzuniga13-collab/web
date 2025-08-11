import { type ReactNode, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { setCredentials } from '@/Context/Slices/authSlice'
import type { RootState } from '@/Context/index'
import { SupportRequestedPopup } from "@/Components/Common/Hub/SupportRequestedPopup";
import { ConversationAssignedPopup } from "@/Components/Common/Hub/ConversationAssignedPopup";
import { AssignmentResponsePopup } from "@/Components/Common/Hub/AssignmentResponsePopup";
import { AssignmentForcedPopup } from "@/Components/Common/Hub/AssignmentForcedPopup";
import ContactValidatorHub from "@/Components/Common/Hub/ContactValidatorHub";
import { useForceLogoutListener } from "@/Hooks/Auth/useForceLogoutListener";
import { GlobalSoundNotifier } from "@/Components/Common/GlobalSoundNotifier";

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const dispatch = useDispatch()
  const location = useLocation()
  const { accessToken } = useSelector((state: RootState) => state.auth)

  useForceLogoutListener();

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


  return <>
   {/* Mover pop-up a rutas privadas*/}
      <GlobalSoundNotifier />
      <SupportRequestedPopup />
      <ConversationAssignedPopup />
      <AssignmentResponsePopup />
      <AssignmentForcedPopup />
      <ContactValidatorHub />
      {children}
  </>
}