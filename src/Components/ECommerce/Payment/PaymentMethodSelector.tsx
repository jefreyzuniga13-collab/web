import type {
  CheckoutPaymentMethod
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"
import type { Currencyto } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import {
  CHECKOUT_PAYMENT_METHOD_LABEL
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

type Props = {
  /**
   * Método de pago actualmente seleccionado.
   * Puede ser null cuando el usuario aún no ha elegido una opción.
   */
  value: CheckoutPaymentMethod | null

  /**
   * Lista de métodos de pago permitidos para el flujo actual.
   *
   * En el CartTab del agente normalmente se usaría:
   * ["cash", "transfer", "manualCard"]
   *
   * En el checkout del cliente se puede incluir:
   * ["cash", "transfer", "manualCard", "gatewayCard"]
   */
  methods: CheckoutPaymentMethod[]

  /**
   * Función que se ejecuta cuando el usuario selecciona un método de pago.
   */
  onChange: (method: CheckoutPaymentMethod) => void

  /**
   * Permite bloquear la selección mientras se carga información
   * o mientras se procesa una acción.
   */
  disabled?: boolean
  options?: Currencyto[]
  resolveMethod?: (option: Currencyto) => CheckoutPaymentMethod | null
}

export default function PaymentMethodSelector({
  value,
  methods,
  onChange,
  disabled = false,
  options,
  resolveMethod
}: Props) {
  if (options && resolveMethod) {
    return (
      <div className="checkout-methods-list">
        {options.map((option) => {
          const method = resolveMethod(option)
          const isActive = !!method && value === method

          return (
            <button
              key={`${option.codPago}-${option.descripcion_Pago}`}
              type="button"
              disabled={disabled || !method}
              onClick={() => method && onChange(method)}
              className={isActive ? "checkout-method checkout-method--active" : "checkout-method"}
            >
              <span className="checkout-radio" aria-hidden="true">
                <span className={isActive ? "checkout-radio__dot checkout-radio__dot--active" : "checkout-radio__dot"} />
              </span>
              <span className="checkout-method__label">{option.descripcion_Pago}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="checkout-methods-list">
      {methods.map((method) => {
        const isActive = value === method

        return (
          <button
            key={method}
            type="button"
            disabled={disabled}
            onClick={() => onChange(method)}
            className={
              isActive
                ? "checkout-method checkout-method--active"
                : "checkout-method"
            }
          >
            <span className="checkout-radio" aria-hidden="true">
              <span
                className={
                  isActive
                    ? "checkout-radio__dot checkout-radio__dot--active"
                    : "checkout-radio__dot"
                }
              />
            </span>

            <span className="checkout-method__label">
              {CHECKOUT_PAYMENT_METHOD_LABEL[method]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
