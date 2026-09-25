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
import type { MonedaCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"
import {
  calcularMontosPago,
  cambioEnCordoba,
  convertirDesdeCordoba,
  cubreMontoPago,
  esMonedaDolar,
  montoACordoba,
  tasaCambioValida
} from "@/Utils/ECommerce/monedaUtils"

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
   * Moneda PCG del pago (ComboMonedas).
   */
  moneda?: string

  /**
   * Catálogo de moneda seleccionado en checkout.
   */
  monedaPago?: MonedaCatalogo | null

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

/**
 * Construye un PagoGenerico para pago único.
 *
 * Efectivo:
 * - monto y montoA: dinero recibido, en C$ o USD según el pago;
 * - montoP: total aplicado en córdobas;
 * - cambio: dinero recibido menos total;
 * - montoS: dinero recibido en dólares.
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
  monedaPago = null,
  codEmpresa = "",
  numPago = "1",
  indice = "0"
}: BuildPagoGenericoParams): PagoGenerico => {
  const esEfectivo = method === "cash"
  const esTransferencia = method === "transfer"
  const esTarjetaManual = method === "manualCard"
  const esPasarela = method === "gatewayCard"

  const totalFactura = Number(total ?? 0)
  const esDolar = esMonedaDolar(monedaPago)
  const tasa = tasaCambioValida(tasaCambio)
  const totalEnMonedaPago = convertirDesdeCordoba(
    totalFactura,
    esDolar,
    tasa
  )

  const efectivoRecibido = Number(
    cashAmount ?? 0
  )

  const montoRecibido = esEfectivo
    ? efectivoRecibido
    : totalEnMonedaPago

  const montoAplicado = esEfectivo
    ? Math.min(montoRecibido, totalEnMonedaPago)
    : totalEnMonedaPago

  const cubreTotal = cubreMontoPago(montoRecibido, totalEnMonedaPago)
  const aplicadoCordoba = cubreTotal
    ? totalFactura
    : Math.min(montoACordoba(montoRecibido, esDolar, tasa), totalFactura)

  const cambio = esEfectivo
    ? cambioEnCordoba(montoRecibido, aplicadoCordoba, esDolar, tasa)
    : 0

  const montos = calcularMontosPago({
    monto: montoRecibido,
    montoAplicado,
    esDolar,
    tasa,
    montoPCordoba: cubreTotal ? totalFactura : undefined
  })

  const monedaPagoId =
    safeStr(monedaPago?.id) || safeStr(moneda) || "1"

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
    ? safeStr(monedaPago?.id) ||
      selectedCurrency?.moneda_Fija ||
      "1"
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
    monto: montos.monto,

    moneda: monedaPagoId,

    /**
     * Dinero recibido.
     */
    montoA: montos.montoA,

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
    montoP: montos.montoP,
    montoS: montos.montoS,

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