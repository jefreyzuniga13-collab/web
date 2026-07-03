import React, { useEffect, useMemo, useState } from "react";
import type { CheckoutStep, PaymentMethod } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import CashPaymentSection from "@/Components/ECommerce/Payment/CashPaymentSection";
import CardPaymentSection from "@/Components/ECommerce/Payment/CardPaymentSection";
import TransferPaymentSection from "@/Components/ECommerce/Payment/TransferPaymentSection";
import ManualCardPaymentSection from "@/Components/ECommerce/Payment/ManualCardPaymentSection";
import { safeStr } from "@/Utils/ECommerce/formatters";
import { formatearDecimales } from "@/Utils/calcularIVA";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import "@/Styles/Ecommerce/Payment/PaymentMethodComponent.css";

export type CheckoutPaymentMethod = PaymentMethod | "manualCard";

export type ManualCardFormState = {
  tarjeta: string;
  ultDigito: string;
  tarjetahabiente: string;
  autorizacion: string;
  termId: string;
  afiliado: string;
  fechaVence: string;
};

export interface Props {
  step: CheckoutStep;
  setStep: (step: CheckoutStep | string) => void;
  method: CheckoutPaymentMethod;
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
  manualCardData: ManualCardFormState;
  setManualCardData: React.Dispatch<React.SetStateAction<ManualCardFormState>>;
  isGatewayCard?: boolean;
  isManualCard?: boolean;
  isAnyCard?: boolean;
}

function methodLabel(m: CheckoutPaymentMethod): string {
  if (m === "cash") return "Efectivo";
  if (m === "transfer") return "Transferencia";
  if (m === "manualCard") return "Tarjeta manual";
  return "Tarjeta débito / crédito";
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
  manualCardData,
  setManualCardData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isGatewayCard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isManualCard,
}: Props) => {
  const [selectedSavedCard, setSelectedSavedCard] = useState<TarjetaModelInterface | null>(null);

  const showDivisaSelect = method === "card" || method === "manualCard" || method === "transfer";

  useEffect(() => {
    if (method === "transfer") {
      setTransferAmount(totalPagar);
    }
  }, [method, totalPagar, setTransferAmount]);

  useEffect(() => {
    if (method !== "card") {
      setSelectedSavedCard(null);
      onSelectCard?.(null);
    }
  }, [method, onSelectCard]);

  const transferRefOk = useMemo(() => {
    if (method !== "transfer") return true;

    const ref = safeStr(transfer);

    if (!ref) return false;

    return /^[A-Za-z0-9-]{4,40}$/.test(ref);
  }, [method, transfer]);

  const manualCardOk = useMemo(() => {
    if (method !== "manualCard") return true;

    return (
      !!safeStr(manualCardData.tarjetahabiente) &&
      !!safeStr(manualCardData.tarjeta) &&
      !!safeStr(manualCardData.ultDigito) &&
      !!safeStr(manualCardData.fechaVence)
    );
  }, [method, manualCardData]);

  const canPay =
    !payNowDisabled &&
    !payNowLock &&
    (showDivisaSelect ? !!divisaSelected : true) &&
    (method === "transfer" ? transferRefOk : true) &&
    (method === "manualCard" ? manualCardOk : true);
  const handleSelectCard = (card: TarjetaModelInterface | null) => {
    setSelectedSavedCard(card);
    onSelectCard?.(card);
  };

  const totalResumen = useMemo(() => {
  return Number(totalPagar ?? 0);
}, [totalPagar]);

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
                {method === "transfer"
                  ? "Tipo de transferencia / banco *"
                  : method === "manualCard"
                    ? "Tipo de tarjeta / banco manual *"
                    : "Tipo de tarjeta / banco *"}
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
                <p className="checkout-summary__p">Subtotal:</p>
                <strong className="checkout-summary__strong">
                  {formatearDecimales(existingLog?.subTotal ?? 0)}
                </strong>
              </div>

              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">IVA:</p>
                <strong className="checkout-summary__strong">
                  {formatearDecimales(existingLog?.ivaPantalla ?? 0)}
                </strong>
              </div>

              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">Transporte:</p>
                <strong className="checkout-summary__strong">
                  {formatearDecimales(transpCost || existingLog?.transCost || 0)}
                </strong>
              </div>

              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">Total:</p>
                <strong className="checkout-summary__strong">
                  C$ {formatearDecimales(totalResumen)}
                </strong>
              </div>

              {method === "card" && selectedSavedCard && (
                <div className="checkout-summary__subtitle">
                  <p className="checkout-summary__p">Tarjeta guardada:</p>
                  <strong className="checkout-summary__strong">
                    **** {safeStr(selectedSavedCard.ultimos4)}
                  </strong>
                </div>
              )}

              {method === "manualCard" && safeStr(manualCardData.ultDigito) && (
                <div className="checkout-summary__subtitle">
                  <p className="checkout-summary__p">Tarjeta manual:</p>
                  <strong className="checkout-summary__strong">
                    **** {safeStr(manualCardData.ultDigito)}
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

          {method === "manualCard" && (
            <ManualCardPaymentSection
              value={manualCardData}
              onChange={setManualCardData}
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


          {/* Multipago
          
            - Opcion de seleccionar mas de 1 forma de pago, actualmente solo esta para fija, transferencia, efectivo o tarjetas...

          */}

          <div className="checkout-actionBtn">
            <button
              type="button"
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
              {payNowDisabled ? <AiOutlineLoading3Quarters /> : "Pagar ahora"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};