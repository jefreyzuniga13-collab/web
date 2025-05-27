/* eslint-disable react-hooks/rules-of-hooks */
import { ToastContainer } from 'react-toastify'
import { AppRouter } from '@/Routers/AppRouter'
import ReLoginModal from '@/Components/Common/ReLoginModal'
import OfflineBanner from '@/Components/Common/OfflineBanner'
import { useOnline } from '@/Hooks/useOnline'
import { SignalRProvider } from '@/Context/SignalRContext'
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications'
import './App.css'
import './i18n'
import 'react-toastify/dist/ReactToastify.css'

interface AuthStorage {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  userId?: number
}

export default function App() {
  const online = useOnline()

  // Extraemos el token (si existe) del localStorage
  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as AuthStorage

  // Si no hay token, vamos al login (página pública)
  if (!accessToken) {
    return <AppRouter />  // Rutas públicas ya esta /login
  }

  useRealtimeNotifications();
  
  // Sólo cuando tenemos token, arrancamos SignalR y las notifs en tiempo real
  return (
    <SignalRProvider token={accessToken}>

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