import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import type { AppDispatch } from "@/Context"
import { selectIsRoot } from "@/Context/Slices/Auth/authSlice"
import { selectActiveCompanyName } from "@/Context/Slices/Auth/companySlice"
import { tasaCambio } from "@/Constants/tasaCambio"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { fetchDivisasPagoTipo } from "@/Utils/ECommerce/fetchDivisasPagoTipo"
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface"
import type { ContactLogInterface } from "@/Interfaces/Auth/ContactInterface"
import type { FaloteRequestDto, InvoiceTotalsDto } from "@/Interfaces/Crm/CartPCGInterface"
import type { LogCartResponseDto, Payload } from "@/Interfaces/Crm/LogCartInterface"
import type {
  FacturaTempo,
  ObtenerDivisaPagosTipoRes,
  PagoGenerico,
  SINO
} from "@/Interfaces/Ecommerce/FacturaTempo"
import type { Currencyto } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"
import type { PagoSeleccionado } from "@/Interfaces/Ecommerce/MultiPagoTypes"
import type { CheckoutPaymentMethod } from "@/Interfaces/Ecommerce/PaymentCheckoutInterface"
import { useCheckoutPaymentState } from "@/Hooks/Ecommerce/payment/useCheckoutPaymentState"
import { loadFacturaTempo } from "@/Utils/facturaTempoStorage"
import { buildFacturaTempo } from "@/Utils/ECommerce/buildFacturaTempo"
import {
  buildPagoGenerico,
  getPaymentCodeByMethod
} from "@/Utils/ECommerce/buildPagoGenerico"
import { safeStr } from "@/Utils/ECommerce/formatters"
import {
  construirDetallePago,
  validarPagosSeleccionados
} from "@/Utils/ECommerce/pagoFacturaUtils"
import { procesarVentaCheckout } from "@/Utils/ECommerce/procesarVentaCheckout"
import { safePositiveNumber } from "@/Utils/ECommerce/utils"
import { TipoFalote } from "@/Constants/falote"

type EnsureEcommerceUserResult = {
  ecommerceUserId: number
  contact: ContactLogInterface | null
}

