
import React, { useEffect } from 'react';
import { X, CirclePower, AlertTriangle } from 'lucide-react';
import { Button } from '@/Components/ui/CustomButton';
import type { SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface";

import '@/styles/users/Modal.css'
import '@/styles/users/DeleteConfirmation.css'

interface DeleteParamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  param: SystemParamResponseDto | null;
  isToggle?: boolean;
}

const DeleteParamDialog: React.FC<DeleteParamDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  param,
  // isToggle = false
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !param) return null;

  const isActive = param.isActive;
  const action = isActive ? 'desactivar' : 'activar';
  const actionTitle = isActive ? 'Desactivar' : 'Activar';

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div 
        className="modal__container modal__container--small" 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 className="modal__title">{actionTitle} Parámetro</h2>
          <button 
            className="modal__close-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="modal__content">
          <div className="delete-confirmation">
            <div className="delete-confirmation__header">
              <div className={`delete-confirmation__icon ${isActive ? 'delete-confirmation__icon--warning' : 'delete-confirmation__icon--success'}`}>
                {isActive ? <AlertTriangle size={32} /> : <CirclePower size={32} />}
              </div>
              
              <div className="delete-confirmation__content">
                <h3 className="delete-confirmation__title">
                  {actionTitle} Parámetro
                </h3>
                
                <p className="delete-confirmation__message">
                  ¿Estás seguro que deseas {action} el parámetro{' '}
                  <span className="delete-confirmation__user-name">{param.name}</span>?
                </p>
                
                <div className={`delete-confirmation__warning ${isActive ? 'delete-confirmation__warning--danger' : 'delete-confirmation__warning--info'}`}>
                  {isActive ? (
                    <div className="delete-confirmation__warning-content">
                      <strong>Advertencia:</strong> Si desactivas el parámetro no estará disponible en el sistema 
                      hasta que sea activado nuevamente. Ten en cuenta este hecho antes de continuar.
                    </div>
                  ) : (
                    <div className="delete-confirmation__warning-content">
                      <strong>Información:</strong> Activar el parámetro lo hará disponible nuevamente en el sistema. 
                      Verifica que la configuración actual sea correcta para el parámetro a activar.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="delete-confirmation__actions">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="delete-confirmation__button delete-confirmation__button--cancel"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant={isActive ? "destructive" : "default"}
                onClick={onConfirm}
                className={`delete-confirmation__button ${isActive ? 'delete-confirmation__button--danger' : 'delete-confirmation__button--success'}`}
              >
                {`${actionTitle} Parámetro`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteParamDialog;