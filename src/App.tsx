import { ToastContainer } from 'react-toastify'
import { AppRouter }     from '@/Routers/AppRouter'
import ReLoginModal      from '@/Components/Common/ReLoginModal'
import OfflineBanner       from '@/Components/Common/OfflineBanner'
import { useOnline }     from '@/Hooks/useOnline'
import './App.css'
import './i18n'
import 'react-toastify/dist/ReactToastify.css'

export default function App() {
  const online = useOnline()

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <>
      {!online && <OfflineBanner onRetry={handleRetry} />}

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
    </>
  )
}