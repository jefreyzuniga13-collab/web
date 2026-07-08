import type { ManualCardFormState } from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"
import "@/Styles/Ecommerce/Payment/ManualCardPaymentSection.css"

interface Props {
  /**
   * Estado actual del formulario de tarjeta manual.
   * Este estado viene desde el componente padre o desde un hook reutilizable.
   */
  value: ManualCardFormState

  /**
   * Actualiza el estado del formulario de tarjeta manual.
   * Se usa Dispatch para permitir actualizar por campo sin perder el resto del objeto.
   */
  onChange: React.Dispatch<React.SetStateAction<ManualCardFormState>>

  /**
   * Permite bloquear el formulario mientras se procesa el pago
   * o mientras se cargan datos relacionados.
   */
  disabled?: boolean
}

export default function ManualCardPaymentSection({
  value,
  onChange,
  disabled = false
}: Props) {
  /**
   * Actualiza un campo específico del formulario.
   * Mantiene los demás valores existentes.
   */
  const updateField = (field: keyof ManualCardFormState, nextValue: string) => {
    if (disabled) return

    onChange((prev) => ({
      ...prev,
      [field]: nextValue
    }))
  }

  /**
   * Limpia cualquier carácter que no sea número.
   * Se usa para campos como últimos 4 dígitos y fecha de vencimiento.
   */
  const handleDigitsOnly = (
    field: keyof ManualCardFormState,
    nextValue: string,
    maxLength?: number
  ) => {
    const limpio = nextValue.replace(/\D/g, "")
    updateField(field, maxLength ? limpio.slice(0, maxLength) : limpio)
  }

  /**
   * Valida la fecha de vencimiento en formato MMYY.
   * Solo permite meses entre 01 y 12.
   */
  const handleFechaVence = (nextValue: string) => {
    const limpio = nextValue.replace(/\D/g, "").slice(0, 4)

    if (limpio.length >= 2) {
      const mes = Number(limpio.slice(0, 2))

      if (mes < 1 || mes > 12) {
        return
      }
    }

    updateField("fechaVence", limpio)
  }

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
          disabled={disabled}
          onChange={(event) =>
            updateField("tarjetahabiente", event.target.value)
          }
          placeholder="Nombre del titular"
          autoComplete="off"
        />
      </div>

      <div className="checkout-field checkout-field--full">
        <label className="checkout-label" htmlFor="tarjeta">
          Tarjeta *
        </label>

        <select
          id="tarjeta"
          className="checkout-input"

          value={value.tarjeta} 
          disabled={disabled}
          onChange={(event) => updateField("tarjeta", event.target.value)}
          autoComplete="off"
        >
          <option value="" disabled>Selecciona una tarjeta</option> 
          
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
          <option value="American Express">American Express</option>
          <option value="Discover">Discover</option>
          <option value="OTRA">Otra</option>
        </select>
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
          disabled={disabled}
          onChange={(event) =>
            handleDigitsOnly("ultDigito", event.target.value, 4)
          }
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
          disabled={disabled}
          onChange={(event) => handleFechaVence(event.target.value)}
          placeholder="MMYY"
          autoComplete="off"
          maxLength={4}
        />
      </div>
    </div>
  )
}