
import React from 'react'
import { X } from 'lucide-react'
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/SystemParamDetails.css'

interface Props {
  param: SystemParamResponseDto | null
  isOpen: boolean
  onClose: () => void
}

export const SystemParamDetails: React.FC<Props> = ({ param, isOpen, onClose }) => {
  if (!isOpen || !param) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
            <div className="system-param-details__container">
              <div className="system-param-details__meta">
                <div className="system-param-details__field system-param-details__field--meta">
                  <label className="system-param-details__label">ID</label>
                  <p className="system-param-details__value">{param.id}</p>
                </div>
                
                <div className="system-param-details__field system-param-details__field--meta">
                  <label className="system-param-details__label">Nombre</label>
                  <p className="system-param-details__value">{param.name}</p>
                </div>
                
                <div className="system-param-details__field system-param-details__field--meta">
                  <label className="system-param-details__label">Tipo</label>
                  <span className={`system-params-table__badge system-params-table__badge--${param.type}`}>
                    {param.type}
                  </span>
                </div>

                <div className="system-param-details__field system-param-details__field--meta">
                  <label className="system-param-details__label">Estado</label>
                  <span className={`system-params-table__badge system-params-table__badge--${param.isActive ? 'active' : 'inactive'}`}>
                    {param.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              
              <div className="system-param-details__content">
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

                <div className="system-param-details__field">
                  <label className="system-param-details__label">Fecha de Creación</label>
                  <p className="system-param-details__value">{formatDate(param.createdAt)}</p>
                </div>

                <div className="system-param-details__field">
                  <label className="system-param-details__label">Última Actualización</label>
                  <p className="system-param-details__value">{formatDate(param.updatedAt)}</p>
                </div>
              </div>
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