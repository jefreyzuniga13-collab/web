import type { CheckoutStep, Currencyto } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";

export interface Props {
  step: CheckoutStep;
  currency: Currencyto[] | [];
  selectedCurrency: Currencyto | null;
  handleSelectCurrency: (item: Currencyto) => void;
  invoiceLoading: boolean;
  setStep: (step: CheckoutStep) => void;
  handleGoToPayment: () => void;
}

export const CurrencySection = ({
  step,
  currency,
  selectedCurrency,
  handleSelectCurrency,
  invoiceLoading,
  setStep,
  handleGoToPayment,
}: Props) => {
  const handleSelectAndContinue = (item: Currencyto) => {
    handleSelectCurrency(item);
    handleGoToPayment();
  };

  return (
    <>
      {step === "currency" && (
        <div className="checkout-methods-list">
          <h2 className="checkout-section__title">Selecciona cómo deseas pagar</h2>

          <div className="checkout-methods-list">
            {currency.map((item) => (
              <button
                key={item.codPago}
                type="button"
                onDoubleClick={() => handleSelectAndContinue(item)}
                className={
                  selectedCurrency?.codPago === item.codPago
                    ? "checkout-method checkout-method--active"
                    : "checkout-method"
                }
                disabled={invoiceLoading}
              >
                <div className="checkout-method__left">
                  <span className="checkout-radio">
                    <span
                      className={
                        selectedCurrency?.codPago === item.codPago
                          ? "checkout-radio__dot checkout-radio__dot--active"
                          : "checkout-radio__dot"
                      }
                    />
                  </span>
                  <span className="checkout-method__label">{item.descripcion_Pago}</span>
                </div>
              </button>
            ))}
          </div>

          {selectedCurrency && (
            <div className="checkout-selected-currency">
              <p>Método seleccionado:</p>
              <strong>{selectedCurrency.descripcion_Pago}</strong>
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
          </div>
        </div>
      )}
    </>
  );
};