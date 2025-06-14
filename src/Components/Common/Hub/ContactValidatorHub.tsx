import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/Context'
import { dequeuePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { useNavigate } from 'react-router-dom'

export const ContactValidatorPopup: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { queue } = useSelector((state: RootState) => state.popup)
  const current = queue[0]

  if (!current || current.type !== 'newContactValidation') return null

  const { waName, createdAt, isVerified, phone } = current.payload

  const handleClose = () => {
    dispatch(dequeuePopup())
  }

  const handleSubmit = () => {
    navigate(`/verify-contact/${phone}`)
    dispatch(dequeuePopup())
  }

  const actions: ModalAction[] = [
    {
      label: 'Verificar',
      onClick: handleSubmit,
      variant: 'primary',
    },
  ]

  return (
    <ModalPopup
      title="Nuevo contacto"
      message={`Nuevo contacto ${waName} se registró el ${new Date(createdAt).toLocaleString()}. Estado actual: ${isVerified ? 'Verificado' : 'Sin verificar'}.`}
      actions={actions}
      isOpen={true}
      onClose={handleClose}
      icon="🛎️"
    />
  )
}

export default ContactValidatorPopup