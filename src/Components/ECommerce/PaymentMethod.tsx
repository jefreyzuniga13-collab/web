import React, { useEffect, useMemo } from "react";
import type { CheckoutStep, PaymentMethod } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { FaRegCreditCard } from "react-icons/fa";
import VisaLogo from "@/assets/img/visaLogo.png";
import MasterCardLogo from "@/assets/img/masterCardLogo.png";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import {toNumberNoLeadingZeros,safeStr} from '@/Utils/ECommerce/formatters'
export interface Props {
  step: CheckoutStep;
  setStep: (step: CheckoutStep) => void;
  method: PaymentMethod;
  transpCost: number;
  distanceKm: number;
  tip: number;
  setTip: (tip: number) => void;
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
    if (method === "transfer") {
      setTransferAmount(totalPagar);
    }
  }, [method, totalPagar, setTransferAmount]);

  const transferRefOk = useMemo(() => {
    if (method !== "transfer") return true;
    const ref = safeStr(transfer);
    if (!ref) return false;
    return /^[A-Za-z0-9-]{4,40}$/.test(ref);
  }, [method, transfer]);

  const canPay =
    !payNowDisabled &&
    !payNowLock &&
    (showDivisaSelect ? !!divisaSelected : true) &&
    (method === "transfer" ? transferRefOk : true);

  return (
    <>
      {step === "paymentMethod" && (
        <div className="checkout-section">

          <h2 className="checkout-section__title">
            {`Método de pago ${methodLabel(method)}`}
          </h2>

          {/* SELECT BANCO / TARJETA */}
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

          {/* EFECTIVO */}
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
                  onChange={(e) =>
                    setCashAmount(
                      toNumberNoLeadingZeros(e.target.value)
                    )
                  }
                />
              </div>
            </div>
          )}

          {/* TARJETA */}
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

              <div className="checkout-field checkout-field--full">
                <p className="checkout-hint">
                  Serás redirigido a una pasarela segura.
                </p>
                <p className="checkout-hint">
                  Total: <strong>C$ {totalPagar.toFixed(2)}</strong>
                </p>
              </div>
            </>
          )}

          {/* TRANSFERENCIA */}
          {method === "transfer" && (
            <div className="checkout-cash">
              <div className="checkout-field checkout-field--full">
                <label className="checkout-label">Monto</label>
                <input className="checkout-input" value={totalPagar} readOnly />
              </div>

              <div className="checkout-field checkout-field--full">
                <label className="checkout-label">Referencia *</label>
                <input
                  className="checkout-input"
                  value={transfer}
                  onChange={(e) => setTransfer(e.target.value)}
                />
                {!transferRefOk && (
                  <small className="checkout-error">
                    Referencia inválida
                  </small>
                )}
              </div>
            </div>
          )}

          {carPCG && carPCG.length > 0 && (
            <aside className="checkout-summary">
              <p className="checkout-summary__title">Resumen</p>

              <div className="checkout-summary__subtitle"><p className="checkout-summary__p">Subtotal: </p> <strong className="checkout-summary__strong">{existingLog?.subTotal}</strong></div>
              <div className="checkout-summary__subtitle"><p className="checkout-summary__p">IVA: </p><strong className="checkout-summary__strong">{existingLog?.ivaPantalla}</strong></div>
              <div className="checkout-summary__subtitle"><p className="checkout-summary__p">Transporte: </p><strong className="checkout-summary__strong"> {transpCost || existingLog?.transCost}</strong></div>

             <div className="checkout-summary__subtitle"> <p className="checkout-summary__p">Total :</p> <strong className="checkout-summary__strong">
                  C${" "}
                  {(existingLog?.totalEnPantalla ?? 0) +
                    (transpCost > 0 ? transpCost : 0)}
                </strong></div>
            </aside>
          )}

          <div className="checkout-actionBtn">
            <button
              className="checkout-paybtn__back"
              onClick={() => setStep("currency")}
            >
              Regresar
            </button>

            <button
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