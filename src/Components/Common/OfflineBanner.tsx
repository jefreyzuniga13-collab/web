import '@/Styles/Common/OfflinePage.css'
import Unavailable from '@/assets/img/unavailable.webp'

export default function OfflinePage({
  onRetry
}: {
  onRetry: () => void
}) {
  return (
    <div className="offline-page">
      <img
        src={Unavailable}
        alt="Sin conexión a Internet"
        className="offline-page__image"
      />

      <h1 className="offline-page__title">
        Sin conexión
      </h1>

      <p className="offline-page__subtitle">
        No se pudo establecer conexión a Internet. 
        Verifica tu red e inténtalo nuevamente.
      </p>

      <button
        className="offline-page__button"
        onClick={onRetry}
      >
        Reintentar
      </button>
    </div>
  )
}