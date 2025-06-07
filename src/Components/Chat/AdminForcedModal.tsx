// src/components/AdminForcedModal.tsx
import React from 'react'
import { IoCheckmarkDoneCircle } from 'react-icons/io5'

interface AdminForcedModalProps {
  conversationId: number
  targetAgentId: number
  comment: string
  onClose(): void
}

const AdminForcedModal: React.FC<AdminForcedModalProps> = ({
  conversationId,
  targetAgentId,
  comment,
  onClose
}) => (
  <div className="modal-backdrop">
    <div className="modal admin-forced-modal">
      <header className="modal-header">
        <IoCheckmarkDoneCircle size={48}/>
        <h2>Asignación Completada</h2>
      </header>
      <div className="modal-body">
        <p>
          Has forzado la asignación de la conversación <strong>#{conversationId}</strong> al agente <strong>#{targetAgentId}</strong>.
        </p>
        <blockquote>{comment}</blockquote>
      </div>
      <footer className="modal-footer">
        <button onClick={onClose}>OK</button>
      </footer>
    </div>
  </div>
)

export default AdminForcedModal
