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

import { safeStr } from "@/Utils/ECommerce/formatters"

const round2 = (value: number): number => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

/**
 * Código usado para consultar opciones en GetDivisaPagosTipoAsync.
 *
 * Este valor sirve para pedir opciones a PCG, no necesariamente para guardar
 * el codPago final de PagoGenerico.
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
 * Concepto visible del pago.
 */
export const getPaymentConceptByMethod = (
  method: CheckoutPaymentMethod,
  divisaSelected?: ObtenerDivisaPagosTipoRes | null
): string => {
  if (method === "cash") return "Efectivo"

  if (method === "transfer") {
    return safeStr(divisaSelected?.nombre) || "Transferencia"
  }

  if (method === "manualCard") {
    return safeStr(divisaSelected?.nombre) || "Tarjeta"
  }

  return safeStr(divisaSelected?.nombre) || "Pasarela"
}

type BuildPagoGenericoParams = {
  method: CheckoutPaymentMethod
  total: number
  codSucursal: string
  tasaCambio: number

  /**
   * Método seleccionado desde CurrencySection.
   * Aplica principalmente para efectivo o para tener respaldo del método general.
   */
  selectedCurrency?: Currencyto | null

  /**
   * Opción seleccionada desde GetDivisaPagosTipoAsync.
   *
   * Para transferencia, tarjeta manual y pasarela, de aquí salen los valores
   * reales de codPago, tipoPago, codPagoExterno y banco.
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
   * Moneda de factura usada por PCG.
   */
  moneda?: string

  /**
   * Código de empresa si aplica.
   */
  codEmpresa?: string

  /**
   * Número de pago dentro del detalle.
   */
  numPago?: string

  /**
   * Índice del pago dentro del detalle.
   */
  indice?: string
}

/**
 * Construye un PagoGenerico para pago único.
 *
 * Regla principal:
 * efectivo usa selectedCurrency.codPago.
 * transferencia, tarjeta manual y pasarela usan divisaSelected.codigo.
 */
export const buildPagoGenerico = ({
  method,
  total,
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
  const concepto = getPaymentConceptByMethod(method, divisaSelected)

  const esEfectivo = method === "cash"
  const esTransferencia = method === "transfer"
  const esTarjetaManual = method === "manualCard"
  const esPasarela = method === "gatewayCard"

  /**
   * Código real del pago.
   *
   * Para efectivo viene de CurrencySection.
   * Para los demás métodos viene de GetDivisaPagosTipoAsync.
   */
  const codPago = esEfectivo
    ? safeStr(selectedCurrency?.codPago) || "1"
    : safeStr(divisaSelected?.codigo)

  /**
   * Código externo del pago.
   */
  const codPagoExterno = esEfectivo
    ? safeStr(selectedCurrency?.codExterno) || "1"
    : safeStr(divisaSelected?.codigoExterno)

  /**
   * Tipo de pago.
   */
  const tipoPago = esEfectivo
    ? ""
    : safeStr(divisaSelected?.tipo)

  /**
   * Banco asociado al pago.
   */
  const banco = esEfectivo
    ? safeStr(selectedCurrency?.codigo_Banco) || "00"
    : safeStr(divisaSelected?.banco)

  const referencia = esTransferencia
    ? safeStr(transfer)
    : esTarjetaManual
      ? safeStr(manualCardData?.autorizacion)
      : esPasarela
        ? safeStr(transactionIdentifier)
        : ""

  const autorizacion = esTarjetaManual
    ? safeStr(manualCardData?.autorizacion)
    : esPasarela
      ? safeStr(transactionIdentifier)
      : referencia

  const fechaOVence = esTransferencia
    ? new Date().toISOString().slice(0, 10)
    : esTarjetaManual
      ? safeStr(manualCardData?.fechaVence)
      : ""

  return {
    numPago,
    concepto,

    codPago,
    tipoPago,
    aplicaCambio: "N",
    codPagoExterno,
    banco,

    monto: total,
    moneda,
    montoA: total,
    cambio: 0,
    tasaCambio,

    Fecha_o_Vence: fechaOVence,
    referencia,
    numeroTransaccion: referencia,
    cuentaContable: "",
    Dll: "",
    Numero: "",

    ultDigito: esTarjetaManual
      ? safeStr(manualCardData?.ultDigito)
      : "",

    tarjeta: esTarjetaManual
      ? safeStr(manualCardData?.tarjeta)
      : "",

    tarjetahabiente: esTarjetaManual
      ? safeStr(manualCardData?.tarjetahabiente)
      : "",

    autorizacion,

    termId: esTarjetaManual
      ? safeStr(manualCardData?.termId)
      : "",

    afiliado: esTarjetaManual
      ? safeStr(manualCardData?.afiliado)
      : "",

    montoP: total,
    montoS: round2(total / tasaCambio),

    indice,
    codClienteCrd: "00000",
    facturaPinpad: "N",
    codEmpresa,
    codSucursal,
    montoFirma: "0",
    sobrante: "0",

    Codtransaccion: esPasarela
      ? safeStr(transactionIdentifier)
      : referencia,

    CuentaHabiente: esTarjetaManual
      ? safeStr(manualCardData?.tarjetahabiente)
      : "",

    CodStrCadsaccion: esPasarela
      ? safeStr(transactionIdentifier)
      : referencia
  }
}