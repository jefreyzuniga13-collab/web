import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { closeReLoginModal } from '@/Context/Slices/uiSlice'
import { logout } from '@/Context/Slices/authSlice'
import type { RootState, AppDispatch } from '@/Context/index'
import '@/Styles/Common/ReLoginModal.css'

export default function ReLoginModal() {
  const { t } = useTranslation()

  const open = useSelector((state: RootState) => state.ui.reloginModalOpen)

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  if (!open) return null

  const handleClose = () => {
    dispatch(closeReLoginModal())
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{t('reloginModal.title')}</h2>
        <p>{t('reloginModal.message')}</p>
        <button onClick={handleClose}>
          {t('reloginModal.button')}
        </button>
      </div>
    </div>
  )
}