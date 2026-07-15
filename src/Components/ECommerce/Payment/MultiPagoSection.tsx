import { useMemo, useState } from "react"
import { toast } from "react-toastify"

import ManualCardPaymentSection from "@/Components/ECommerce/Payment/ManualCardPaymentSection"

import type {
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import type {
  ObtenerDivisaPagosTipoRes
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  PagoSeleccionado
} from "@/Interfaces/Ecommerce/MultiPagoTypes"

import type {
  CheckoutPaymentMethod,
  ManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import {
  initialManualCardFormState
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import {
  filtrarFormasPagoMultipago,
  obtenerTipoPagoDesdeMoneda,
  totalPagado,
  totalPendiente
} from "@/Utils/ECommerce/pagoFacturaUtils"

import { formatearDecimales } from "@/Utils/calcularIVA"
import { safeStr } from "@/Utils/ECommerce/formatters"

import "@/Styles/Ecommerce/Payment/MultiPagoSection.css"

type Props = {
  /**
   * Formas de pago disponibles desde PCG.
   */
  currency: Currencyto[]

  /**
   * Total final que debe cubrir el multipago.
   */
  totalPagar: number

  /**
   * Pagos agregados actualmente.
   */
  pagos: PagoSeleccionado[]

  /**
   * Actualiza la lista de pagos.
   */
  setPagos: React.Dispatch<React.SetStateAction<PagoSeleccionado[]>>

  /**
   * Carga bancos o tipos de pago según la forma seleccionada.
   */
  cargarDivisas: (item: Currencyto) => Promise<ObtenerDivisaPagosTipoRes[]>

  /**
   * Bloquea los controles cuando hay proceso activo.
   */
  disabled?: boolean
}

const crearIdPago = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const getCurrencyKey = (item: Currencyto, index: number) => {
  return `${safeStr(item.codPago)}-${safeStr(item.descripcion_Pago)}-${index}`
}

const getMetodoLabel = (metodo: CheckoutPaymentMethod) => {
  if (metodo === "cash") return "Efectivo"
  if (metodo === "transfer") return "Transferencia"
  if (metodo === "manualCard") return "Tarjeta manual"

  return "Tarjeta en línea"
}

const getPagoTitulo = (pago: PagoSeleccionado) => {
  if (pago.metodo === "cash") {
    return safeStr(pago.moneda?.descripcion_Pago) || "Efectivo"
  }

  if (pago.metodo === "transfer") {
    return safeStr(pago.divisa?.nombre) || "Transferencia"
  }

  if (pago.metodo === "manualCard") {
    return safeStr(pago.divisa?.nombre) || "Tarjeta manual"
  }

  return "Pago"
}

export default function MultiPagoSection({
  currency,
  totalPagar,
  pagos,
  setPagos,
  cargarDivisas,
  disabled = false
}: Props) {
  const [selectedCurrency, setSelectedCurrency] =
    useState<Currencyto | null>(null)

  const [method, setMethod] =
    useState<CheckoutPaymentMethod | null>(null)

  const [monto, setMonto] = useState<number>(0)
  const [referencia, setReferencia] = useState("")
  const [divisaOpts, setDivisaOpts] =
    useState<ObtenerDivisaPagosTipoRes[]>([])

  const [divisaSelected, setDivisaSelected] =
    useState<ObtenerDivisaPagosTipoRes | null>(null)

  const [divisaLoading, setDivisaLoading] = useState(false)

  const [manualCardData, setManualCardData] =
    useState<ManualCardFormState>(initialManualCardFormState)

  const formasPagoMultipago = useMemo(() => {
    return filtrarFormasPagoMultipago(currency)
  }, [currency])

  const pagado = useMemo(() => {
    return totalPagado(pagos)
  }, [pagos])

  const pendiente = useMemo(() => {
    return totalPendiente(pagos, totalPagar)
  }, [pagos, totalPagar])

  const requiereDivisa =
    method === "transfer" || method === "manualCard"

  const resetFormulario = () => {
    setSelectedCurrency(null)
    setMethod(null)
    setMonto(0)
    setReferencia("")
    setDivisaOpts([])
    setDivisaSelected(null)
    setManualCardData(initialManualCardFormState)
  }

  const handleSelectCurrency = async (value: string) => {
    const selected = formasPagoMultipago.find(
      (item, index) => getCurrencyKey(item, index) === value
    )

    if (!selected) {
      resetFormulario()
      return
    }

    const nextMethod = obtenerTipoPagoDesdeMoneda(selected)

    setSelectedCurrency(selected)
    setMethod(nextMethod)
    setReferencia("")
    setDivisaOpts([])
    setDivisaSelected(null)
    setManualCardData(initialManualCardFormState)

    const pendienteActual = totalPendiente(pagos, totalPagar)

    setMonto(pendienteActual > 0 ? pendienteActual : 0)

    if (nextMethod === "transfer" || nextMethod === "manualCard") {
      setDivisaLoading(true)

      try {
        const opts = await cargarDivisas(selected)

        setDivisaOpts(opts)
        setDivisaSelected(opts.length > 0 ? opts[0] : null)
      } catch {
        setDivisaOpts([])
        setDivisaSelected(null)
        toast.error("No se pudieron cargar las opciones de pago.")
      } finally {
        setDivisaLoading(false)
      }
    }
  }

  const validarPagoActual = () => {
    if (!selectedCurrency || !method) {
      return "Selecciona una forma de pago."
    }

    if (method === "gatewayCard") {
      return "La tarjeta en línea no está disponible dentro de multipago."
    }

    if (Number(monto) <= 0) {
      return "El monto debe ser mayor a 0."
    }

    if (Number(monto) > pendiente) {
      return "El monto no puede superar el pendiente."
    }

    if (requiereDivisa && !divisaSelected) {
      return "Selecciona banco o tipo de pago."
    }

    if (method === "transfer" && !safeStr(referencia)) {
      return "La referencia de transferencia es requerida."
    }

    if (method === "manualCard") {
      if (!safeStr(manualCardData.tarjetahabiente)) {
        return "El tarjetahabiente es requerido."
      }

      // if (!safeStr(manualCardData.)) {
      //   return "La tarjeta es requerida."
      // }

      if (!safeStr(manualCardData.ultDigito)) {
        return "Los últimos 4 dígitos son requeridos."
      }

      if (!safeStr(manualCardData.fechaVence)) {
        return "La fecha de vencimiento es requerida."
      }
    }

    return null
  }

  const handleAgregarPago = () => {
    const error = validarPagoActual()

    if (error) {
      toast.error(error)
      return
    }

    const nuevoPago: PagoSeleccionado = {
      id: crearIdPago(),
      metodo: method!,
      moneda: selectedCurrency,
      divisa: requiereDivisa ? divisaSelected : null,
      monto: Number(monto),
      referencia: method === "transfer" ? referencia.trim() : "",
      tarjetaManual:
        method === "manualCard" ? manualCardData : undefined
    }

    setPagos((prev) => [...prev, nuevoPago])
    resetFormulario()
  }

  const handleQuitarPago = (id: string) => {
    setPagos((prev) => prev.filter((pago) => pago.id !== id))
  }

  const puedeAgregar =
    !disabled &&
    !!selectedCurrency &&
    !!method &&
    Number(monto) > 0 &&
    Number(monto) <= pendiente &&
    (!requiereDivisa || !!divisaSelected)

  return (
    <div className="multipago-section">
      <div className="checkout-summary multipago-summary">
        <div className="checkout-summary__subtitle">
          <p className="checkout-summary__p">Total factura:</p>
          <strong className="checkout-summary__strong">
            C$ {formatearDecimales(totalPagar)}
          </strong>
        </div>

        <div className="checkout-summary__subtitle">
          <p className="checkout-summary__p">Total pagado:</p>
          <strong className="checkout-summary__strong">
            C$ {formatearDecimales(pagado)}
          </strong>
        </div>

        <div className="checkout-summary__subtitle">
          <p className="checkout-summary__p">Pendiente:</p>
          <strong className="checkout-summary__strong__pendiente">
            C$ {formatearDecimales(pendiente)}
          </strong>
        </div>
      </div>

      <div className="multipago-form">
        <div className="checkout-field checkout-field--full">
          <label className="checkout-label" htmlFor="multipagoCurrency">
            Forma de pago
          </label>

          <select
            id="multipagoCurrency"
            className="checkout-input"
            value={
              selectedCurrency
                ? formasPagoMultipago
                    .map((item, index) => ({
                      item,
                      key: getCurrencyKey(item, index)
                    }))
                    .find(({ item }) => item === selectedCurrency)?.key ?? ""
                : ""
            }
            disabled={disabled}
            onChange={(event) => {
              void handleSelectCurrency(event.target.value)
            }}
          >
            <option value="">Seleccionar</option>

            {formasPagoMultipago.map((item, index) => (
              <option
                key={getCurrencyKey(item, index)}
                value={getCurrencyKey(item, index)}
              >
                {safeStr(item.descripcion_Pago)}
              </option>
            ))}
          </select>
        </div>

        {method && (
          <div className="multipago-selected-method">
            <span>Método seleccionado</span>
            <strong>{getMetodoLabel(method)}</strong>
          </div>
        )}

        {requiereDivisa && (
          <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="multipagoDivisa">
              Banco o tipo de pago
            </label>

            <select
              id="multipagoDivisa"
              className="checkout-input"
              value={safeStr(divisaSelected?.codigo)}
              disabled={disabled || divisaLoading}
              onChange={(event) => {
                const code = safeStr(event.target.value)

                const found =
                  divisaOpts.find(
                    (item) => safeStr(item.codigo) === code
                  ) ?? null

                setDivisaSelected(found)
              }}
            >
              <option value="">
                {divisaLoading ? "Cargando..." : "Seleccionar"}
              </option>

              {divisaOpts.map((item) => (
                <option
                  key={`${item.codigo}-${item.codigoExterno}-${item.banco}`}
                  value={safeStr(item.codigo)}
                >
                  {safeStr(item.nombre)}
                </option>
              ))}
            </select>
          </div>
        )}

        {method && (
          <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="multipagoMonto">
              Monto
            </label>

            <input
              id="multipagoMonto"
              type="number"
              min={0}
              max={pendiente}
              className="checkout-input"
              value={monto}
              disabled={disabled}

              // Efectivo, debe permitir ingresar mas del monto
              onChange={(event) => {
                const value =
                  event.target.value === ""
                    ? 0
                    : Number(event.target.value)

                setMonto(value)
              }}
            />
          </div>
        )}

        {method === "transfer" && (
          <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="multipagoReferencia">
              Referencia
            </label>

            <input
              id="multipagoReferencia"
              type="text"
              className="checkout-input"
              // maxLength={4}
              value={referencia}
              disabled={disabled}
              onChange={(event) => setReferencia(event.target.value)}
              placeholder="Referencia de transferencia"
            />
          </div>
        )}

        {method === "manualCard" && (
          <ManualCardPaymentSection
            value={manualCardData}
            onChange={setManualCardData}
          />
        )}

        <button
          type="button"
          className="multipago-add-btn"
          disabled={!puedeAgregar}
          onClick={handleAgregarPago}
        >
          Agregar pago
        </button>
      </div>

      {pagos.length > 0 && (
        <div className="multipago-list">
          <p className="multipago-list__title">Pagos agregados</p>

          {pagos.map((pago) => (
            <div key={pago.id} className="multipago-card">
              <div className="multipago-card__content">
                <div>
                  <strong className="multipago-card__title">
                    {getPagoTitulo(pago)}
                  </strong>

                  <span className="multipago-card__text">
                    {getMetodoLabel(pago.metodo)} - C${" "}
                    {formatearDecimales(pago.monto)}
                  </span>

                  {pago.metodo === "transfer" && (
                    <span className="multipago-card__text">
                      Referencia: {safeStr(pago.referencia)}
                    </span>
                  )}

                  {pago.metodo === "manualCard" && (
                    <span className="multipago-card__text">
                      Tarjeta: ****{" "}
                      {safeStr(pago.tarjetaManual?.ultDigito)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="multipago-remove-btn"
                  disabled={disabled}
                  onClick={() => handleQuitarPago(pago.id)}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}