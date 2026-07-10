/* eslint-disable @typescript-eslint/no-explicit-any */

import { PCG_SERVICES } from "@/Constants/pcgservices"
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface"
import type {
  BuildLogUpdateParams,
  DraftState,
  LogCartFormValues,
  LogCartResponseDto,
  LogCartUpdateRequestDto
} from "@/Interfaces/Crm/LogCartInterface"
import type { CalculationReqDto } from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type { PowertranzBrowserInfoDto } from "@/Interfaces/Ecommerce/powertranzInterface"
import * as turf from "@turf/turf"

/**
 * Calcula la distancia entre dos coordenadas en kilómetros.
 *
 * Se usa para estimar distancia entre ubicación del cliente,
 * sucursal o punto de entrega.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const from = turf.point([lon1, lat1])
  const to = turf.point([lon2, lat2])

  return turf.distance(from, to, { units: "kilometers" })
}

/**
 * Obtiene información del navegador requerida por PowerTranz.
 *
 * Esta información es usada principalmente en flujos 3DS,
 * fingerprint y challenge.
 */
export function obtenerBrowserInfo(): PowertranzBrowserInfoDto {
  return {
    Language: window?.navigator?.language ?? "es-NI",
    ScreenHeight: window?.screen?.height?.toString() ?? "",
    ScreenWidth: window?.screen?.width?.toString() ?? "",
    TimeZone: String(new Date().getTimezoneOffset() * -1),
    UserAgent: window?.navigator?.userAgent ?? "",
    Ip: null,
    JavaEnabled:
      typeof window !== "undefined" &&
      typeof window.navigator?.javaEnabled === "function"
        ? window.navigator.javaEnabled()
        : false,
    JavascriptEnabled: true,
    ColorDepth: window?.screen?.colorDepth?.toString() ?? "",
    ChallengeWindowSize: 5,
    ChallengeIndicator: "01",
    AcceptHeader:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  }
}

/**
 * Convierte un valor a número de forma segura.
 *
 * Si el valor no es numérico o no es finito,
 * retorna el fallback indicado.
 */
export const safeNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value)

  return Number.isFinite(n) ? n : fallback
}

/**
 * Convierte un valor a número positivo.
 *
 * Si el valor es negativo, inválido o cero,
 * retorna 0.
 */
export const safePositiveNumber = (value: unknown): number => {
  const n = safeNumber(value, 0)

  return n > 0 ? n : 0
}

/**
 * Convierte un valor a texto limpio.
 */
export const safeText = (value: unknown): string => {
  return String(value ?? "").trim()
}

/**
 * Obtiene un valor de LogCart buscando entre varios posibles nombres de propiedad.
 *
 * Es útil porque algunos objetos pueden venir con nombres en camelCase
 * y otros con PascalCase dependiendo del backend o del mapper.
 */
export const getLogValue = <T,>(
  log: LogCartResponseDto,
  keys: string[],
  fallback: T
): T => {
  const record = log as unknown as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (value !== undefined && value !== null) {
      return value as T
    }
  }

  return fallback
}

/**
 * Normaliza el borrador local del carrito.
 *
 * Este draft se usa para recuperar datos del paso de entrega:
 * nombre de factura, dirección manual, retiro en sucursal,
 * transporte, dirección seleccionada y observación.
 */
export const normalizeDraft = (raw: string | null): DraftState | null => {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<DraftState>

    return {
      invoiceName: safeText(parsed.invoiceName),
      addDescription: safeText(parsed.addDescription),
      retiraSucursal: parsed.retiraSucursal === "S" ? "S" : "N",
      transCost: safePositiveNumber(parsed.transCost),
      selectedAddressId:
        parsed.selectedAddressId != null &&
        Number.isFinite(Number(parsed.selectedAddressId))
          ? Number(parsed.selectedAddressId)
          : null,
      observation: safeText(parsed.observation)
    }
  } catch {
    return null
  }
}

/**
 * Cuenta únicamente los productos principales del carrito.
 *
 * Los componentes tipo "O" normalmente representan opciones,
 * modificadores o adicionales, por eso no se cuentan como producto principal.
 */
export const countMainProducts = (cartList: CarDto[]): number => {
  return (
    cartList[0]?.listDetalle?.reduce((sum, detail) => {
      if (detail.tipoComponente !== "O") {
        return sum + safeNumber(detail.cantidad, 0)
      }

      return sum
    }, 0) ?? 0
  )
}

/**
 * Construye el request para recalcular totales del carrito.
 *
 * Este cálculo toma en cuenta transporte, impuestos,
 * descuentos y demás reglas manejadas por PCG.
 */
