/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type {
  CredentialRequestDTO,
} from "@/Interfaces/Crm/ClientInterface";
import type {
  CredMode,
  CredScope,
  ErrorBag,
} from "@/Hooks/Chat/DetailPanel/useCredentialSection";
import "@/Styles/Chat/DetailPanel/CredentialsModal.css";

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credMode: CredMode;
  credScope: CredScope;
  setCredScope: (v: CredScope) => void;
  deviceTargetId: number | "";
  setDeviceTargetId: (v: number | "") => void;
  systemTargetId: number | "";
  setSystemTargetId: (v: number | "") => void;
  credReq: CredentialRequestDTO;
  setCredReq: (
    v: CredentialRequestDTO | ((prev: CredentialRequestDTO) => CredentialRequestDTO)
  ) => void;
  credErrors: ErrorBag;
  catCredential: { id: number; name: string }[];
  filteredDevs: any[];
  filteredSystems: any[];
  saveCred: () => Promise<void>;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({
  isOpen,
  onClose,
  credMode,
  credScope,
  setCredScope,
  deviceTargetId,
  setDeviceTargetId,
  systemTargetId,
  setSystemTargetId,
  credReq,
  setCredReq,
  credErrors,
  catCredential,
  filteredDevs,
  filteredSystems,
  saveCred,
}) => {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCred();
  };

  return (
    <div
      className="dp-modal"
      role="dialog"
      aria-modal="true"
      aria-label={credMode === "create" ? "Nueva credencial" : "Detalle de credencial"}
    >
      <div className="dp-modal__backdrop" onClick={onClose} />

      <div className="credentialsModal">
        <div className="credentialsModal__header">
          <h6 className="credentialsModal__title">
            {credMode === "create" ? "Nueva credencial" : "Detalle de credencial"}
          </h6>
          <button
            className="btn btn--ghost credentialsModal__close"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="credentialsModal__form"
        >
          {!!Object.keys(credErrors).length && (
            <div className="cap__alert">Revise los campos marcados.</div>
          )}

          <div className="credentialsModal__grid">
            <div className="cap__field">
              <label className="cap__label" htmlFor="cred_cat">
                Tipo
              </label>
              <select
                id="cred_cat"
                value={credReq.catCredentialId}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    catCredentialId: Number(e.target.value),
                  }))
                }
                disabled={credMode === "view"}
                className={`input ${credErrors.catCredentialId ? "has-error" : ""}`}
              >
                <option value={0}>Seleccione tipo</option>
                {catCredential.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {credErrors.catCredentialId && (
                <div className="cap__error">{credErrors.catCredentialId}</div>
              )}
            </div>

            <div className="cap__field">
              <label className="cap__label" htmlFor="cred_scope">
                Ámbito
              </label>
              <select
                id="cred_scope"
                value={credScope}
                onChange={e => setCredScope(e.target.value as CredScope)}
                disabled={credMode === "view"}
                className={`input ${credErrors.scope ? "has-error" : ""}`}
              >
                <option value="client">Cliente</option>
                <option value="device">Equipo</option>
                <option value="system">Sistema</option>
              </select>
              {credErrors.scope && (
                <div className="cap__error">{credErrors.scope}</div>
              )}
            </div>

            {credScope === "device" && (
              <div className="cap__field">
                <label className="cap__label" htmlFor="cred_device">
                  Equipo
                </label>
                <select
                  id="cred_device"
                  value={deviceTargetId}
                  onChange={e =>
                    setDeviceTargetId(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  disabled={credMode === "view"}
                  className="input"
                >
                  <option value="">Seleccione equipo</option>
                  {filteredDevs.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {credScope === "system" && (
              <div className="cap__field">
                <label className="cap__label" htmlFor="cred_system">
                  Sistema
                </label>
                <select
                  id="cred_system"
                  value={systemTargetId}
                  onChange={e =>
                    setSystemTargetId(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  disabled={credMode === "view"}
                  className="input"
                >
                  <option value="">Seleccione sistema</option>
                  {filteredSystems.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="cap__field">
              <label className="cap__label" htmlFor="cred_user">
                Usuario
              </label>
              <input
                id="cred_user"
                className={`input ${credErrors.user ? "has-error" : ""}`}
                value={credReq.user}
                maxLength={255}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    user: e.target.value,
                  }))
                }
                disabled={credMode === "view"}
              />
              {credErrors.user && (
                <div className="cap__error">{credErrors.user}</div>
              )}
            </div>

            <div className="cap__field">
              <label className="cap__label" htmlFor="cred_pass">
                Contraseña
              </label>
              <input
                id="cred_pass"
                type="password"
                className={`input ${credErrors.password ? "has-error" : ""}`}
                value={credReq.password ?? ""}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    password: e.target.value,
                  }))
                }
                disabled={credMode === "view"}
              />
              {credErrors.password && (
                <div className="cap__error">{credErrors.password}</div>
              )}
            </div>

            <div className="cap__field">
              <label className="cap__label" htmlFor="cred_instance">
                Instancia
              </label>
              <input
                id="cred_instance"
                className={`input ${credErrors.instance ? "has-error" : ""}`}
                value={credReq.instance ?? ""}
                maxLength={100}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    instance: e.target.value,
                  }))
                }
                disabled={credMode === "view"}
              />
              {credErrors.instance && (
                <div className="cap__error">{credErrors.instance}</div>
              )}
            </div>

            <div className="cap__field">
              <label className="cap__label" htmlFor="cred_port">
                Puerto
              </label>
              <input
                id="cred_port"
                className={`input ${credErrors.port ? "has-error" : ""}`}
                value={credReq.port ?? ""}
                maxLength={100}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    port: e.target.value,
                  }))
                }
                disabled={credMode === "view"}
              />
              {credErrors.port && (
                <div className="cap__error">{credErrors.port}</div>
              )}
            </div>

            <div className="cap__field credentialsModal__gridFull">
              <label className="cap__label" htmlFor="cred_obs">
                Observación
              </label>
              <textarea
                id="cred_obs"
                className={`input ${credErrors.observation ? "has-error" : ""}`}
                value={credReq.observation ?? ""}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    observation: e.target.value,
                  }))
                }
                disabled={credMode === "view"}
                rows={4}
              />
              {credErrors.observation && (
                <div className="cap__error">{credErrors.observation}</div>
              )}
            </div>

            <div className="credentialsModal__checkboxRow">
              <input
                type="checkbox"
                id="cred_active"
                checked={!!credReq.isActive}
                onChange={e =>
                  setCredReq(s => ({
                    ...s,
                    isActive: e.target.checked,
                  }))
                }
                disabled={credMode === "view"}
              />
              <label
                htmlFor="cred_active"
                className="cap__label cap__label--inline credentialsModal__checkboxLabel"
              >
                Activo
              </label>
            </div>
          </div>
        </form>

        <div className="credentialsModal__footer">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
          >
            Cerrar
          </button>
          {credMode !== "view" && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={saveCred}
            >
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CredentialsModal;