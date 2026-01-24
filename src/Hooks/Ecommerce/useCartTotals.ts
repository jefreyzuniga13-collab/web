// src/Hooks/Ecommerce/useCartTotals.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "react-toastify"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import type { CalculationReqDto } from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type { InvoiceTotalsDto } from "@/Interfaces/Crm/CartPCGInterface"

type TotalsOptions = {
  contactId: number
  retiraSucursal: "S" | "N"
  transCost: number
  selectedAddressId: number | null
  addDescription: string
  debounceMs?: number
}

const toNumber0 = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export function useCartTotals({
  contactId,
  retiraSucursal,
  transCost,
  selectedAddressId,
  addDescription,
  debounceMs = 350,
}: TotalsOptions) {
  const [invoiceTotalsDto, setInvoiceTotalsDto] = useState<InvoiceTotalsDto | null>(null)
  const [totalsLoading, setTotalsLoading] = useState(false)
  const [debouncedTransCost, setDebouncedTransCost] = useState<number>(0)

  const reqRef = useRef(0)

  const isPickup = retiraSucursal === "S"
  const hasSelectedAddress = selectedAddressId != null
  const hasManualAddress = addDescription.trim().length > 0
  const hasDeliveryAddress = hasSelectedAddress || hasManualAddress

  const allowShipping = !isPickup && hasDeliveryAddress

  const effectiveShipping = useMemo(() => {
    if (!allowShipping) return 0
    const cost = toNumber0(transCost)
    return cost > 0 ? cost : 0
  }, [allowShipping, transCost])

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedTransCost(toNumber0(transCost))
    }, debounceMs)
    return () => clearTimeout(t)
  }, [transCost, debounceMs])

  const calcTotals = useCallback(
    async (opts?: { cost?: number; pickup?: boolean; silent?: boolean }) => {
      if (!contactId) return
      const myReq = ++reqRef.current

      const pickup = opts?.pickup ?? (retiraSucursal === "S")
      const cost = toNumber0(opts?.cost ?? debouncedTransCost)
      const safeCost = cost > 0 ? cost : 0

      const shippingAllowedNow = !(pickup === true) && (selectedAddressId != null || addDescription.trim().length > 0)

      const calculationReqDto: CalculationReqDto = {
        maquina: `CRM-${contactId}`,
        usuario: `${contactId}`,
        aplicaPropina: "N",
        exonerada: "N",
        imi: "N",
        ir: "N",
        tabla: "det_factura_tempo",
        tasa: 36.6243,
        tipoServicio: "8",
        valorTransporte: shippingAllowedNow ? safeCost : 0,
      }

      if (!opts?.silent) setTotalsLoading(true)
      try {
        const res = await CartService.VspConsolidadoFactura(calculationReqDto)
        if (myReq !== reqRef.current) return
        setInvoiceTotalsDto(res.data?.[0] ?? null)
      } catch {
        if (myReq !== reqRef.current) return
        setInvoiceTotalsDto(null)
        toast.error("No se pudo calcular el total")
      } finally {
        if (!opts?.silent) setTotalsLoading(false)
      }
    },
    [contactId, retiraSucursal, debouncedTransCost, selectedAddressId, addDescription]
  )

  useEffect(() => {
    if (!contactId) return
    void calcTotals({ cost: debouncedTransCost, pickup: retiraSucursal === "S" })
  }, [contactId, debouncedTransCost, retiraSucursal, selectedAddressId, addDescription, calcTotals])

  return {
    invoiceTotalsDto,
    totalsLoading,
    debouncedTransCost,
    effectiveShipping,
    calcTotals,
  }
}