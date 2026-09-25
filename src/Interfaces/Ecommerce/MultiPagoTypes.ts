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
import type { MonedaCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"

/**
 * Representa una forma de pago agregada dentro del flujo de multipago.
 */
export type PagoSeleccionado = {
  id: string
  metodo: CheckoutPaymentMethod
  moneda: Currencyto | null
  divisa: ObtenerDivisaPagosTipoRes | null
  monto: number
  referencia: string
  tarjetaManual?: ManualCardFormState
  monedaPago?: MonedaCatalogo | null
}

/**
 * Estado inicial para agregar un pago dentro del multipago.
 */
export const pagoSeleccionadoVacio: PagoSeleccionado = {
  id: "",
  metodo: "cash",
  moneda: null,
  divisa: null,
  monto: 0,
  referencia: "",
  tarjetaManual: undefined,
  monedaPago: null
}