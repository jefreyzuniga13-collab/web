import React, {
  useEffect,
  useState,
} from "react";

import "@/Styles/Hub/ModalPopup.css";

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";

  /**
   * Deshabilita la acción mientras
   * se procesa una solicitud.
   */
  disabled?: boolean;
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

  /**
   * Impide cerrar, colapsar o interactuar
   * con el backdrop mientras se procesa.
   */
  closeDisabled?: boolean;
}

const HIDE_MS = 250;

export const ModalPopup: React.FC<ModalPopupProps> = ({
  title,
  message,
  actions,
  isOpen,
  onClose,
  systemDefinedCompanyName,
  timestamp,
  icon = "💬",
  closeDisabled = false,
}) => {
  const [isExpanded, setIsExpanded] =
    useState(false);

  const [shouldShow, setShouldShow] =
    useState(false);

  /**
   * Abre inmediatamente el popup.
   *
   * Al cerrar, espera la duración de la
   * animación antes de retirarlo del DOM.
   */
  useEffect(() => {
    let timeoutId: number | undefined;

    if (isOpen) {
      setShouldShow(true);
      setIsExpanded(true);
    } else {
      setIsExpanded(false);

      timeoutId = window.setTimeout(() => {
        setShouldShow(false);
      }, HIDE_MS);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isOpen]);

  if (!shouldShow) {
    return null;
  }

  /**
   * Permite expandir o colapsar manualmente,
   * excepto mientras el cierre está bloqueado.
   */
  const handleToggle = (): void => {
    if (closeDisabled) {
      return;
    }

    setIsExpanded((previous) => !previous);
  };

  /**
   * Ejecuta una acción únicamente
   * cuando no está deshabilitada.
   */
  const handleActionClick = (
    action: ModalAction
  ): void => {
    if (action.disabled) {
      return;
    }

    action.onClick();
  };

  /**
   * Cierra el popup y delega al componente padre
   * el avance de la cola.
   */
  const handleCloseAll = (): void => {
    if (closeDisabled) {
      return;
    }

    setIsExpanded(false);

    window.setTimeout(() => {
      onClose();
    }, 0);
  };

  return (
    <>
      {!isExpanded && (
        <div
          className={[
            "modal-popup__bubble",
            isOpen
              ? "modal-popup__bubble--visible"
              : "",
            closeDisabled
              ? "modal-popup__bubble--disabled"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={handleToggle}
          role="button"
          tabIndex={closeDisabled ? -1 : 0}
          aria-disabled={closeDisabled}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              handleToggle();
            }
          }}
        >
          <div className="modal-popup__bubble-content">
            <span className="modal-popup__icon">
              {icon}
            </span>
          </div>
        </div>
      )}

      {isExpanded && (
        <div
          className={[
            "modal-popup__expanded",
            "modal-popup__expanded--visible",
          ].join(" ")}
          aria-busy={closeDisabled}
        >
          <div className="modal-popup__header">
            <div className="modal-popup__header-content">
              <div className="modal-popup__icon-container">
                <span className="modal-popup__header-icon">
                  {icon}
                </span>
              </div>

              <div className="modal-popup__header-text">
                <h3 className="modal-popup__title">
                  {title}
                </h3>

                {timestamp && (
                  <div className="modal-popup__timestamp">
                    <span className="modal-popup__clock-icon">
                      🕒
                    </span>

                    {new Date(
                      timestamp
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseAll}
              className="modal-popup__close-btn"
              aria-label="Cerrar"
              disabled={closeDisabled}
            >
              ×
            </button>
          </div>

          <div className="modal-popup__content">
            {systemDefinedCompanyName && (
              <div className="modal-popup__client-info">
                <span className="modal-popup__user-icon">
                  👤
                </span>

                <span className="modal-popup__client-name">
                  {systemDefinedCompanyName}
                </span>
              </div>
            )}

            <div className="modal-popup__message">
              {message}
            </div>
          </div>

          <div className="modal-popup__actions">
            {actions.map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                type="button"
                onClick={() =>
                  handleActionClick(action)
                }
                disabled={action.disabled}
                aria-disabled={action.disabled}
                className={[
                  "modal-popup__action",
                  `modal-popup__action--${
                    action.variant ?? "primary"
                  }`,
                  action.disabled
                    ? "modal-popup__action--disabled"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isExpanded && (
        <div
          className={[
            "modal-popup__backdrop",
            closeDisabled
              ? "modal-popup__backdrop--disabled"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={handleCloseAll}
          aria-hidden="true"
        />
      )}
    </>
  );
};