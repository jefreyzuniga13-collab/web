import React, { useEffect, useMemo, useState } from "react";
import type { CheckoutStep, PaymentMethod } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import CashPaymentSection from "@/Components/ECommerce/Payment/CashPaymentSection";
import CardPaymentSection from "@/Components/ECommerce/Payment/CardPaymentSection";
import TransferPaymentSection from "@/Components/ECommerce/Payment/TransferPaymentSection";
import { safeStr } from "@/Utils/ECommerce/formatters";
import '@/Styles/Ecommerce/Payment/PaymentMethodComponent.css';
import { formatearDecimales } from "@/Utils/calcularIVA";

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
  ecommerceUserId: number;
  onSelectCard?: (card: TarjetaModelInterface | null) => void;
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
  existingLog,
  ecommerceUserId,
  onSelectCard,
}: Props) => {
  const [selectedSavedCard, setSelectedSavedCard] = useState<TarjetaModelInterface | null>(null);

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

  const handleSelectCard = (card: TarjetaModelInterface | null) => {
    setSelectedSavedCard(card);
    onSelectCard?.(card);
  };

  return (
    <>
      {step === "paymentMethod" && (
        <div className="checkout-section">
          <h2 className="checkout-section__title">
            {`Método de pago ${methodLabel(method)}`}
          </h2>

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


          {carPCG && carPCG.length > 0 && (
            <aside className="checkout-summary">
              <p className="checkout-summary__title">Resumen</p>

              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">Subtotal: </p>
                <strong className="checkout-summary__strong">
                  {formatearDecimales(existingLog?.subTotal ?? 0)}
                </strong>
              </div>

              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">IVA: </p>
                <strong className="checkout-summary__strong">
                  {formatearDecimales(existingLog?.ivaPantalla ?? 0)}
                </strong>
              </div>


              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">Transporte: </p>
                <strong className="checkout-summary__strong">
                  {formatearDecimales(transpCost ?? 0) || formatearDecimales(existingLog?.transCost ?? 0)}
                </strong>
              </div>

              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">Total :</p>
                <strong className="checkout-summary__strong">
                  C${" "}
                  {formatearDecimales((existingLog?.totalEnPantalla ?? 0) +
                    (transpCost > 0 ? transpCost : 0)) ?? 0}
                </strong>
              </div>

              {method === "card" && selectedSavedCard && (
                <div className="checkout-summary__subtitle">
                  <p className="checkout-summary__p">Tarjeta:</p>
                  <strong className="checkout-summary__strong">
                    **** {safeStr(selectedSavedCard.ultimos4)}
                  </strong>
                </div>
              )}
            </aside>
          )}

          {method === "cash" && (
            <CashPaymentSection
              cashAmount={cashAmount}
              setCashAmount={setCashAmount}
            />
          )}

          {method === "card" && (
            <CardPaymentSection
              ecommerceUserId={ecommerceUserId}
              onSelectCard={handleSelectCard}
            />
          )}

          {method === "transfer" && (
            <TransferPaymentSection
              totalPagar={totalPagar}
              transfer={transfer}
              setTransfer={setTransfer}
              transferRefOk={transferRefOk}
            />
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