export const buildCalculationRequest = (
  contactId: number,
  shippingCost: number
): CalculationReqDto => {
  return {
    maquina: `CRM-${contactId}`,
    usuario: `${contactId}`,
    aplicaPropina: "N",
    exonerada: "N",
    imi: "N",
    ir: "N",
    tabla: "det_factura_tempo",
    tasa: 36.6243,
    tipoServicio: PCG_SERVICES.CRM.toString(),
    valorTransporte: safePositiveNumber(shippingCost)
  }
}

/**
 * Configuración visual reutilizable para tooltips.
 */
export const tooltipSlotProps = {
  tooltip: {
    sx: {
      fontSize: "1.2rem",
      padding: "10px"
    }
  }
}

/**
 * Construye el request de actualización de LogCart.
 *
 * Este mapper centraliza la persistencia de:
 * sucursal, bodega, dirección, transporte, totales,
 * observación, nombre de factura y datos relacionados al carrito.
 */
export const buildLogUpdateRequest = ({
  log,
  contactId,
  conversationId,
  addressPayload,
  totals,
  observation,
  invoiceName
}: BuildLogUpdateParams): LogCartUpdateRequestDto => {
  const totalEnPantalla =
    totals != null
      ? safeNumber(totals.total, 0)
      : getLogValue<number>(log, ["totalEnPantalla", "TotalEnPantalla"], 0)

  const descuentoPantalla =
    totals != null
      ? safeNumber(totals.descuento, 0)
      : getLogValue<number>(
          log,
          ["descuentoPantalla", "DescuentoPantalla"],
          0
        )

  const ivaPantalla =
    totals != null
      ? safeNumber(totals.iva, 0)
      : getLogValue<number>(log, ["ivaPantalla", "IvaPantalla"], 0)

  const propina =
    totals != null
      ? safeNumber(totals.propina, 0)
      : getLogValue<number>(log, ["propina", "Propina"], 0)

  const subTotal =
    totals != null
      ? safeNumber(totals.subTotal, 0)
      : getLogValue<number>(log, ["subTotal", "SubTotal"], 0)

  const invoiceNameFinal =
    safeText(invoiceName) ||
    safeText(getLogValue<string | null>(log, ["invoiceName", "InvoiceName"], null)) ||
    null

  return {
    orderId: safeNumber(log.orderId, 0),
    contactId: safeNumber(log.contactId, contactId),
    userId: safeNumber(log.userId, 0),
    conversationId: safeNumber(log.conversationId, conversationId),
    statusId: safeNumber(log.statusId, 0),

    branch: log.branch ?? null,
    branchName: log.branchName ?? null,
    wherehouse: log.wherehouse ?? null,
    wherehouseCode: log.wherehouseCode ?? null,

    retiraSucursal: addressPayload.retiraSucursal,
    addressId: addressPayload.addressId,
    transCost: addressPayload.transCost,

    totalEnPantalla,
    descuentoPantalla,
    ivaPantalla,
    propina,
    subTotal,

    exonerado: getLogValue<any>(log, ["exonerado", "Exonerado"], null),
    observacion: observation ?? "",
    invoiceName: invoiceNameFinal,

    destinationBranchCode: getLogValue<any>(
      log,
      ["destinationBranchCode", "DestinationBranchCode"],
      null
    ),
    destinationWherehouseCode: getLogValue<any>(
      log,
      ["destinationWherehouseCode", "DestinationWherehouseCode"],
      null
    ),

    serie: log.serie
  } as LogCartUpdateRequestDto
}

/**
 * Convierte el request de actualización a valores completos de formulario.
 *
 * Algunos endpoints de actualización necesitan conservar datos existentes
 * como id, companyId o codPrecio. Por eso se mezclan datos nuevos con datos
 * ya existentes del LogCart.
 */
export const toLogCartFormValues = (
  req: LogCartUpdateRequestDto,
  log: LogCartResponseDto
): LogCartFormValues => {
  const invoiceNameFinal =
    safeText(req.invoiceName) ||
    safeText(getLogValue<string | null>(log, ["invoiceName", "InvoiceName"], null)) ||
    null

  return {
    ...req,

    id: getLogValue<number>(log, ["id", "Id"], 0),

    companyId: getLogValue<number | null>(
      log,
      ["companyId", "CompanyId"],
      null
    ),

    codPrecio: getLogValue<string | null>(
      log,
      ["codPrecio", "CodPrecio"],
      null
    ),

    invoiceName: invoiceNameFinal
  } as LogCartFormValues
}