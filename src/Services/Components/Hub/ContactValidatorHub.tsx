import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/Context'
import { dequeuePopup } from '@/Context/Slices/Chat/popupSlice'
import { ModalPopup, type ModalAction } from '@/Services/Components/Hub/ModalPopup'
import { useNavigate } from 'react-router-dom'

export const ContactValidatorPopup: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { queue } = useSelector((state: RootState) => state.popup)
  const current = queue[0]

  if (!current || current.type !== 'newContactValidation') return null

  const { waName, fullName, createdAt, isVerified,
    //  phone, 
     id
    } = current.payload

  const handleClose = () => {
    dispatch(dequeuePopup())
  }

  const handleSubmit = () => {
    navigate(`/verify-contact/${id}`)
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
      message={`Nuevo contacto ${fullName != null ? fullName : waName} se registró el ${new Date(createdAt).toLocaleString()}. Estado actual: ${isVerified ? 'Verificado' : 'Sin verificar'}.`}
      actions={actions}
      isOpen={true}
      onClose={handleClose}
      icon="🛎️"
    />
  )
}

export default ContactValidatorPopup