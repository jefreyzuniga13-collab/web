import { useTranslation } from 'react-i18next'
import '@/Styles/Common/OfflinePage.css'

export default function OfflinePage({
  onRetry
}: {
  /** Función que se ejecuta al hacer retry */
  onRetry: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="offline-page">
      <img
        src="https://i.ibb.co/VYc8frY5/offline.png"
        alt={t('offlinePage.title')}
        className="offline-page__image"
      />
      <h1 className="offline-page__title">
        {t('offlinePage.title')}
      </h1>
      <p className="offline-page__subtitle">
        {t('offlinePage.message')}
      </p>
      <button
        className="offline-page__button"
        onClick={onRetry}
      >
        {t('offlinePage.button')}
      </button>
    </div>
  )
}