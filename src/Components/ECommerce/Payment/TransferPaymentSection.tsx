import Input from "@/Components/Common/Input"
import { Label } from "@/Components/Common/Label"
import { formatearDecimales } from "@/Utils/calcularIVA"
import "@/Styles/Ecommerce/Payment/CashPaymentSection.css"
import "@/Styles/Ecommerce/Payment/TransferPaymentSection.css"

interface Props {
  /**
   * Monto exacto a cobrar, en la moneda del pago (C$ o USD).
   */
  totalPagar: number
  /**
   * Símbolo de la moneda seleccionada (C$ o $).
   */
  simboloMoneda?: string
  transfer: string
  setTransfer: (transfer: string) => void
  transferRefOk: boolean
}

export default function TransferPaymentSection({
  totalPagar,
  simboloMoneda = "NIO",
  transfer,
  setTransfer,
  transferRefOk,
}: Props) {
  const showRefError = transfer.trim().length > 0 && !transferRefOk

  return (
    <div className="checkout-cash">
      <div className="checkout-field checkout-field--half">
        <Label htmlFor="transferAmount">Monto ({simboloMoneda})</Label>
        <Input
          id="transferAmount"
          value={`${simboloMoneda} ${formatearDecimales(totalPagar)}`}
          readOnly
        />
        <small className="checkout-amount-fixed-help">
          En pago único debe pagar el total; el monto no se puede cambiar.
        </small>
      </div>

      <div className="checkout-field checkout-field--half">
        <Label htmlFor="transferRef">Referencia *</Label>
        <Input
          id="transferRef"
          value={transfer}
          maxLength={50}
          onChange={(e) => setTransfer(e.target.value)}
        />

        {showRefError && (
          <small className="checkout-error">
            Referencia inválida
          </small>
        )}
      </div>
    </div>
  )
}
