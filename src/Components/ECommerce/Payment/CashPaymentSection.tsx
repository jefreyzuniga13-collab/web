import { useEffect, useState } from "react";
import Input from "@/Components/Common/Input";
import { Label } from "@/Components/Common/Label";
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

  // const handleChange = (value: string) => {
  //   const limpio = value.replace(/\D/g, "");

  //   if (limpio === "") {
  //     setCashAmountText("");
  //     setCashAmount(0);
  //     return;
  //   }

  //   const sinCerosIniciales = limpio.replace(/^0+/, "") || "0";

  //   setCashAmountText(sinCerosIniciales);
  //   setCashAmount(Number(sinCerosIniciales));
  // };

  return (
    <div className="checkout-cash checkout-cash--amount-right">
      <div className="checkout-field checkout-field--half">
        <Label htmlFor="cashAmount">Monto con el que pagas</Label>

        <Input
          id="cashAmount"
          type="text"
          inputMode="numeric"
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