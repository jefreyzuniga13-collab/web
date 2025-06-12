import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup, openPopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import '@/Styles/Hub/SupportRequestedPopup.css'

export const SupportRequestedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((state: RootState) => state.popup)

  if (!event || event.type !== 'SupportRequested') return null

  const { clientName, requestedAt } = event.payload

  const handleOpen = () => dispatch(openPopup(event))
  const handleClose = () => dispatch(closePopup())

  const actions: ModalAction[] = [
    {
      label: 'Cerrar',
      onClick: handleClose,
      variant: 'secondary',
    },
  ]

  return (
    <>
      {!isOpen && (
        <div className="support-requested-bubble" onClick={handleOpen}>
          🛎️
        </div>
      )}
      <ModalPopup
        title="Solicitud de soporte"
        message={`El cliente ${clientName} solicitó soporte el ${new Date(requestedAt).toLocaleString()}.`}
        actions={actions}
        isOpen={isOpen}
        onClose={handleClose}
        clientName={clientName}
        timestamp={requestedAt}
        icon="🎧"
      />
    </>
  )
}