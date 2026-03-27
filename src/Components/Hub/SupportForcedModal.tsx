// src/components/SupportForcedModal.tsx
import React from 'react'
import { IoWarning } from 'react-icons/io5'

interface SupportForcedModalProps {
  conversationId: number
  comment: string
  onClose(): void
}

const SupportForcedModal: React.FC<SupportForcedModalProps> = ({
  conversationId,
  comment,
  onClose
}) => (
  <div className="modal-backdrop">
    <div className="modal support-forced-modal">
      <header className="modal-header">
        <IoWarning size={48}/>
        <h2>Asignación Forzada</h2>
      </header>
      <div className="modal-body">
        <p>
          Se te ha asignado <strong>forzosamente</strong> la conversación #{conversationId}.
        </p>
        <blockquote>{comment}</blockquote>
      </div>
      <footer className="modal-footer">
        <button onClick={onClose}>OK</button>
      </footer>
    </div>
  </div>
)

export default SupportForcedModal