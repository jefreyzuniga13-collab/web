import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import '@/Styles/Common/Unauthorized.css'

export default function Unauthorized() {
  const { t } = useTranslation()
  return (
    <div className="unauthorized-container">
      <img
        src="https://i.ibb.co/ksPRdqdx/forbidden.png"
        alt={t('unauthorized.title')}
        className="unauthorized-image"
      />
      <h1 className="unauthorized-title">{t('unauthorized.title')}</h1>
      <p className="unauthorized-description">
        {t('unauthorized.description')}
      </p>
      <Link to="/dashboard" replace className="unauthorized-button">
        {t('unauthorized.button')}
      </Link>
    </div>
  )
}