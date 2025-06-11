import React from 'react'
import '@/Styles/Common/ModalPopup.css'

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface ModalPopupProps {
  title: string
  message: React.ReactNode
  actions: ModalAction[]
  isOpen: boolean
  onClose: () => void
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
  title,
  message,
  actions,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-popup">
      <div className="modal-popup__backdrop" onClick={onClose} />
      <div className="modal-popup__dialog">
        <header className="modal-popup__header">
          <h2 className="modal-popup__title">{title}</h2>
          <button
            className="modal-popup__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="modal-popup__body">{message}</div>
        <footer className="modal-popup__footer">
          {actions.map((act, i) => (
            <button
              key={i}
              className={`modal-popup__action modal-popup__action--${act.variant ?? 'primary'}`}
              onClick={act.onClick}
            >
              {act.label}
            </button>
          ))}
        </footer>
      </div>
    </div>
  )
}