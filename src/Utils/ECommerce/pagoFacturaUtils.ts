import { tasaCambio as tasaCambioSistema } from "@/Constants/tasaCambio"
import {
  calcularMontosPago,
  clavePagoMoneda,
  esMonedaDolar,
  absorberResiduoCambio,
  cambioEnCordoba,
  convertirDesdeCordoba,
  limpiarDecimal,
  montoACordoba,
  montoACordobaCerrando,
  restarExacto,
  tasaCambioValida
} from "@/Utils/ECommerce/monedaUtils"

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
 * Suma los montos ingresados en multipago, convertidos a córdobas.
 *
 * La factura y la preventa siempre se validan en C$.
 */
export const totalPagado = (
  pagos: PagoSeleccionado[],
  tasaCambio = tasaCambioSistema
): number => {
  const tasa = tasaCambioValida(tasaCambio)

  return pagos.reduce((acumulado, pago) => {
    return (
      acumulado +
      montoACordoba(
        Number(pago.monto ?? 0),
        esMonedaDolar(pago.monedaPago),
        tasa
      )
    )
  }, 0)
}

/**
 * Suma lo aplicado a la factura en córdobas.
 * Si un pago en USD cubre el equivalente visible, cierra el pendiente exacto.
 */
export const totalAplicado = (
  pagos: PagoSeleccionado[],
  totalFactura: number,
  tasaCambio = tasaCambioSistema
): number => {
  const tasa = tasaCambioValida(tasaCambio)
  let restante = Math.max(0, Number(totalFactura ?? 0))
  let aplicado = 0

  for (const pago of pagos) {
    const parte = montoACordobaCerrando(
      Number(pago.monto ?? 0),
      esMonedaDolar(pago.monedaPago),
      tasa,
      restante
    )

    aplicado += parte
    restante = Math.max(0, restante - parte)
  }

  return aplicado
}

/**
 * Calcula cuánto falta por cubrir.
 *
 * Un resultado negativo se transforma en cero porque representa
 * un posible cambio en efectivo.
 */
export const totalPendiente = (
  pagos: PagoSeleccionado[],
  totalFactura: number,
  tasaCambio = tasaCambioSistema
): number => {
  const crudo = Math.max(
    0,
    Number(totalFactura ?? 0) - totalAplicado(pagos, totalFactura, tasaCambio)
  )

  return absorberResiduoCambio(crudo, tasaCambio)
}

/**
 * Vuelto en córdobas: solo el excedente de efectivo sobre el
 * equivalente visible, no el residuo de USD × tasa − total C$.
 */
