import { ToastContainer } from 'react-toastify'
import { AppRouter } from '@/Routers/AppRouter'
import ReLoginModal from '@/Components/Common/ReLoginModal'
import OfflineBanner from '@/Components/Common/OfflineBanner'
import { useOnline } from '@/Hooks/useOnline'
import { SignalRProvider } from '@/Context/SignalRContext'
import { useNotificationsHub } from '@/Hooks/Hub/useNotificationsHub'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { openPopup } from '@/Context/Slices/popupSlice'
import { SupportRequestedPopup } from '@/Components/Common/Hub/SupportRequestedPopup'
import { AssignmentResponsePopup } from '@/Components/Common/Hub/AssignmentResponsePopup'
import { AssignmentForcedPopup } from '@/Components/Common/Hub/AssignmentForcedPopup'
import '@/App.css'
import '@/i18n'
import 'react-toastify/dist/ReactToastify.css'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface'

function NotificationsHandler() {
  const lastEvent = useNotificationsHub()
  const dispatch = useDispatch()

  useEffect(() => {
    console.log('🔔 SignalR event:', lastEvent)
    if (lastEvent) {
      dispatch(openPopup(lastEvent))
    }
  }, [lastEvent, dispatch])

  return null
}

export default function App() {
  const online = useOnline()
  const authRaw = localStorage.getItem('auth') ?? '{}'
  const { accessToken } = JSON.parse(authRaw) as AuthData

  if (!accessToken) {
    return <AppRouter />
  }

  return (
    <SignalRProvider token={accessToken}>
      <NotificationsHandler />
      <SupportRequestedPopup />
      <AssignmentResponsePopup />
      <AssignmentForcedPopup />
      {!online && <OfflineBanner onRetry={() => window.location.reload()} />}
      <ReLoginModal />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
      <AppRouter />
    </SignalRProvider>
  )
}