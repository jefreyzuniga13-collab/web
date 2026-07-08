import { useCallback, useEffect, useState } from "react"
import { toast } from "react-toastify"

import { CartService } from "@/Services/Ecommerce/CarPCGService"

import type {
  FacturaTempo,
  ObtenerDivisaPagosTipoReq,
  ObtenerDivisaPagosTipoRes
} from "@/Interfaces/Ecommerce/FacturaTempo"

import type {
  FaloteRequestDto,
  InvoiceTotalsDto
} from "@/Interfaces/Crm/CartPCGInterface"

import type {
  LogCartResponseDto,
  Payload
} from "@/Interfaces/Crm/LogCartInterface"

import type {
  CheckoutPaymentMethod
} from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"

import type {
  ContactLogInterface
} from "@/Interfaces/Auth/ContactInterface"

import type {
  AppDispatch
} from "@/Context"

import type {
  ApiResponse
} from "@/Interfaces/Auth/AuthInterface"

import { useCheckoutPaymentState } from "@/Hooks/Ecommerce/payment/useCheckoutPaymentState"

import { loadFacturaTempo } from "@/Utils/facturaTempoStorage"
import { safeStr } from "@/Utils/ECommerce/formatters"
import {
  safePositiveNumber
} from "@/Utils/ECommerce/utils"

import {
  buildPagoGenerico,
  getPaymentCodeByMethod
} from "@/Utils/ECommerce/buildPagoGenerico"

import {
  buildFacturaTempo
} from "@/Utils/ECommerce/buildFacturaTempo"

import {
  procesarVentaCheckout
} from "@/Utils/ECommerce/procesarVentaCheckout"

type EnsureEcommerceUserResult = {
  ecommerceUserId: number
  contact: ContactLogInterface | null
}

type UseAgentCartPaymentParams = {
  /**
   * Contacto actual del chat.
   */
  contactId: number

  /**
   * Conversación actual del chat.
   */
  conversationId: number

  /**
   * Id del pedido temporal.
   */
  orderId: number | null

  /**
   * Total final calculado por PCG.
   */
  totalPagar: number

  /**
   * Costo de transporte tomado desde el paso 2.
   */
  effectiveShipping: number

  /**
   * Indica si el cliente retira en sucursal.
   */
  retiraSucursal: "S" | "N"

  /**
   * Dirección manual digitada por el agente.
   */
  addDescription: string

  /**
   * Observación del pedido.
   */
  observation: string

  /**
   * Dirección guardada seleccionada.
   */
  selectedAddressId: number | null

  /**
   * Lista de direcciones cargadas del cliente.
   */
  addresses: Array<{
    idDireccion?: number
    nombre?: string
    descripcion?: string
    referencia?: string
  }>

  /**
   * LogCart actual.
   */
  currentLog: LogCartResponseDto | null

  /**
   * Asegura o crea el usuario ecommerce.
   */
  ensureEcommerceUser: () => Promise<EnsureEcommerceUserResult>

  /**
   * Obtiene LogCart por contacto.
   */
  fetchByContactId: (contactId: number) => Promise<LogCartResponseDto | null>

  /**
   * Actualiza estado del LogCart.
   */
  UpdatedStatus: (
    id: number,
    status: number
  ) => Promise<LogCartResponseDto | null>

  /**
   * Inserta la factura final en PCG.
   */
  InsertaFacturaAsync: (
    invoice: FacturaTempo
  ) => Promise<ApiResponse<unknown>>

  /**
   * Persiste dirección, observación y totales frescos en LogCart.
   */
  persistLogWithTotals: (
    log: LogCartResponseDto,
    ecommerceUserId: number,
    totals: InvoiceTotalsDto
  ) => Promise<LogCartResponseDto | null | undefined>

  /**
   * Obtiene totales frescos desde PCG.
   */
  getFreshInvoiceTotals: () => Promise<InvoiceTotalsDto>

  /**
   * Limpia visualmente el carrito/panel después de vender.
   */
  resetCartPanelUi: () => void

  /**
   * Dispatch de Redux.
   */
  dispatch: AppDispatch
}

/**
 * Hook encargado del pago directo del agente.
 *
 * Este hook deja fuera del CarPCPanelTab la lógica de:
 * método de pago, carga de bancos/tipos de pago, construcción de factura,
 * validaciones de totales y procesamiento final de venta.
 */
