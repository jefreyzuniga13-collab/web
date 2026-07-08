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
 * Importante:
 * Esto NO siempre es el codPago final de PagoGenerico.
 *
 * Ejemplo:
 * manualCard usa "STA" para pedir opciones,
 * pero el codPago final puede ser 3, 6, etc.,
 * según lo que venga en divisaSelected.codigo.
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
  method: CheckoutPaymentMethod
): string => {
  if (method === "cash") return "Efectivo"
  if (method === "transfer") return "Transferencia"
  if (method === "manualCard") return "Tarjeta"

  return "Pasarela"
}

type BuildPagoGenericoParams = {
  method: CheckoutPaymentMethod
  total: number
  codSucursal: string
  tasaCambio: number

  /**
   * Método seleccionado desde CurrencySection.
   * Aplica principalmente para CheckoutPage.
   */
  selectedCurrency?: Currencyto | null

  /**
   * Opción seleccionada desde GetDivisaPagosTipoAsync.
   * Para transferencia/tarjeta/pasarela, de aquí salen:
   * codPago, tipoPago, codPagoExterno y banco.
   */
  divisaSelected?: ObtenerDivisaPagosTipoRes | null

  transfer?: string
  manualCardData?: ManualCardFormState | null
  transactionIdentifier?: string
  moneda?: string
  codEmpresa?: string
}

/**
 * Construye el objeto PagoGenerico completo.
 *
 * Regla importante:
 * - Efectivo puede usar selectedCurrency.codPago o "1".
 * - Transferencia / tarjeta manual / pasarela deben usar divisaSelected.codigo
 *   cuando exista, porque ese es el código real devuelto por PCG.
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
  codEmpresa = ""
}: BuildPagoGenericoParams): PagoGenerico => {
  const concepto = getPaymentConceptByMethod(method)
  const totalRedondeado = round2(total)

  /**
   * Código real del pago.
   *
   * Para efectivo:
   * normalmente viene del método general seleccionado en CurrencySection,
   * o se usa "1" como respaldo.
   *
   * Para transferencia/tarjeta:
   * debe venir de divisaSelected.codigo.
   */
  const codPago =
    method === "cash"
      ? safeStr(selectedCurrency?.codPago) || "1"
      : safeStr(divisaSelected?.codigo)

  /**
   * Código externo real.
   */
  const codPagoExterno =
    method === "cash"
      ? safeStr(selectedCurrency?.codExterno)
      : safeStr(divisaSelected?.codigoExterno)

  /**
   * Tipo de pago real.
   */
  const tipoPago =
    method === "cash"
      ? codPago
      : safeStr(divisaSelected?.tipo)

  /**
   * Banco real.
   */
  const banco =
    method === "cash"
      ? safeStr(selectedCurrency?.codigo_Banco)
      : safeStr(divisaSelected?.banco)

  const referencia =
    method === "transfer"
      ? safeStr(transfer)
      : method === "manualCard"
        ? safeStr(manualCardData?.autorizacion)
        : method === "gatewayCard"
          ? safeStr(transactionIdentifier)
          : ""

  const autorizacion =
    method === "manualCard"
      ? safeStr(manualCardData?.autorizacion)
      : method === "gatewayCard"
        ? safeStr(transactionIdentifier)
        : referencia

  return {
    numPago: "1",
    concepto,

    codPago,
    tipoPago,
    aplicaCambio: "N",
    codPagoExterno,
    banco,

    monto: totalRedondeado,
    moneda,
    montoA: totalRedondeado,
    cambio: 0,
    tasaCambio,

    Fecha_o_Vence:
      method === "manualCard"
        ? safeStr(manualCardData?.fechaVence)
        : "",

    referencia,
    numeroTransaccion: referencia,
    cuentaContable: "",
    Dll: "",
    Numero: "",

    ultDigito:
      method === "manualCard"
        ? safeStr(manualCardData?.ultDigito)
        : "",

    tarjeta:
      method === "manualCard"
        ? safeStr(manualCardData?.tarjeta)
        : "",

    tarjetahabiente:
      method === "manualCard"
        ? safeStr(manualCardData?.tarjetahabiente)
        : "",

    autorizacion,

    termId:
      method === "manualCard"
        ? safeStr(manualCardData?.termId)
        : "",

    afiliado:
      method === "manualCard"
        ? safeStr(manualCardData?.afiliado)
        : "",

    montoP: totalRedondeado,
    montoS: 0,

    indice: "0",
    codClienteCrd: "00000",
    facturaPinpad: "N",
    codEmpresa,
    codSucursal,
    montoFirma: "0",
    sobrante: "0",

    Codtransaccion:
      method === "gatewayCard" ? safeStr(transactionIdentifier) : referencia,

    CuentaHabiente:
      method === "manualCard"
        ? safeStr(manualCardData?.tarjetahabiente)
        : "",

    CodStrCadsaccion:
      method === "gatewayCard" ? safeStr(transactionIdentifier) : referencia
  }
}