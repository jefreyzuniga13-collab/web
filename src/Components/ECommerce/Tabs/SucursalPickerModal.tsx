import React, { useMemo, useState, useEffect } from "react"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import "@/Styles/Ecommerce/SucursalPickerModal.css"

export type SucursalPickerValue = {
  codsucursal: string
  sucursal: string
  serie: string
  existencia: number
  medida: string
  nombodega: string
  codBodega: string
  codPrecio: string
}

interface Props {
  open: boolean
  loading?: boolean
  codProducto?: string
  items: ExistenciaSucursalItem[]
  selectedCodSucursal?: string | null
  onClose: () => void
  onSelect: (value: SucursalPickerValue) => void
}

type NormalizedRow = {
  codsucursal: string
  sucursal: string
  serie: string
  existencia: number
  medida: string
  nombodega: string
  codBodega: string
  precio: string
}

const buildKey = (r: { codsucursal: string; serie: string }) => `${r.codsucursal}__${r.serie}`

export function SucursalPickerModal({
  open,
  loading = false,
  codProducto,
  items,
  selectedCodSucursal = null,
  onClose,
  onSelect,
}: Props) {
  const rows = useMemo<NormalizedRow[]>(() => {

    const arr = Array.isArray(items) ? items : []

    const normalized = arr.map((r) => {
      const codBodega =
        String((r as unknown as { codBodega?: string }).codBodega ?? (r as unknown as { codbodega?: string }).codbodega ?? "").trim()

      return {
        codsucursal: String(r.codsucursal ?? "").trim(),
        sucursal: String(r.sucursal ?? "").trim(),
        serie: String(r.serie ?? "").trim(),
        existencia: Number(r.existencia ?? 0),
        medida: String(r.medida ?? "").trim(),
        nombodega: String((r as unknown as { nombodega?: string }).nombodega ?? "").trim(),
        codBodega,
        precio: r.precio,
      }
    })

    return normalized.sort((a, b) => Number(b.existencia) - Number(a.existencia))
  }, [items])

  const [localSelectedKey, setLocalSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (!selectedCodSucursal) {
      setLocalSelectedKey(rows.length ? buildKey(rows[0]) : null)
      return
    }

    const found = rows.find((r) => r.codsucursal === selectedCodSucursal)
    setLocalSelectedKey(found ? buildKey(found) : (rows.length ? buildKey(rows[0]) : null))
  }, [open, selectedCodSucursal, rows])

  if (!open) return null

  const selected = rows.find((r) => buildKey(r) === localSelectedKey) ?? null

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
                const key = buildKey(r)
                const isActive = localSelectedKey === key

                return (
                  <li key={key}>
                    <button
                      type="button"
                      className={`spmRow ${isActive ? "spmRow--active" : ""}`}
                      onClick={() => setLocalSelectedKey(key)}
                      title="Seleccionar"
                    >
                      <div className="spmRowMain">
                        <div className="spmSucursal">
                          <span className="spmCode">{r.codsucursal}</span>
                          <span className="spmName">
                            {r.sucursal} - {r.nombodega}
                          </span>
                        </div>
                        <div className="spmMeta">
                          <span className="spmChip">Serie {r.serie}</span>
                          <span className="spmStock">
                            {r.existencia} {r.medida}
                          </span>
                        </div>

                        <div className="spmMeta">
                          <span className="spmChip">CodPrecio {r.precio}</span>
                        </div>
                      </div>
                      <span className="spmRadio" aria-hidden="true">
                        {isActive ? "●" : "○"}
                      </span>
                    </button>
                  </li>
                )
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
              if (!selected) return
              if (!selected.codBodega) return

              onSelect({
                codsucursal: selected.codsucursal,
                sucursal: selected.sucursal,
                serie: selected.serie,
                existencia: selected.existencia,
                medida: selected.medida,
                nombodega: selected.nombodega,
                codBodega: selected.codBodega,
                codPrecio: selected.precio
              })
              onClose()
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}