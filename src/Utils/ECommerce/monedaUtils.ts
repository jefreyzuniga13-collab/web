import { tasaCambio as tasaCambioRespaldo } from "@/Constants/tasaCambio"
import type { MonedaCatalogo, TasaCambioCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"

const trunc4 = (value: number): number =>
  Math.trunc(value * 10000) / 10000

const redondear2 = (value: number): number =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100

const textoMoneda = (moneda?: MonedaCatalogo | null): string => {
  if (!moneda) return ""

  return [moneda.id, moneda.moneda, moneda.abreviatura, moneda.simbolo]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export const esMonedaDolar = (moneda?: MonedaCatalogo | null): boolean => {
  const texto = textoMoneda(moneda)

  return (
    texto.includes("dolar") ||
    texto.includes("usd") ||
    texto.includes("dollar")
  )
}

export const esMonedaCordoba = (moneda?: MonedaCatalogo | null): boolean => {
  const texto = textoMoneda(moneda)

  return (
    texto.includes("cordob") ||
    texto.includes("nio") ||
    moneda?.id === "1"
  )
}

export const tasaCambioValida = (tasa?: number | null): number => {
  const valor = Number(tasa)
  return Number.isFinite(valor) && valor > 0 ? valor : tasaCambioRespaldo
}

export const leerTasaCambio = (raw?: TasaCambioCatalogo | null): number => {
  if (!raw) return tasaCambioRespaldo

  return tasaCambioValida(Number(raw.tasaCambio ?? raw.TasaCambio ?? 0))
}

export const normalizarMoneda = (raw: Record<string, unknown>): MonedaCatalogo => {
  return {
    id: String(raw.id ?? raw.Id ?? "").trim(),
    moneda: String(raw.moneda ?? raw.Moneda ?? "").trim(),
    simbolo: String(raw.simbolo ?? raw.Simbolo ?? "").trim(),
    abreviatura: String(raw.abreviatura ?? raw.Abreviatura ?? "").trim(),
    activo: String(raw.activo ?? raw.Activo ?? "S").trim()
  }
}

export const elegirCordoba = (monedas: MonedaCatalogo[]): MonedaCatalogo | null => {
  return monedas.find(esMonedaCordoba) ?? monedas[0] ?? null
}

export const convertirDesdeCordoba = (
  montoCordoba: number,
  esDolar: boolean,
  tasa?: number
): number => {
  const monto = Number(montoCordoba ?? 0)
  if (!esDolar) return monto

  return redondear2(monto / tasaCambioValida(tasa))
}

export const montoACordoba = (
  monto: number,
  esDolar: boolean,
  tasa: number
): number => {
  const valor = Number(monto ?? 0)
  if (!esDolar) return valor

  return trunc4(valor * tasaCambioValida(tasa))
}

/**
 * Si el pago en USD cubre el equivalente visible del pendiente,
 * se aplica el pendiente exacto en córdobas y no queda residuo.
 */
export const montoACordobaCerrando = (
  monto: number,
  esDolar: boolean,
  tasa: number,
  pendienteCordoba: number
): number => {
  const pendiente = Math.max(0, Number(pendienteCordoba ?? 0))
  const convertido = montoACordoba(monto, esDolar, tasa)

  if (!esDolar) return Math.min(convertido, pendiente)

  const requeridoUsd = convertirDesdeCordoba(pendiente, true, tasa)
  if (cubreMontoPago(monto, requeridoUsd)) return pendiente

  return Math.min(convertido, pendiente)
}

export type MontosPagoCalculados = {
  monto: number
  montoA: number
  montoP: number
  montoS: number
}

/**
 * monto / montoA: dinero recibido en la moneda del pago (C$ o USD).
 * MontoP: lo aplicado a la factura en córdobas.
 * MontoS: el dinero recibido en dólares.
 */
export const calcularMontosPago = ({
  monto,
  montoAplicado,
  esDolar,
  tasa,
  montoPCordoba
}: {
  monto: number
  montoAplicado: number
  esDolar: boolean
  tasa: number
  montoPCordoba?: number
}): MontosPagoCalculados => {
  const recibido = Number(monto ?? 0)
  const aplicado = Math.max(0, Number(montoAplicado ?? 0))
  const tasaSafe = tasaCambioValida(tasa)

  if (esDolar) {
    return {
      monto: recibido,
      montoA: recibido,
      montoP: montoPCordoba ?? trunc4(aplicado * tasaSafe),
      montoS: trunc4(recibido)
    }
  }

  return {
    monto: recibido,
    montoA: recibido,
    montoP: trunc4(aplicado),
    montoS: trunc4(recibido / tasaSafe)
  }
}

export const simboloMoneda = (moneda?: MonedaCatalogo | null): string => {
  if (moneda?.simbolo) return moneda.simbolo
  if (esMonedaDolar(moneda)) return "$"
  return "C$"
}

export const clavePagoMoneda = (
  metodo: string,
  monedaId?: string | null
): string => `${metodo}:${monedaId || "1"}`

/**
 * Compara montos como se ven en pantalla (2 decimales).
 */
export const cubreMontoPago = (
  recibido: number,
  requerido: number
): boolean => redondear2(recibido) + 0.001 >= redondear2(requerido)

/**
 * Cambio siempre en córdobas.
 * recibido × tasa − lo aplicado a la factura.
 * $20 × 36.6243 − C$430.16 = C$302.326
 */
export const cambioEnCordoba = (
  recibido: number,
  aplicadoCordoba: number,
  esDolar: boolean,
  tasa?: number
): number => {
  const recibidoC = montoACordoba(recibido, esDolar, tasa ?? 0)
  return trunc4(Math.max(0, recibidoC - Number(aplicadoCordoba ?? 0)))
}

/**
 * Residuo de conversión C$ ↔ USD que no llega a un centavo de dólar.
 * En multipago se considera cubierto para no bloquear el cobro.
 */
export const absorberResiduoCambio = (
  pendienteCordoba: number,
  tasa?: number
): number => {
  const pendiente = Math.max(0, Number(pendienteCordoba ?? 0))
  if (pendiente <= 0) return 0

  const enDolares = pendiente / tasaCambioValida(tasa)
  if (redondear2(enDolares) <= 0) return 0

  return pendiente
}
