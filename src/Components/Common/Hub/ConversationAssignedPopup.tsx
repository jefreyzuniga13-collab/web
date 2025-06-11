import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'

export const ConversationAssignedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((s: RootState) => s.popup)

  if (!isOpen || event?.type !== 'ConversationAssigned') return null

  const convo = event.payload

  const actions: ModalAction[] = [
    {
      label: 'Ver detalles',
      onClick: () => {
        window.location.href = `/conversations/${convo.conversationId}`
        dispatch(closePopup())
      },
      variant: 'primary'
    },
    { label: 'Cerrar', onClick: () => dispatch(closePopup()), variant: 'secondary' }
  ]

  return (
    <ModalPopup
      title="Conversación asignada"
      message={`Se te ha asignado la conversación #${convo.conversationId}.`}
      actions={actions}
      isOpen={isOpen}
      onClose={() => dispatch(closePopup())}
    />
  )
}