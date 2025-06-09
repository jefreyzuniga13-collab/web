
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/Components/ui/CustomButton';
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";

import '@/styles/users/Modal.css'
import '@/Styles/Setting/SystemParamModal.css'

interface SystemParamDetailsProps {
  param: SystemParamResponseDto | null;
  isOpen: boolean;
  onClose: () => void;
}

const SystemParamDetails: React.FC<SystemParamDetailsProps> = ({ param, isOpen, onClose }) => {
  if (!isOpen || !param) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div 
        className="modal__container modal__container--large" 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">Detalles del Parámetro</h2>
          <button 
            className="modal__close-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="modal__content">
          <div className="user-detail">
            <div className="user-detail__header">
              <div className="user-detail__info">
                <h2 className="user-detail__name">{param.name}</h2>
                <div className="user-detail__status">
                  <span className={`user-detail__status-indicator ${param.isActive ? 'user-detail__status-indicator--active' : 'user-detail__status-indicator--inactive'}`}></span>
                  <span className="user-detail__status-text">
                    {param.isActive ? 'Parámetro Activo' : 'Parámetro Inactivo'}
                  </span>
                </div>
                <span className={`system-param-detail__type-badge system-param-detail__type-badge--${param.type.toLowerCase()}`}>
                  {param.type}
                </span>
              </div>
            </div>

            <div className="user-detail__content">
              <div className="user-detail__info-tab">
                <div className="user-detail__section">
                  <h3 className="user-detail__section-title">Información General</h3>
                  <div className="user-detail__info-grid">
                    <div className="user-detail__info-item">
                      <label className="user-detail__info-label">ID del parámetro</label>
                      <span className="user-detail__info-value">{param.id}</span>
                    </div>
                    <div className="user-detail__info-item">
                      <label className="user-detail__info-label">Nombre</label>
                      <span className="user-detail__info-value">{param.name}</span>
                    </div>
                    <div className="user-detail__info-item">
                      <label className="user-detail__info-label">Tipo</label>
                      <span className="user-detail__info-value">{param.type}</span>
                    </div>
                    <div className="user-detail__info-item">
                      <label className="user-detail__info-label">Estado</label>
                      <span className="user-detail__info-value">
                        {param.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="user-detail__section">
                  <h3 className="user-detail__section-title">Valor del Parámetro</h3>
                  <div className="user-detail__info-grid">
                    <div className="user-detail__info-item" style={{ gridColumn: '1 / -1' }}>
                      <label className="user-detail__info-label">Contenido</label>
                      <div style={{ 
                        background: '#f8f9fa', 
                        border: '1px solid #e9ecef', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {param.value}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="user-detail__section">
                  <h3 className="user-detail__section-title">Descripción</h3>
                  <div className="user-detail__info-grid">
                    <div className="user-detail__info-item" style={{ gridColumn: '1 / -1' }}>
                      <label className="user-detail__info-label">Descripción del parámetro</label>
                      <span className="user-detail__info-value">{param.description}</span>
                    </div>
                  </div>
                </div>

                <div className="user-detail__section">
                  <h3 className="user-detail__section-title">Fechas</h3>
                  <div className="user-detail__info-grid">
                    <div className="user-detail__info-item">
                      <label className="user-detail__info-label">Fecha de creación</label>
                      <span className="user-detail__info-value">{formatDate(param.createdAt)}</span>
                    </div>
                    <div className="user-detail__info-item">
                      <label className="user-detail__info-label">Última actualización</label>
                      <span className="user-detail__info-value">{formatDate(param.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="user-detail__footer">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="user-detail__close-btn"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemParamDetails;