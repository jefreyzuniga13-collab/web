import React, { useEffect, useMemo } from "react";
import type { CardFormState, CheckoutStep, PaymentMethod } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { FaRegCreditCard } from "react-icons/fa";
import VisaLogo from "@/assets/visaLogo.png";
import MasterCardLogo from "@/assets/masterCardLogo.png";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import { toast } from "react-toastify";
import { isExpiryValid } from "@/Utils/validation";


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
  totalPagar: number;
  existingLog: LogCartResponseDto | null;
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

function toNumberNoLeadingZeros(raw: string): number {
  // Limpieza de espacios y manejo de nulos
  const s = String(raw ?? "").trim();
  if (!s) return 0;

  // Bloquear ceros a la izquierda (ej: "010", "0.5" SI es permitido, "01.5" NO)
  // Si empieza con 0, el siguiente carácter DEBE ser un punto o nada más.
  if (s.length > 1 && s.startsWith('0') && s[1] !== '.') {
    return 0;
  }

  //  Limpiar caracteres no numéricos excepto el PUNTO
  // Reemplaza todo lo que NO sea dígito o punto
  const cleaned = s.replace(/[^\d.]/g, "");

  // Convertir a número
  const num = Number(cleaned);

  // Validar que sea un número real (evita NaN por múltiples puntos como "1.2.3")
  return Number.isFinite(num) ? num : 0;
}

function methodLabel(m: PaymentMethod): string {
  if (m === "cash") return "Efectivo";
  if (m === "card") return "Tarjeta";
  return "Transferencia";
}

export const PaymentMethodComponent = ({
  step,
  setStep,
  method,
  transpCost,
  cardForm,
  onExpiryChange,
  onCvcChange,
  onNameChange,
  cashAmount,
  setCashAmount,
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
  totalPagar,
  existingLog
}: Props) => {
  const showDivisaSelect = method === "card" || method === "transfer";

  useEffect(() => {
    if (method === "transfer") setTransferAmount(totalPagar);
  }, [method, totalPagar, setTransferAmount]);

  const transferRefOk = useMemo(() => {
    if (method !== "transfer") return true;
    const ref = safeStr(transfer);
    if (!ref) return false;
    return /^[A-Za-z0-9-]{4,40}$/.test(ref);
  }, [method, transfer]);

  const expiryOk = useMemo(() => {
    if (method !== "card") return true;
    const v = (cardForm.expiry ?? "").trim();
    if (v.length !== 5) return false;
    return isExpiryValid(v);
  }, [method, cardForm.expiry]);

  const canPay =
    !payNowDisabled &&
    !payNowLock &&
    (showDivisaSelect ? !!divisaSelected : true) &&
    (method === "transfer" ? transferRefOk : true) &&
    (method === "card" ? expiryOk : true);

  return (
    <>
      {step === "paymentMethod" && (
        <div className="checkout-section">
          <h2 className="checkout-section__title">{`Método de pago ${methodLabel(method)}`}</h2>

          {showDivisaSelect && (
            <div className="checkout-field checkout-field--full">
              <label className="checkout-label" htmlFor="payType">
                {method === "card" ? "Tipo de tarjeta / banco *" : "Tipo de transferencia / banco *"}
              </label>

              <select
                id="payType"
                className="checkout-input"
                value={safeStr(divisaSelected?.codigo)}
                onChange={(e) => {
                  const code = safeStr(e.target.value);
                  const found = divisaOpts.find((x) => safeStr(x.codigo) === code) ?? null;
                  setDivisaSelected(found);
                }}
                disabled={divisaLoading}
              >
                <option value="">{divisaLoading ? "Cargando..." : "Seleccionar"}</option>

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
                  inputMode="numeric"
                  min={1}
                  className="checkout-input"
                  value={cashAmount}
                  onChange={

                    (e) => setCashAmount(toNumberNoLeadingZeros(e.target.value))
                  }
                  onFocus={(e) => e.currentTarget.select()}
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
                    <img src={VisaLogo} className="checkout-card-brand" alt="Visa" />
                    <img src={MasterCardLogo} className="checkout-card-brand" alt="Mastercard" />
                  </div>
                </div>
              </div>

              <form className="checkout-cardform" onSubmit={(e) => e.preventDefault()}>
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
                      maxLength={5}
                      value={cardForm.expiry}
                      onChange={onExpiryChange}

                      //aqui esta bien
                      onBlur={() => {
                        if (cardForm.expiry.length === 5 && !isExpiryValid(cardForm.expiry)) {
                          toast.error("Fecha de expiración inválida o tarjeta vencida");
                        }
                      }}
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
                    Nombre del Titular
                  </label>
                  <input
                    id="nameOnCard"
                    type="text"
                    maxLength={150}
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
                <input id="transferAmount" type="number" className="checkout-input" value={totalPagar} readOnly />
                <small className="checkout-hint">
                  Total a transferir: <strong>C$ {totalPagar.toFixed(2)}</strong>
                </small>
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
                {!transferRefOk && (
                  <small className="checkout-error">Referencia inválida (4-40, solo letras, números o guion).</small>
                )}
              </div>
            </div>
          )}

          {carPCG && carPCG.length > 0 && (
            <aside className="checkout-summary">
              <p className="checkout-summary__title">Resumen</p>
              <div className="checkout-summary__Cost_cost">
                <p className="checkout-summary__content">
                  Subtotal: <span>{existingLog != null ? existingLog.subTotal : ""}</span>
                </p>

                {carPCG[0].descuento != null && carPCG[0].descuento > 0 && (
                  <p className="checkout-summary__content">
                    Descuento: <span>{existingLog != null ? existingLog.DescuentoPantalla : ""}</span>
                  </p>
                )}

                <p className="checkout-summary__content">
                  IVA: <span>{existingLog != null ? existingLog.ivaPantalla : ""}</span>
                </p>
                

                <span className="checkout-summary__content">
                  Transporte:
                  <span>{transpCost && transpCost > 0 ? transpCost : existingLog?.transCost ?? 0}</span>
                </span>

                <p className="checkout-summary__content">
                  Total:
                  <span className="checkout-summary__content__total">
                    C${" "}

                    {/* {existingLog != null ? existingLog.totalEnPantalla : 0} */}
                    
                    {existingLog
                      ? (existingLog.totalEnPantalla ?? 0) +
                      (
                        transpCost && transpCost > 0 ? transpCost : 
                        0)
                      : 0
                      }

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

            <button type="button" className="checkout-paybtn"
              onClick={handlePayNow} disabled={!canPay}
            >
              {payNowDisabled ? "Procesando..." : "Pagar ahora"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};