// src/components/AdminResponseModal.tsx
import React, { useState } from 'react'
import { forceAssign } from '@/Services/ConversationService'

interface AdminResponseModalProps {
  conversationId: number
  accepted: boolean
  comment?: string
  onClose(): void
 // onForceAssign: (conversationId: number, targetAgentId: number, comment: string) => Promise<void>
}

const AdminResponseModal: React.FC<AdminResponseModalProps> = ({
  conversationId,
  accepted,
  comment,
  onClose
}) => {
  const [targetAgentId, setTargetAgentId] = useState<number>()
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)

  const handleForce = async () => {
    if (!targetAgentId || !justification.trim()) return
    setLoading(true)
    try {
      await forceAssign(conversationId, true, justification? justification : '')
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal admin-response-modal">
        <header className="modal-header">
          <h2>Respuesta de Support</h2>
        </header>
        <div className="modal-body">
          {accepted ? (
            <p>La conversación #{conversationId} ha sido <strong>aceptada</strong>.</p>
          ) : (
            <>
              <p>La conversación #{conversationId} ha sido <strong>rechazada</strong>.</p>
              <blockquote>{comment}</blockquote>
            </>
          )}
          {!accepted && (
            <>
              <hr/>
              <h3>Forzar asignación</h3>
              <label>Agent ID:</label>
              <input
                type="number"
                value={targetAgentId ?? ''}
                onChange={e => setTargetAgentId(Number(e.target.value))}
                disabled={loading}
              />
              <label>Justificación:</label>
              <textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                disabled={loading}
              />
            </>
          )}
        </div>
        <footer className="modal-footer">
          {!accepted && (
            <button
              onClick={handleForce}
              disabled={loading || !targetAgentId || !justification.trim()}
            >
              Forzar asignación
            </button>
          )}
          <button onClick={onClose} disabled={loading}>Cerrar</button>
        </footer>
      </div>
    </div>
  )
}

export default AdminResponseModal
