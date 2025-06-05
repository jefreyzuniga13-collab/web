
import React from 'react'
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/DeleteParamDialog.css'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  param: SystemParamResponseDto | null
  isToggle?: boolean
}

export const DeleteParamDialog: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  param,
  isToggle = false
}) => {
  if (!isOpen || !param) return null

  const action = isToggle 
    ? (param.isActive ? 'desactivar' : 'activar')
    : 'eliminar'
  
  // const actionPast = isToggle 
  //   ? (param.isActive ? 'desactivado' : 'activado') 
  //   : 'eliminado'

  return (
    <div className="system-param-modal">
      <div className="system-param-modal__backdrop">
        <div className="system-param-modal__overlay" onClick={onClose}></div>
        
        <div className="system-param-modal__content">
          <div className="system-param-modal__body">
            <div className="system-param-delete__icon-container">
              <div className="system-param-delete__icon">
                {isToggle ? '❓' : '⚠'}
              </div>
            </div>
            
            <h3 className="system-param-delete__title">
              {isToggle ? 'Cambiar Estado' : 'Confirmar Eliminación'}
            </h3>
            
            <p className="system-param-delete__message">
              ¿Estás seguro que deseas {action} el parámetro <strong>{param.name}</strong>?
            </p>
            
            {!isToggle && (
              <div className="system-param-delete__warning">
                Si eliminas este parámetro no podrá ser recuperado y puede afectar 
                el funcionamiento del sistema. Por favor tome en cuenta este hecho antes de seguir.
              </div>
            )}

            <div className="system-param-delete__actions">
              <button
                onClick={onClose}
                className="system-param-delete__button system-param-delete__button--cancel"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={`system-param-delete__button ${isToggle ? 'system-param-delete__button--toggle' : 'system-param-delete__button--confirm'}`}
              >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}