export const vueltoEnCordoba = (
  pagos: PagoSeleccionado[],
  totalFactura: number,
  tasaCambio = tasaCambioSistema
): number => {
  const tasa = tasaCambioValida(tasaCambio)
  let restante = Math.max(0, Number(totalFactura ?? 0))
  let vuelto = 0

  for (const pago of pagos) {
    const monto = Number(pago.monto ?? 0)
    const esDolar = esMonedaDolar(pago.monedaPago)
    const pendienteAntes = restante
    const aplicadoCordoba = montoACordobaCerrando(
      monto,
      esDolar,
      tasa,
      pendienteAntes
    )

    if (pago.metodo === "cash") {
      vuelto += cambioEnCordoba(monto, aplicadoCordoba, esDolar, tasa)
    }

    restante = Math.max(0, pendienteAntes - aplicadoCordoba)
  }

  return vuelto
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
  totalFactura: number,
  tasaCambio = tasaCambioSistema
): string | null => {
  if (!pagos.length) {
    return "Debe agregar al menos una forma de pago."
  }

  const total = Number(totalFactura ?? 0)
  const pagado = totalPagado(pagos, tasaCambio)

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

  const clavesVistas = new Set<string>()

  for (const pago of pagos) {
    const clave = clavePagoMoneda(
      pago.metodo,
      pago.monedaPago?.id || pago.moneda?.moneda_Fija
    )

    if (clavesVistas.has(clave)) {
      return "No puede repetir la misma forma de pago en la misma moneda."
    }

    clavesVistas.add(clave)
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

  const pendiente = totalPendiente(
    pagos,
    total,
    tasaCambio
  )

  if (pendiente > PAYMENT_EPSILON) {
    return `Monto insuficiente. Pendiente C$${pendiente}.`
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

    const totalAnterior = totalPagado(
      pagos.slice(0, ultimoIndice),
      tasaCambio
    )

    if (totalAnterior >= total - PAYMENT_EPSILON) {
      return "El pago en efectivo no puede agregarse después de haber cubierto completamente la factura."
    }
  }

  return null
}

type ConstruirPagoFacturaOptions = {
  /**
   * Monto de este pago que realmente se aplica a la factura,
   * en la moneda del pago.
   */
  montoAplicado: number
  /**
   * MontoP exacto en córdobas. Si el USD cubre el equivalente visible,
   * es el pendiente de la factura y no el redondeo de la tasa.
   */
  montoPCordoba?: number
}

/**
 * Construye un PagoGenerico individual dentro de multipago.
 *
 * Efectivo:
 * - monto y montoA: dinero recibido, en C$ o USD según el pago;
 * - montoP: monto aplicado a la factura en córdobas;
 * - cambio: monto recibido menos monto aplicado;
 * - montoS: dinero recibido en dólares.
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

  const esDolar = esMonedaDolar(pago.monedaPago)

  const tasaFactura = Number(
    factura.tasaCambio ?? tasaCambioSistema
  )

  const tasa = tasaCambioValida(tasaFactura)

  const aplicadoCordoba =
    options.montoPCordoba ??
    (esDolar
      ? montoACordoba(montoAplicado, true, tasa)
      : montoAplicado)

  const cambio = esEfectivo
    ? cambioEnCordoba(montoRecibido, aplicadoCordoba, esDolar, tasa)
    : 0

  const monedaPagoId =
    safeStr(pago.monedaPago?.id) ||
    safeStr(factura.moneda) ||
    "1"

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
    ? safeStr(pago.monedaPago?.id) ||
      safeStr(moneda?.moneda_Fija) ||
      "1"
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

  const montos = calcularMontosPago({
    monto: montoRecibido,
    montoAplicado,
    esDolar,
    tasa,
    montoPCordoba: options.montoPCordoba
  })

  return {
    numPago: String(index + 1),
    concepto,
    codPago,
    tipoPago,
    aplicaCambio: esEfectivo,
    codPagoExterno,
    banco,

    monto: montos.monto,
    moneda: monedaPagoId,
    montoA: montos.montoA,
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

    montoP: montos.montoP,
    montoS: montos.montoS,

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
  const tasa = tasaCambioValida(factura.tasaCambio)
  const error = validarPagosSeleccionados(
    pagos,
    totalFactura,
    tasa
  )

  if (error) {
    throw new Error(error)
  }

  let pendiente = Number(totalFactura ?? 0)

  return pagos.map((pago, index) => {
    const montoRecibido = Number(
      pago.monto ?? 0
    )
    const esDolar = esMonedaDolar(pago.monedaPago)
    const pendienteAntes = Math.max(0, pendiente)
    const aplicadoCordoba = montoACordobaCerrando(
      montoRecibido,
      esDolar,
      tasa,
      pendienteAntes
    )

    pendiente = Math.max(
      0,
      limpiarDecimal(restarExacto(pendienteAntes, aplicadoCordoba))
    )

    const cierraPendiente =
      pendienteAntes > 0 && aplicadoCordoba >= pendienteAntes - PAYMENT_EPSILON

    const montoAplicado = esDolar
      ? cierraPendiente
        ? Math.min(
            montoRecibido,
            convertirDesdeCordoba(pendienteAntes, true, tasa)
          )
        : convertirDesdeCordoba(aplicadoCordoba, true, tasa)
      : aplicadoCordoba

    return construirPagoFactura(
      pago,
      factura,
      codSucursalFactura,
      index,
      {
        montoAplicado,
        montoPCordoba: aplicadoCordoba
      }
    )
  })
}