import type {
  FacturaTempo,
  ObtenerDivisaPagosTipoRes,
  PagoGenerico
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import type {
  PagoSeleccionado
} from "@/Interfaces/Ecommerce/MultiPagoTypes"

import type {
  CheckoutPaymentMethod
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import { round2, safeStr } from "@/Utils/ECommerce/formatters"

const TASA_CAMBIO_DEFECTO = 36.6243

/**
 * Convierte una forma de pago recibida desde PCG al método interno del checkout.
 *
 * La pasarela se representa como gatewayCard en la refactorización actual.
 */
export const obtenerTipoPagoDesdeMoneda = (
  item: Currencyto
): CheckoutPaymentMethod => {
  const codPago = safeStr(item?.codPago).toUpperCase()
  const descripcion = safeStr(item?.descripcion_Pago).toLowerCase().trim()
  const moneda = safeStr(item?.moneda_Fija).toLowerCase().trim()

  if (
    codPago === "1" ||
    descripcion.includes("efectivo") ||
    moneda.includes("efectivo")
  ) {
    return "cash"
  }

  if (
    codPago === "STR" ||
    descripcion.includes("transfer") ||
    descripcion.includes("transferencia") ||
    moneda.includes("transfer")
  ) {
    return "transfer"
  }

  if (
    codPago === "STA" ||
    descripcion.includes("tarjeta manual") ||
    descripcion === "tarjeta"
  ) {
    return "manualCard"
  }

  if (codPago === "PAS") {
    return "gatewayCard"
  }

  return "cash"
}

/**
 * Retorna las formas de pago que se pueden usar dentro de multipago.
 *
 * La pasarela no se permite en multipago porque requiere Hosted Page,
 * tokenización o 3DS como pago único.
 */
export const filtrarFormasPagoMultipago = (
  currency: Currencyto[]
): Currencyto[] => {
  return currency.filter((item) => {
    const metodo = obtenerTipoPagoDesdeMoneda(item)

    return metodo !== "gatewayCard"
  })
}

/**
 * Retorna las formas de pago disponibles para pago único.
 *
 * Si la empresa no permite pasarela, se oculta gatewayCard.
 */
export const filtrarFormasPagoUnico = (
  currency: Currencyto[],
  permitePasarela: boolean
): Currencyto[] => {
  return currency.filter((item) => {
    const metodo = obtenerTipoPagoDesdeMoneda(item)

    if (!permitePasarela && metodo === "gatewayCard") {
      return false
    }

    return true
  })
}

/**
 * Suma todos los montos agregados al multipago.
 */
export const totalPagado = (pagos: PagoSeleccionado[]): number => {
  return round2(
    pagos.reduce((acc, item) => acc + Number(item.monto ?? 0), 0)
  )
}

/**
 * Calcula cuánto falta para cubrir el total de factura.
 */
export const totalPendiente = (
  pagos: PagoSeleccionado[],
  totalFactura: number
): number => {
  return round2(Number(totalFactura ?? 0) - totalPagado(pagos))
}

/**
 * Valida que el multipago sea consistente antes de construir detallePago.
 */
export const validarPagosSeleccionados = (
  pagos: PagoSeleccionado[],
  totalFactura: number
): string | null => {
  if (!pagos.length) {
    return "Debe agregar al menos una forma de pago."
  }

  const total = round2(totalFactura)
  const pagado = totalPagado(pagos)

  if (pagos.some((pago) => pago.metodo === "gatewayCard")) {
    return "La tarjeta en línea no está disponible dentro de multipago. Úsala como pago único."
  }

  if (pagado < total) {
    return `Monto insuficiente. Pendiente C$${round2(total - pagado)}.`
  }

  if (pagado > total) {
    return `El monto pagado no puede superar el total. Exceso C$${round2(
      pagado - total
    )}.`
  }

  for (const pago of pagos) {
    if (!pago.moneda) {
      return "Hay una forma de pago sin método seleccionado."
    }

    if (Number(pago.monto ?? 0) <= 0) {
      return "Hay una forma de pago con monto inválido."
    }

    if (
      (pago.metodo === "transfer" || pago.metodo === "manualCard") &&
      !pago.divisa
    ) {
      return "Debe seleccionar banco / tipo de pago."
    }

    if (
      (pago.metodo === "transfer" || pago.metodo === "manualCard") &&
      !safeStr(pago.divisa?.codigo)
    ) {
      return "La forma de pago seleccionada no tiene código válido."
    }

    if (pago.metodo === "transfer" && !safeStr(pago.referencia)) {
      return "La referencia de transferencia es requerida."
    }

    if (pago.metodo === "manualCard") {
      if (!safeStr(pago.tarjetaManual?.tarjetahabiente)) {
        return "El tarjetahabiente es requerido."
      }

      if (!safeStr(pago.tarjetaManual?.tarjeta)) {
        return "La tarjeta es requerida."
      }

      if (!safeStr(pago.tarjetaManual?.ultDigito)) {
        return "Los últimos 4 dígitos son requeridos."
      }

      if (!safeStr(pago.tarjetaManual?.fechaVence)) {
        return "La fecha de vencimiento es requerida."
      }
    }
  }

  return null
}

/**
 * Construye un PagoGenerico individual.
 *
 * Para efectivo usa la moneda seleccionada.
 * Para transferencia y tarjeta manual usa divisa.codigo como codPago real.
 */
export const construirPagoFactura = (
  pago: PagoSeleccionado,
  factura: FacturaTempo,
  codSucursalFactura: string,
  index: number
): PagoGenerico => {
  const metodo = pago.metodo

  const esEfectivo = metodo === "cash"
  const esTransferencia = metodo === "transfer"
  const esTarjetaManual = metodo === "manualCard"

  const monedaFactura = safeStr(factura.moneda) || "1"
  const tasaCambio = Number(factura.tasaCambio ?? TASA_CAMBIO_DEFECTO)
  const monto = round2(Number(pago.monto ?? 0))

  const divisa = pago.divisa as ObtenerDivisaPagosTipoRes | null
  const moneda = pago.moneda as Currencyto | null

  const codPago = esEfectivo
    ? safeStr(moneda?.codPago) || "1"
    : safeStr(divisa?.codigo)

  const descripcionPago = esEfectivo
    ? safeStr(moneda?.descripcion_Pago) || "Efectivo"
    : safeStr(divisa?.nombre)

  const tipoPago = esEfectivo ? "" : safeStr(divisa?.tipo)

  const banco = esEfectivo
    ? safeStr(moneda?.codigo_Banco) || "00"
    : safeStr(divisa?.banco)

  const codPagoExterno = esEfectivo
    ? safeStr(moneda?.codExterno) || "1"
    : safeStr(divisa?.codigoExterno)

  const referencia = esTransferencia
    ? safeStr(pago.referencia)
    : esTarjetaManual
      ? safeStr(pago.tarjetaManual?.autorizacion)
      : ""

  const fechaOVence = esTransferencia
    ? new Date().toISOString().slice(0, 10)
    : esTarjetaManual
      ? safeStr(pago.tarjetaManual?.fechaVence)
      : ""

  const concepto = esEfectivo
    ? "Efectivo"
    : esTransferencia
      ? descripcionPago || "Transferencia"
      : esTarjetaManual
        ? descripcionPago || "Tarjeta manual"
        : descripcionPago || "Pago"

  return {
    numPago: String(index + 1),
    concepto,
    codPago,
    tipoPago,
    aplicaCambio: "True",
    codPagoExterno,
    banco,

    monto,
    moneda: monedaFactura,
    montoA: monto,
    cambio: 0,
    tasaCambio,

    Fecha_o_Vence: fechaOVence,
    referencia,
    numeroTransaccion: referencia,
    cuentaContable: "",
    Dll: "",
    Numero: "",

    ultDigito: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.ultDigito)
      : "",

    tarjeta: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.tarjeta)
      : "",

    tarjetahabiente: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.tarjetahabiente)
      : "",

    autorizacion: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.autorizacion)
      : "",

    termId: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.termId)
      : "",

    afiliado: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.afiliado)
      : "",

    montoP: monto,
    montoS: round2(monto / tasaCambio),

    indice: String(index),
    codClienteCrd: "00000",
    facturaPinpad: "N",
    codEmpresa: safeStr(factura.codEmpresa),
    codSucursal: codSucursalFactura,
    montoFirma: "0",
    sobrante: "0",

    Codtransaccion: referencia,
    CuentaHabiente: esTarjetaManual
      ? safeStr(pago.tarjetaManual?.tarjetahabiente)
      : "",
    CodStrCadsaccion: referencia
  }
}

/**
 * Construye todos los pagos de una factura con multipago.
 */
export const construirDetallePago = (
  pagos: PagoSeleccionado[],
  factura: FacturaTempo,
  codSucursalFactura: string,
  totalFactura: number
): PagoGenerico[] => {
  const error = validarPagosSeleccionados(pagos, totalFactura)

  if (error) {
    throw new Error(error)
  }

  return pagos.map((pago, index) =>
    construirPagoFactura(
      pago,
      factura,
      codSucursalFactura,
      index
    )
  )
}