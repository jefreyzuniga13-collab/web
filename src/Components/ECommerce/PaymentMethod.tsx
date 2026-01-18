import React from "react";
import type {
  CardFormState,
  CheckoutStep,
  PaymentMethod,
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { FaRegCreditCard } from "react-icons/fa";
import VisaLogo from "@/assets/visaLogo.png";
import MasterCardLogo from "@/assets/masterCardLogo.png";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
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

  transferAmount: number;
  setTransferAmount: (transferAmount: number) => void;

  transfer: string;
  setTransfer: (transfer: string) => void;

  payNowDisabled: boolean;
  payNowLock: boolean;
  handlePayNow: () => void;

  divisaLoading: boolean;
  divisaOpts: ObtenerDivisaPagosTipoRes[];
  divisaSelected: ObtenerDivisaPagosTipoRes | null;
  setDivisaSelected: (v: ObtenerDivisaPagosTipoRes | null) => void;

  carPCG?: CarDto[];
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
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
  transferAmount,
  setTransferAmount,
  transfer,
  setTransfer,
  payNowDisabled,
  payNowLock,
  handlePayNow,
  divisaLoading,
  divisaOpts,
  divisaSelected,
  setDivisaSelected,
  carPCG,
}: Props) => {
  const showDivisaSelect = method === "card" || method === "transfer";

  const canPay =
    !payNowDisabled &&
    !payNowLock &&
    (showDivisaSelect ? !!divisaSelected : true);

  return (
    <>
      {step === "paymentMethod" && (
        <div className="checkout-section">
          <h2 className="checkout-section__title">Método de pago</h2>

          {showDivisaSelect && (
            <div className="checkout-field checkout-field--full">
              <label className="checkout-label" htmlFor="payType">
                {method === "card"
                  ? "Tipo de tarjeta / banco *"
                  : "Tipo de transferencia / banco *"}
              </label>

              <select
                id="payType"
                className="checkout-input"
                value={safeStr(divisaSelected?.codigo)}
                onChange={(e) => {
                  const code = safeStr(e.target.value);
                  const found =
                    divisaOpts.find((x) => safeStr(x.codigo) === code) ?? null;
                  setDivisaSelected(found);
                }}
                disabled={divisaLoading}
              >
                <option value="">
                  {divisaLoading ? "Cargando..." : "Seleccionar"}
                </option>

                {divisaOpts.map((x) => (
                  <option key={`${x.codigo}-${x.codigoExterno}`} value={x.codigo}>
                    {x.nombre}
                  </option>
                ))}
              </select>
            </div>
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
                      Último 4 números
                    </label>
                    <input
                      id="cvc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      className="checkout-input"
                      placeholder="0000"
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

          {method === "transfer" && (
            <div className="checkout-cash">
              <div className="checkout-field checkout-field--full">
                <label className="checkout-label" htmlFor="transferAmount">
                  Monto C$ *
                </label>
                <input
                  id="transferAmount"
                  type="number"
                  className="checkout-input"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                />
              </div>

              <div className="checkout-field checkout-field--full">
                <label className="checkout-label" htmlFor="transferRef">
                  Referencia *
                </label>
                <input
                  id="transferRef"
                  type="text"
                  className="checkout-input"
                  value={transfer}
                  onChange={(e) => setTransfer(e.target.value)}
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
              disabled={!canPay}
            >
              {payNowDisabled ? "Procesando..." : "Pagar ahora"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};