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
    // Reemplaza todo lo que no sea número o punto decimal
    let limpio = value.replace(/[^0-9.]/g, "");

    // Evita más de un punto decimal
    const puntos = limpio.split(".");
    if (puntos.length > 2) {
      limpio = `${puntos[0]}.${puntos.slice(1).join("")}`;
    }

    if (limpio === "" || limpio === ".") {
      setCashAmountText(limpio);
      setCashAmount(0);
      return;
    }

    // Evita ceros iniciales inválidos (ej. "05" pasa a "5", pero "0.5" se mantiene)
    if (limpio.startsWith("0") && limpio[1] !== "." && limpio.length > 1) {
      limpio = limpio.replace(/^0+/, "");
    }

    setCashAmountText(limpio);
    setCashAmount(parseFloat(limpio) || 0);
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