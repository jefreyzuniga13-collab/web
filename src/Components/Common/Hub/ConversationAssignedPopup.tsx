// src/Components/Common/Hub/ConversationAssignedPopup.tsx
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { dequeuePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { respondAssignment } from '@/Services/ConversationService'
import '@/Styles/Hub/SupportRequestedPopup.css'

export const ConversationAssignedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { queue } = useSelector((state: RootState) => state.popup)
  const current = queue[0]
  const [comment, setComment] = useState<string>('')
  const [error, setError] = useState<string>('')

  if (!current || current.type !== 'ConversationAssigned') return null

  const convo = current.payload as {
    conversationId: number
    clientContactName: string
    contactNumber?: string
    assignedAt?: string
  }

  const handleClose = () => {
    dispatch(dequeuePopup())
  }

  const handleSubmit = async (accepted: boolean) => {
    if (!accepted && comment.trim() === '') {
      setError('La justificación es obligatoria al rechazar.')
      return
    }
    try {
      await respondAssignment(convo.conversationId, accepted, comment.trim() || undefined)
      handleClose()
    } catch {
      setError('Error al procesar tu respuesta. Intenta nuevamente.')
    }
  }

  const actions: ModalAction[] = [
    { label: 'Aceptar', onClick: () => handleSubmit(true), variant: 'primary' },
    { label: 'Rechazar', onClick: () => handleSubmit(false), variant: 'danger' }
  ]

  return (
    <ModalPopup
      title="Conversación asignada"
      message={
        <>
          <p>Se te ha asignado la conversación de <strong>{convo.clientContactName}</strong>.</p>
          {convo.contactNumber && <p>Contacto: {convo.contactNumber}</p>}
          <div>
            <textarea
              className="modal-popup__textarea"
              placeholder="Motivo de rechazo..."
              value={comment}
              onChange={e => {
                setComment(e.target.value)
                if (e.target.value.trim()) setError('')
              }}
            />
            {error && <p className="modal-popup__error">{error}</p>}
          </div>
        </>
      }
      actions={actions}
      isOpen={true}
      onClose={handleClose}
      clientName={convo.clientContactName}
      timestamp={convo.assignedAt}
      icon="👥"
    />
  )
}