import type {
  Dispatch,
  SetStateAction
} from "react"

import CashPaymentSection from "@/Components/ECommerce/Payment/CashPaymentSection"
import TransferPaymentSection from "@/Components/ECommerce/Payment/TransferPaymentSection"
import ManualCardPaymentSection from "@/Components/ECommerce/Payment/ManualCardPaymentSection"
import CardPaymentSection from "@/Components/ECommerce/Payment/CardPaymentSection"

import type {
  CheckoutPaymentMethod,
  ManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import type {
  TarjetaModelInterface
} from "@/Interfaces/Ecommerce/TarjetaInterface"

interface Props {
  /**
   * Método de pago seleccionado.
   *
   * Si es null, no se muestra ningún formulario.
   */
  method: CheckoutPaymentMethod | null

  /**
   * Total a mostrar en la moneda del pago (C$ o USD).
   */
  totalPagar: number

  /**
   * Símbolo de la moneda del pago.
   */
  simboloMoneda?: string

  /**
   * Monto recibido en efectivo.
   */
  cashAmount: number

  /**
   * Actualiza el monto recibido en efectivo.
   */
  setCashAmount: (value: number) => void

  /**
   * Referencia de transferencia.
   */
  transfer: string

  /**
   * Actualiza la referencia de transferencia.
   */
  setTransfer: (value: string) => void

  /**
   * Indica si la referencia de transferencia es válida.
   */
  transferRefOk: boolean

  /**
   * Estado del formulario de tarjeta manual.
   */
  manualCardData: ManualCardFormState

  /**
   * Actualiza los datos de tarjeta manual.
   */
  setManualCardData: Dispatch<SetStateAction<ManualCardFormState>>

  /**
   * Id del usuario ecommerce.
   * Solo se usa para tarjetas guardadas en pasarela.
   */
  ecommerceUserId?: number

  /**
   * Selecciona una tarjeta guardada.
   * Solo aplica para gatewayCard.
   */
  onSelectCard?: (card: TarjetaModelInterface | null) => void
}

export default function PaymentFormRenderer({
  method,
  totalPagar,
  simboloMoneda = "C$",
  cashAmount,
  setCashAmount,
  transfer,
  setTransfer,
  transferRefOk,
  manualCardData,
  setManualCardData,
  ecommerceUserId = 0,
  onSelectCard
}: Props) {
  /**
   * Sin método seleccionado no se muestra ningún formulario.
   */
  if (!method) {
    return null
  }

  if (method === "cash") {
    return (
      <CashPaymentSection
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
      />
    )
  }

  if (method === "transfer") {
    return (
      <TransferPaymentSection
        totalPagar={totalPagar}
        simboloMoneda={simboloMoneda}
        transfer={transfer}
        setTransfer={setTransfer}
        transferRefOk={transferRefOk}
      />
    )
  }

  if (method === "manualCard") {
    return (
      <ManualCardPaymentSection
        value={manualCardData}
        onChange={setManualCardData}
        totalPagar={totalPagar}
        simboloMoneda={simboloMoneda}
      />
    )
  }

  if (method === "gatewayCard") {
    return (
      <CardPaymentSection
        ecommerceUserId={ecommerceUserId}
        onSelectCard={onSelectCard}
      />
    )
  }

  return null
}
