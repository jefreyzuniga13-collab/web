import type {
  ObtenerDivisaPagosTipoRes,
  PagoGenerico
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  CheckoutPaymentMethod,
  ManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import type {
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import {
  safeStr
} from "@/Utils/ECommerce/formatters"

/**
 * Código utilizado para consultar opciones mediante
 * GetDivisaPagosTipoAsync.
 *
 * No necesariamente corresponde al codPago final guardado en
 * PagoGenerico.
 */
export const getPaymentCodeByMethod = (
  method: CheckoutPaymentMethod
): string => {
  if (method === "cash") return "1"
  if (method === "transfer") return "STR"
  if (method === "manualCard") return "STA"

  return "PAS"
}

/**
 * Retorna el concepto visible del pago.
 */
export const getPaymentConceptByMethod = (
  method: CheckoutPaymentMethod,
  divisaSelected?: ObtenerDivisaPagosTipoRes | null
): string => {
  if (method === "cash") {
    return "Efectivo"
  }

  if (method === "transfer") {
    return safeStr(
      divisaSelected?.nombre
    ) || "Transferencia"
  }

  if (method === "manualCard") {
    return safeStr(
      divisaSelected?.nombre
    ) || "Tarjeta"
  }

  return safeStr(
    divisaSelected?.nombre
  ) || "Pasarela"
}

type BuildPagoGenericoParams = {
  method: CheckoutPaymentMethod

  /**
   * Total real que debe aplicarse a la factura.
   */
  total: number

  /**
   * Dinero entregado por el cliente cuando paga en efectivo.
   *
   * No debe utilizarse para transferencia, tarjeta manual o pasarela.
   */
  cashAmount?: number

  codSucursal: string
  tasaCambio: number

  /**
   * Método seleccionado desde CurrencySection.
   *
   * Aplica principalmente para efectivo.
   */
  selectedCurrency?: Currencyto | null

  /**
   * Banco o tipo de pago seleccionado desde
   * GetDivisaPagosTipoAsync.
   */
  divisaSelected?: ObtenerDivisaPagosTipoRes | null

  /**
   * Referencia de transferencia.
   */
  transfer?: string

  /**
   * Datos de tarjeta manual.
   */
  manualCardData?: ManualCardFormState | null

  /**
   * Identificador de transacción de pasarela.
   */
  transactionIdentifier?: string

  /**
   * Moneda de factura utilizada por PCG.
   */
  moneda?: string

  /**
   * Código de empresa.
   */
  codEmpresa?: string

  /**
   * Número del pago dentro del detalle.
   */
  numPago?: string

  /**
   * Índice del pago.
   */
  indice?: string
}


const trunc4 = (value: number): number =>
  Math.trunc(value * 10000) / 10000


/**
 * Construye un PagoGenerico para pago único.
 *
 * Efectivo:
 * - monto: dinero recibido;
 * - montoA: dinero recibido;
 * - montoP: total de factura;
 * - cambio: dinero recibido menos total;
 * - montoS: dinero recibido convertido por tasa de cambio.
 *
 * Otros métodos:
 * - monto, montoA y montoP corresponden al total;
 * - cambio es cero.
 *
 * No redondea valores antes de enviarlos a PCG.
 */
export const buildPagoGenerico = ({
  method,
  total,
  cashAmount = 0,
  codSucursal,
  tasaCambio,
  selectedCurrency = null,
  divisaSelected = null,
  transfer = "",
  manualCardData = null,
  transactionIdentifier = "",
  moneda = "1",
  codEmpresa = "",
  numPago = "1",
  indice = "0"
}: BuildPagoGenericoParams): PagoGenerico => {
  const esEfectivo = method === "cash"
  const esTransferencia = method === "transfer"
  const esTarjetaManual = method === "manualCard"
  const esPasarela = method === "gatewayCard"

  const totalFactura = Number(total ?? 0)

  const efectivoRecibido = Number(
    cashAmount ?? 0
  )

  const montoRecibido = esEfectivo
    ? efectivoRecibido
    : totalFactura

  const montoAplicado = totalFactura

const cambio = esEfectivo
  ? trunc4(
      Math.max(
        0,
        montoRecibido - montoAplicado
      )
    )
  : 0

  const tasa = Number.isFinite(
    Number(tasaCambio)
  ) && Number(tasaCambio) > 0
    ? Number(tasaCambio)
    : 1

  const concepto = getPaymentConceptByMethod(
    method,
    divisaSelected
  )

  /**
   * Para efectivo viene de CurrencySection.
   *
   * Para transferencia, tarjeta manual y pasarela viene de
   * GetDivisaPagosTipoAsync.
   */
  const codPago = esEfectivo
    ? safeStr(selectedCurrency?.codPago) || "1"
    : safeStr(divisaSelected?.codigo)

  const codPagoExterno = esEfectivo
    ? safeStr(selectedCurrency?.codExterno) || "1"
    : safeStr(divisaSelected?.codigoExterno)

  const tipoPago = esEfectivo
    ?  selectedCurrency?.moneda_Fija ?? "1"
    : safeStr(divisaSelected?.tipo)

  const banco = esEfectivo
    ? safeStr(selectedCurrency?.codigo_Banco) || "00"
    : safeStr(divisaSelected?.banco)

  const referencia = esTransferencia
    ? safeStr(transfer)
    : esTarjetaManual
      ? safeStr(
          manualCardData?.autorizacion
        )
      : esPasarela
        ? safeStr(
            transactionIdentifier
          )
        : ""

  const fechaOVence = esTransferencia
    ? new Date().toISOString().slice(0, 10)
    : esTarjetaManual
      ? safeStr(
          manualCardData?.fechaVence
        )
      : ""

  return {
    numPago,
    concepto,

    codPago,
    tipoPago,

    /**
     * Únicamente efectivo genera cambio.
     */
    aplicaCambio: esEfectivo,

    codPagoExterno,
    banco,

    /**
     * Dinero recibido.
     *
     * En otros métodos es igual al total.
     */
    monto: montoRecibido,

    moneda,

    /**
     * Dinero recibido.
     */
    montoA: montoRecibido,

    /**
     * Cambio calculado solamente para efectivo.
     */
    cambio,

    tasaCambio: tasa,

    Fecha_o_Vence: fechaOVence,
    referencia,

    ultDigito: esTarjetaManual
      ? safeStr(
          manualCardData?.ultDigito
        )
      : "",

    tarjeta: esTarjetaManual
      ? safeStr(
          manualCardData?.tarjeta
        )
      : "",

    tarjetahabiente: esTarjetaManual
      ? safeStr(
          manualCardData?.tarjetahabiente
        )
      : "",

    /**
     * Total aplicado realmente a la factura.
     */
    montoP: montoAplicado,

    /**
     * PCG espera el monto recibido convertido.
     *
     * No redondear.
     */
    montoS: trunc4(
      montoRecibido / tasa
    ),

    indice,
    codClienteCrd: "00000",
    facturaPinpad: "N",
    codEmpresa,
    codSucursal,
    montoFirma: "0",
    sobrante: "0",

    CuentaHabiente: esTarjetaManual
      ? safeStr(
          manualCardData?.tarjetahabiente
        )
      : "",

    autorizacion: "",
    termId: "",
    afiliado: "",
    cuentaContable: "",
    Dll: "",
    Numero: "",
    numeroTransaccion: "",
    Codtransaccion: "",
    CodStrCadsaccion: ""
  }
}