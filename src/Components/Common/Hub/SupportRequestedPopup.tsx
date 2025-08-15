import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { dequeuePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import '@/Styles/Hub/SupportRequestedPopup.css'

export const SupportRequestedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { queue } = useSelector((state: RootState) => state.popup)
  const current = queue[0]

  if (!current || current.type !== 'SupportRequested') return null

  const { requestedAt, clientContactName, clientName } = current.payload

  const handleClose = () => {
    dispatch(dequeuePopup())
  }

  const actions: ModalAction[] = [
    {
      label: 'Cerrar',
      onClick: handleClose,
      variant: 'secondary',
    },
  ]

  return (
    <ModalPopup
      title={`Solicitud de soporte cliente ${clientName}`}
      message={`El contacto ${clientContactName} solicitó soporte el ${new Date(requestedAt).toLocaleString()}.`}
      actions={actions}
      isOpen={true}
      onClose={handleClose}
      clientName={clientName}
      timestamp={requestedAt}
      icon="🎧"
    />
  )
}