import React, { useMemo, useState, useEffect } from "react";
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo";
import "@/Styles/Ecommerce/SucursalPickerModal.css";

export type SucursalPickerValue = {
  codsucursal: string;
  sucursal: string;
  serie: string;
  existencia: number;
  medida: string;
};

interface Props {
  open: boolean;
  loading?: boolean;
  codProducto?: string;
  items: ExistenciaSucursalItem[];
  selectedCodSucursal?: string | null;

  onClose: () => void;
  onSelect: (value: SucursalPickerValue) => void;
}

export function SucursalPickerModal({
  open,
  loading = false,
  codProducto,
  items,
  selectedCodSucursal = null,
  onClose,
  onSelect,
}: Props) {
  const [localSelected, setLocalSelected] = useState<string | null>(selectedCodSucursal);

  useEffect(() => {
    if (!open) return;
    setLocalSelected(selectedCodSucursal);
  }, [open, selectedCodSucursal]);

  const rows = useMemo(() => {
    return [...(items ?? [])].sort((a, b) => (b.existencia ?? 0) - (a.existencia ?? 0));
  }, [items]);

  if (!open) return null;

  const selected = rows.find((x) => x.codsucursal === localSelected) ?? null;

  return (
    <div className="spmOverlay" role="presentation" onMouseDown={onClose}>
      <div
        className="spmModal"
        role="dialog"
        aria-modal="true"
        aria-label="Seleccionar sucursal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="spmHeader">
          <div>
            <h3 className="spmTitle">Seleccionar sucursal</h3>
            <p className="spmSub">
              {codProducto ? (
                <>
                  Producto: <strong>{codProducto}</strong>
                </>
              ) : (
                "Elige la sucursal para continuar"
              )}
            </p>
          </div>

          <button className="spmClose" type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className="spmBody">
          {loading ? (
            <div className="spmLoading">Cargando...</div>
          ) : rows.length === 0 ? (
            <div className="spmEmpty">No hay sucursales para mostrar.</div>
          ) : (
            <ul className="spmList">
              {rows.map((r) => {
                const isActive = localSelected === r.codsucursal;

                return (
                  <li key={`${r.codsucursal}-${r.serie}`}>
                    <button
                      type="button"
                      className={`spmRow ${isActive ? "spmRow--active" : ""}`}
                      onClick={() => setLocalSelected(r.codsucursal)}
                      title="Seleccionar"
                    >
                      <div className="spmRowMain">
                        <div className="spmSucursal">
                          <span className="spmCode">{r.codsucursal}</span>
                          <span className="spmName">{r.sucursal}</span>
                        </div>
                        <div className="spmMeta">
                          <span className="spmChip">Serie {r.serie}</span>
                          <span className="spmStock">
                            {r.existencia} {r.medida}
                          </span>
                        </div>
                      </div>
                      <span className="spmRadio" aria-hidden="true">
                        {isActive ? "●" : "○"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="spmFooter">
          <button type="button" className="spmBtn spmBtn--ghost" onClick={onClose}>
            Cancelar
          </button>

          <button
            type="button"
            className="spmBtn spmBtn--primary"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onSelect({
                codsucursal: selected.codsucursal,
                sucursal: selected.sucursal,
                serie: selected.serie,
                existencia: selected.existencia,
                medida: selected.medida,
              });
              onClose();
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}