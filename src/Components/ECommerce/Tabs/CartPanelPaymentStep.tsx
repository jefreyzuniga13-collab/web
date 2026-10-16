import {
  useEffect,
  type Dispatch,
  type SetStateAction
} from "react"

import PaymentMethodComponent from "@/Components/ECommerce/Payment/PaymentMethodComponent"

import type {
  CheckoutPaymentMethod,
  ManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import type {
  ObtenerDivisaPagosTipoRes
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  CarDto,
  InvoiceTotalsDto
} from "@/Interfaces/Crm/CartPCGInterface"

import type {
  LogCartResponseDto
} from "@/Interfaces/Crm/LogCartInterface"

import type {
  CheckoutStep,
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import type {
  PagoSeleccionado
} from "@/Interfaces/Ecommerce/MultiPagoTypes"
import type { MonedaCatalogo } from "@/Interfaces/Ecommerce/MonedaCatalogo"

interface Props {
  /**
   * Método de pago seleccionado por el agente.
   */
  method: CheckoutPaymentMethod | null

  /**
   * Actualiza el método de pago.
   */
  setMethod: (method: CheckoutPaymentMethod | null) => void

  /**
   * Opciones de banco/tipo de pago según el método.
   */
  divisaOpts: ObtenerDivisaPagosTipoRes[]

  /**
   * Opción seleccionada de banco/tipo de pago.
   */
  divisaSelected: ObtenerDivisaPagosTipoRes | null

  /**
   * Actualiza banco/tipo de pago.
   */
  setDivisaSelected: (
    value: ObtenerDivisaPagosTipoRes | null
  ) => void

  /**
   * Indica si se están cargando las opciones de pago.
   */
  divisaLoading: boolean

  /**
   * Monto recibido en efectivo.
   */
  cashAmount: number

  /**
   * Actualiza monto recibido en efectivo.
   */
  setCashAmount: (value: number) => void

  /**
   * Referencia de transferencia.
   */
  transfer: string

  /**
   * Actualiza referencia de transferencia.
   */
  setTransfer: (value: string) => void

  /**
   * Datos de tarjeta manual.
   */
  manualCardData: ManualCardFormState

  /**
   * Actualiza datos de tarjeta manual.
   */
  setManualCardData: Dispatch<
    SetStateAction<ManualCardFormState>
  >

  /**
   * Total final del carrito para pago.
   */
  totalPagar: number

  /**
   * Costo de transporte tomado desde el paso 2.
   */
  transpCost: number

  /**
   * Totales frescos calculados desde PCG.
   */
  invoiceTotalsDto: InvoiceTotalsDto | null

  /**
   * Carrito actual.
   */
  carPCG: CarDto[]

  /**
   * Log actual del carrito.
   */
  currentLog: LogCartResponseDto | null

  /**
   * Indica si hay proceso de pago en curso.
   */
  payLoading: boolean

  /**
   * Indica si las acciones generales están bloqueadas.
   */
  actionsDisabled: boolean

  /**
   * Indica si el formulario de pago único está completo.
   */
  canPay: boolean

  /**
   * Regresa al paso de entrega.
   */
  onBack: () => void

  /**
   * Procesa la venta desde el agente.
   */
  handlePayNow: () => Promise<void>

  /**
   * Indica si la empresa permite multipago.
   *
   * Este valor viene de la sesión autenticada del agente.
   */
  permiteMultiPago: boolean

  /**
   * Indica si el modo multipago está activo.
   */
  multiPagoActivo: boolean

  /**
   * Activa o desactiva el modo multipago.
   */
  setMultiPagoActivo: (value: boolean) => void

  /**
   * Pagos agregados en multipago.
   */
  pagosMultiples: PagoSeleccionado[]

  /**
   * Actualiza los pagos agregados en multipago.
   */
  setPagosMultiples: Dispatch<
    SetStateAction<PagoSeleccionado[]>
  >

  /**
   * Formas de pago disponibles desde PCG.
   */
  currency: Currencyto[]

  /**
   * Carga bancos o tipos de pago para multipago.
   */
  cargarDivisas: (
    item: Currencyto
  ) => Promise<ObtenerDivisaPagosTipoRes[]>

  aplicaMultiMoneda?: boolean
  monedas?: MonedaCatalogo[]
  monedaSeleccionada?: MonedaCatalogo | null
  onChangeMoneda?: (moneda: MonedaCatalogo) => void
  tasaCambio?: number
  monedaLoading?: boolean
}

export default function CartPanelPaymentStep({
  method,
  setMethod,
  divisaOpts,
  divisaSelected,
  setDivisaSelected,
  divisaLoading,
  cashAmount,
  setCashAmount,
  transfer,
  setTransfer,
  manualCardData,
  setManualCardData,
  totalPagar,
  transpCost,
  invoiceTotalsDto,
  carPCG,
  currentLog,
  payLoading,
  actionsDisabled,
  canPay,
  onBack,
  handlePayNow,
  permiteMultiPago,
  multiPagoActivo,
  setMultiPagoActivo,
  pagosMultiples,
  setPagosMultiples,
  currency,
  cargarDivisas,
  aplicaMultiMoneda = false,
  monedas = [],
  monedaSeleccionada = null,
  onChangeMoneda,
  tasaCambio,
  monedaLoading = false
}: Props) {
  /**
   * Multipago solo se considera activo cuando:
   * - el estado local está activo;
   * - la empresa realmente lo permite.
   *
   * Esto evita que un estado inconsistente renderice MultiPagoSection.
   */
  const multipagoHabilitado =
    permiteMultiPago && multiPagoActivo

  /**
   * Si la sesión indica que la empresa no permite multipago,
   * se fuerza el regreso a pago único y se limpian los pagos parciales.
   */
  useEffect(() => {
    if (permiteMultiPago || !multiPagoActivo) return

    setMultiPagoActivo(false)
    setPagosMultiples([])
  }, [
    permiteMultiPago,
    multiPagoActivo,
    setMultiPagoActivo,
    setPagosMultiples
  ])

  /**
   * Se crea un log visual con los totales frescos.
   *
   * Así el resumen del pago no muestra subtotal, IVA o total en 0 cuando
   * currentLog todavía no está actualizado.
   */
  const logForSummary = {
    ...currentLog,
    subTotal:
      invoiceTotalsDto?.subTotal ??
      currentLog?.subTotal ??
      0,
    ivaPantalla:
      invoiceTotalsDto?.iva ??
      currentLog?.ivaPantalla ??
      0,
    DescuentoPantalla:
      invoiceTotalsDto?.descuento ??
      currentLog?.descuentoPantalla ??
      0,
    transCost: transpCost,
    totalEnPantalla:
      invoiceTotalsDto?.total ??
      currentLog?.totalEnPantalla ??
      0
  } as LogCartResponseDto

  const handleChangeModoPago = (value: boolean) => {
    if (value && !permiteMultiPago) {
      setMultiPagoActivo(false)
      setPagosMultiples([])
      return
    }

    setMultiPagoActivo(value)

    if (value) {
      setMethod(null)
      setDivisaSelected(null)
      return
    }

    setPagosMultiples([])
  }

  return (
    <div className="carPCPanel-stepContent">
      {permiteMultiPago && (
        <div className="checkout-payment-mode">
          <label
            className={
              !multipagoHabilitado
                ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                : "checkout-payment-mode__option"
            }
          >
            <input
              type="radio"
              name="agentPaymentMode"
              checked={!multipagoHabilitado}
              onChange={() => handleChangeModoPago(false)}
              disabled={actionsDisabled || payLoading}
            />

            <span className="checkout-payment-mode__content">
              <strong>Pago único</strong>
              <small>Usa una sola forma de pago.</small>
            </span>
          </label>

          <label
            className={
              multipagoHabilitado
                ? "checkout-payment-mode__option checkout-payment-mode__option--active"
                : "checkout-payment-mode__option"
            }
          >
            <input
              type="radio"
              name="agentPaymentMode"
              checked={multipagoHabilitado}
              onChange={() => handleChangeModoPago(true)}
              disabled={actionsDisabled || payLoading}
            />

            <span className="checkout-payment-mode__content">
              <strong>Multipago</strong>
              <small>
                Usa varias formas de pago en la misma factura.
              </small>
            </span>
          </label>
        </div>
      )}

      {!multipagoHabilitado && !method && (
        <p className="cartPanel-paymentHint">
          Selecciona una forma de pago para continuar.
        </p>  
      )}

      {!multipagoHabilitado && method && !canPay && (
        <p className="cartPanel-paymentHint">
          Completa los datos requeridos del método seleccionado.
        </p>
      )}

      {multipagoHabilitado && pagosMultiples.length === 0 && (
        <p className="cartPanel-paymentHint">
          Agrega las formas de pago para completar el total de la factura.
        </p>
      )}

      <PaymentMethodComponent
        step={"paymentMethod" as CheckoutStep}
        setStep={() => onBack()}
        method={method}
        setMethod={setMethod}
        allowedMethods={[]}
        paymentOptions={currency}
        agentPaymentFlow
        transpCost={transpCost}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        transfer={transfer}
        setTransfer={setTransfer}
        payNowDisabled={actionsDisabled || payLoading}
        payNowLock={payLoading}
        handlePayNow={handlePayNow}
        divisaLoading={divisaLoading}
        divisaOpts={divisaOpts}
        divisaSelected={divisaSelected}
        setDivisaSelected={setDivisaSelected}
        carPCG={carPCG}
        totalPagar={totalPagar}
        existingLog={logForSummary}
        invoiceTotalsDto={invoiceTotalsDto}
        ecommerceUserId={0}
        manualCardData={manualCardData}
        setManualCardData={setManualCardData}
        backStep="location"
        payButtonText="Finalizar Pedido"
        showMethodSelector={!multipagoHabilitado}
        showBackButton={false}
        multiPagoActivo={multipagoHabilitado}
        pagosMultiples={pagosMultiples}
        setPagosMultiples={setPagosMultiples}
        currency={currency}
        cargarDivisas={cargarDivisas}
        aplicaMultiMoneda={aplicaMultiMoneda}
        monedas={monedas}
        monedaSeleccionada={monedaSeleccionada}
        onChangeMoneda={onChangeMoneda}
        tasaCambio={tasaCambio}
        monedaLoading={monedaLoading}
      />
    </div>
  )
}
