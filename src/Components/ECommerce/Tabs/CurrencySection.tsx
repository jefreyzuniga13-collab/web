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
  currency: Currencyto[] | []

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

  const puedeContinuar =
    !invoiceLoading &&
    (multiPagoActivo || selectedCurrency != null)

  const handleChangeModoPago = (value: boolean) => {
    if (!setMultiPagoActivo) return

    setMultiPagoActivo(value)
  }

  return (
    <>
      {step === "currency" && (
        <div className="checkout-methods-list">
          <h2 className="checkout-section__title">
            Selecciona cómo deseas pagar
          </h2>

          {permiteMultiPago && (
            <div className="checkout-payment-mode">
              <label
                className={
                  !multiPagoActivo
                    ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                    : "checkout-payment-mode__option"
                }
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={!multiPagoActivo}
                  onChange={() => handleChangeModoPago(false)}
                  disabled={invoiceLoading}
                />

                <span className="checkout-payment-mode__content">
                  <strong>Pago único</strong>
                  <small>Usa una sola forma de pago.</small>
                </span>
              </label>

              <label
                className={
                  multiPagoActivo
                    ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                    : "checkout-payment-mode__option"
                }
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={multiPagoActivo}
                  onChange={() => handleChangeModoPago(true)}
                  disabled={invoiceLoading}
                />

                <span className="checkout-payment-mode__content">
                  <strong>Multipago</strong>
                  <small>Usa varias formas de pago en una misma factura.</small>
                </span>
              </label>
            </div>
          )}

          {!multiPagoActivo && (
            <>
              <div className="checkout-methods-list">
                {formasPagoUnico.map((item, index) => {
                  const itemKey = `${item.codPago}-${item.descripcion_Pago}-${index}`

                  const isSelected =
                    selectedCurrency?.codPago === item.codPago &&
                    selectedCurrency?.descripcion_Pago === item.descripcion_Pago

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
                      <div className="checkout-method__left">
                        <span className="checkout-radio">
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
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedCurrency && (
                <div className="checkout-selected-currency">
                  <p>Método seleccionado:</p>
                  <strong>{selectedCurrency.descripcion_Pago}</strong>
                </div>
              )}
            </>
          )}

          {multiPagoActivo && (
            <div className="checkout-selected-currency">
              <p>Modo seleccionado:</p>
              <strong>Multipago</strong>
              <small>
                En el siguiente paso podrás agregar efectivo, transferencia o
                tarjeta manual.
              </small>
            </div>
          )}

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
      )}
    </>
  )
}