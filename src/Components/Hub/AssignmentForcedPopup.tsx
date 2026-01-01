import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { dequeuePopup } from '@/Context/Slices/Chat/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Hub/ModalPopup'

export const AssignmentForcedPopup: React.FC = () => {
  const dispatch = useDispatch()
  const { queue } = useSelector((state: RootState) => state.popup)
  const current = queue[0]

  if (!current || current.type !== 'AssignmentForced') return null

  const { assignmentComment, systemDefinedCompanyName, clientContactName  } = current.payload as { assignmentComment: string , systemDefinedCompanyName: string; clientContactName: string}

  const handleClose = () => {
    dispatch(dequeuePopup())
  }

  const actions: ModalAction[] = [
    {
      label: 'Aceptar',
      onClick: handleClose,
      variant: 'primary'
    }
  ]

  return (
    <ModalPopup
      title={`Asignación realizada. ${systemDefinedCompanyName != null ? "Cliente " + systemDefinedCompanyName : ""}. Contacto ${clientContactName}`}
      message={`La asignación fue realizada con éxito. El motivo ha sido: ${assignmentComment || 'No Especificado.'}`}
      actions={actions}
      isOpen={true}
      onClose={handleClose}
    />
  )
}