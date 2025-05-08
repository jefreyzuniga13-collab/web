import '@/Styles/Common/EmptyState.css'

interface EmptyStateProps {
  imageSrc: string
  alt:      string
  title:    string
  subtitle?: string
  buttonText?: string
  onButtonClick?: () => void
}

export default function EmptyState({
  imageSrc,
  alt,
  title,
  subtitle,
  buttonText,
  onButtonClick
}: EmptyStateProps) {
  return (
    <div className="empty-state-page">
      <img
        src={imageSrc}
        alt={alt}
        className="empty-state-page__image"
      />
      <h1 className="empty-state-page__title">{title}</h1>
      {subtitle && (
        <p className="empty-state-page__subtitle">{subtitle}</p>
      )}
      {buttonText && onButtonClick && (
        <button
          className="empty-state-page__button"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      )}
    </div>
  )
}