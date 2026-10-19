import { useEffect, useMemo, useState } from 'react'
import Tooltip from '@mui/material/Tooltip'
import { WaTemplateService } from '@/Services/Wa/WaTemplateService'
import type { WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import '@/Styles/Chat/custom-messages-flyout.css'

type Props = {
  anchorRect: DOMRect | null
  open: boolean
  onClose: () => void
  onPick: (template: WaTemplateResponseDto) => void
}

const bodyOf = (template: WaTemplateResponseDto) => {
  try {
    const raw = typeof template.components === 'string'
      ? JSON.parse(template.components)
      : template.components
    if (!Array.isArray(raw)) return ''
    const body = raw.find((item) => String(item?.type ?? '').toUpperCase() === 'BODY')
    return String(body?.text ?? '').trim()
  } catch {
    return ''
  }
}

export default function TemplatesFlyout({
  anchorRect,
  open,
  onClose,
  onPick
}: Props) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<WaTemplateResponseDto[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)

    WaTemplateService.GetAllAsync(false, '')
      .then((list) => {
        if (cancelled) return
        const approved = (list ?? []).filter(
          (item) => String(item.status ?? '').toLowerCase() === 'approved'
        )
        setItems(approved)
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return items.filter((item) => {
      if (!term) return true
      const body = bodyOf(item).toLowerCase()
      return (
        item.name.toLowerCase().includes(term) ||
        body.includes(term) ||
        (item.templateCategoryName ?? '').toLowerCase().includes(term)
      )
    })
  }, [items, query])

  const flyoutStyle = useMemo(() => {
    if (!anchorRect) {
      return { left: 16, bottom: 90, transform: 'none' }
    }

    const gap = 10
    const margin = 12
    const width = 420
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    let left = anchorRect.left
    let top = anchorRect.top - 460

    if (left + width > viewportWidth - margin) {
      left = viewportWidth - width - margin
    }
    if (left < margin) left = margin
    if (top < margin) top = margin
    if (top > viewportHeight - 480) top = Math.max(margin, viewportHeight - 480)

    return { top, left, transform: 'none' }
  }, [anchorRect])

  if (!open) return null

  return (
    <>
      <div className="cmf-backdrop" onClick={onClose} />
      <div
        className="cmf-flyout"
        style={flyoutStyle}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label="Plantillas"
      >
        <div className="cmf-header">
          <div className="cmf-title">Plantillas</div>
        </div>

        <input
          className="cmf-textarea cmf-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o texto"
        />

        <div className="cmf-list">
          {loading && (
            <div className="cmf-skeleton" aria-hidden>
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="cmf-skeleton__card">
                  <span className="cmf-skeleton__bar cmf-skeleton__bar--title" />
                  <span className="cmf-skeleton__bar cmf-skeleton__bar--text" />
                </div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <p className="cmf-empty">
              {query.trim() ? 'Ninguna plantilla coincide.' : 'No hay plantillas aprobadas.'}
            </p>
          )}
          {!loading && filtered.map((item) => {
            const body = bodyOf(item) || item.name
            return (
              <Tooltip key={item.id} title={body} placement="left" arrow>
                <button
                  type="button"
                  className="cmf-item"
                  style={{ width: '100%', cursor: 'pointer' }}
                  onClick={() => {
                    onPick(item)
                    onClose()
                  }}
                >
                  <span className="cmf-item-text">
                    <strong className="cmf-item-content" title={item.name}>{item.name}</strong>
                    <span className="cmf-item-content" title={body}>{body}</span>
                  </span>
                </button>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </>
  )
}
