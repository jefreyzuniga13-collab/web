
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
  clientName?: string;
  timestamp?: string;
  icon?: React.ReactNode;
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
  title,
  message,
  actions,
  isOpen,
  clientName,
  timestamp,
  icon = '💬'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldShow(true);
      const timer = setTimeout(() => setIsExpanded(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsExpanded(false);
      const timer = setTimeout(() => setShouldShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldShow) return null;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleActionClick = (action: ModalAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <>
      {/* Compact bubble when collapsed */}
      {!isExpanded && (
        <div 
          className={`modal-popup__bubble ${isOpen ? 'modal-popup__bubble--visible' : ''}`}
          onClick={handleToggle}
        >
          <div className="modal-popup__bubble-content">
            <span className="modal-popup__icon">{icon}</span>
            {/* <div className="modal-popup__pulse-indicator" /> */}
          </div>
        </div>
      )}

      {/* Expanded notification */}
      {isExpanded && (
        <div 
          className={`modal-popup__expanded ${isExpanded ? 'modal-popup__expanded--visible' : ''}`}
        >
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
              onClick={handleToggle}
              className="modal-popup__close-btn"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="modal-popup__content">
            {clientName && (
              <div className="modal-popup__client-info">
                <span className="modal-popup__user-icon">👤</span>
                <span className="modal-popup__client-name">{clientName}</span>
              </div>
            )}
            <div className="modal-popup__message">
              {message}
            </div>
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

      {/* Backdrop for mobile */}
      {isExpanded && (
        <div 
          className="modal-popup__backdrop"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};