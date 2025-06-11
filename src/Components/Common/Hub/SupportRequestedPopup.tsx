import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup, openPopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import '@/Styles/Hub/SupportRequestedPopup.css'

export const SupportRequestedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((s: RootState) => s.popup)

  if (!event || event.type !== 'SupportRequested') return null

  const { conversationId, clientName, requestedAt } = event.payload

  const actions: ModalAction[] = [
    {
      label: 'Ver conversación',
      onClick: () => {
        window.location.href = `/conversations/${conversationId}`
        dispatch(closePopup())
      },
      variant: 'primary'
    },
    {
      label: 'Cerrar',
      onClick: () => dispatch(closePopup()),
      variant: 'secondary'
    }
  ]

  return (
    <>
      {!isOpen && (
        <div
          className="support-requested-bubble"
          onClick={() => dispatch(openPopup(event))}
        >
          🛎️
        </div>
      )}
      <ModalPopup
        title="Solicitud de soporte"
        message={`El cliente ${clientName} solicitó soporte el ${new Date(requestedAt).toLocaleString()}.`}
        actions={actions}
        isOpen={isOpen}
        onClose={() => dispatch(closePopup())}
      />
    </>
  )
}