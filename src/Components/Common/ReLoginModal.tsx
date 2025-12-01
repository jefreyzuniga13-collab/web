import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ReactDOM from 'react-dom'
import { closeReLoginModal } from '@/Context/Slices/uiSlice'
import { logout } from '@/Context/Slices/authSlice'
import type { RootState, AppDispatch } from '@/Context/index'
import Button from '@/Components/Common/Button'
import '@/Styles/Common/ReLoginModal.css'
import { useEffect } from 'react'

export default function ReLoginModal() {
  const open = useSelector((s: RootState) => s.ui.reloginModalOpen)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    document.body.classList.add('modal-open')
    return () => document.body.classList.remove('modal-open')
  }, [open])

  if (!open) return null

  const handleClose = () => {
    dispatch(closeReLoginModal())
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  const modal = (
    <div className="modal-backdrop modal-background" role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="relogin-title"
        aria-describedby="relogin-desc"
      >
        <h2 id="relogin-title" className="modal__title">Sesión expirada</h2>
        <p id="relogin-desc" className="modal__body">
          Tu sesión ha caducado. Por favor, inicia sesión nuevamente para continuar usando el sistema.
        </p>

        <div className="modal__actions">
          <Button onClick={handleClose}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    </div>
  )

  return ReactDOM.createPortal(modal, document.body)
}