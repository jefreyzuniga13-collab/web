/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { SystemRequestDTO } from "@/Interfaces/Crm/ClientInterface";
import "@/Styles/Chat/DetailPanel/SystemPickerModal.css";

interface SystemPickerModalProps {
  open: boolean;
  onClose: () => void;

  sysCatalog: any[];
  sysTotal: number;
  sysPage: number;
  setSysPage: (v: number) => void;
  sysPageSize: number;
  setSysPageSize: (v: number) => void;
  sysGlobalFilter: string;
  setSysGlobalFilter: (v: string) => void;
  fetchSysPage: (page: number, size: number) => void | Promise<void>;

  newSystem: SystemRequestDTO;
  setNewSystem: (v: SystemRequestDTO) => void;
  addPickedSystem: () => Promise<void>;
}

const SystemPickerModal: React.FC<SystemPickerModalProps> = ({
  open,
  onClose,
  sysCatalog,
  sysTotal,
  sysPage,
  setSysPage,
  sysPageSize,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSysPageSize,
  sysGlobalFilter,
  setSysGlobalFilter,
  fetchSysPage,
  newSystem,
  setNewSystem,
  addPickedSystem,
}) => {
  if (!open) return null;

  return (
    <div
      className="dp-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Agregar sistema"
    >
      <div className="dp-modal__backdrop" onClick={onClose} />

      <div className="systemModal">
        <div className="systemModal__header">
          <h6 className="systemModal__title">Agregar sistema</h6>
          <button
            className="btn btn--ghost systemModal__close"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="systemModal__body">
          <div className="systemModal__searchRow">
            <div className="systemModal__searchInputWrapper">
              <input
                className="input systemModal__searchInput"
                placeholder="Buscar en catálogo de sistemas…"
                value={sysGlobalFilter}
                onChange={e => {
                  const val = e.target.value;
                  setSysGlobalFilter(val);
                  fetchSysPage(1, sysPageSize);
                }}
                aria-label="Buscar en catálogo de sistemas"
              />
              <span className="systemModal__searchIcon">🔍</span>
            </div>

            {/* <select
              className="input systemModal__pageSizeSelect"
              value={String(sysPageSize)}
              onChange={e => setSysPageSize(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select> */}
          </div>

          <div className="systemModal__tableContainer">
            <div className="systemModal__tableWrapper">
              {sysCatalog.length > 0 ? (
                <ul className="systemModal__items">
                  {sysCatalog.map(s => {
                    const isSelected = newSystem.outsourcedSystemsId === s.id;
                    return (
                      <li
                        key={s.id}
                        className={`systemModal__item ${
                          isSelected ? "systemModal__item--selected" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className="systemModal__itemButton"
                          onClick={() =>
                            setNewSystem({
                              ...newSystem,
                              outsourcedSystemsId: s.id,
                            })
                          }
                          aria-label={`Seleccionar ${s.name}`}
                        >
                          <div className="systemModal__itemHeader">
                            <input
                              type="radio"
                              name="pickSys"
                              checked={isSelected}
                              onChange={() =>
                                setNewSystem({
                                  ...newSystem,
                                  outsourcedSystemsId: s.id,
                                })
                              }
                            />
                            <span className="systemModal__itemName">
                              {s.name}
                            </span>
                          </div>

                          <div className="systemModal__itemRow">
                            <span className="systemModal__itemLabel">
                              Versión:
                            </span>
                            <span className="systemModal__itemValue">
                              {s.version ?? "---"}
                            </span>
                          </div>

                          <div
                            className="systemModal__itemRow systemModal__itemRow--description"
                            title={s.description}
                          >
                            <span className="systemModal__itemLabel">
                              Descripción:
                            </span>
                            <span className="systemModal__itemDescription">
                              {s.description}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="systemModal__emptyRow">Sin resultados</div>
              )}
            </div>

            <div className="systemModal__tableFooter">
              <div className="systemModal__footerInfo">
                Total: {sysTotal}
              </div>

              <div className="systemModal__pagination">
                <button
                  className="btn btn--ghost systemModal__paginationBtn"
                  onClick={() => setSysPage(Math.max(1, sysPage - 1))}
                  type="button"
                >
                  Prev
                </button>
                <span className="systemModal__paginationText">
                  Página {sysPage}
                </span>
                <button
                  className="btn btn--ghost systemModal__paginationBtn"
                  onClick={() => setSysPage(sysPage + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <label className="systemModal__checkboxRow">
            <input
              type="checkbox"
              checked={!!newSystem.isActive}
              onChange={e =>
                setNewSystem({
                  ...newSystem,
                  isActive: e.target.checked,
                })
              }
            />
            Activo
          </label>

          <div className="systemModal__actions">
            <button
              className="btn btn--ghost"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={addPickedSystem}
              disabled={!newSystem.outsourcedSystemsId}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPickerModal;