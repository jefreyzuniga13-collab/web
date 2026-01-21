import { useEffect, useMemo, useState } from "react"
import { CartService } from "@/Services/Ecommerce/CarPCGService"

export type BranchPick = {
  codsucursal: string
  sucursal: string
  serie: string
  existencia: number
  medida: string
  nombodega: string
  codbodega: string
}

type UseBranchesByProductOptions = {
  enabled?: boolean
  sortByStockDesc?: boolean
}

export const useBranchesByProduct = (codProducto?: string | null, options?: UseBranchesByProductOptions) => {
  const enabled = options?.enabled ?? true
  const sortByStockDesc = options?.sortByStockDesc ?? true

  const [rows, setRows] = useState<BranchPick[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      const cod = (codProducto ?? "").trim()
      if (!enabled || !cod) {
        setRows([])
        return
      }

      setLoading(true)
      try {
        const res = await CartService.getProductFromTempTotal(cod)
        const data = Array.isArray(res) ? (res as BranchPick[]) : []
        setRows(data)
      } catch {
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [codProducto, enabled])

  const sorted = useMemo(() => {
    if (!sortByStockDesc) return rows
    return [...rows].sort((a, b) => Number(b.existencia ?? 0) - Number(a.existencia ?? 0))
  }, [rows, sortByStockDesc])

  return { rows: sorted, loading, rawRows: rows }
}