import { useMemo, useState } from "react"
import type {
  CheckoutPaymentMethod,
  CheckoutPaymentState,
  ManualCardFormState,
  PaymentSource
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import {
  initialManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import type {
  ObtenerDivisaPagosTipoRes
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  TarjetaModelInterface
} from "@/Interfaces/Ecommerce/TarjetaInterface"

import { safePositiveNumber } from "@/Utils/ECommerce/utils"
import { safeStr } from "@/Utils/ECommerce/formatters"
import { cubreMontoPago } from "@/Utils/ECommerce/monedaUtils"

type Params = {
  /**
   * Indica desde dónde se está procesando el pago.
   *
   * agent:
   * Pago procesado directamente por el agente desde el CartTab.
   *
   * customerLink:
   * Pago procesado por el cliente desde el link de checkout.
   */
  source: PaymentSource

  /**
   * Total final que debe pagar el cliente.
   * Se usa para validaciones de efectivo, transferencia y resumen del estado.
   */
  totalPagar: number

  /**
   * Total expresado en la moneda seleccionada del pago.
   * Si no se envía, se usa totalPagar (córdobas).
   */
  totalEnMonedaPago?: number

  /**
   * Método de pago inicial.
   * Es opcional porque normalmente el usuario selecciona el método en pantalla.
   */
  initialMethod?: CheckoutPaymentMethod | null
}

export function useCheckoutPaymentState({
  source,
  totalPagar,
  totalEnMonedaPago,
  initialMethod = null
}: Params) {
  const totalEfectivo = totalEnMonedaPago ?? totalPagar
  /**
   * Método de pago seleccionado.
   * Puede iniciar en null cuando todavía no se ha seleccionado ningún método.
   */
  const [method, setMethodState] =
    useState<CheckoutPaymentMethod | null>(initialMethod)

  /**
   * Divisa, banco o tipo de pago seleccionado.
   * Aplica principalmente para transferencia, tarjeta manual y pasarela.
   */
  const [divisaSelected, setDivisaSelected] =
    useState<ObtenerDivisaPagosTipoRes | null>(null)

  /**
   * Monto recibido para pago en efectivo.
   */
  const [cashAmount, setCashAmount] = useState(0)

  /**
   * Referencia o comprobante de transferencia.
   */
  const [transfer, setTransfer] = useState("")

  /**
   * Formulario de tarjeta manual.
   * Este flujo no procesa tarjeta por pasarela, solo registra datos manuales.
   */
  const [manualCardData, setManualCardData] =
    useState<ManualCardFormState>(initialManualCardFormState)

  /**
   * Tarjeta guardada seleccionada.
   * Solo aplica cuando se usa gatewayCard.
   */
  const [selectedSavedCard, setSelectedSavedCard] =
    useState<TarjetaModelInterface | null>(null)

  /**
   * Cambia el método de pago.
   *
   * Al cambiar de método se limpian datos que no deben arrastrarse
   * entre una forma de pago y otra.
   */
  const setMethod = (nextMethod: CheckoutPaymentMethod | null) => {
    setMethodState(nextMethod)
    setDivisaSelected(null)

    if (nextMethod !== "cash") {
      setCashAmount(0)
    }

    if (nextMethod !== "transfer") {
      setTransfer("")
    }

    if (nextMethod !== "manualCard") {
      setManualCardData(initialManualCardFormState)
    }

    if (nextMethod !== "gatewayCard") {
      setSelectedSavedCard(null)
    }
  }

  /**
   * Indica si el método seleccionado requiere seleccionar divisa,
   * banco o tipo de pago.
   */
  const requiresDivisa = useMemo(() => {
    return (
      method === "transfer" ||
      method === "manualCard" ||
      method === "gatewayCard"
    )
  }, [method])

  /**
   * Valida el formato básico de la referencia de transferencia.
   *
   * Permite letras, números y guiones.
   * Longitud permitida: 4 a 40 caracteres.
   */
  const transferRefOk = useMemo(() => {
    if (method !== "transfer") return true

    const ref = safeStr(transfer)

    if (!ref) return false

    return /^[A-Za-z0-9-]{4,40}$/.test(ref)
  }, [method, transfer])

  /**
   * Valida los campos mínimos para tarjeta manual.
   *
   * No valida contra bancos ni pasarela.
   * Solo asegura que el agente ingrese la información mínima del comprobante.
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
   * Valida pago en efectivo.
   *
   * El monto recibido debe ser igual o mayor al total a pagar.
   */
  const cashOk = useMemo(() => {
    if (method !== "cash") return true

    return cubreMontoPago(cashAmount, totalEfectivo)
  }, [method, cashAmount, totalEfectivo])

  /**
   * Valida tarjeta con pasarela.
   *
   * Si existe una tarjeta guardada seleccionada, se permite continuar.
   * Si no hay tarjeta guardada, el flujo puede continuar para abrir pasarela
   * o capturar tarjeta desde el checkout correspondiente.
   */
  const gatewayCardOk = useMemo(() => {
    if (method !== "gatewayCard") return true

    return true
  }, [method])

  /**
   * Determina si el estado actual permite procesar el pago.
   *
   * No contempla bloqueos externos como loading o doble click.
   * Esos bloqueos deben sumarse desde el componente padre.
   */
  const canPay = useMemo(() => {
    if (!method) return false

    if (requiresDivisa && !divisaSelected) return false

    if (!transferRefOk) return false

    if (!manualCardOk) return false

    if (!cashOk) return false

    if (!gatewayCardOk) return false

    return true
  }, [
    method,
    requiresDivisa,
    divisaSelected,
    transferRefOk,
    manualCardOk,
    cashOk,
    gatewayCardOk
  ])

  /**
   * Calcula el cambio cuando el método es efectivo.
   */
  const cashChange = useMemo(() => {
    if (method !== "cash") return 0

    const recibido = safePositiveNumber(cashAmount)
    const total = safePositiveNumber(totalEfectivo)

    return recibido > total ? recibido - total : 0
  }, [method, cashAmount, totalEfectivo])

  /**
   * Estado normalizado del pago.
   *
   * Este objeto puede enviarse a builders, servicios o utils
   * sin depender directamente de estados internos del componente.
   */
  const paymentState: CheckoutPaymentState = useMemo(() => {
    return {
      source,
      method,
      divisaSelected,
      cash: {
        montoRecibido: safePositiveNumber(cashAmount),
        cambio: cashChange
      },
      transfer: {
        referencia: safeStr(transfer),
        monto: safePositiveNumber(totalPagar)
      },
      manualCard: manualCardData,
      savedCard: selectedSavedCard
    }
  }, [
    source,
    method,
    divisaSelected,
    cashAmount,
    cashChange,
    transfer,
    totalPagar,
    manualCardData,
    selectedSavedCard
  ])

  /**
   * Limpia todo el estado de pago.
   * Se debe llamar cuando se procesa la venta, se cambia de carrito
   * o se cancela el flujo.
   */
  const resetPayment = () => {
    setMethodState(null)
    setDivisaSelected(null)
    setCashAmount(0)
    setTransfer("")
    setManualCardData(initialManualCardFormState)
    setSelectedSavedCard(null)
  }

  return {
    method,
    setMethod,

    divisaSelected,
    setDivisaSelected,

    cashAmount,
    setCashAmount,
    cashChange,

    transfer,
    setTransfer,
    transferRefOk,

    manualCardData,
    setManualCardData,
    manualCardOk,

    selectedSavedCard,
    setSelectedSavedCard,

    requiresDivisa,
    cashOk,
    gatewayCardOk,
    canPay,

    paymentState,
    resetPayment
  }
}