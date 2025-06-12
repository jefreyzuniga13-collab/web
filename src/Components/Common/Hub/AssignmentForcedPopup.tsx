import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/Context'
import { closePopup } from '@/Context/Slices/popupSlice'
import { ModalPopup, type ModalAction } from '@/Components/Common/Hub/ModalPopup'

export const AssignmentForcedPopup: React.FC = () => {

  const dispatch = useDispatch()
  const { isOpen, event } = useSelector((s: RootState) => s.popup)

  if (!isOpen || event?.type !== 'AssignmentForced') return null

  const {assignmentComment} = event.payload as {assignmentComment: string;}
  console.log("assignment recibida", assignmentComment);
  const handleForce = async () => {

      dispatch(closePopup())

  }

  const actions: ModalAction[] = [
    {
      label: 'Aceptar',
      onClick: handleForce,
      variant: 'primary'
    }
  ]

  return (
    <ModalPopup
      title="Asignación forzada"
      message={`La asignación fue realizada con éxito. El motivo ha sido: ${assignmentComment.length != 0 ? assignmentComment : 'No Especificado.'}`}
      actions={actions}
      isOpen={isOpen}
      onClose={() => dispatch(closePopup())}
    />
  )
}