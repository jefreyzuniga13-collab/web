import "@/Styles/Ecommerce/Payment/ManualCardPaymentSection.css";

export type ManualCardFormState = {
  tarjeta: string;
  ultDigito: string;
  tarjetahabiente: string;
  autorizacion: string;
  termId: string;
  afiliado: string;
  fechaVence: string;
};

interface Props {
  value: ManualCardFormState;
  onChange: React.Dispatch<React.SetStateAction<ManualCardFormState>>;
}

export default function ManualCardPaymentSection({
  value,
  onChange,
}: Props) {
  const updateField = (field: keyof ManualCardFormState, nextValue: string) => {
    onChange((prev) => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  const handleDigitsOnly = (
    field: keyof ManualCardFormState,
    nextValue: string,
    maxLength?: number
  ) => {
    const limpio = nextValue.replace(/\D/g, "");
    updateField(field, maxLength ? limpio.slice(0, maxLength) : limpio);
  };

  const handleFechaVence = (nextValue: string) => {
    const limpio = nextValue.replace(/\D/g, "").slice(0, 4);

    if (limpio.length >= 2) {
      const mes = Number(limpio.slice(0, 2));

      if (mes < 1 || mes > 12) {
        return;
      }
    }

    updateField("fechaVence", limpio);
  };

  return (
    <div className="checkout-manual-card">
      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="tarjetahabiente">
          Tarjetahabiente *
        </label>

        <input
          id="tarjetahabiente"
          type="text"
          className="checkout-input"
          value={value.tarjetahabiente}
          onChange={(e) => updateField("tarjetahabiente", e.target.value)}
          placeholder="Nombre del titular"
          autoComplete="off"
        />
      </div>

      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="tarjeta">
          Tarjeta *
        </label>

        <input
          id="tarjeta"
          type="text"
          className="checkout-input"
          value={value.tarjeta}
          onChange={(e) => updateField("tarjeta", e.target.value)}
          placeholder="Ej. VISA, Mastercard, BAC, Lafise"
          autoComplete="off"
        />
      </div>

      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="ultDigito">
          Últimos 4 dígitos *
        </label>

        <input
          id="ultDigito"
          type="text"
          inputMode="numeric"
          className="checkout-input"
          value={value.ultDigito}
          onChange={(e) => handleDigitsOnly("ultDigito", e.target.value, 4)}
          placeholder="Ej. 1234"
          autoComplete="off"
          maxLength={4}
        />
      </div>

      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="fechaVence">
          Fecha de vencimiento *
        </label>

        <input
          id="fechaVence"
          type="text"
          inputMode="numeric"
          className="checkout-input"
          value={value.fechaVence}
          onChange={(e) => handleFechaVence(e.target.value)}
          placeholder="MMYY"
          autoComplete="off"
          maxLength={4}
        />
      </div>
    </div>
  );
}