/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { ClientUpdateRequestDTO } from "@/Interfaces/Crm/ClientInterface";
import "@/Styles/Chat/DetailPanel/ClientEditModal.css";

interface ClientEditModalProps {
  open: boolean;
  onClose: () => void;
  clientEdit: ClientUpdateRequestDTO;
  onChange: <K extends keyof ClientUpdateRequestDTO>(
    field: K,
    value: ClientUpdateRequestDTO[K]
  ) => void;
  onNumberChange: (field: keyof ClientUpdateRequestDTO, value: string) => void;
  onSave: () => Promise<void>;
}

const ClientEditModal: React.FC<ClientEditModalProps> = ({
  open,
  onClose,
  clientEdit,
  onChange,
  onNumberChange,
  onSave,
}) => {
  if (!open) return null;

  return (
    <div
      className="dp-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Editar cliente"
    >
      <div className="dp-modal__backdrop" onClick={onClose} />

      <div className="clientModal">
        <div className="clientModal__header">
          <h6 className="clientModal__title">Editar cliente</h6>

          <button
            className="btn btn--ghost clientModal__close"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="clientModal__body">
          <div className="clientModal__grid">
            <div className="clientModal__gridFull">
              <textarea
                className="input"
                placeholder="Modelo de trabajo"
                value={clientEdit.workModel ?? ""}
                onChange={e => onChange("workModel", e.target.value)}
                rows={8}
              />
            </div>

            <select
              className="input"
              value={clientEdit.priority ?? ""}
              onChange={e => onChange("priority", e.target.value as any)}
            >
              <option value="">Prioridad</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>

            <select
              className="input"
              value={clientEdit.supportType ?? ""}
              onChange={e => onChange("supportType", e.target.value as any)}
            >
              <option value="">Tipo soporte</option>
              <option value="AAA">AAA</option>
              <option value="AA">AA</option>
              <option value="A">A</option>
            </select>

            <select
              className="input"
              value={clientEdit.enviromentType ?? ""}
              onChange={e => onChange("enviromentType", e.target.value as any)}
            >
              <option value="">Entorno</option>
              <option value="LOCAL">LOCAL</option>
              <option value="NUBE">NUBE</option>
            </select>

            <input
              className="input"
              type="number"
              min={0}
              placeholder="Horas de soporte por día"
              value={clientEdit.supportLimitTime ?? ""}
              onChange={e => onNumberChange("supportLimitTime", e.target.value)}
            />
          </div>

          {/* <div className="clientModal__gridFull">
            <textarea
              className="input"
              placeholder="Observación"
              rows={4}
              value={clientEdit.observation ?? ""}
              onChange={e => onChange("observation", e.target.value)}
            />
          </div> */}

          <label className="clientModal__check">
            <input
              type="checkbox"
              checked={!!clientEdit.isSupportActive}
              onChange={e =>
                onChange("isSupportActive", e.target.checked as any)
              }
            />
            Soporte activo
          </label>

          <label className="clientModal__check">
            <input
              type="checkbox"
              checked={!!clientEdit.isFranchise}
              onChange={e =>
                onChange("isFranchise", e.target.checked as any)
              }
            />
            Franquicia
          </label>

          <div className="clientModal__footer">
            <button
              className="btn btn--ghost"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              onClick={onSave}
              type="button"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientEditModal;
