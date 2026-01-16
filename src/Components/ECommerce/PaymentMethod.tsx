import type {
  CardFormState,
  CheckoutStep,
  PaymentMethod,
  // PaymentMethod
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { FaRegCreditCard } from "react-icons/fa";
import VisaLogo from "@/assets/visaLogo.png";
import MasterCardLogo from "@/assets/masterCardLogo.png";
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface";

export interface Props {
  step: CheckoutStep;
  setStep: (step: CheckoutStep) => void;
  method: PaymentMethod;
  transpCost: number;
  distanceKm: number;
  cardForm: CardFormState;
  tip: number;
  setTip: (tip: number) => void;
  onCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExpiryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCvcChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cashAmount: number;
  setCashAmount: (cashAmount: number) => void;
  carPCG: CarDto[];
  payNowDisabled: boolean;
  payNowLock: boolean;
  handlePayNow: () => void;
  transferAmount: number;
  setTransferAmount: (transferAmount: number)=> void;
  transfer: number;
  setTransfer: (transfer: number)=> void;
}
export const PaymentMethodComponent = ({
  step,
  setStep,
  method,
  distanceKm,
  transpCost,
  cardForm,
  tip,
  setTip,
  onExpiryChange,
  onCardNumberChange,
  onCvcChange,
  onNameChange,
  cashAmount,
  setCashAmount,
  carPCG,
  payNowDisabled,
  payNowLock,
  handlePayNow,
  transferAmount,
  setTransferAmount,
  transfer,
  setTransfer
}: // method
Props) => {
  return (
    <>
      {step === "paymentMethod" && (
        <div className="checkout-section">
          <h2 className="checkout-section__title">Método de pago</h2>

          {method === "card" && (
            <>
              <div className="checkout-methods">
                <div className="checkout-method checkout-method--active">
                  <div className="checkout-method__left">
                    <span className="checkout-radio">
                      <span className="checkout-radio__dot checkout-radio__dot--active" />
                    </span>
                    <FaRegCreditCard className="checkout-method__icon" />
                    <span className="checkout-method__label">Tarjeta</span>
                  </div>

                  <div className="checkout-method__brands">
                    <img src={VisaLogo} className="checkout-card-brand" />
                    <img src={MasterCardLogo} className="checkout-card-brand" />
                  </div>
                </div>
              </div>

              <form
                className="checkout-cardform"
                onSubmit={(e) => e.preventDefault()}
              >
                <p>
                  Costo de transporte C$ {Number(transpCost ?? 0)}
                  {distanceKm > 0 ? ` (${distanceKm.toFixed(2)} km)` : ""}
                </p>

                <div className="checkout-field checkout-field--full">
                  <label className="checkout-label" htmlFor="cardNumber">
                    Número de tarjeta
                  </label>
                  <input
                    id="cardNumber"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    className="checkout-input"
                    placeholder="1234 5678 9012 3456"
                    value={cardForm.cardNumber}
                    onChange={onCardNumberChange}
                  />
                </div>

                <div className="checkout-cardform__row">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="expiry">
                      Expiración
                    </label>
                    <input
                      id="expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      className="checkout-input"
                      placeholder="MM/AA"
                      value={cardForm.expiry}
                      onChange={onExpiryChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="cvc">
                      CVC
                    </label>
                    <input
                      id="cvc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      className="checkout-input"
                      placeholder="CVC"
                      value={cardForm.cvc}
                      onChange={onCvcChange}
                    />
                  </div>
                </div>

                <div className="checkout-field checkout-field--full">
                  <label className="checkout-label" htmlFor="nameOnCard">
                    Nombre en tarjeta
                  </label>
                  <input
                    id="nameOnCard"
                    type="text"
                    autoComplete="cc-name"
                    className="checkout-input"
                    value={cardForm.nameOnCard}
                    onChange={onNameChange}
                  />
                </div>
              </form>
            </>
          )}

          {method === "cash" && (
            <div className="checkout-cash">
              <div className="checkout-field checkout-field--full">
                <label className="checkout-label" htmlFor="cashAmount">
                  Monto con el que pagas
                </label>
                <input
                  id="cashAmount"
                  type="number"
                  className="checkout-input"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                />
              </div>

              <div className="checkout-field checkout-field--full">
                <label className="checkout-label" htmlFor="tip">
                  Propina
                </label>
                <input
                  id="tip"
                  type="number"
                  className="checkout-input"
                  value={tip}
                  onChange={(e) => setTip(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {method === 'transfer' &&(
            <div className="checkout-cash">
              <div className="checkout-field checkout-field--full">
                <label className="checkout-label" htmlFor="cashAmount">
                  Monto C$ *
                </label>
                <input
                  id="cashAmount"
                  type="number"
                  className="checkout-input"
                  value={transferAmount}
                  onChange={(e) =>   setTransferAmount(Number(e.target.value))}
                />
              </div>

              <div className="checkout-field checkout-field--full">
                <label className="checkout-label" htmlFor="tip">
                    Referencia *
                </label>
                <input
                  id="transfer"
                  type="number"
                  className="checkout-input"
                  value={transfer}
                  onChange={(e) => setTransfer(Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {carPCG && carPCG.length > 0 && (
            <aside className="checkout-summary">
              <p className="checkout-summary__title">Resumen</p>
              <div className="checkout-summary__Cost_cost">
                <p className="checkout-summary__content">
                  Subtotal: <span>{carPCG[0].subTotal}</span>
                </p>

                {carPCG[0].descuento != null && carPCG[0].descuento > 0 && (
                  <p className="checkout-summary__content">
                    Descuento: <span>{carPCG[0].descuento}</span>
                  </p>
                )}

                <p className="checkout-summary__content">
                  IVA: <span>{carPCG[0].iva}</span>
                </p>

                <p className="checkout-summary__content">
                  Transporte: <span>{transpCost}</span>
                </p>
                <p className="checkout-summary__content">
                  Total:
                  <span className="checkout-summary__content__total">
                    C$
                    {(
                      Number(carPCG[0].total ?? 0) +
                      Number(transpCost ?? 0) +
                      Number(tip ?? 0)
                    ).toFixed(2)}
                  </span>
                </p>
              </div>
            </aside>
          )}

          <div className="checkout-actionBtn">
            <button
              type="button"
              disabled={payNowDisabled || payNowLock}
              className="checkout-paybtn__back"
              onClick={() => setStep("currency")}
            >
              Regresar
            </button>

            <button
              type="button"
              className="checkout-paybtn"
              onClick={handlePayNow}
              disabled={payNowDisabled || payNowLock}
            >
              {/* {payNowLock ? "Procesando..." : payNowCooldown > 0 ? `Espera ${payNowCooldown}s` : "Pagar ahora"} */}
              {payNowDisabled ? "Procesando..." : "Pagar ahora"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
