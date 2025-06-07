import React, { useState } from 'react'
import { IoChatboxSharp } from 'react-icons/io5'
import { respondAssignment } from '@/Services/ConversationService'

interface AssignedModalProps {
  conversationId: number
  onClose(): void
}

const AssignedModal: React.FC<AssignedModalProps> = ({ conversationId, onClose }) => {
  const [justification, setJustification] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      await respondAssignment(conversationId, true)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!justification.trim()) {
      setError(true)
      return
    }
    setError(false)
    setLoading(true)
    try {
      await respondAssignment(conversationId, false, justification)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal assigned-modal">
        <header className="modal-header">
          <IoChatboxSharp size={48}/>
          <h2>Asignación de Conversación</h2>
          <p>Se te ha asignado la conversación #{conversationId}</p>
        </header>
        <div className="modal-body">
          <label>Justificación (si rechazas)</label>
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            disabled={loading}
          />
          {error && <p className="error">La justificación es obligatoria para rechazar.</p>}
        </div>
        <footer className="modal-footer">
          <button onClick={handleAccept} disabled={loading}>Aceptar</button>
          <button onClick={handleReject} disabled={loading}>Rechazar</button>
        </footer>
      </div>
    </div>
  )
}

export default AssignedModal