export const useAgentCartPayment = ({
  contactId,
  conversationId,
  orderId,
  totalPagar,
  effectiveShipping,
  retiraSucursal,
  addDescription,
  observation,
  selectedAddressId,
  addresses,
  currentLog,
  ensureEcommerceUser,
  fetchByContactId,
  UpdatedStatus,
  InsertaFacturaAsync,
  persistLogWithTotals,
  getFreshInvoiceTotals,
  resetCartPanelUi,
  dispatch
}: UseAgentCartPaymentParams) => {
  const [divisaOpts, setDivisaOpts] =
    useState<ObtenerDivisaPagosTipoRes[]>([])

  const [divisaLoading, setDivisaLoading] = useState(false)
  const [payLoading, setPayLoading] = useState(false)

  const payment = useCheckoutPaymentState({
    source: "agent",
    totalPagar
  })

  const {
    method,
    divisaSelected,
    setDivisaSelected,
    transfer,
    manualCardData,
    canPay
  } = payment

  /**
   * Carga bancos o tipos de pago cuando el método lo requiere.
   * En efectivo no se carga divisa porque no hace falta.
   */
  const loadDivisa = useCallback(
    async (nextMethod: CheckoutPaymentMethod | null) => {
      if (!nextMethod || nextMethod === "cash") {
        setDivisaOpts([])
        setDivisaSelected(null)
        return
      }

      setDivisaLoading(true)

      try {
        const req: ObtenerDivisaPagosTipoReq = {
          codigo: "0",
          formulario: "1-",
          opcion: getPaymentCodeByMethod(nextMethod)
        }

        const resp = await CartService.GetDivisaPagosTipoAsync(req)

        const list = Array.isArray(resp?.data)
          ? (resp.data as ObtenerDivisaPagosTipoRes[])
          : resp?.data
            ? [resp.data as ObtenerDivisaPagosTipoRes]
            : []

        const fixed = list
          .filter(Boolean)
          .map((item) => ({
            nombre: safeStr(item.nombre),
            codigo: safeStr(item.codigo),
            codigoExterno: safeStr(item.codigoExterno),
            tipo: safeStr(item.tipo),
            banco: safeStr(item.banco),
            aCambio: safeStr(item.aCambio)
          }))
          .filter((item) => item.codigo || item.codigoExterno || item.nombre)

        setDivisaOpts(fixed)
        setDivisaSelected(fixed.length > 0 ? fixed[0] : null)
      } catch {
        setDivisaOpts([])
        setDivisaSelected(null)
        toast.error("No se pudieron cargar las opciones de pago.")
      } finally {
        setDivisaLoading(false)
      }
    },
    [setDivisaSelected]
  )

  /**
   * Busca el texto de dirección final para la factura.
   */
  const getDireccionFactura = useCallback(
    (log: LogCartResponseDto | null) => {
      if (retiraSucursal === "S") {
        return safeStr(log?.branchName)
      }

      if (selectedAddressId != null) {
        const selected = addresses.find(
          (address) =>
            Number(address.idDireccion) === Number(selectedAddressId)
        )

        return safeStr(selected?.descripcion)
      }

      return safeStr(addDescription)
    },
    [addDescription, addresses, retiraSucursal, selectedAddressId]
  )

  /**
   * Busca la referencia final de dirección para la factura.
   */
  const getReferenciaFactura = useCallback(
    (log: LogCartResponseDto | null) => {
      if (retiraSucursal === "S") {
        return safeStr(log?.branch)
      }

      if (selectedAddressId != null) {
        const selected = addresses.find(
          (address) =>
            Number(address.idDireccion) === Number(selectedAddressId)
        )

        return safeStr(selected?.referencia)
      }

      return safeStr(addDescription)
    },
    [addDescription, addresses, retiraSucursal, selectedAddressId]
  )

  /**
   * Valida que los totales en pantalla coincidan con PCG.
   */
  const validateTotalsBeforeInvoice = useCallback(
    async ({
      totals,
      codSucursalFactura
    }: {
      totals: InvoiceTotalsDto
      codSucursalFactura: string
    }) => {
      const req = {
        descuentoPantalla: totals.descuento ?? 0,
        exonerado: "N",
        ivaPantalla: totals.iva ?? 0,
        maquina: `CRM-${contactId}`,
        sucursal: codSucursalFactura,
        tabla: "det_factura_tempo",
        totalEnPantalla: totals.subTotal ?? 0,
        usuario: contactId.toString()
      }

      const validacionTotales =
        await CartService.sp_valida_SobTotalFactura(req)

      const { pasasub, pasadesc, pasaiva } =
        validacionTotales.data?.[0] ?? {}

      const errores: Record<string, string> = {
        pasasub: "Subtotal no válido, diferencia con el valor real.",
        pasadesc: "Descuento no válido, diferencia con el valor real.",
        pasaiva: "IVA no válido, diferencia con el valor real."
      }

      const fallo = [
        { key: "pasasub", value: pasasub },
        { key: "pasadesc", value: pasadesc },
        { key: "pasaiva", value: pasaiva }
      ].find((item) => item.value === "N")

      if (fallo) {
        throw new Error(`(${errores[fallo.key]})`)
      }
    },
    [contactId]
  )

  /**
   * Procesa la venta directa del agente.
   */
  const handleAgentPayNow = useCallback(async () => {
    if (payLoading) return

    if (!method) {
      toast.error("Selecciona un método de pago.")
      return
    }

    if (!canPay) {
      toast.error("Completa la información del pago.")
      return
    }

    if (!orderId || orderId <= 0) {
      toast.error("No hay pedido asociado a este carrito.")
      return
    }

    setPayLoading(true)

    try {
      const { ecommerceUserId, contact } = await ensureEcommerceUser()

      if (!ecommerceUserId || !contact) {
        toast.error("No se pudo obtener el usuario ecommerce.")
        return
      }

      const existingLog =
        currentLog ?? (await fetchByContactId(contactId))

      if (!existingLog?.id) {
        toast.error("Log no encontrado.")
        return
      }

      const totals = await getFreshInvoiceTotals()

      await persistLogWithTotals(existingLog, ecommerceUserId, totals)

      const logForInvoice =
        (await fetchByContactId(contactId)) ?? existingLog

      const codSucursalFactura = safeStr(
        logForInvoice?.branch || existingLog.branch
      )

      if (!codSucursalFactura) {
        toast.error("No fue posible determinar la sucursal de factura.")
        return
      }

      await validateTotalsBeforeInvoice({
        totals,
        codSucursalFactura
      })

      const falote: FaloteRequestDto = {
        codSucursal: codSucursalFactura,
        documento: "OrdenFactura"
      }

      const dataconse = await CartService.GetConsecDocAsync(falote)
      const consecutivo = Number(dataconse?.data?.consecutivo ?? 0)

      if (!consecutivo) {
        toast.error("No fue posible obtener el consecutivo de factura.")
        return
      }

      const facturaBase = await loadFacturaTempo()
      const tasaCambio = 36.6243

      const nombreCliente =
        safeStr(contact.fullName) ||
        safeStr(contact.waName) ||
        safeStr(contact.phone) ||
        "Cliente"

      const pagoGenerico = buildPagoGenerico({
        method,
        total: safePositiveNumber(totals.total ?? totalPagar),
        divisaSelected,
        codSucursal: codSucursalFactura,
        tasaCambio,
        transfer,
        manualCardData
      })

      const invoiceReqFinal = buildFacturaTempo({
        facturaBase,
        codSucursalFactura,
        consecutivo,
        orderId,
        contactId,
        nombreCliente,
        direccionCte: getDireccionFactura(logForInvoice),
        referencia: getReferenciaFactura(logForInvoice),
        valorTransporte: effectiveShipping,
        retiraSucursal,
        observacion: observation,
        serie: logForInvoice?.serie ?? existingLog.serie,
        detallePago: [pagoGenerico],
        tasaCambio,
        correo: contact.email ?? "",
        telefonoCte: contact.phone ?? ""
      })

      const payload: Payload = {
        contactId,
        conversationId,
        orderId,
        ecommerceUserId,
        fullName: nombreCliente
      } as Payload

      await procesarVentaCheckout({
        source: "agent",
        paymentMethod: method,
        paymentState: payment.paymentState,
        invoiceReqFinal,
        payload,
        orderId,
        transactionIdentifier: "",
        usarPdfPagoElectronico: false,
        codSucursalFactura,
        consecutivo,
        fetchByContactId,
        updatedStatus: UpdatedStatus,
        insertaFacturaAsync: InsertaFacturaAsync,
        dispatch,
        onSuccess: () => {
          toast.success("Venta procesada correctamente.")
          resetCartPanelUi()
        }
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "No se pudo procesar la venta."

      toast.error(message)
    } finally {
      setPayLoading(false)
    }
  }, [
    payLoading,
    method,
    canPay,
    orderId,
    ensureEcommerceUser,
    currentLog,
    fetchByContactId,
    contactId,
    getFreshInvoiceTotals,
    persistLogWithTotals,
    validateTotalsBeforeInvoice,
    totalPagar,
    divisaSelected,
    transfer,
    manualCardData,
    effectiveShipping,
    retiraSucursal,
    observation,
    conversationId,
    payment.paymentState,
    UpdatedStatus,
    InsertaFacturaAsync,
    dispatch,
    resetCartPanelUi,
    getDireccionFactura,
    getReferenciaFactura
  ])

  /**
   * Cada vez que el agente selecciona método, se cargan sus opciones.
   */
  useEffect(() => {
    void loadDivisa(method)
  }, [method, loadDivisa])

  return {
    payment,

    divisaOpts,
    divisaLoading,

    payLoading,
    handleAgentPayNow
  }
}