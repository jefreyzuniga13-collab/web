import type { BillingFormState } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

type OnlyTextAddressField = "addressName" | "address" | "city"

interface Props {
  /**
   * Datos actuales del formulario de dirección.
   */
  billingForm: BillingFormState

  /**
   * Actualiza un campo específico del formulario.
   */
  onChange: (field: OnlyTextAddressField, value: string) => void

  /**
   * Continúa al siguiente paso del checkout.
   */
  onContinue: () => void

  /**
   * Costo de transporte definido previamente en LogCart.
   * Este componente solo lo muestra; no lo recalcula.
   */
  transpCost?: number

  /**
   * Bloquea los campos y el botón durante un proceso activo.
   */
  disabled?: boolean
}

const formatCurrencyNio = (value?: number | null): string => {
  const amount = Number(value ?? 0)

  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(amount) ? amount : 0)
}

/**
 * Formulario para pedidos configurados con dirección de solo texto.
 *
 * No consulta direcciones guardadas, no muestra mapa, no solicita
 * coordenadas y no calcula sucursal ni costo de transporte.
 */
const OnlyTextAddressSection = ({
  billingForm,
  onChange,
  onContinue,
  transpCost = 0,
  disabled = false
}: Props) => {
  return (
    <div className="checkout-section checkout-section__location">
      <div className="checkout-location__header">
        <h2 className="checkout-section__title">
          Dirección de entrega
        </h2>

        <p className="checkout-location__subtitle">
          Escribe la dirección donde deseas recibir el pedido. No necesitas
          marcar una ubicación en el mapa.
        </p>
      </div>

      <div className="checkout-pickup-info">
        <p>
          <strong>Costo de transporte</strong>
        </p>

        <span>{formatCurrencyNio(transpCost)}</span>
      </div>

      <div className="checkout-grid__container">
        <div className="checkout-grid">
          <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="addressName">
              Nombre de la dirección
            </label>

            <input
              id="addressName"
              type="text"
              className="checkout-input"
              value={billingForm.addressName}
              onChange={(event) =>
                onChange("addressName", event.target.value)
              }
              placeholder="Casa, trabajo, oficina, etc."
              disabled={disabled}
            />
          </div>

          <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="address">
              Dirección completa
            </label>

            <textarea
              id="address"
              className="checkout-input checkout-input--textarea"
              value={billingForm.address}
              onChange={(event) =>
                onChange("address", event.target.value)
              }
              placeholder="Barrio, calle, número de casa y detalles necesarios."
              disabled={disabled}
              rows={4}
            />
          </div>

          {/* <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="city">
              Referencia
            </label>

            <input
              id="city"
              type="text"
              className="checkout-input"
              value={billingForm.city}
              onChange={(event) =>
                onChange("city", event.target.value)
              }
              placeholder="Punto de referencia cercano."
              disabled={disabled}
            />
          </div> */}
        </div>

        <button
          type="button"
          className="checkout-paybtn"
          onClick={onContinue}
          disabled={disabled}
        >
          Continuar a pago
        </button>
      </div>
    </div>
  )
}

export default OnlyTextAddressSection