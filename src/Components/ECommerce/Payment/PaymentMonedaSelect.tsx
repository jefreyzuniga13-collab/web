import type { MonedaCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"
import { esMonedaDolar } from "@/Utils/ECommerce/monedaUtils"

type Props = {
  monedas: MonedaCatalogo[]
  monedaSeleccionada: MonedaCatalogo | null
  onChange: (moneda: MonedaCatalogo) => void
  bloquearDolar?: boolean
  disabled?: boolean
  loading?: boolean
}

export default function PaymentMonedaSelect({
  monedas,
  monedaSeleccionada,
  onChange,
  bloquearDolar = false,
  disabled = false,
  loading = false
}: Props) {
  if (!monedas.length && !loading) {
    return null
  }

  return (
    <div className="checkout-field checkout-field--full">
      <span className="checkout-title-label">Tipo de moneda</span>

      <div className="checkout-payment-mode">
        {monedas.map((moneda) => {
          const esDolar = esMonedaDolar(moneda)
          const bloqueada = bloquearDolar && esDolar
          const activa = monedaSeleccionada?.id === moneda.id

          return (
            <label
              key={moneda.id}
              className={
                activa
                  ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                  : "checkout-payment-mode__option"
              }
            >
              <input
                type="radio"
                name="currencyType"
                className="checkout-radio"
                checked={activa}
                disabled={disabled || loading || bloqueada}
                onChange={() => onChange(moneda)}
              />

              <span className="checkout-payment-mode__content">
                <strong>
                  {moneda.moneda || moneda.abreviatura || moneda.id}
                </strong>
                <small>
                  {bloqueada
                    ? "La pasarela solo acepta córdobas."
                    : moneda.simbolo
                      ? `Pagos en ${moneda.simbolo}`
                      : "Selecciona la moneda del pago."}
                </small>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
