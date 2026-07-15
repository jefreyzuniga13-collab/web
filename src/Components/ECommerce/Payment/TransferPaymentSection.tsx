import  '@/Styles/Ecommerce/Payment/TransferPaymentSection.css'
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
  return (
    <div className="checkout-cash">
      <div className="checkout-field checkout-field--full">
        <label className="checkout-label">Monto</label>
        <input className="checkout-input" value={totalPagar} readOnly />
      </div>

      <div className="checkout-field checkout-field--full">
        <label className="checkout-label">Referencia *</label>
        <input
          className="checkout-input"
          value={transfer}
          // maxLength={4}
          onChange={(e) => setTransfer(e.target.value)}
        />

        {!transferRefOk && (
          <small className="checkout-error">
            Referencia inválida
          </small>
        )}
      </div>
    </div>
  );
}