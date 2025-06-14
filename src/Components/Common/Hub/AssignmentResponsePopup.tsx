// src/Components/Common/Hub/AssignmentResponsePopup.tsx
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/Context'
import { dequeuePopup } from '@/Context/Slices/popupSlice'
import { openAssignModal } from '@/Context/Slices/assignModalSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { forceAssign, getConversation } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Hub/SupportRequestedPopup.css'

export const AssignmentResponsePopup: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { queue } = useSelector((state: RootState) => state.popup)
  const current = queue[0]

  const [assignmentComment, setAssignmentComment] = useState('')
  const [conversation, setConversation] = useState<ConversationDto | null>(null)

  useEffect(() => {
    if (!current || current.type !== 'AssignmentResponse') {
      setConversation(null)
      return
    }
    const { conversationId } = current.payload as {
      conversationId: number
      accepted: boolean
      justification: string
    }
    getConversation(conversationId)
      .then(res => setConversation(res.data.data))
      .catch(console.error)
  }, [current])

  if (!current || current.type !== 'AssignmentResponse') return null

  const { conversationId, accepted, justification } = current.payload as {
    conversationId: number
    accepted: boolean
    justification: string
  }

  const handleClose = () => {
    dispatch(dequeuePopup())
  }

  const handleSubmit = async (isAccepted: boolean) => {
    try {
      if (!accepted) {
        await forceAssign(conversationId, isAccepted, assignmentComment)
        if (!isAccepted && conversation) {
          dispatch(openAssignModal(conversation))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      handleClose()
    }
  }

  const actions: ModalAction[] = [
    {
      label: accepted ? 'Aceptar' : 'Forzar asignación',
      onClick: () => handleSubmit(true),
      variant: accepted ? 'primary' : 'danger',
    },
    {
      label: 'Reasignar',
      onClick: () => handleSubmit(false),
      variant: 'secondary',
    },
  ]

  return (
    <ModalPopup
      title="Respuesta de asignación"
      isOpen={true}
      onClose={handleClose}
      message={
        accepted ? (
          <p>El agente aceptó la asignación.</p>
        ) : (
          <>
            <p>El agente va a rechazar la asignación. Motivo:</p>
            <p className="assignmentResponse-justification">{justification}</p>
            <textarea
              className="modal-popup__textarea"
              placeholder="Motivo de forzar asignación..."
              value={assignmentComment}
              onChange={e => setAssignmentComment(e.target.value)}
            />
          </>
        )
      }
      actions={actions}
    />
  )
}