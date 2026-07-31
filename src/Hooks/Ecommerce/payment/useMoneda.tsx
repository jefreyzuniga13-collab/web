import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface"
import type {
  MonedaInterface,
  TasaCambioInterface
} from "@/Interfaces/Ecommerce/Moneda"

import { MonedaService } from "@/Services/Ecommerce/MonedaService"

/**
 * Obtiene el catálogo de monedas y la tasa de cambio
 * correspondiente a una fecha.
 *
 * @param fechaTasaCambio Fecha en formato YYYY-MM-DD.
 */
export const useMoneda = (fechaTasaCambio?: string) => {
  const fechaValida = Boolean(fechaTasaCambio?.trim())

  /**
   * Catálogo de monedas.
   */
  const monedaQuery = useQuery<
    ApiPCGResponse<MonedaInterface[]>,
    Error
  >({
    queryKey: ["moneda-pcg", "listar"],

    queryFn: () => MonedaService.Listar(),

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
    retry: 1
  })

  /**
   * Tasa de cambio según la fecha indicada.
   */
  const tasaCambioQuery = useQuery<
    ApiPCGResponse<TasaCambioInterface>,
    Error
  >({
    queryKey: [
      "tasaCambio-pcg",
      "obtenerTasaCambio",
      fechaTasaCambio
    ],

    queryFn: () => {
      if (!fechaTasaCambio?.trim()) {
        throw new Error(
          "La fecha es obligatoria para obtener la tasa de cambio."
        )
      }

      return MonedaService.TasaCambio(fechaTasaCambio)
    },

    enabled: fechaValida,

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
    retry: 1
  })

  /**
   * Solo expone monedas activas.
   */
  const monedas = useMemo<MonedaInterface[]>(() => {
    const data = monedaQuery.data?.data ?? []

    return data.filter(
      (item) => item.activo?.trim().toUpperCase() === "S"
    )
  }, [monedaQuery.data])

  /**
   * Respuesta original de tasa de cambio.
   */
  const tasaCambioData = useMemo<TasaCambioInterface | null>(() => {
    return tasaCambioQuery.data?.data ?? null
  }, [tasaCambioQuery.data])

  /**
   * Tasa convertida a number para utilizarla en cálculos.
   */
  const tasaCambio = useMemo<number>(() => {
    const valor = Number(tasaCambioData?.tasaCambio ?? 0)

    if (!Number.isFinite(valor) || valor <= 0) {
      return 0
    }

    return valor
  }, [tasaCambioData])

  const loadingMonedas =
    monedaQuery.isPending || monedaQuery.isFetching

  const loadingTasaCambio =
    tasaCambioQuery.isPending || tasaCambioQuery.isFetching

  return {
    monedas,

    tasaCambio,
    tasaCambioData,

    loadingMonedas,
    loadingTasaCambio,

    monedaError: monedaQuery.error,
    tasaCambioError: tasaCambioQuery.error,

    monedaQuery,
    tasaCambioQuery,

    refetchMonedas: monedaQuery.refetch,
    refetchTasaCambio: tasaCambioQuery.refetch
  }
}