
import React from 'react';
import Button from '@/Components/Common/Button';
import '@/Styles/Users/DeleteConfirmation.css';

interface DeleteConfirmationProps {
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  userName,
  onConfirm,
  onCancel,
  loading,
}) => {
  return (
    <div className="delete-confirmation">
      <div className="delete-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </div>
      <h3>Eliminar usuario</h3>
      <p>
        ¿Estás seguro que deseas eliminar a <strong>{userName}</strong>?
      </p>
      <p className="delete-warning">
        Esta acción no se puede deshacer y eliminará permanentemente todos los datos asociados a este usuario.
      </p>
      <div className="delete-actions">
        <Button type="button" variant="tertiary" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={loading}>
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;