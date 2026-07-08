import PaymentMethodComponent from "@/Components/ECommerce/Payment/PaymentMethodComponent"

import {
  AGENT_PAYMENT_METHODS
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

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
  CheckoutStep
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

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
  setDivisaSelected: (value: ObtenerDivisaPagosTipoRes | null) => void

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
  setManualCardData: React.Dispatch<React.SetStateAction<ManualCardFormState>>

  /**
   * Total final del carrito para pago.
   */
  totalPagar: number

  /**
   * Costo transporte tomado desde el paso 2.
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
   * Indica si el formulario de pago está completo.
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
  handlePayNow
}: Props) {
  /**
   * Se crea un log visual con los totales frescos.
   * Así el resumen del pago no muestra subtotal/IVA en 0
   * cuando currentLog todavía no está actualizado.
   */
  const logForSummary = {
    ...currentLog,
    subTotal: invoiceTotalsDto?.subTotal ?? currentLog?.subTotal ?? 0,
    ivaPantalla: invoiceTotalsDto?.iva ?? currentLog?.ivaPantalla ?? 0,
    descuentoPantalla:
      invoiceTotalsDto?.descuento ?? currentLog?.DescuentoPantalla ?? 0,
    transCost: transpCost,
    totalEnPantalla: invoiceTotalsDto?.total ?? currentLog?.totalEnPantalla ?? 0
  } as LogCartResponseDto

  return (
    <div className="carPCPanel-stepContent">

    {!method && (
        <p className="cartPanel-paymentHint">
          Selecciona una forma de pago para continuar.
        </p>
      )}

      {method && !canPay && (
        <p className="cartPanel-paymentHint">
          Completa los datos requeridos del método seleccionado.
        </p>
      )}

      <PaymentMethodComponent
        step={"paymentMethod" as CheckoutStep}
        setStep={onBack}
        method={method}
        setMethod={setMethod}
        allowedMethods={AGENT_PAYMENT_METHODS}
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
        ecommerceUserId={0}
        manualCardData={manualCardData}
        setManualCardData={setManualCardData}
        backStep="location"
        payButtonText="Finalizar Pedido"
        showMethodSelector
      />
    </div>
  )
}