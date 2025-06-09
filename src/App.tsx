import { ToastContainer } from 'react-toastify'
import { AppRouter } from '@/Routers/AppRouter'
import ReLoginModal from '@/Components/Common/ReLoginModal'
import OfflineBanner from '@/Components/Common/OfflineBanner'
import { useOnline } from '@/Hooks/useOnline'
import { SignalRProvider } from '@/Context/SignalRContext'
import { useRealtimeNotifications } from '@/Hooks/useRealtimeNotifications'
import '@/App.css'
import '@/i18n'
import 'react-toastify/dist/ReactToastify.css'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface'

// Componente interno para disparar el hook dentro del provider
function NotificationsHandler() {
  useRealtimeNotifications()
  return null
}

export default function App() {
  const online = useOnline()

  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as AuthData

  // Si no hay token, vamos al login (página pública)
  if (!accessToken) {
    return <AppRouter /> // Rutas públicas ya están en /login
  }

  return (
    <SignalRProvider token={accessToken}>
      {/* Iniciar la escucha de notificaciones en tiempo real */}
      <NotificationsHandler />

      {/* Banner offline */}
      {!online && <OfflineBanner onRetry={() => window.location.reload()} />}

      {/* Modal de re-login por token expirado */}
      <ReLoginModal />

      {/* Contenedor de toasts */}
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

      {/* Tu aplicación de rutas */}
      <AppRouter />
    </SignalRProvider>
  )
}
