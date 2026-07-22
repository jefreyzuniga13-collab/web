import { useEffect } from "react";
import { FiAlertTriangle, FiMapPin, FiMonitor, FiWifi } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import type { LoginConflictResponseDto } from "@/Interfaces/Auth/AuthInterface";

import "@/Styles/Auth/ReplaceSessionModal.css";

type ReplaceSessionModalProps = {
  isOpen: boolean;
  conflict: LoginConflictResponseDto | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ReplaceSessionModal({
  isOpen,
  conflict,
  loading,
  onConfirm,
  onCancel,
}: ReplaceSessionModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("replace-session-body-lock");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("replace-session-body-lock");
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) {
    return null;
  }

  const currentDevice =
    conflict?.currentDevice?.trim() || "Dispositivo no identificado";

  const currentLocation =
    conflict?.currentLocation?.trim() || "Ubicación no disponible";

  const currentPublicIp =
    conflict?.currentPublicIp?.trim() || "IP no disponible";

  return (
    <div
      className="replace-session"
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-session-title"
      aria-describedby="replace-session-description"
    >
      <button
        type="button"
        className="replace-session__backdrop"
        aria-label="Cerrar modal"
        disabled={loading}
        onClick={onCancel}
      />

      <div className="replace-session__card">
        <div className="replace-session__icon">
          <FiAlertTriangle />
        </div>

        <div className="replace-session__header">
          <span className="replace-session__eyebrow">
            Sesión activa detectada
          </span>

          <h2 id="replace-session-title">
            Ya existe una sesión iniciada
          </h2>

          <p id="replace-session-description">
            Tu usuario ya está conectado en otro dispositivo. Puedes cancelar
            este intento o cerrar la sesión anterior para iniciar aquí.
          </p>
        </div>

        <div className="replace-session__info">
          <div className="replace-session__info-item">
            <span className="replace-session__info-icon">
              <FiMonitor />
            </span>

            <div>
              <strong>Dispositivo actual</strong>
              <span>{currentDevice}</span>
            </div>
          </div>

          <div className="replace-session__info-item">
            <span className="replace-session__info-icon">
              <FiMapPin />
            </span>

            <div>
              <strong>Ubicación</strong>
              <span>{currentLocation}</span>
            </div>
          </div>

          <div className="replace-session__info-item">
            <span className="replace-session__info-icon">
              <FiWifi />
            </span>

            <div>
              <strong>IP pública</strong>
              <span>{currentPublicIp}</span>
            </div>
          </div>
        </div>

        <div className="replace-session__warning">
          Si continúas, la sesión anterior se cerrará automáticamente.
        </div>

        <div className="replace-session__actions">
          <button
            type="button"
            className="replace-session__button replace-session__button--secondary"
            disabled={loading}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="replace-session__button replace-session__button--primary"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className="replace-session__spinner" />
                Cerrando sesión anterior...
              </>
            ) : (
              "Iniciar aquí"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}