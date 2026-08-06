import type { ReactNode } from "react"
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined'

interface CatalogCardMetadata {
  label: string
  value: ReactNode
  icon?: ReactNode
}

interface CatalogCardProps {
  title: string
  subtitle?: string
  description?: string
  statusLabel: string
  isActive: boolean
  icon?: ReactNode
  tags?: string[]
  metadata?: CatalogCardMetadata[]
  footer?: ReactNode
  actions?: ReactNode
  beneficios:boolean
}

export function CatalogCard({
  title,
  subtitle,
  description,
  statusLabel,
  isActive,
  icon,
  tags = [],
  metadata = [],
  footer,
  actions,
  beneficios= false
}: CatalogCardProps) {
  const visibleTags = tags.slice(0, 5)
  const remainingTags = Math.max(tags.length - visibleTags.length, 0)

  return (
    <article className="license-card">
      <div className="license-card__header">
        <div className="license-card__identity">
          <div className="license-card__icon">
            {icon ?? <WorkspacePremiumOutlinedIcon />}
          </div>

          <div className="license-card__heading">
            <h2 className="license-card__title">{title}</h2>

            {subtitle && (
              <p className="license-card__subtitle">{subtitle}</p>
            )}
          </div>
        </div>

        <span
          className={[
            'license-card__status',
            isActive
              ? 'license-card__status--active'
              : 'license-card__status--inactive'
          ].join(' ')}
        >
          <span className="license-card__status-dot" />
          {statusLabel}
        </span>
      </div>

      <div className="license-card__body">
        <div className="license-card__section">
          <span className="license-card__section-label">Descripción</span>

          <p className="license-card__description">
            {description?.trim() || 'Esta licencia no posee una descripción registrada.'}
          </p>
        </div>

       {beneficios && (
         <div className="license-card__section">
          <span className="license-card__section-label">Beneficios</span>

          {visibleTags.length > 0 ? (
            <div className="license-card__tags">
              {visibleTags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="license-card__tag"
                  title={tag}
                >
                  {tag}
                </span>
              ))}

              {remainingTags > 0 && (
                <span
                  className="license-card__tag license-card__tag--more"
                  title={`${remainingTags} beneficios adicionales`}
                >
                  +{remainingTags}
                </span>
              )}
            </div>
          ) : (
            <p className="license-card__empty-text">
              No hay beneficios registrados.
            </p>
          )}
        </div>
       )}

        {metadata.length > 0 && (
          <div className="license-card__metadata">
            {metadata.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="license-card__metadata-item"
              >
                {item.icon && (
                  <div className="license-card__metadata-icon">
                    {item.icon}
                  </div>
                )}

                <div className="license-card__metadata-content">
                  <span className="license-card__metadata-label">
                    {item.label}
                  </span>

                  <span className="license-card__metadata-value">
                    {item.value || 'Sin registrar'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="license-card__footer">
        <div className="license-card__footer-information">
          {footer}
        </div>

        {actions && (
          <div className="license-card__actions">
            {actions}
          </div>
        )}
      </div>
    </article>
  )
}