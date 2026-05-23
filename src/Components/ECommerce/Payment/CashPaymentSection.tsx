import { useEffect, useState } from "react";
import "@/Styles/Ecommerce/Payment/CashPaymentSection.css";

interface Props {
  cashAmount: number;
  setCashAmount: (cashAmount: number) => void;
}

export default function CashPaymentSection({
  cashAmount,
  setCashAmount,
}: Props) {
  const [cashAmountText, setCashAmountText] = useState(
    cashAmount > 0 ? String(cashAmount) : ""
  );

  useEffect(() => {
    setCashAmountText(cashAmount > 0 ? String(cashAmount) : "");
  }, [cashAmount]);

  const handleChange = (value: string) => {
    const limpio = value.replace(/\D/g, "");

    if (limpio === "") {
      setCashAmountText("");
      setCashAmount(0);
      return;
    }

    const sinCerosIniciales = limpio.replace(/^0+/, "") || "0";

    setCashAmountText(sinCerosIniciales);
    setCashAmount(Number(sinCerosIniciales));
  };

  return (
    <div className="checkout-cash">
      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="cashAmount">
          Monto con el que pagas
        </label>

        <input
          id="cashAmount"
          type="text"
          inputMode="numeric"
          className="checkout-input"
          value={cashAmountText}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ej. 300"
        />
      </div>
    </div>
  );
}