import { tasaCambio as tasaCambioSistema } from "@/Constants/tasaCambio"

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

import {
  safeStr
} from "@/Utils/ECommerce/formatters"

/**
 * Se utiliza únicamente para comparar números decimales.
 *
 * No redondea ni modifica los valores enviados a PCG.
 */
const PAYMENT_EPSILON = 0.000001

/**
 * Convierte una forma de pago recibida desde PCG al método interno
 * utilizado por el checkout.
 */
export const obtenerTipoPagoDesdeMoneda = (
  item: Currencyto
): CheckoutPaymentMethod => {
  const codPago = safeStr(item?.codPago).toUpperCase()

  const descripcion = safeStr(item?.descripcion_Pago)
    .toLowerCase()
    .trim()

  const moneda = safeStr(item?.moneda_Fija)
    .toLowerCase()
    .trim()

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
 * Retorna las formas de pago permitidas dentro de multipago.
 *
 * La pasarela no se permite porque requiere Hosted Page,
 * tokenización o autenticación 3DS como pago único.
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
 */
export const filtrarFormasPagoUnico = (
  currency: Currencyto[],
  permitePasarela: boolean
): Currencyto[] => {
  return currency.filter((item) => {
    const metodo = obtenerTipoPagoDesdeMoneda(item)

    if (
      !permitePasarela &&
      metodo === "gatewayCard"
    ) {
      return false
    }

    return true
  })
}

/**
 * Suma los montos ingresados en multipago.
 *
 * No redondea ni modifica los valores.
 */
export const totalPagado = (
  pagos: PagoSeleccionado[]
): number => {
  return pagos.reduce(
    (acumulado, pago) =>
      acumulado + Number(pago.monto ?? 0),
    0
  )
}

/**
 * Calcula cuánto falta por cubrir.
 *
 * Un resultado negativo se transforma en cero porque representa
 * un posible cambio en efectivo.
 */
export const totalPendiente = (
  pagos: PagoSeleccionado[],
  totalFactura: number
): number => {
  return Math.max(
    0,
    Number(totalFactura ?? 0) - totalPagado(pagos)
  )
}

/**
 * Retorna el índice del último pago con monto mayor que cero.
 */
const obtenerIndiceUltimoPagoValido = (
  pagos: PagoSeleccionado[]
): number => {
  for (
    let index = pagos.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (Number(pagos[index]?.monto ?? 0) > 0) {
      return index
    }
  }

  return -1
}

/**
 * Valida que los pagos seleccionados puedan construir detallePago.
 *
 * El excedente solamente se permite cuando:
 * - el último pago es efectivo;
 * - los pagos anteriores todavía no habían cubierto la factura.
 */
export const validarPagosSeleccionados = (
  pagos: PagoSeleccionado[],
  totalFactura: number
): string | null => {
  if (!pagos.length) {
    return "Debe agregar al menos una forma de pago."
  }

  const total = Number(totalFactura ?? 0)
  const pagado = totalPagado(pagos)

  if (!Number.isFinite(total) || total <= 0) {
    return "El total de la factura no es válido."
  }

  if (
    pagos.some(
      (pago) => pago.metodo === "gatewayCard"
    )
  ) {
    return "La tarjeta en línea no está disponible dentro de multipago. Úsala como pago único."
  }

  /** Efectivo solo puede registrarse una vez dentro del multipago. */
  const cantidadPagosEfectivo = pagos.filter(
    (pago) => pago.metodo === "cash"
  ).length

  if (cantidadPagosEfectivo > 1) {
    return "Solamente puede agregar un pago en efectivo."
  }

  for (const pago of pagos) {
    const monto = Number(pago.monto ?? 0)

    if (!pago.moneda) {
      return "Hay una forma de pago sin método seleccionado."
    }

    if (!Number.isFinite(monto) || monto <= 0) {
      return "Hay una forma de pago con monto inválido."
    }

    if (
      (
        pago.metodo === "transfer" ||
        pago.metodo === "manualCard"
      ) &&
      !pago.divisa
    ) {
      return "Debe seleccionar banco / tipo de pago."
    }

    if (
      (
        pago.metodo === "transfer" ||
        pago.metodo === "manualCard"
      ) &&
      !safeStr(pago.divisa?.codigo)
    ) {
      return "La forma de pago seleccionada no tiene código válido."
    }

    if (
      pago.metodo === "transfer" &&
      !safeStr(pago.referencia)
    ) {
      return "La referencia de transferencia es requerida."
    }

    if (pago.metodo === "manualCard") {
      if (
        !safeStr(
          pago.tarjetaManual?.tarjetahabiente
        )
      ) {
        return "El tarjetahabiente es requerido."
      }

      if (
        safeStr(
          pago.tarjetaManual?.ultDigito
        ).length !== 4
      ) {
        return "Los últimos 4 dígitos son requeridos."
      }

      if (
        !safeStr(
          pago.tarjetaManual?.fechaVence
        )
      ) {
        return "La fecha de vencimiento es requerida."
      }
    }
  }

  if (pagado < total - PAYMENT_EPSILON) {
    return `Monto insuficiente. Pendiente C$${
      total - pagado
    }.`
  }

  if (pagado > total + PAYMENT_EPSILON) {
    const ultimoIndice =
      obtenerIndiceUltimoPagoValido(pagos)

    if (ultimoIndice < 0) {
      return "No se encontró un pago válido."
    }

    const ultimoPago = pagos[ultimoIndice]

    if (ultimoPago.metodo !== "cash") {
      return "Solamente un pago en efectivo puede superar el total para generar cambio."
    }

    const totalAnterior = pagos
      .slice(0, ultimoIndice)
      .reduce(
        (acumulado, pago) =>
          acumulado + Number(pago.monto ?? 0),
        0
      )

    if (totalAnterior >= total - PAYMENT_EPSILON) {
      return "El pago en efectivo no puede agregarse después de haber cubierto completamente la factura."
    }
  }

  return null
}

type ConstruirPagoFacturaOptions = {
  /**
   * Monto de este pago que realmente se aplica a la factura.
   */
  montoAplicado: number
}

/**
 * Construye un PagoGenerico individual dentro de multipago.
 *
 * Efectivo:
 * - monto: dinero recibido;
 * - montoA: dinero recibido;
 * - montoP: monto aplicado a la factura;
 * - cambio: monto recibido menos monto aplicado;
 * - montoS: dinero recibido convertido por tasa de cambio.
 *
 * Transferencia y tarjeta:
 * - monto, montoA y montoP tienen el mismo valor;
 * - cambio es cero.
 */
export const construirPagoFactura = (
  pago: PagoSeleccionado,
  factura: FacturaTempo,
  codSucursalFactura: string,
  index: number,
  options: ConstruirPagoFacturaOptions
): PagoGenerico => {
  const metodo = pago.metodo

  const esEfectivo = metodo === "cash"
  const esTransferencia = metodo === "transfer"
  const esTarjetaManual = metodo === "manualCard"

  const montoRecibido = Number(pago.monto ?? 0)

  const montoAplicado = Math.max(
    0,
    Number(options.montoAplicado ?? 0)
  )

  const cambio = esEfectivo
    ? Math.max(
        0,
        montoRecibido - montoAplicado
      )
    : 0

  const monedaFactura =
    safeStr(factura.moneda) || "1"

  const divisa =
    pago.divisa as ObtenerDivisaPagosTipoRes | null

  const moneda =
    pago.moneda as Currencyto | null

  const codPago = esEfectivo
    ? safeStr(moneda?.codPago) || "1"
    : safeStr(divisa?.codigo)

  const descripcionPago = esEfectivo
    ? safeStr(moneda?.descripcion_Pago)
    : safeStr(divisa?.nombre)

  const tipoPago = esEfectivo
    ? safeStr(moneda?.moneda_Fija) || "1"
    : safeStr(divisa?.tipo)

  const banco = esEfectivo
    ? safeStr(moneda?.codigo_Banco) || "00"
    : safeStr(divisa?.banco)

  const codPagoExterno = esEfectivo
    ? safeStr(moneda?.codExterno) || "1"
    : safeStr(divisa?.codigoExterno)

  const referencia = esTransferencia
    ? safeStr(pago.referencia)
    : esTarjetaManual
      ? safeStr(
          pago.tarjetaManual?.autorizacion
        )
      : ""

  const fechaOVence = esTransferencia
    ? new Date().toISOString().slice(0, 10)
    : esTarjetaManual
      ? safeStr(
          pago.tarjetaManual?.fechaVence
        )
      : ""

  const concepto = esEfectivo
    ? "Efectivo"
    : esTransferencia
      ? descripcionPago || "Transferencia"
      : esTarjetaManual
        ? descripcionPago || "Tarjeta manual"
        : descripcionPago || "Pago"

  const tasaFactura = Number(
    factura.tasaCambio ?? tasaCambioSistema
  )

  const tasa = Number.isFinite(tasaFactura) &&
    tasaFactura > 0
    ? tasaFactura
    : tasaCambioSistema

  return {
    numPago: String(index + 1),
    concepto,
    codPago,
    tipoPago,
    aplicaCambio: esEfectivo,
    codPagoExterno,
    banco,

    monto: montoRecibido,
    moneda: monedaFactura,
    montoA: montoRecibido,
    cambio,
    tasaCambio: tasa,

    Fecha_o_Vence: fechaOVence,
    referencia,

    ultDigito: esTarjetaManual
      ? safeStr(
          pago.tarjetaManual?.ultDigito
        )
      : "",

    tarjeta: esTarjetaManual
      ? safeStr(
          pago.tarjetaManual?.tarjeta
        )
      : "",

    tarjetahabiente: esTarjetaManual
      ? safeStr(
          pago.tarjetaManual?.tarjetahabiente
        )
      : "",

    montoP: montoAplicado,

    /**
     * No redondear. PCG recibe la precisión completa.
     */
    montoS: montoRecibido / tasa,

    indice: String(index + 1),
    codClienteCrd: "00000",
    facturaPinpad: "N",
    codEmpresa: safeStr(factura.codEmpresa),
    codSucursal: codSucursalFactura,
    montoFirma: "0",
    sobrante: "0",

    CuentaHabiente: esTarjetaManual
      ? safeStr(
          pago.tarjetaManual?.tarjetahabiente
        )
      : "",

    cuentaContable: "",
    Dll: "",
    Numero: "",

    Codtransaccion: "",
    CodStrCadsaccion: "",

    afiliado: "",
    autorizacion: "",
    numeroTransaccion: "",
    termId: ""
  }
}

/**
 * Construye todos los pagos de una factura con multipago.
 *
 * Los montos se aplican a la factura siguiendo el orden en que
 * fueron agregados.
 *
 * No redondea ni modifica la precisión original.
 */
export const construirDetallePago = (
  pagos: PagoSeleccionado[],
  factura: FacturaTempo,
  codSucursalFactura: string,
  totalFactura: number
): PagoGenerico[] => {
  const error = validarPagosSeleccionados(
    pagos,
    totalFactura
  )

  if (error) {
    throw new Error(error)
  }

  let pendiente = Number(totalFactura ?? 0)

  return pagos.map((pago, index) => {
    const montoRecibido = Number(
      pago.monto ?? 0
    )

    const montoAplicado = Math.min(
      montoRecibido,
      Math.max(0, pendiente)
    )

    pendiente = Math.max(
      0,
      pendiente - montoAplicado
    )

    return construirPagoFactura(
      pago,
      factura,
      codSucursalFactura,
      index,
      {
        montoAplicado
      }
    )
  })
}