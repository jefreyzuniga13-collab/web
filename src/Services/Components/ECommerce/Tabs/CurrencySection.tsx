import { useEffect } from "react"

import type {
  CheckoutStep,
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import {
  filtrarFormasPagoUnico
} from "@/Utils/ECommerce/pagoFacturaUtils"

export interface Props {
  /**
   * Paso actual del checkout.
   */
  step: CheckoutStep

  /**
   * Formas de pago disponibles desde PCG.
   */
  currency: Currencyto[]

  /**
   * Forma de pago seleccionada en pago único.
   */
  selectedCurrency: Currencyto | null

  /**
   * Selecciona una forma de pago para pago único.
   */
  handleSelectCurrency: (item: Currencyto) => void

  /**
   * Indica si se están cargando datos de factura o formas de pago.
   */
  invoiceLoading: boolean

  /**
   * Cambia el paso actual del checkout.
   */
  setStep: (step: CheckoutStep) => void

  /**
   * Continúa al paso de pago.
   */
  handleGoToPayment: () => void

  /**
   * Indica si la empresa permite multipago.
   */
  permiteMultiPago?: boolean

  /**
   * Indica si la empresa permite pasarela de pago.
   */
  permitePasarela?: boolean

  /**
   * Indica si el modo multipago está activo.
   */
  multiPagoActivo?: boolean

  /**
   * Activa o desactiva el modo multipago.
   */
  setMultiPagoActivo?: (value: boolean) => void
}

export const CurrencySection = ({
  step,
  currency,
  selectedCurrency,
  handleSelectCurrency,
  invoiceLoading,
  setStep,
  handleGoToPayment,
  permiteMultiPago = false,
  permitePasarela = false,
  multiPagoActivo = false,
  setMultiPagoActivo
}: Props) => {
  /**
   * En pago único se filtran las formas de pago según la configuración
   * de la empresa. Si no permite pasarela, no se muestra gatewayCard.
   */
  const formasPagoUnico = filtrarFormasPagoUnico(
    currency,
    permitePasarela
  )

  /**
   * Si el permiso de multipago deja de estar activo,
   * se regresa automáticamente a pago único.
   */
  useEffect(() => {
    if (!permiteMultiPago && multiPagoActivo) {
      setMultiPagoActivo?.(false)
    }
  }, [
    permiteMultiPago,
    multiPagoActivo,
    setMultiPagoActivo
  ])

  /**
   * Solo permite continuar cuando:
   * - Multipago está activo y autorizado.
   * - Pago único tiene una forma de pago seleccionada.
   */
  const puedeContinuar =
    !invoiceLoading &&
    (
      (multiPagoActivo && permiteMultiPago) ||
      (!multiPagoActivo && selectedCurrency != null)
    )

  const handleChangeModoPago = (value: boolean) => {
    if (!setMultiPagoActivo) return

    if (value && !permiteMultiPago) {
      return
    }

    setMultiPagoActivo(value)
  }

  if (step !== "currency") {
    return null
  }

  return (
    <div className="checkout-methods-list checkout-pay-panel">
      {permiteMultiPago && (
        <div className="checkout-payment-mode">
          <label
            className={
              !multiPagoActivo
                ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                : "checkout-payment-mode__option"
            }
          >
            <span className="checkout-payment-mode__content">
              <span className="checkout-payment-mode__name">Pago único</span>
              <small>Una sola forma de pago.</small>
            </span>

            <input
              type="radio"
              name="paymentMode"
              checked={!multiPagoActivo}
              onChange={() => handleChangeModoPago(false)}
              disabled={invoiceLoading}
            />
          </label>

          <label
            className={
              multiPagoActivo
                ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                : "checkout-payment-mode__option"
            }
          >
            <span className="checkout-payment-mode__content">
              <span className="checkout-payment-mode__name">Multipago</span>
              <small>Varias formas en una factura.</small>
            </span>

            <input
              type="radio"
              name="paymentMode"
              checked={multiPagoActivo}
              onChange={() => handleChangeModoPago(true)}
              disabled={invoiceLoading}
            />
          </label>
        </div>
      )}

      <div className="checkout-pay-panel__body">
        {!multiPagoActivo && (
          <>
            <p className="checkout-methods-heading">
              Selecciona el método de pago
            </p>

            <div className="checkout-methods-options">
              {formasPagoUnico.map((item, index) => {
                const itemKey =
                  `${item.codPago}-${item.descripcion_Pago}-${index}`

                const isSelected =
                  selectedCurrency?.codPago === item.codPago &&
                  selectedCurrency?.descripcion_Pago ===
                    item.descripcion_Pago

                return (
                  <button
                    key={itemKey}
                    type="button"
                    onClick={() => handleSelectCurrency(item)}
                    className={
                      isSelected
                        ? "checkout-method checkout-method--active"
                        : "checkout-method"
                    }
                    disabled={invoiceLoading}
                  >
                    <span className="checkout-radio" aria-hidden="true">
                      <span
                        className={
                          isSelected
                            ? "checkout-radio__dot checkout-radio__dot--active"
                            : "checkout-radio__dot"
                        }
                      />
                    </span>

                    <span className="checkout-method__label">
                      {item.descripcion_Pago}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {multiPagoActivo && permiteMultiPago && (
          <div className="checkout-selected-currency checkout-selected-currency--info">
            <strong>Multipago</strong>
            <small>
              En el siguiente paso agregas efectivo, transferencia o tarjeta.
            </small>
          </div>
        )}
      </div>

      <div className="checkout-actionBtn">
        <button
          type="button"
          className="checkout-paybtn__back"
          onClick={() => setStep("location")}
          disabled={invoiceLoading}
        >
          Regresar
        </button>

        <button
          type="button"
          className="checkout-paybtn"
          onClick={handleGoToPayment}
          disabled={!puedeContinuar}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
