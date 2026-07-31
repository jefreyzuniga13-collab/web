import type {
  ObtenerDivisaPagosTipoRes
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import type {
  CheckoutPaymentMethod,
  ManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import type {
  MonedaInterface
} from "@/Interfaces/Ecommerce/Moneda"

/**
 * Métodos permitidos dentro del multipago.
 *
 * PowerTranz/gatewayCard no se permite dentro del multipago.
 * La pasarela únicamente debe procesarse como pago único.
 */
export type MetodoMultipago = Exclude<
  CheckoutPaymentMethod,
  "gatewayCard"
>

/**
 * Representa una forma de pago agregada dentro del flujo de multipago.
 */
export type PagoSeleccionado = {
  /**
   * Identificador único de la fila.
   */
  id: string

  /**
   * Método normalizado utilizado por el frontend.
   *
   * Ejemplos:
   * - cash
   * - transfer
   * - manualCard
   */
  metodo: MetodoMultipago

  /**
   * Forma de pago obtenida desde el catálogo de PCG.
   *
   * Antes este campo se llamaba `moneda`, pero realmente
   * representaba una forma de pago.
   */
  formaPago: Currencyto | null

  /**
   * Moneda real seleccionada para este pago.
   *
   * Ejemplos:
   * - Córdoba
   * - Dólar
   */
  moneda: MonedaInterface | null

  /**
   * Banco, tipo de transferencia o tipo de tarjeta.
   *
   * No aplica para efectivo.
   */
  divisa: ObtenerDivisaPagosTipoRes | null

  /**
   * Monto ingresado en la moneda seleccionada.
   *
   * Ejemplos:
   * - C$100
   * - US$200
   */
  monto: number

  /**
   * Tasa aplicada a este pago.
   *
   * Para la moneda base debe utilizarse 1.
   */
  tasaCambio: number

  /**
   * Monto convertido a la moneda base de la factura.
   *
   * Este campo debe utilizarse para sumar y validar
   * el total del multipago.
   */
  montoBase: number

  /**
   * Referencia bancaria o de transferencia.
   */
  referencia: string

  /**
   * Datos de tarjeta manual.
   *
   * Solo aplica cuando metodo === "manualCard".
   */
  tarjetaManual?: ManualCardFormState
}

/**
 * Estado inicial para agregar un pago dentro del multipago.
 */
export const pagoSeleccionadoVacio: PagoSeleccionado = {
  id: "",
  metodo: "cash",
  formaPago: null,
  moneda: null,
  divisa: null,
  monto: 0,
  tasaCambio: 1,
  montoBase: 0,
  referencia: "",
  tarjetaManual: undefined
}

/**
 * Genera la clave utilizada para impedir que se repita
 * la misma combinación de método y moneda.
 *
 * Ejemplos:
 * - cash:1
 * - cash:2
 * - transfer:1
 */
export const obtenerClaveMetodoMoneda = (
  metodo: MetodoMultipago,
  monedaId?: string | null
): string => {
  return `${metodo}:${String(monedaId ?? "").trim()}`
}

/**
 * Determina si una combinación de método y moneda
 * ya fue agregada al multipago.
 *
 * Permite:
 * - Efectivo + Córdoba
 * - Transferencia + Córdoba
 *
 * No permite repetir:
 * - Efectivo + Córdoba
 * - Efectivo + Córdoba
 */
export const existeMetodoMonedaDuplicado = ({
  pagos,
  metodo,
  monedaId,
  excluirPagoId
}: {
  pagos: PagoSeleccionado[]
  metodo: MetodoMultipago
  monedaId?: string | null
  excluirPagoId?: string
}): boolean => {
  const monedaNormalizada = String(monedaId ?? "").trim()

  if (!monedaNormalizada) {
    return false
  }

  const claveBuscada = obtenerClaveMetodoMoneda(
    metodo,
    monedaNormalizada
  )

  return pagos.some((pago) => {
    if (excluirPagoId && pago.id === excluirPagoId) {
      return false
    }

    const claveActual = obtenerClaveMetodoMoneda(
      pago.metodo,
      pago.moneda?.id
    )

    return claveActual === claveBuscada
  })
}