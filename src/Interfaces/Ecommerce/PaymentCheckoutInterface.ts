import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo"
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface"

export type PaymentSource = "agent" | "customerLink"

export type CheckoutPaymentMethod =
  | "cash"
  | "transfer"
  | "manualCard"
  | "gatewayCard"

export type ManualCardFormState = {
  tarjeta: string
  ultDigito: string
  tarjetahabiente: string
  autorizacion: string
  termId: string
  afiliado: string
  fechaVence: string
}

export type CashPaymentState = {
  montoRecibido: number
  cambio: number
}

export type TransferPaymentState = {
  referencia: string
  monto: number
}

export type CheckoutPaymentState = {
  source: PaymentSource
  method: CheckoutPaymentMethod | null
  divisaSelected: ObtenerDivisaPagosTipoRes | null
  cash: CashPaymentState
  transfer: TransferPaymentState
  manualCard: ManualCardFormState
  savedCard: TarjetaModelInterface | null
}

export type CheckoutPaymentValidation = {
  isValid: boolean
  message?: string
}

export const CHECKOUT_PAYMENT_METHOD_LABEL: Record<
  CheckoutPaymentMethod,
  string
> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  manualCard: "Tarjeta manual",
  gatewayCard: "Tarjeta con pasarela"
}

export const AGENT_PAYMENT_METHODS: CheckoutPaymentMethod[] = [
  "cash",
  "transfer",
  "manualCard"
]

export const CUSTOMER_LINK_PAYMENT_METHODS: CheckoutPaymentMethod[] = [
  "cash",
  "transfer",
  "manualCard",
  "gatewayCard"
]

export const initialManualCardFormState: ManualCardFormState = {
  tarjeta: "",
  ultDigito: "",
  tarjetahabiente: "",
  autorizacion: "",
  termId: "",
  afiliado: "",
  fechaVence: ""
}

export const initialCheckoutPaymentState: CheckoutPaymentState = {
  source: "agent",
  method: null,
  divisaSelected: null,
  cash: {
    montoRecibido: 0,
    cambio: 0
  },
  transfer: {
    referencia: "",
    monto: 0
  },
  manualCard: initialManualCardFormState,
  savedCard: null
}