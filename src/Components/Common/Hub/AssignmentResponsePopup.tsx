import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { respondAssignment } from '@/Services/ConversationService'

export const AssignmentResponsePopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((s: RootState) => s.popup)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  if (!isOpen || event?.type !== 'AssignmentResponse') return null

  const { conversationId, accepted } = event.payload

  const handleSubmit = async () => {
    if (!accepted && comment.trim() === '') {
      setError('La justificación es obligatoria cuando se rechaza.')
      return
    }
    try {
      await respondAssignment(conversationId, accepted, comment)
      dispatch(closePopup())
    } catch {
      setError('Error al enviar la respuesta. Intenta de nuevo.')
    }
  }

  const actions: ModalAction[] = [
    {
      label: accepted ? 'Aceptar' : 'Enviar rechazo',
      onClick: handleSubmit,
      variant: accepted ? 'primary' : 'danger'
    },
    {
      label: 'Cerrar',
      onClick: () => dispatch(closePopup()),
      variant: 'secondary'
    }
  ]

  return (
    <ModalPopup
      title="Respuesta de asignación"
      message={
        accepted ? (
          <p>El agente aceptó la asignación.</p>
        ) : (
          <>
            <p>El agente va a rechazar la asignación. Por favor ingrese un motivo:</p>
            <textarea
              className="modal-popup__textarea"
              value={comment}
              onChange={e => {
                setComment(e.target.value)
                if (e.target.value.trim()) setError('')
              }}
              placeholder="Motivo de rechazo..."
            />
            {error && <p className="modal-popup__error">{error}</p>}
          </>
        )
      }
      actions={actions}
      isOpen={isOpen}
      onClose={() => dispatch(closePopup())}
    />
  )
}