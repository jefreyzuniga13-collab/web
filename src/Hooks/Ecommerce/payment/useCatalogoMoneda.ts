import { useCallback, useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { CatalogoService } from "@/Services/Ecommerce/CatalogoService"
import { FechaManagua } from "@/Utils/FechaManagua"
import { readPublicEmpresaId } from "@/Utils/ECommerce/publicEmpresa"
import {
  elegirCordoba,
  esMonedaDolar,
  leerTasaCambio,
  normalizarMoneda,
  tasaCambioValida
} from "@/Utils/ECommerce/monedaUtils"
import type { MonedaCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"
import { tasaCambio as tasaCambioRespaldo } from "@/Constants/tasaCambio"

const catalogoKeys = {
  monedas: (empresaId = "") => ["catalogo", "monedas", empresaId] as const,
  tasa: (fecha: string, empresaId = "") =>
    ["catalogo", "tasa-cambio", fecha, empresaId] as const
}

type UseCatalogoMonedaParams = {
  aplicaMultiMoneda?: boolean
  bloquearDolar?: boolean
}

export const useCatalogoMoneda = ({
  aplicaMultiMoneda = false,
  bloquearDolar = false
}: UseCatalogoMonedaParams = {}) => {
  const empresaId = readPublicEmpresaId()
  const fechaIso = FechaManagua.obtenerIso()

  const [monedaSeleccionada, setMonedaSeleccionada] =
    useState<MonedaCatalogo | null>(null)

  const monedasQuery = useQuery({
    queryKey: catalogoKeys.monedas(empresaId),
    queryFn: async () => {
      const res = await CatalogoService.ListarMoneda()
      if (!res.success) {
        toast.error(res.message || "No se pudieron cargar las monedas.")
        return [] as MonedaCatalogo[]
      }

      const raw = Array.isArray(res.data) ? res.data : []
      return raw
        .map((item) => normalizarMoneda(item as unknown as Record<string, unknown>))
        .filter((item) => item.id && item.activo !== "N")
    },
    staleTime: 1000 * 60 * 30
  })

  const tasaQuery = useQuery({
    queryKey: catalogoKeys.tasa(fechaIso, empresaId),
    queryFn: async () => {
      const res = await CatalogoService.ObtenerTasaCambio(fechaIso)
      if (!res.success) {
        toast.error(res.message || "No se pudo obtener la tasa de cambio.")
        return tasaCambioRespaldo
      }

      return leerTasaCambio(res.data)
    },
    staleTime: 1000 * 60 * 10
  })

  const monedas = useMemo(() => {
    const lista = monedasQuery.data ?? []
    if (aplicaMultiMoneda) return lista
    return lista.filter((item) => !esMonedaDolar(item))
  }, [aplicaMultiMoneda, monedasQuery.data])

  const tasa = tasaCambioValida(tasaQuery.data)

  useEffect(() => {
    if (!monedas.length) return

    setMonedaSeleccionada((actual) => {
      if (!aplicaMultiMoneda || bloquearDolar) {
        return elegirCordoba(monedas)
      }

      if (actual && monedas.some((item) => item.id === actual.id)) {
        return actual
      }
      
      return elegirCordoba(monedas)
    })
  }, [monedas, aplicaMultiMoneda, bloquearDolar])

  const seleccionarMoneda = useCallback(
    (moneda: MonedaCatalogo) => {
      if (!aplicaMultiMoneda && esMonedaDolar(moneda)) {
        setMonedaSeleccionada(elegirCordoba(monedas))
        return
      }

      if (bloquearDolar && esMonedaDolar(moneda)) {
        toast.info("La pasarela de pago solo acepta córdobas.")
        setMonedaSeleccionada(elegirCordoba(monedas))
        return
      }

      setMonedaSeleccionada(moneda)
    },
    [aplicaMultiMoneda, bloquearDolar, monedas]
  )

  const esDolar = esMonedaDolar(monedaSeleccionada)
  const monedaId = monedaSeleccionada?.id || "1"
  const loading = monedasQuery.isLoading || tasaQuery.isLoading

  return useMemo(
    () => ({
      monedas,
      monedaSeleccionada,
      setMonedaSeleccionada: seleccionarMoneda,
      monedaId,
      esDolar,
      tasa,
      loading
    }),
    [
      monedas,
      monedaSeleccionada,
      seleccionarMoneda,
      monedaId,
      esDolar,
      tasa,
      loading
    ]
  )
}
