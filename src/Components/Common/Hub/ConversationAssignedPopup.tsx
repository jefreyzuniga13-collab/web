import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { respondAssignment } from '@/Services/ConversationService'
import '@/Styles/Hub/SupportRequestedPopup.css' // adapta si tienes CSS específico

export const ConversationAssignedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((state: RootState) => state.popup)
  const [comment, setComment] = useState<string>('')
  const [error, setError] = useState<string>('')

  if (!isOpen || event?.type !== 'ConversationAssigned') return null

  const convo = event.payload as {
    conversationId: number
    clientContactName: string
    contactNumber?: string
    assignedAt?: string
  }

  const handleSubmit = async (accepted: boolean) => {
    // Si rechaza, validar que haya justificación
    if (!accepted && comment.trim() === '') {
      setError('La justificación es obligatoria al rechazar.')
      return
    }

    try {

      await respondAssignment(convo.conversationId, accepted, comment.trim() || undefined)
      dispatch(closePopup())
      // opcional: redirigir o refrescar lista
    } catch {
      setError('Error al procesar tu respuesta. Intenta nuevamente.')
    }
  }

  const actions: ModalAction[] = [
    {
      label: 'Aceptar',
      onClick: () => handleSubmit(true),
      variant: 'primary',
    },
    {
      label: 'Rechazar',
      onClick: () => handleSubmit(false),
      variant: 'danger',
    }
  ]

  return (
    <ModalPopup
      title="Conversación asignada"
      message={
        <>
          <p>Se te ha asignado la conversación de <strong>{convo.clientContactName}</strong>.</p>
          {convo.contactNumber && <p>Contacto: {convo.contactNumber}</p>}
          {/* Si rechaza, mostrar textarea */}
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
      isOpen={isOpen}
      onClose={() => dispatch(closePopup())}
      clientName={convo.clientContactName}
      timestamp={convo.assignedAt}
      icon="👥"
    />
  )
}