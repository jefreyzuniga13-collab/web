import React, { useState } from "react";
import { IoChatboxSharp } from "react-icons/io5";
import { updateConversationState } from "@/Services/ConversationService";
import "@/Styles/Chat/AssignedModal.css"; // Asegúrate de tener este CSS

interface AssignedModalProps {
  conversationId: number;
  showModal?: boolean; // Opcional, si quieres controlar la visibilidad desde fuera
  setShowModal?: (show: boolean) => void; // Callback para controlar la visibilidad
}

//Nota: Este componente se usa para mostrar un modal cuando un usuario con rol de support recibe una notificación  de que se le ha asignado una conversación por medio de signalr. El modal permite aceptar o rechazar la conversación, y si se rechaza, se debe proporcionar una justificación.
const AssignedModal: React.FC<AssignedModalProps> = ({
  conversationId,
  showModal = false,
  setShowModal = () => {},
}) => {
  const [justification, setJustification] = useState("");
  const [error, setError] = useState(false);
  // Opcionalmente, podrías tener un “loading” interno mientras llamas al servicio.
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    // Si acepto la conversación, no necesito justificación.
    setLoading(true);
    try {
      await updateConversationState( {
        conversationId,
        assignmentStatus: "Assigned",
        justification: "",
      });
      // Cerrar inmediatamente el modal
        setShowModal(false);
    } catch (err) {
      console.error(err);
      // Manejar error (quizás mostrar toast o mensaje en UI)
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleReject = async () => {
    // Si rechazo, la justificación es obligatoria.
    if (justification.trim() === "") {
      setError(true);
      return;
    }

    setError(false);
    setLoading(true);

    try {
      await updateConversationState({
        conversationId,
        assignmentStatus: "Rejected",
        justification,
      });
      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`assigned-modal disabled" ${showModal ? "" : "disabled"}`}>

      <div className="assigned-modal-content">
        <div className="assigned-modal-header">
          <h2 className="assigned-modal-title">Asignación de Conversación</h2>
          <p className="assigned-modal-subtitle">
            Se te ha asignado la conversación #{conversationId}.
          </p>
          <div className="assigned-modal-icon">
            <IoChatboxSharp size={50} />
          </div>
        </div>

        <div className="assigned-modal-justification">
          <label
            htmlFor="justification"
            className="assigned-modal-justification-label"
          >
            Justificación (si rechazas)
          </label>
          <p className="assigned-modal-text">
            Si no aceptas la conversación, debes añadir una justificación.
          </p>
          <textarea
            id="justification"
            className="assigned-modal-justification-textarea"
            placeholder="Escribe aquí tu justificación..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            disabled={loading}
          />
          {error && (
            <div className="assigned-modal-justification-error">
              Este campo es obligatorio para rechazar
            </div>
          )}
        </div>

        <div className="assigned-modal-actions">
          <button
            className="assigned-modal-button assigned-modal-button--continue"
            onClick={handleAccept}
            disabled={loading}
          >
            Aceptar
          </button>
          <button
            className="assigned-modal-button assigned-modal-button--assign"
            onClick={handleReject}
            disabled={loading}
          >
            Rechazar
          </button>
        </div>

        <div className="assigned-modal-footer">
          <p className="assigned-modal-footer-text">
            Si rechazas la conversación, asegúrate de escribir una justificación
            válida.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AssignedModal;