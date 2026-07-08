import { useMemo } from "react"
import { AiOutlineLoading3Quarters } from "react-icons/ai"

import PaymentMethodSelector from "@/Components/ECommerce/Payment/PaymentMethodSelector"
import PaymentCurrencySelect from "@/Components/ECommerce/Payment/PaymentCurrencySelect"
import PaymentFormRenderer from "@/Components/ECommerce/Payment/PaymentFormRenderer"

import type {
  CheckoutStep
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

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
  TarjetaModelInterface
} from "@/Interfaces/Ecommerce/TarjetaInterface"

import type {
  CheckoutPaymentMethod,
  ManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import { safeStr } from "@/Utils/ECommerce/formatters"
import { safeNumber } from "@/Utils/ECommerce/utils"
import { formatearDecimales } from "@/Utils/calcularIVA"

import "@/Styles/Ecommerce/Payment/PaymentMethodComponent.css"
import { TbRosetteDiscountCheck } from "react-icons/tb"

interface Props {
  /**
   * Paso actual del checkout.
   * El componente solo renderiza cuando el paso es paymentMethod.
   */
  step: CheckoutStep

  /**
   * Regresa o cambia de paso.
   */
  setStep: (step: CheckoutStep | string) => void

  /**
   * Método de pago seleccionado.
   */
  method: CheckoutPaymentMethod | null

  /**
   * Actualiza el método de pago seleccionado.
   */
  setMethod: (method: CheckoutPaymentMethod | null) => void

  /**
   * Métodos permitidos para el flujo actual.
   *
   * Agente:
   * cash, transfer, manualCard.
   *
   * Cliente:
   * cash, transfer, manualCard, gatewayCard.
   */
  allowedMethods: CheckoutPaymentMethod[]

  /**
   * Costo de transporte final.
   */
  transpCost: number

  /**
   * Distancia en kilómetros, si aplica.
   */
  distanceKm?: number

  /**
   * Propina, si aplica.
   */
  tip?: number

  /**
   * Actualiza propina, si aplica.
   */
  setTip?: (tip: number) => void

  /**
   * Monto recibido en efectivo.
   */
  cashAmount: number

  /**
   * Actualiza monto recibido en efectivo.
   */
  setCashAmount: (cashAmount: number) => void

  /**
   * Referencia de transferencia.
   */
  transfer: string

  /**
   * Actualiza referencia de transferencia.
   */
  setTransfer: (transfer: string) => void

  /**
   * Bloquea el botón de procesar pago.
   *
   * Importante:
   * Esto NO debe bloquear el selector de método, porque si se usa
   * !canPay aquí, nunca se podría seleccionar el primer método.
   */
  payNowDisabled: boolean

  /**
   * Bloqueo por proceso de pago en curso.
   */
  payNowLock: boolean

  /**
   * Acción final de pago.
   */
  handlePayNow: () => void | Promise<void>

  /**
   * Indica si se cargan bancos/tipos de pago.
   */
  divisaLoading: boolean

  /**
   * Opciones de banco/tipo de pago.
   */
  divisaOpts: ObtenerDivisaPagosTipoRes[]

  /**
   * Banco/tipo de pago seleccionado.
   */
  divisaSelected: ObtenerDivisaPagosTipoRes | null

  /**
   * Actualiza banco/tipo de pago.
   */
  setDivisaSelected: (value: ObtenerDivisaPagosTipoRes | null) => void

  /**
   * Carrito actual.
   */
  carPCG?: CarDto[]

  /**
   * Total final a pagar.
   */
  totalPagar: number

  /**
   * LogCart actual.
   */
  existingLog: LogCartResponseDto | null

  /**
   * Totales frescos calculados por PCG.
   *
   * Se usa para evitar mostrar subtotal/IVA en 0 cuando el LogCart
   * todavía no se ha actualizado.
   */
  invoiceTotalsDto?: InvoiceTotalsDto | null

  /**
   * Id de usuario ecommerce.
   */
  ecommerceUserId?: number

  /**
   * Selección de tarjeta guardada.
   * Solo aplica para gatewayCard.
   */
  onSelectCard?: (card: TarjetaModelInterface | null) => void

  /**
   * Datos de tarjeta manual.
   */
  manualCardData: ManualCardFormState

  /**
   * Actualiza datos de tarjeta manual.
   */
  setManualCardData: React.Dispatch<React.SetStateAction<ManualCardFormState>>

  /**
   * Paso al que se regresa.
   */
  backStep?: CheckoutStep | string

  /**
   * Texto del botón final.
   */
  payButtonText?: string

  /**
   * Indica si se muestra el selector de métodos.
   */
  showMethodSelector?: boolean


  showBackButton?: boolean
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
  showBackButton = false
}: Props) {
  /**
   * Estos métodos necesitan seleccionar banco, tarjeta o tipo de pago.
   * Efectivo no lo requiere.
   */
  const showDivisaSelect =
    method === "transfer" ||
    method === "manualCard" ||
    method === "gatewayCard"

  /**
   * Valida referencia de transferencia.
   */
  const transferRefOk = useMemo(() => {
    if (method !== "transfer") return true

    const ref = safeStr(transfer)

    if (!ref) return false

    return /^[A-Za-z0-9-]{4,40}$/.test(ref)
  }, [method, transfer])

  /**
   * Valida datos mínimos de tarjeta manual.
   */
  const manualCardOk = useMemo(() => {
    if (method !== "manualCard") return true

    return (
      !!safeStr(manualCardData.tarjetahabiente) &&
      !!safeStr(manualCardData.tarjeta) &&
      safeStr(manualCardData.ultDigito).length === 4 &&
      !!safeStr(manualCardData.fechaVence)
    )
  }, [method, manualCardData])

  /**
   * Valida efectivo.
   *
   * En el flujo del agente y cliente, efectivo debe cubrir el total.
   */
  const cashOk = useMemo(() => {
    if (method !== "cash") return true

    return safeNumber(cashAmount, 0) >= safeNumber(totalPagar, 0)
  }, [method, cashAmount, totalPagar])

  /**
   * Habilita únicamente el botón final.
   *
   * No se usa para bloquear el selector, porque al inicio method es null
   * y bloquearía la selección de pago.
   */
  const canPressPay =
    !!method &&
    !payNowDisabled &&
    !payNowLock &&
    (showDivisaSelect ? !!divisaSelected : true) &&
    (method === "transfer" ? transferRefOk : true) &&
    (method === "manualCard" ? manualCardOk : true) &&
    (method === "cash" ? cashOk : true)

  const totalResumen = useMemo(() => {
    return safeNumber(totalPagar, 0)
  }, [totalPagar])

  /**
   * Se toman primero los totales frescos.
   * Si no vienen, se usa existingLog como respaldo.
   */
  const resumen = useMemo(() => {
    return {
      subTotal: safeNumber(
        invoiceTotalsDto?.subTotal ?? existingLog?.subTotal ?? 0,
        0
      ),
      descuento: safeNumber(
        invoiceTotalsDto?.descuento ?? existingLog?.DescuentoPantalla ?? 0,
        0
      ),
      iva: safeNumber(
        invoiceTotalsDto?.iva ?? existingLog?.ivaPantalla ?? 0,
        0
      ),
      transporte: safeNumber(
        transpCost || existingLog?.transCost || 0,
        0
      ),
      total: totalResumen
    }
  }, [
    invoiceTotalsDto,
    existingLog,
    transpCost,
    totalResumen
  ])

  const divisaLabel = useMemo(() => {
    if (method === "transfer") return "Tipo de transferencia / banco *"
    if (method === "manualCard") return "Tipo de tarjeta / banco manual *"
    if (method === "gatewayCard") return "Tipo de tarjeta / banco *"

    return "Tipo de pago / banco *"
  }, [method])

  if (step !== "paymentMethod") {
    return null
  }

  return (
    <div className="checkout-section">
      <h2 className="checkout-section__title">
        Pago y confirmar venta
      </h2>

      {showMethodSelector && (
        <PaymentMethodSelector
          value={method}
          methods={allowedMethods}
          onChange={(nextMethod) => {
            /**
             * Al cambiar método se limpia la divisa seleccionada.
             * El hook padre se encarga de volver a cargar las opciones.
             */
            setMethod(nextMethod)
            setDivisaSelected(null)
          }}
          disabled={payNowLock}
        />
      )}

      {!method && (
        <p className="checkout-payment-hint">
          Selecciona una forma de pago para continuar.
        </p>
      )}

      {method && showDivisaSelect && (
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
              <p className="checkout-summary__p">Subtotal:</p>
              <strong className="checkout-summary__strong">
                C$ {formatearDecimales(resumen.subTotal)}
              </strong>
            </div>
          )}

          {resumen.descuento > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">Descuento:</p>
              <strong className="checkout-summary__strong">
                C$ {formatearDecimales(resumen.descuento)}
              </strong>
            </div>
          )}

          {resumen.iva > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">IVA:</p>
              <strong className="checkout-summary__strong">
                C$ {formatearDecimales(resumen.iva)}
              </strong>
            </div>
          )}

          {resumen.transporte > 0 && (
            <div className="checkout-summary__subtitle">
              <p className="checkout-summary__p">Transporte:</p>
              <strong className="checkout-summary__strong">
                C$ {formatearDecimales(resumen.transporte)}
              </strong>
            </div>
          )}

          <div className="checkout-summary__subtitle">
            <p className="checkout-summary__p">Total:</p>
            <strong className="checkout-summary__strong">
              C$ {formatearDecimales(resumen.total)}
            </strong>
          </div>

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

      <PaymentFormRenderer
        method={method}
        totalPagar={totalPagar}
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

      <div className="checkout-actionBtn">
       {
        showBackButton && (
           <button
              type="button"
              className="checkout-paybtn__back"
              onClick={() => setStep(backStep)}
              disabled={payNowLock}
            >
          Regresar
        </button>
        )
       }

        <button
          type="button"
          className={`checkout-paybtn ${!showBackButton ? "showBackButton" : ""}`}
          onClick={handlePayNow}
          disabled={!canPressPay}
        >
          {payNowLock ? (
            <AiOutlineLoading3Quarters />
          ) : (
            <>
               {payButtonText} <TbRosetteDiscountCheck fontSize={24}/>
            </>
          )}
        </button>
      </div>
    </div>
  )
}