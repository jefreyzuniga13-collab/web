import React from "react";
import Button from "@/Components/Common/Button";
import "@/Styles/Users/DeleteConfirmation.css";
import { CirclePower } from "lucide-react";

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
      <div className="delete-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
         <CirclePower/>
        </svg>
      </div>

      {isActive ? (
        <>
          <h3>Desactivar usuario</h3>
          <p>
            ¿Estás seguro que deseas desactivar a <strong>{userName}</strong>?
          </p>
          <p className="delete-warning">
            Si dedactiva el usuario no podra accceder al sistama, hasta que sea
            activado nuevamente. Por favor tome en cuenta este hecho antes de
            seguir.
          </p>
        </>
      ) : (
        <>
          <p>
            <h3>Activar usuario</h3>
            ¿Estás seguro que deseas activar a <strong>{userName}</strong>?
          </p>
          <p className="acivaion-warning">
            Activar el usuario recupera todos los accesos que se le asignaron,
            verifique que los permisos asignado actualmente seran autorizados
            para el usaurio a activar
          </p>
        </>
      )}

      <div className="delete-actions">
        <Button
          type="button"
          variant="tertiary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>
    </div>
  );
};

export default DeleteConfirmation;