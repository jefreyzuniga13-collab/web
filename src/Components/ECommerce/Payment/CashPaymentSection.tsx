import { toNumberNoLeadingZeros } from "@/Utils/ECommerce/formatters";
import  '@/Styles/Ecommerce/Payment/CashPaymentSection.css'
interface Props {
  cashAmount: number;
  setCashAmount: (cashAmount: number) => void;
}

export default function CashPaymentSection({ cashAmount, setCashAmount }: Props) {
  return (
    <div className="checkout-cash">
      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="cashAmount">
          Monto con el que pagas
        </label>
        <input
          id="cashAmount"
          type="number"
          inputMode="numeric"
          min={1}
          className="checkout-input"
          value={cashAmount}
          onChange={(e) => setCashAmount(toNumberNoLeadingZeros(e.target.value))}
        />
      </div>
    </div>
  );
}