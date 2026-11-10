import { useState } from "react"
import Button from "@/Components/Common/Button"
import "@/Styles/Crm/OpeningHourModal.css"
import "@/Styles/Crm/CallCenter.css"

export interface ConfirmDetalle {
  label: string
  value: string
}

interface Props {
  isOpen: boolean
  title: string
  message: string
  detalles: ConfirmDetalle[]
  confirmText?: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export default function CallCenterConfirmModal({
  isOpen,
  title,
  message,
  detalles,
  confirmText = "Dar de baja",
  onClose,
  onConfirm
}: Props) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const confirmar = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="oh-modal__overlay" onClick={() => !loading && onClose()}>
      <div
        className="oh-modal__container cc-confirm"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="oh-modal__header">
          <div className="oh-modal__header-text">
            <h2 className="oh-modal__title">{title}</h2>
            <p className="oh-modal__subtitle">{message}</p>
          </div>
        </header>

        <dl className="cc-confirm__detalle">
          {detalles.map((item) => (
            <div key={item.label} className="cc-confirm__fila">
              <dt>{item.label}</dt>
              <dd>{item.value || "-"}</dd>
            </div>
          ))}
        </dl>

        <footer className="oh-modal__footer">
          <Button variant="secondary" className="oh-modal__btn" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" className="oh-modal__btn" onClick={() => void confirmar()} loading={loading}>
            {confirmText}
          </Button>
        </footer>
      </div>
    </div>
  )
}