type UseAgentCartPaymentParams = {
  contactId: number
  conversationId: number
  orderId: number | null
  totalPagar: number
  effectiveShipping: number
  retiraSucursal: SINO
  addDescription: string
  observation: string
  selectedAddressId: number | null

  addresses: Array<{
    idDireccion?: number
    nombre?: string
    descripcion?: string
    referencia?: string
  }>

  currentLog: LogCartResponseDto | null

  ensureEcommerceUser: () => Promise<EnsureEcommerceUserResult>

  fetchByContactId: (
    contactId: number
  ) => Promise<LogCartResponseDto | null>

  UpdatedStatus: (
    id: number,
    status: number
  ) => Promise<LogCartResponseDto | null>

  InsertaFacturaAsync: (
    invoice: FacturaTempo
  ) => Promise<ApiResponse<unknown>>

  persistLogWithTotals: (
    log: LogCartResponseDto,
    ecommerceUserId: number,
    totals: InvoiceTotalsDto
  ) => Promise<LogCartResponseDto | null | undefined>

  getFreshInvoiceTotals: () => Promise<InvoiceTotalsDto>

  resetCartPanelUi: () => void
  dispatch: AppDispatch
  multiPagoActivo?: boolean
  pagosMultiples?: PagoSeleccionado[]
}

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
  dispatch,
  multiPagoActivo = false,
  pagosMultiples = []
}: UseAgentCartPaymentParams) => {
  const isRoot = useSelector(selectIsRoot)
  const activeCompanyName = useSelector(selectActiveCompanyName)

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
    cashAmount,
    transfer,
    manualCardData,
    canPay
  } = payment

  const loadDivisa = useCallback(
    async (
      nextMethod: CheckoutPaymentMethod | null
    ) => {
      if (!nextMethod || nextMethod === "cash") {
        setDivisaOpts([])
        setDivisaSelected(null)
        return
      }

      setDivisaLoading(true)

      try {
        const fixed = await fetchDivisasPagoTipo({
          codPago: getPaymentCodeByMethod(nextMethod),
        } as Currencyto)

        setDivisaOpts(fixed)
        setDivisaSelected(
          fixed.length > 0
            ? fixed[0]
            : null
        )
      } catch {
        setDivisaOpts([])
        setDivisaSelected(null)

        toast.error(
          "No se pudieron cargar las opciones de pago."
        )
      } finally {
        setDivisaLoading(false)
      }
    },
    [setDivisaSelected]
  )

  const cargarDivisasPorMoneda = useCallback(
    async (
      item: Currencyto
    ): Promise<ObtenerDivisaPagosTipoRes[]> => {
      setDivisaLoading(true)

      try {
        return await fetchDivisasPagoTipo(item)
      } catch {
        toast.error(
          "No se pudieron cargar las opciones de pago."
        )

        return []
      } finally {
        setDivisaLoading(false)
      }
    },
    []
  )

  const getDireccionFactura = useCallback(
    (
      log: LogCartResponseDto | null
    ): string => {
      if (retiraSucursal === "S") {
        return safeStr(log?.branchName)
      }

      if (selectedAddressId != null) {
        const selected = addresses.find(
          (address) =>
            Number(address.idDireccion) ===
            Number(selectedAddressId)
        )

        return safeStr(selected?.descripcion)
      }

      return safeStr(addDescription)
    },
    [
      addDescription,
      addresses,
      retiraSucursal,
      selectedAddressId
    ]
  )

  const getReferenciaFactura = useCallback(
    (
      log: LogCartResponseDto | null
    ): string => {
      if (retiraSucursal === "S") {
        return safeStr(log?.branch)
      }

      if (selectedAddressId != null) {
        const selected = addresses.find(
          (address) =>
            Number(address.idDireccion) ===
            Number(selectedAddressId)
        )

        return safeStr(selected?.referencia)
      }

      return safeStr(addDescription)
    },
    [
      addDescription,
      addresses,
      retiraSucursal,
      selectedAddressId
    ]
  )

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

      const {
        pasasub,
        pasadesc,
        pasaiva
      } = validacionTotales.data?.[0] ?? {}

      const errores: Record<string, string> = {
        pasasub:
          "Subtotal no válido, diferencia con el valor real.",

        pasadesc:
          "Descuento no válido, diferencia con el valor real.",

        pasaiva:
          "IVA no válido, diferencia con el valor real."
      }

      const fallo = [
        { key: "pasasub", value: pasasub },
        { key: "pasadesc", value: pasadesc },
        { key: "pasaiva", value: pasaiva }
      ].find(
        (item) => item.value === "N"
      )

      if (fallo) {
        throw new Error(
          `(${errores[fallo.key]})`
        )
      }
    },
    [contactId]
  )

  const construirDetallePagoFinal = useCallback(
    ({
      facturaBase,
      codSucursalFactura,
      tasaCambio,
      totalFinal
    }: {
      facturaBase: FacturaTempo
      codSucursalFactura: string
      tasaCambio: number
      totalFinal: number
    }): PagoGenerico[] => {
      if (multiPagoActivo) {
        const error = validarPagosSeleccionados(
          pagosMultiples,
          totalFinal
        )

        if (error) {
          throw new Error(error)
        }

        const facturaParaPago: FacturaTempo = {
          ...facturaBase,
          tasaCambio,
          moneda:
            safeStr(facturaBase.moneda) ||
            "1",
          codEmpresa:
            safeStr(facturaBase.codEmpresa)
        }

        return construirDetallePago(
          pagosMultiples,
          facturaParaPago,
          codSucursalFactura,
          totalFinal
        )
      }

      if (!method) {
        throw new Error(
          "Selecciona un método de pago."
        )
      }

      if (!canPay) {
        throw new Error(
          "Completa la información del pago."
        )
      }

      return [
        buildPagoGenerico({
          method,
          total: totalFinal,
          cashAmount,
          divisaSelected,
          codSucursal: codSucursalFactura,
          tasaCambio,
          transfer,
          manualCardData,
          moneda:
            safeStr(facturaBase.moneda) ||
            "1",
          codEmpresa:
            safeStr(facturaBase.codEmpresa)
        })
      ]
    },
    [
      multiPagoActivo,
      pagosMultiples,
      method,
      canPay,
      cashAmount,
      divisaSelected,
      transfer,
      manualCardData
    ]
  )

  const handleAgentPayNow = useCallback(
    async () => {
      if (payLoading) {
        return
      }

      if (!multiPagoActivo && !method) {
        toast.error(
          "Selecciona un método de pago."
        )

        return
      }

      if (!multiPagoActivo && !canPay) {
        toast.error(
          "Completa la información del pago."
        )

        return
      }

      if (multiPagoActivo) {
        const error = validarPagosSeleccionados(
          pagosMultiples,
          totalPagar
        )

        if (error) {
          toast.error(error)
          return
        }
      }

      if (!orderId || orderId <= 0) {
        toast.error(
          "No hay pedido asociado a este carrito."
        )

        return
      }

      setPayLoading(true)

      try {
        const {
          ecommerceUserId,
          contact
        } = await ensureEcommerceUser()

        if (!ecommerceUserId || !contact) {
          toast.error(
            "No se pudo obtener el usuario ecommerce."
          )

          return
        }

        const existingLog =
          currentLog ??
          await fetchByContactId(contactId)

        if (!existingLog?.id) {
          toast.error(
            "Log no encontrado."
          )

          return
        }

        const totals =
          await getFreshInvoiceTotals()

        const persistedLog =
          await persistLogWithTotals(
            existingLog,
            ecommerceUserId,
            totals
          )

        const refreshedLog =
          await fetchByContactId(contactId)

        const logForInvoice =
          refreshedLog ??
          persistedLog ??
          existingLog

        const sellerName =
          safeStr(
            logForInvoice?.createdByFullName
          ) ||
          safeStr(
            logForInvoice?.createdByNickname
          ) ||
          safeStr(
            logForInvoice?.createdByName
          ) ||
          safeStr(
            logForInvoice?.userName
          ) ||
          safeStr(
            existingLog.createdByFullName
          ) ||
          safeStr(
            existingLog.createdByNickname
          ) ||
          safeStr(
            existingLog.createdByName
          ) ||
          safeStr(
            existingLog.userName
          ) ||
          "Agente"

        const companyName =
          (
            isRoot
              ? safeStr(activeCompanyName)
              : ""
          ) ||
          safeStr(
            logForInvoice?.companyName
          ) ||
          safeStr(
            existingLog.companyName
          ) ||
          "Empresa"

        const codSucursalFactura =
          safeStr(
            logForInvoice?.branch ||
            existingLog.branch
          )

        if (!codSucursalFactura) {
          toast.error(
            "No fue posible determinar la sucursal de factura."
          )

          return
        }

        await validateTotalsBeforeInvoice({
          totals,
          codSucursalFactura
        })

        const falote: FaloteRequestDto = {
          codSucursal:
            codSucursalFactura,
          documento: TipoFalote.OrdenFactura
        }

        const dataconse =
          await CartService.GetConsecDocAsync(
            falote
          )

        const consecutivo = Number(
          dataconse?.data?.consecutivo ?? 0
        )

        if (!consecutivo) {
          toast.error(
            "No fue posible obtener el consecutivo de factura."
          )

          return
        }

        const facturaBase =
          await loadFacturaTempo()

        const nombreCliente =
          safeStr(
            persistedLog?.invoiceName
          ) ||
          safeStr(
            logForInvoice?.invoiceName
          ) ||
          safeStr(
            existingLog.invoiceName
          ) ||
          safeStr(
            contact.fullName
          ) ||
          safeStr(
            contact.waName
          ) ||
          safeStr(
            contact.phone
          ) ||
          "Cliente"

        const telefonoContacto =
          safeStr(contact.phone)

        const totalFinal =
          safePositiveNumber(
            totals.total ??
            totalPagar
          )

        const detallePago =
          construirDetallePagoFinal({
            facturaBase,
            codSucursalFactura,
            tasaCambio,
            totalFinal
          })

        const invoiceReqFinal =
          buildFacturaTempo({
            facturaBase,
            codSucursalFactura,
            consecutivo,
            orderId,
            contactId,
            nombreCliente,

            direccionCte:
              getDireccionFactura(
                logForInvoice
              ),

            referencia:
              getReferenciaFactura(
                logForInvoice
              ),

            valorTransporte:
              effectiveShipping,

            retiraSucursal,

            observacion:
              safeStr(
                logForInvoice?.observacion
              ) ||
              observation,

            serie:
              logForInvoice?.serie ??
              existingLog.serie,

            detallePago,

            tasa:
              tasaCambio,

            correo:
              safeStr(contact.email),

            telefonoCte:
              telefonoContacto
          })

        const payload: Payload = {
          contactId,
          conversationId,
          orderId,
          ecommerceUserId,
          fullName:
            nombreCliente,
          phone:
            telefonoContacto,
          sellerName,
          companyName,
          userId:
            existingLog.createdById,
          companyId:
            existingLog.companyId,
          expiresAtUtc:
            "",
          email:
            safeStr(contact.email),
          OolyTextAddress:
            Boolean(
              logForInvoice?.onlyTextAddress
            )
        }

        await procesarVentaCheckout({
          source:
            "agent",

          paymentMethod:
            multiPagoActivo
              ? "cash"
              : method as CheckoutPaymentMethod,

          paymentState:
            payment.paymentState,

          invoiceReqFinal,
          payload,
          orderId,

          transactionIdentifier:
            "",

          usarPdfPagoElectronico:
            false,

          codSucursalFactura,
          consecutivo,

          pdfContext: {
            sellerName,
            contactName:
              nombreCliente,
            contactPhone:
              telefonoContacto,
            companyName
          },

          fetchByContactId,

          updatedStatus:
            UpdatedStatus,

          insertaFacturaAsync:
            InsertaFacturaAsync,

          dispatch,

          onSuccess: () => {
            toast.success(
              "Venta procesada correctamente."
            )

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
    },
    [
      payLoading,
      multiPagoActivo,
      method,
      canPay,
      pagosMultiples,
      totalPagar,
      orderId,
      ensureEcommerceUser,
      currentLog,
      fetchByContactId,
      contactId,
      getFreshInvoiceTotals,
      persistLogWithTotals,
      validateTotalsBeforeInvoice,
      construirDetallePagoFinal,
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
      getReferenciaFactura,
      isRoot,
      activeCompanyName
    ]
  )

  useEffect(() => {
    if (multiPagoActivo) {
      setDivisaOpts([])
      setDivisaSelected(null)
      return
    }

    void loadDivisa(method)
  }, [
    method,
    loadDivisa,
    multiPagoActivo,
    setDivisaSelected
  ])

  return {
    payment,
    divisaOpts,
    divisaLoading,
    payLoading,
    handleAgentPayNow,
    cargarDivisasPorMoneda
  }
}