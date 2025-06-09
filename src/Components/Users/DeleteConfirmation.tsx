
import React from "react";
import { CirclePower, AlertTriangle } from "lucide-react";
import { Button } from '@/Components/ui/CustomButton';
import '@/Styles/Users/DeleteConfirmation.css'

interface DeleteConfirmationProps {
  userName: string;
  isActive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  userName,
  isActive,
  onConfirm,
  onCancel,
  loading,
}) => {
  return (
    <div className="delete-confirmation">
      <div className="delete-confirmation__header">
        <div className={`delete-confirmation__icon ${isActive ? 'delete-confirmation__icon--warning' : 'delete-confirmation__icon--success'}`}>
          {isActive ? <AlertTriangle size={32} /> : <CirclePower size={32} />}
        </div>
        
        <div className="delete-confirmation__content">
          <h3 className="delete-confirmation__title">
            {isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
          </h3>
          
          <p className="delete-confirmation__message">
            ¿Estás seguro que deseas {isActive ? 'desactivar' : 'activar'} a{' '}
            <span className="delete-confirmation__user-name">{userName}</span>?
          </p>
          
          <div className={`delete-confirmation__warning ${isActive ? 'delete-confirmation__warning--danger' : 'delete-confirmation__warning--info'}`}>
            {isActive ? (
              <div className="delete-confirmation__warning-content">
                <strong>Advertencia:</strong> Si desactivas el usuario no podrá acceder al sistema 
                hasta que sea activado nuevamente. Ten en cuenta este hecho antes de continuar.
              </div>
            ) : (
              <div className="delete-confirmation__warning-content">
                <strong>Información:</strong> Activar el usuario recupera todos los accesos que se le asignaron. 
                Verifica que los permisos asignados actualmente sean autorizados para el usuario a activar.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="delete-confirmation__actions">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="delete-confirmation__button delete-confirmation__button--cancel"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant={isActive ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={loading}
          className={`delete-confirmation__button ${isActive ? 'delete-confirmation__button--danger' : 'delete-confirmation__button--success'}`}
        >
          {loading ? (
            <span className="delete-confirmation__loading">
              <div className="delete-confirmation__spinner"></div>
              Procesando...
            </span>
          ) : (
            `${isActive ? 'Desactivar' : 'Activar'} Usuario`
          )}
        </Button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;