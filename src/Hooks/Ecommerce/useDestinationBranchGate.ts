import { useCallback, useMemo, useRef, useState } from "react"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import type { SucursalPickerValue } from "@/Components/ECommerce/SucursalPickerModal"

export type DestinationSelection = {
  destinationBranchCode: string
  destinationBranchName?: string | null
  destinationWherehouseCode: string
  destinationWherehouseName?: string | null
  destinationSerie?: string | null
}

type ApplyDestinationFn = (next: DestinationSelection) => void

type Options = {
  items: ExistenciaSucursalItem[]
  loading?: boolean
  codProducto?: string
  destinationBranchCode?: string | null
  destinationWherehouseCode?: string | null
  onApply: ApplyDestinationFn
}

type EnsureResult =
  | { ok: true; selection: DestinationSelection; existed: boolean }
  | { ok: false; reason: "cancelled" | "no_items" }

export function useDestinationBranchGate({
  items,
  loading = false,
  codProducto,
  destinationBranchCode,
  destinationWherehouseCode,
  onApply,
}: Options) {
  const [open, setOpen] = useState(false)

  const pendingRef = useRef<{
    resolve: (r: EnsureResult) => void
    reject: (e: unknown) => void
  } | null>(null)

  const hasDestination = useMemo(() => {
    const a = String(destinationBranchCode ?? "").trim()
    const b = String(destinationWherehouseCode ?? "").trim()
    return a.length > 0 && b.length > 0
  }, [destinationBranchCode, destinationWherehouseCode])

  const required = useMemo(() => !hasDestination, [hasDestination])

  const close = useCallback((result?: EnsureResult) => {
    setOpen(false)
    if (pendingRef.current) {
      pendingRef.current.resolve(result ?? { ok: false, reason: "cancelled" })
      pendingRef.current = null
    }
  }, [])

  const onClose = useCallback(() => {
    close({ ok: false, reason: "cancelled" })
  }, [close])

  const onConfirm = useCallback(
    (value: SucursalPickerValue) => {
      const selection: DestinationSelection = {
        destinationBranchCode: String(value.codsucursal ?? "").trim(),
        destinationBranchName: String(value.sucursal ?? "").trim() || null,
        destinationWherehouseCode: String(value.codBodega ?? "").trim(),
        destinationWherehouseName: String(value.nombodega ?? "").trim() || null,
        destinationSerie: String(value.serie ?? "").trim() || null,
      }

      if (!selection.destinationBranchCode || !selection.destinationWherehouseCode) {
        close({ ok: false, reason: "cancelled" })
        return
      }

      onApply(selection)
      close({ ok: true, selection, existed: false })
    },
    [close, onApply]
  )

  const ensureDestination = useCallback(async (): Promise<EnsureResult> => {
    if (hasDestination) {
      return {
        ok: true,
        selection: {
          destinationBranchCode: String(destinationBranchCode ?? "").trim(),
          destinationBranchName: null,
          destinationWherehouseCode: String(destinationWherehouseCode ?? "").trim(),
          destinationWherehouseName: null,
          destinationSerie: null,
        },
        existed: true,
      }
    }

    const arr = Array.isArray(items) ? items : []
    if (arr.length === 0) return { ok: false, reason: "no_items" }
    if (loading) return { ok: false, reason: "no_items" }

    if (pendingRef.current) {
      return new Promise<EnsureResult>((resolve) => {
        const prev = pendingRef.current!
        pendingRef.current = {
          resolve: (r) => {
            prev.resolve(r)
            resolve(r)
          },
          reject: (e) => prev.reject(e),
        }
      })
    }

    setOpen(true)
    return new Promise<EnsureResult>((resolve, reject) => {
      pendingRef.current = { resolve, reject }
    })
  }, [destinationBranchCode, destinationWherehouseCode, hasDestination, items, loading])

  return {
    required,
    open,
    loading,
    codProducto,
    items,
    selectedCodSucursal: destinationBranchCode ?? null,
    ensureDestination,
    onClose,
    onConfirm,
  }
}
