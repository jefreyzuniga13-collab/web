import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { forceAssign } from '@/Services/ConversationService'

import '@/Styles/Hub/SupportRequestedPopup.css'

export const AssignmentResponsePopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((state: RootState) => state.popup)
  const [assignmentComment, setComment] = useState<string>('')
  //const [error, setError] = useState<string>('')

  // Solo renderizar si es el evento correcto
  if (!isOpen || event?.type !== 'AssignmentResponse') return null

  const { conversationId, accepted, justification } = event.payload as { conversationId: number; accepted: boolean; justification: string }

  const handleSubmit = async (isAccepted: boolean) => {
    // Validar justificación al rechazar
    // if (!isAccepted && assignmentComment.trim() === '') {
    //   setError('La justificación es obligatoria cuando se rechaza.')
    //   return
    // }

    try {
    if(accepted)
      {
        console.log("Aceptado")
      }else{
           await forceAssign(conversationId, isAccepted, assignmentComment)
      }
      dispatch(closePopup())
    } catch {
      //setError('Error al enviar la respuesta. Intenta de nuevo.')
    }
  }

  const actions: ModalAction[] = [
    {
      label: accepted ? 'Aceptar' : 'Forzar asignación',
      onClick: () => handleSubmit(true),
      variant: accepted ? 'primary' : 'danger',
    },
    {
      label: 'Rechazar',
      onClick: () => handleSubmit(false),
      variant: 'secondary',
    },
  ]

  return (
    <ModalPopup
      title="Respuesta de asignación"
      message={
        accepted ? (
          <p>El agente aceptó la asignación.</p>
        ) : (
          <>
            <p>El agente va a rechazar la asignación, Motivo:</p>
            <p className='assignmentResponse-justification'> {justification}</p>

            <textarea
              className="modal-popup__textarea"
              placeholder="Motivo de forzar asignación..."
              value={assignmentComment}
              onChange={e => {
                setComment(e.target.value)
                // if (e.target.value.trim()) setError('')
              }}
            />
            {/* {error && <p className="modal-popup__error">{error}</p>} */}
          </>
        )
      }
      actions={actions}
      isOpen={isOpen}
      onClose={() => dispatch(closePopup())}
    />
  )
}
