import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { TbRosetteDiscountCheck } from "react-icons/tb";
import { CustomConfirmModal } from "@/Services/Components/Common/CustomConfirmModal";
import PaymentMethodSelector from "@/Services/Components/ECommerce/Payment/PaymentMethodSelector";
import PaymentCurrencySelect from "@/Services/Components/ECommerce/Payment/PaymentCurrencySelect";
import PaymentFormRenderer from "@/Services/Components/ECommerce/Payment/PaymentFormRenderer";
import MultiPagoSection from "@/Services/Components/ECommerce/Payment/MultiPagoSection";
import type {CheckoutStep, Currencyto,} from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import type { CarDto, InvoiceTotalsDto,} from "@/Interfaces/Crm/CartPCGInterface";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import type { TarjetaModelInterface } from "@/Interfaces/Ecommerce/TarjetaInterface";
import type { CheckoutPaymentMethod, ManualCardFormState,} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface";
import type { PagoSeleccionado } from "@/Interfaces/Ecommerce/MultiPagoTypes";
import PaymentMonedaSelect from "@/Services/Components/ECommerce/Payment/PaymentMonedaSelect"
import type { MonedaCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"
import { validarPagosSeleccionados } from "@/Utils/ECommerce/pagoFacturaUtils";
import { convertirDesdeCordoba, cubreMontoPago, esMonedaDolar, simboloMoneda } from "@/Utils/ECommerce/monedaUtils"
import { safeStr } from "@/Utils/ECommerce/formatters";
import { safeNumber, deriveTransportePantalla } from "@/Utils/ECommerce/utils";
import MoneyAmount from "@/Services/Components/ECommerce/Payment/MoneyAmount";
import "@/Styles/Ecommerce/Payment/PaymentMethodComponent.css";
import "@/Styles/Ecommerce/Payment/PaymentBrandTiles.css";

interface Props {
  /**
   * Paso actual del checkout.
   * El componente solo renderiza cuando el paso es paymentMethod.
   */
  step: CheckoutStep;

  /**
   * Regresa o cambia de paso.
   */
  setStep: (step: CheckoutStep | string) => void;

  /**
   * Método de pago seleccionado.
   */
  method: CheckoutPaymentMethod | null;

  /**
   * Actualiza el método de pago seleccionado.
   */
  setMethod: (method: CheckoutPaymentMethod | null) => void;

  /**
   * Métodos permitidos para el flujo actual.
   */
  allowedMethods: CheckoutPaymentMethod[];

  /**
   * Costo de transporte final.
   */
  transpCost: number;

  /**
   * Distancia en kilómetros, si aplica.
   */
  distanceKm?: number;

  /**
   * Propina, si aplica.
   */
  tip?: number;

  /**
   * Actualiza propina, si aplica.
   */
  setTip?: (tip: number) => void;

  /**
   * Monto recibido en efectivo.
   */
  cashAmount: number;

  /**
   * Actualiza monto recibido en efectivo.
   */
  setCashAmount: (cashAmount: number) => void;

  /**
   * Referencia de transferencia.
   */
  transfer: string;

  /**
   * Actualiza referencia de transferencia.
   */
  setTransfer: (transfer: string) => void;

  /**
   * Bloquea el botón de procesar pago.
   *
   * No debe bloquear el selector de método.
   */
  payNowDisabled: boolean;

  /**
   * Bloqueo por proceso de pago en curso.
   */
  payNowLock: boolean;

  /**
   * Acción final de pago.
   */
  handlePayNow: () => void | Promise<void>;

  /**
   * Indica si se cargan bancos/tipos de pago.
   */
  divisaLoading: boolean;

  /**
   * Opciones de banco/tipo de pago.
   */
  divisaOpts: ObtenerDivisaPagosTipoRes[];

  /**
   * Banco/tipo de pago seleccionado.
   */
  divisaSelected: ObtenerDivisaPagosTipoRes | null;

  /**
   * Actualiza banco/tipo de pago.
   */
  setDivisaSelected: (value: ObtenerDivisaPagosTipoRes | null) => void;

  /**
   * Carrito actual.
   */
  carPCG?: CarDto[];

  /**
   * Total final a pagar.
   */
  totalPagar: number;

  /**
   * LogCart actual.
   */
  existingLog: LogCartResponseDto | null;

  /**
   * Totales frescos calculados por PCG.
   */
  invoiceTotalsDto?: InvoiceTotalsDto | null;

  /**
   * Id de usuario ecommerce.
   */
  ecommerceUserId?: number;

  /**
   * Selección de tarjeta guardada.
   * Solo aplica para gatewayCard.
   */
  onSelectCard?: (card: TarjetaModelInterface | null) => void;

  /**
   * Datos de tarjeta manual.
   */
  manualCardData: ManualCardFormState;

  /**
   * Actualiza datos de tarjeta manual.
   */
  setManualCardData: Dispatch<SetStateAction<ManualCardFormState>>;

  /**
   * Paso al que se regresa.
   */
  backStep?: CheckoutStep | string;

  /**
   * Texto del botón final.
   */
  payButtonText?: string;

  /**
   * Indica si se muestra el selector de métodos.
   */
  showMethodSelector?: boolean;

  /**
   * Indica si se muestra el botón regresar.
   */
  showBackButton?: boolean;

  /**
   * Indica si el modo multipago está activo.
   */
  multiPagoActivo?: boolean;

  /**
   * Pagos agregados en multipago.
   */
  pagosMultiples?: PagoSeleccionado[];

  /**
   * Actualiza los pagos agregados en multipago.
   */
  setPagosMultiples?: Dispatch<SetStateAction<PagoSeleccionado[]>>;

  /**
   * Formas de pago disponibles desde PCG.
   */
  currency?: Currencyto[];

  /**
   * Carga bancos o tipos de pago para multipago.
   */
  cargarDivisas?: (item: Currencyto) => Promise<ObtenerDivisaPagosTipoRes[]>;

  aplicaMultiMoneda?: boolean;
  monedas?: MonedaCatalogo[];
  monedaSeleccionada?: MonedaCatalogo | null;
  onChangeMoneda?: (moneda: MonedaCatalogo) => void;
  tasaCambio?: number;
  monedaLoading?: boolean;

  /**
   * Oculta el título interno cuando el shell público ya muestra el hero.
   */
  hideTitle?: boolean;
  paymentOptions?: Currencyto[];
  agentPaymentFlow?: boolean;
}

export default function PaymentMethodComponent({
  step,
  setStep,
  method,
  setMethod,
  allowedMethods,
  transpCost,
  cashAmount,
  setCashAmount,
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
  invoiceTotalsDto = null,
  ecommerceUserId = 0,
  onSelectCard,
  manualCardData,
  setManualCardData,
  backStep = "currency",
  payButtonText = "Pagar ahora",
  showMethodSelector = true,
  showBackButton = true,
  multiPagoActivo = false,
  pagosMultiples = [],
  setPagosMultiples,
  currency = [],
  cargarDivisas,
  aplicaMultiMoneda = false,
  monedas = [],
  monedaSeleccionada = null,
  onChangeMoneda,
  tasaCambio,
  monedaLoading = false,
  hideTitle = false,
  paymentOptions,
  agentPaymentFlow = false,
}: Props) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  /**
   * Estos métodos necesitan seleccionar banco, tarjeta o tipo de pago.
   * Efectivo no lo requiere.
   */
  const showDivisaSelect =
    !multiPagoActivo &&
    (method === "transfer" ||
      method === "manualCard" ||
      method === "gatewayCard");

  /**
   * Valida referencia de transferencia.
   */
  const transferRefOk = useMemo(() => {
    if (method !== "transfer") return true;

    const ref = safeStr(transfer);

    if (!ref) return false;

    return /^[A-Za-z0-9-]{4,40}$/.test(ref);
  }, [method, transfer]);

  /**
   * Valida datos mínimos de tarjeta manual.
   */
  const manualCardOk = useMemo(() => {
    if (method !== "manualCard") return true;

    return (
      !!safeStr(manualCardData.tarjetahabiente) &&
      !!safeStr(manualCardData.tarjeta) &&
      safeStr(manualCardData.ultDigito).length === 4 &&
      !!safeStr(manualCardData.fechaVence)
    );
  }, [method, manualCardData]);

  /**
   * Valida efectivo.
   */
  const totalEnMonedaPago = useMemo(() => {
    return convertirDesdeCordoba(
      safeNumber(totalPagar, 0),
      esMonedaDolar(monedaSeleccionada),
      tasaCambio
    );
  }, [totalPagar, monedaSeleccionada, tasaCambio]);

  const cashOk = useMemo(() => {
    if (method !== "cash") return true;

    return cubreMontoPago(cashAmount, totalEnMonedaPago);
  }, [method, cashAmount, totalEnMonedaPago]);

  useEffect(() => {
    if (method !== "cash" || multiPagoActivo) return
    if (totalEnMonedaPago <= 0) return

    setCashAmount(Number(totalEnMonedaPago.toFixed(2)))
  }, [method, monedaSeleccionada?.id, multiPagoActivo, setCashAmount, totalEnMonedaPago])

  /**
   * Valida el multipago completo.
   *
   * Permite que el último pago en efectivo supere el pendiente
   * para registrar el vuelto.
   */
  const multipagoOk = useMemo(() => {
    if (!multiPagoActivo) return true;

    return (
      validarPagosSeleccionados(
        pagosMultiples,
        safeNumber(totalPagar, 0),
        tasaCambio
      ) === null
    );
  }, [multiPagoActivo, pagosMultiples, totalPagar, tasaCambio]);

  /**
   * Habilita únicamente el botón final.
   */
  const canPressPay = multiPagoActivo
    ? !payNowDisabled && !payNowLock && multipagoOk
    : !!method &&
      !payNowDisabled &&
      !payNowLock &&
      (showDivisaSelect ? !!divisaSelected : true) &&
      (method === "transfer" ? transferRefOk : true) &&
      (method === "manualCard" ? manualCardOk : true) &&
      (method === "cash" ? cashOk : true);

  const totalResumen = useMemo(() => {
    return safeNumber(totalPagar, 0);
  }, [totalPagar]);

  /**
   * Se toman primero los totales frescos.
   * Si no vienen, se usa existingLog como respaldo.
   * El total mostrado debe coincidir con totalPagar (mismo que el carrito).
   */
  const resumen = useMemo(() => {
    const subTotal = safeNumber(
      invoiceTotalsDto?.subTotal ?? existingLog?.subTotal ?? 0,
      0
    )
    const descuento = safeNumber(
      invoiceTotalsDto?.descuento ?? existingLog?.descuentoPantalla ?? 0,
      0
    )
    const iva = safeNumber(
      invoiceTotalsDto?.iva ?? existingLog?.ivaPantalla ?? 0,
      0
    )
    const transporte = safeNumber(
      invoiceTotalsDto?.transporte ??
        (existingLog
          ? deriveTransportePantalla(existingLog)
          : undefined) ??
        transpCost ??
        0,
      0
    )

    const totalDesdePartes = Math.max(
      0,
      subTotal - descuento + iva + transporte
    )
    const totalLog = safeNumber(
      invoiceTotalsDto?.total ?? existingLog?.totalEnPantalla ?? 0,
      0
    )

    return {
      subTotal,
      descuento,
      iva,
      transporte,
      total:
        totalResumen > 0
          ? totalResumen
          : totalLog > 0
            ? totalLog
            : totalDesdePartes
    }
  }, [invoiceTotalsDto, existingLog, transpCost, totalResumen])

  const divisaLabel = useMemo(() => {
    if (method === "transfer") return "Tipo de transferencia / banco *";
    if (method === "manualCard") return "Tipo de tarjeta / banco manual *";
    if (method === "gatewayCard") return "Tipo de tarjeta / banco *";

    return "Tipo de pago / banco *";
  }, [method]);

  if (step !== "paymentMethod") {
    return null;
  }

  // Funciones para manejar la apertura y cierre
  const handleOpenConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const handleConfirmPay = () => {
    setIsConfirmModalOpen(false);
    handlePayNow(); // Llama a la función que procesa el pago real
  };

  return (
    <div className="checkout-section">
      {!hideTitle && (
        <h2 className="checkout-section__title">Pago y confirmar venta</h2>
      )}

      {!multiPagoActivo && showMethodSelector && (
        <PaymentMethodSelector
          value={method}
          methods={allowedMethods}
          options={paymentOptions?.filter((option) =>
            !agentPaymentFlow || safeStr(option.codPago).toUpperCase() !== "PAS"
          )}
          resolveMethod={(option) => {
            const code = safeStr(option.codPago).toUpperCase()
            if (code === "1") return "cash"
            if (code === "STR") return "transfer"
            if (code === "STA") return "manualCard"
            return null
          }}
          onChange={(nextMethod) => {
            setMethod(nextMethod);
            setDivisaSelected(null);
          }}
          disabled={payNowLock}
        />
      )}

      {!multiPagoActivo && !method && (
        <p className="checkout-payment-hint">
          Selecciona una forma de pago para continuar.
        </p>
      )}

      {!multiPagoActivo && method && showDivisaSelect && (
        <PaymentCurrencySelect
          divisaOpts={divisaOpts}
          divisaSelected={divisaSelected}
          setDivisaSelected={setDivisaSelected}
          divisaLoading={divisaLoading}
          label={divisaLabel}
          disabled={payNowLock}
        />
      )}

      {carPCG && carPCG.length > 0 && (
        <aside className="checkout-summary">
          <p className="checkout-summary__title">Resumen</p>

          {resumen.subTotal > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">Subtotal</p>
              <strong className="checkout-summary__strong">
                <MoneyAmount amount={resumen.subTotal} />
              </strong>
            </div>
          )}

          {resumen.descuento > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">Descuento</p>
              <strong className="checkout-summary__strong">
                <MoneyAmount amount={resumen.descuento} />
              </strong>
            </div>
          )}

          {resumen.iva > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">IVA</p>
              <strong className="checkout-summary__strong">
                <MoneyAmount amount={resumen.iva} />
              </strong>
            </div>
          )}

          {resumen.transporte > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">Transporte</p>
              <strong className="checkout-summary__strong">
                <MoneyAmount amount={resumen.transporte} />
              </strong>
            </div>
          )}

          <div className="checkout-summary__subtitle checkout-summary__subtitle--total">
            <p className="checkout-summary__p">Total</p>
            <strong className="checkout-summary__strong checkout-summary__strong--total">
              <MoneyAmount amount={resumen.total} />
            </strong>
          </div>

          {aplicaMultiMoneda && esMonedaDolar(monedaSeleccionada) && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">Equivalente</p>
              <strong className="checkout-summary__strong">
                <MoneyAmount
                  amount={totalEnMonedaPago}
                  symbol={simboloMoneda(monedaSeleccionada)}
                />
              </strong>
            </div>
          )}

          {!multiPagoActivo &&
            method === "manualCard" &&
            safeStr(manualCardData.ultDigito) && (
              <div className="checkout-summary__subtitle">
                <p className="checkout-summary__p">Tarjeta manual</p>
                <strong className="checkout-summary__strong">
                  **** {safeStr(manualCardData.ultDigito)}
                </strong>
              </div>
            )}
        </aside>
      )}

      {!multiPagoActivo &&
        aplicaMultiMoneda &&
        onChangeMoneda &&
        method !== "gatewayCard" && (
        <PaymentMonedaSelect
          monedas={monedas}
          monedaSeleccionada={monedaSeleccionada}
          onChange={onChangeMoneda}
          disabled={payNowLock}
          loading={monedaLoading}
        />
      )}

      {multiPagoActivo ? (
        setPagosMultiples && cargarDivisas ? (
          <MultiPagoSection
            currency={currency}
            totalPagar={totalPagar}
            pagos={pagosMultiples}
            setPagos={setPagosMultiples}
            cargarDivisas={cargarDivisas}
            disabled={payNowLock}
            aplicaMultiMoneda={aplicaMultiMoneda}
            monedas={monedas}
            monedaSeleccionada={monedaSeleccionada}
            onChangeMoneda={onChangeMoneda}
            tasaCambio={tasaCambio}
            monedaLoading={monedaLoading}
            agentPaymentFlow={agentPaymentFlow}
          />
        ) : (
          <p className="checkout-payment-hint">
            No se pudo inicializar el multipago.
          </p>
        )
      ) : (
        <PaymentFormRenderer
          method={method}
          totalPagar={totalEnMonedaPago}
          simboloMoneda={simboloMoneda(monedaSeleccionada)}
          cashAmount={cashAmount}
          setCashAmount={setCashAmount}
          transfer={transfer}
          setTransfer={setTransfer}
          transferRefOk={transferRefOk}
          manualCardData={manualCardData}
          setManualCardData={setManualCardData}
          ecommerceUserId={ecommerceUserId}
          onSelectCard={onSelectCard}
        />
      )}


      {/* Desceunto */}
        
      <div className="checkout-actionBtn">
        {showBackButton && (
          <button
            type="button"
            className={`checkout-paybtn__back`}
            onClick={() => setStep(backStep)}
            disabled={payNowLock}
          >
            Regresar
          </button>
        )}

        {/* Botón que ahora abre el modal en lugar de pagar directamente */}
        <button
          type="button"
          className={`checkout-paybtn checkout-paybtn--pay ${!showBackButton ? "showBackButton" : ""}`}
          onClick={handleOpenConfirmModal}
          disabled={!canPressPay}
        >
          {payNowLock ? (
            <AiOutlineLoading3Quarters className="animate-spin" />
          ) : (
            <>
              {payButtonText} <TbRosetteDiscountCheck fontSize={24} />
            </>
          )}
        </button>

        {/* Renderizado condicional del modal */}
        {isConfirmModalOpen && (
          <CustomConfirmModal
            title="¿Finalizar pedido?"
            subtitle="Para crear su pedido, haga clic en confirmar. En caso de equivocación, haga clic en cancelar para cerrar el modal."
            onConfirm={handleConfirmPay}
            onCancel={handleCloseConfirmModal}
          />
        )}
      </div>
    </div>
  );
}
