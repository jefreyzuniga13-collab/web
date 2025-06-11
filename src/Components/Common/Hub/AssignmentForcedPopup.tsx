import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'
import { forceAssign } from '@/Services/ConversationService'

export const AssignmentForcedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((s: RootState) => s.popup)

  if (!isOpen || event?.type !== 'AssignmentForced') return null

  const { conversationId, comment } = event.payload

  const handleForce = async () => {
    try {
      // aquí podrías pedir al usuario seleccionar otro agente si lo deseas
      // por ahora forzamos sin cambiar agente:
      await forceAssign(conversationId)
      dispatch(closePopup())
    } catch {
      // opcional: mostrar toast de error
      dispatch(closePopup())
    }
  }

  const actions: ModalAction[] = [
    {
      label: 'Forzar asignación',
      onClick: handleForce,
      variant: 'danger'
    },
    {
      label: 'Cerrar',
      onClick: () => dispatch(closePopup()),
      variant: 'secondary'
    }
  ]

  return (
    <ModalPopup
      title="Asignación forzada"
      message={`La asignación fue forzada. Motivo: ${comment}`}
      actions={actions}
      isOpen={isOpen}
      onClose={() => dispatch(closePopup())}
    />
  )
}