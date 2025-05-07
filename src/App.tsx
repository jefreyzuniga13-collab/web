import { ToastContainer } from 'react-toastify'
import { AppRouter } from '@/Routers/AppRouter'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
import './i18n'

export default function App() {
  return (
    <>
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