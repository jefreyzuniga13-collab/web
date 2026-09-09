import Input from "@/Components/Common/Input"
import { Label } from "@/Components/Common/Label"
import { formatearDecimales } from "@/Utils/calcularIVA"
import "@/Styles/Ecommerce/Payment/TransferPaymentSection.css"
interface Props {
  totalPagar: number;
  transfer: string;
  setTransfer: (transfer: string) => void;
  transferRefOk: boolean;
}

export default function TransferPaymentSection({
  totalPagar,
  transfer,
  setTransfer,
  transferRefOk,
}: Props) {
  const showRefError = transfer.trim().length > 0 && !transferRefOk

  return (
    <div className="checkout-cash">
      <div className="checkout-field checkout-field--full">
        <Label htmlFor="transferAmount">Monto</Label>
        <Input
          id="transferAmount"
          value={formatearDecimales(totalPagar)}
          readOnly
        />
      </div>

      <div className="checkout-field checkout-field--full">
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
  );
}