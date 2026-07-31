import { useEffect, useState } from "react"
import type { CheckoutStep, Currencyto} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"
import { filtrarFormasPagoUnico} from "@/Utils/ECommerce/pagoFacturaUtils"
import {selectPermiteMultiMoneda} from "@/Context/Slices/Auth/authSlice"
import { safeStr } from "@/Utils/ECommerce/formatters"
import { useMoneda } from "@/Hooks/Ecommerce/payment/useMoneda"
import type { MonedaInterface } from "@/Interfaces/Ecommerce/Moneda"
import { useSelector, type TypedUseSelectorHook} from "react-redux"
import type { RootState } from "@/Context"

// eslint-disable-next-line react-refresh/only-export-components
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

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

const getCurrencyKey = (item: MonedaInterface, index: number) => {
  return `${safeStr(item.moneda)}-${safeStr(item.simbolo)}-${index}`;
};

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

  // Permite o no multimoneda
  const permiteMultiMoneda = useAppSelector(selectPermiteMultiMoneda)
  const [monedaSeleccionada, setMonedaSeleccionada] = useState<MonedaInterface>({
    abreviatura: '',
    activo: '',
    id:'',
    moneda:'',
    simbolo:''
  });
  const {monedas, loadingMonedas} = useMoneda()



  const handleSelectMoneda = (value: string)=>{

    const selected = monedas.find(
      (item, index) => getCurrencyKey(item, index) === value
    )

    if(!selected){
      return;
    }


    setMonedaSeleccionada(selected)

  }
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
  
  // Cuando se va a relaizar el pago, se debe de seleccionar la moneda, por ejemplo 100 en efectivo, 400 en dolares, etc. Pero se debe de validar
  // MontoA: Es el monto del pago sin importar si es cordoba o dolar
  // MontoP: Es el monto del pago pero en cordobas, es el mismo que MontoA si el monto del pago aplicado es cordoba, y el equivalente en cordobas del MontoA si el monto del pago es dolar
  // MontoS: Es el monto del pago pero en dolar, es el mismo que MontoA si el monto del pago aplicado es dolar, y el equivalente en dolares de MontoA si el monto del pago es cordoba

  return (
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
              <small>
                Usa varias formas de pago en una misma factura.
              </small>
            </span>
          </label>
        </div>
      )}


      {/* Agregar la moneda, usando el useMoneda, realizo */}
      {permiteMultiMoneda && (
        <div className="checkout-field checkout-field--full">
          <label className="checkout-label" htmlFor="multipagoCurrency">
           Selecionar Moneda
          </label>

          <select
            id="multipagoCurrency"
            className="checkout-input"
            value={
              monedaSeleccionada
                ? (monedas
                    .map((item, index) => ({
                      item,
                      key: getCurrencyKey(item, index),
                    }))
                    .find(({ item }) => item === monedaSeleccionada)?.key ?? "")
                : ""
            }
            disabled={loadingMonedas}
            onChange={(event) => {
              void handleSelectMoneda(event.target.value);
            }}
          >
            <option value="">Seleccionar moneda</option>

            {monedas.map((item, index) => (
              <option
                key={getCurrencyKey(item, index)}
                value={getCurrencyKey(item, index)}
              >
                {safeStr(item.moneda)}
              </option>
            ))}
          </select>
        </div>
      )}

      {!multiPagoActivo && (
        <>
          <div className="checkout-methods-list">
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

              <strong>
                {selectedCurrency.descripcion_Pago}
              </strong>
            </div>
          )}
        </>
      )}

      {multiPagoActivo && permiteMultiPago && (
        <div className="checkout-selected-currency">
          <p>Modo seleccionado:</p>

          <strong>Multipago</strong>

          <small>
            En el siguiente paso podrás agregar efectivo,
            transferencia o tarjeta manual.
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
  )
}