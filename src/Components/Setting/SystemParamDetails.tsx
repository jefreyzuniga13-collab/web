
import React from 'react'
import { X } from 'lucide-react'
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"

interface Props {
  param: SystemParamResponseDto | null
  isOpen: boolean
  onClose: () => void
}

export const SystemParamDetails: React.FC<Props> = ({ param, isOpen, onClose }) => {
  if (!isOpen || !param) return null

  return (
    <div className="system-param-modal">
      <div className="system-param-modal__backdrop">
        <div className="system-param-modal__overlay" onClick={onClose}></div>
        
        <div className="system-param-modal__content">
          <div className="system-param-modal__header">
            <h3 className="system-param-modal__title">Detalles del Parámetro</h3>
            <button
              onClick={onClose}
              className="system-param-modal__close"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="system-param-modal__body">
            <div className="system-param-details__field">
              <label className="system-param-details__label">ID</label>
              <p className="system-param-details__value">{param.id}</p>
            </div>
            
            <div className="system-param-details__field">
              <label className="system-param-details__label">Nombre</label>
              <p className="system-param-details__value">{param.name}</p>
            </div>
            
            <div className="system-param-details__field">
              <label className="system-param-details__label">Tipo</label>
              <span className={`system-params-table__badge system-params-table__badge--${param.type}`}>
                {param.type}
              </span>
            </div>
            
            <div className="system-param-details__field">
              <label className="system-param-details__label">Valor</label>
              <p className="system-param-details__value system-param-details__value--code">
                {param.value}
              </p>
            </div>
            
            <div className="system-param-details__field">
              <label className="system-param-details__label">Descripción</label>
              <p className="system-param-details__value">{param.description}</p>
            </div>
          </div>
          
          <div className="system-param-modal__footer">
            <button
              onClick={onClose}
              className="system-param-details__close-button"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
