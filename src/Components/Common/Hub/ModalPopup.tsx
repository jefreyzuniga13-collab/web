import React, { useState, useEffect } from 'react';
import "@/Styles/Hub/ModalPopup.css"

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface ModalPopupProps {
  title: string;
  message: React.ReactNode;
  actions: ModalAction[];
  isOpen: boolean;
  onClose: () => void;
  systemDefinedCompanyName?: string;
  timestamp?: string;
  icon?: React.ReactNode;
}

const HIDE_MS = 250; // debe coincidir con la transición CSS

export const ModalPopup: React.FC<ModalPopupProps> = ({
  title,
  message,
  actions,
  isOpen,
  onClose,
  systemDefinedCompanyName,
  timestamp,
  icon = '💬'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  // Abre expandido de inmediato cuando isOpen=true; cierra con pequeña transición cuando isOpen=false
  useEffect(() => {
    let t: number | undefined;

    if (isOpen) {
      setShouldShow(true);
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
      t = window.setTimeout(() => setShouldShow(false), HIDE_MS);
    }

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, [isOpen]);

  if (!shouldShow) return null;

  const handleToggle = () => {
    // Permite colapsar/expandir manualmente sin afectar la cola
    setIsExpanded(prev => !prev);
  };

  const handleActionClick = (action: ModalAction) => {
    // Ejecuta la acción; el cierre/avance de cola lo decide el padre (onClose lo llama el padre cuando corresponda)
    action.onClick();
  };

  const handleCloseAll = () => {
    // Cierre explícito (✕ o backdrop): delega al padre para hacer dequeue y mostrar la siguiente abierta
    setIsExpanded(false);
    window.setTimeout(() => onClose(), 0);
  };

  return (
    <>
      {/* Burbuja compacta cuando está colapsado (solo útil si el usuario decide colapsar manualmente) */}
      {!isExpanded && (
        <div
          className={`modal-popup__bubble ${isOpen ? 'modal-popup__bubble--visible' : ''}`}
          onClick={handleToggle}
        >
          <div className="modal-popup__bubble-content">
            <span className="modal-popup__icon">{icon}</span>
          </div>
        </div>
      )}

      {/* Notificación expandida */}
      {isExpanded && (
        <div className={`modal-popup__expanded ${isExpanded ? 'modal-popup__expanded--visible' : ''}`}>
          {/* Header */}
          <div className="modal-popup__header">
            <div className="modal-popup__header-content">
              <div className="modal-popup__icon-container">
                <span className="modal-popup__header-icon">{icon}</span>
              </div>
              <div className="modal-popup__header-text">
                <h3 className="modal-popup__title">{title}</h3>
                {timestamp && (
                  <div className="modal-popup__timestamp">
                    <span className="modal-popup__clock-icon">🕒</span>
                    {new Date(timestamp).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleCloseAll}
              className="modal-popup__close-btn"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="modal-popup__content">
            {systemDefinedCompanyName && (
              <div className="modal-popup__client-info">
                <span className="modal-popup__user-icon">👤</span>
                <span className="modal-popup__client-name">{systemDefinedCompanyName}</span>
              </div>
            )}
            <div className="modal-popup__message">{message}</div>
          </div>

          {/* Actions */}
          <div className="modal-popup__actions">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action)}
                className={`modal-popup__action modal-popup__action--${action.variant || 'primary'}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop (clic = cerrar y avanzar cola) */}
      {isExpanded && <div className="modal-popup__backdrop" onClick={handleCloseAll} />}
    </>
  );
};