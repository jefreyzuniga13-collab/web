/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import "@/Styles/Chat/DetailPanel.css";
import "@/Styles/Chat/DetailPanel/DeviceModal.css";

type ErrorBag = Record<string, string>;

interface DeviceModalProps {
  show: boolean;
  onClose: () => void;
  newDevice: any;
  setNewDevice: (updater: (prev: any) => any) => void;
  deviceErrors: ErrorBag;
  setDeviceErrors: (v: ErrorBag) => void;
  onSave: () => void | Promise<void>;
}

const DeviceModal: React.FC<DeviceModalProps> = ({
  show,
  onClose,
  newDevice,
  setNewDevice,
  deviceErrors,
  setDeviceErrors,
  onSave,
}) => {
  if (!show) return null;

  const handleClose = () => {
    onClose();
    setDeviceErrors({});
  };

  return (
    <div
      className="dp-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo equipo"
    >
      <div className="dp-modal__backdrop" onClick={handleClose} />

      <div className="deviceModal">
        <div className="deviceModal__header">
          <h6 className="deviceModal__title">Nuevo equipo</h6>
          <button
            className="btn btn--ghost deviceModal__close"
            onClick={handleClose}
            aria-label="Cerrar"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="deviceModal__body">
          {!!Object.keys(deviceErrors).length && (
            <div className="cap__alert">Revise los campos del equipo.</div>
          )}

          <div className="deviceModal__grid">
            <div className="cap__field">
              <input
                className={`input ${deviceErrors.name ? "has-error" : ""}`}
                placeholder="Nombre"
                value={newDevice.name}
                onChange={e =>
                  setNewDevice(prev => ({ ...prev, name: e.target.value }))
                }
              />
              {deviceErrors.name && (
                <div className="cap__error">{deviceErrors.name}</div>
              )}
            </div>

            <div className="cap__field">
              <input
                className="input"
                placeholder="IP"
                value={newDevice.ip}
                maxLength={100}
                onChange={e =>
                  setNewDevice(prev => ({ ...prev, ip: e.target.value }))
                }
              />
            </div>

            <div className="cap__field">
              <input
                className={`input ${
                  deviceErrors.operatingSystem ? "has-error" : ""
                }`}
                maxLength={100}
                placeholder="SO"
                value={newDevice.operatingSystem}
                onChange={e =>
                  setNewDevice(prev => ({
                    ...prev,
                    operatingSystem: e.target.value,
                  }))
                }
              />
              {deviceErrors.operatingSystem && (
                <div className="cap__error">{deviceErrors.operatingSystem}</div>
              )}
            </div>

            <div className="cap__field">
              <input
                className={`input ${
                  deviceErrors.versionSO ? "has-error" : ""
                }`}
                placeholder="Versión SO"
                maxLength={100}
                value={newDevice.versionSO}
                onChange={e =>
                  setNewDevice(prev => ({
                    ...prev,
                    versionSO: e.target.value,
                  }))
                }
              />
              {deviceErrors.versionSO && (
                <div className="cap__error">{deviceErrors.versionSO}</div>
              )}
            </div>

            <div className="cap__field deviceModal__gridFull">
              <textarea
                className={`input ${
                  deviceErrors.description ? "has-error" : ""
                }`}
                placeholder="Descripción"
                value={newDevice.description}
                maxLength={500}
                onChange={e =>
                  setNewDevice(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
              {deviceErrors.description && (
                <div className="cap__error">{deviceErrors.description}</div>
              )}
            </div>
          </div>

          <label className="deviceModal__check">
            <input
              type="checkbox"
              checked={!!newDevice.isActive}
              onChange={e =>
                setNewDevice(prev => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
            />
            Activo
          </label>

          <div className="deviceModal__footer">
            <button
              className="btn btn--ghost"
              onClick={handleClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              onClick={onSave}
              type="button"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceModal;