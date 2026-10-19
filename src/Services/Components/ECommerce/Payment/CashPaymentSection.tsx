import { useEffect, useState } from "react";
import Input from "@/Services/Components/Common/Input";
import { Label } from "@/Services/Components/Common/Label";
import { limpiarMontoTexto } from "@/Utils/ECommerce/utils";
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
    const limpio = limpiarMontoTexto(value);

    if (limpio === "" || limpio === ".") {
      setCashAmountText(limpio);
      setCashAmount(0);
      return;
    }

    setCashAmountText(limpio);
    setCashAmount(parseFloat(limpio) || 0);
  };

  return (
    <div className="checkout-cash checkout-cash--amount-right">
      <div className="checkout-field checkout-field--half">
        <Label htmlFor="cashAmount">Monto con el que pagas</Label>

        <Input
          id="cashAmount"
          type="text"
          inputMode="decimal"
          value={cashAmountText}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Ej. 300"
        />

        <small className="checkout-cash-help">
          Puede superar el total; el excedente será el vuelto.
        </small>
      </div>
    </div>
  );
}
