import { useCallback, useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"

import type {
  AppDispatch,
  RootState
} from "@/Context"

import {
  selectIsRoot
} from "@/Context/Slices/Auth/authSlice"

import {
  selectActiveCompanyName
} from "@/Context/Slices/Auth/companySlice"

import { CartService } from "@/Services/Ecommerce/CarPCGService"

import type {
  Currencyto
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import type {
  FacturaTempo,
  ObtenerDivisaPagosTipoReq,
  ObtenerDivisaPagosTipoRes,
  SINO
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
  PagoSeleccionado
} from "@/Interfaces/Ecommerce/MultiPagoTypes"

import type {
  ContactLogInterface
} from "@/Interfaces/Auth/ContactInterface"

import type {
  ApiResponse
} from "@/Interfaces/Auth/AuthInterface"

import {
  useCheckoutPaymentState
} from "@/Hooks/Ecommerce/payment/useCheckoutPaymentState"

import {
  loadFacturaTempo
} from "@/Utils/facturaTempoStorage"

import {
  safeStr
} from "@/Utils/ECommerce/formatters"

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

import {
  construirDetallePago,
  validarPagosSeleccionados
} from "@/Utils/ECommerce/pagoFacturaUtils"
import { tasaCambio } from "@/Constants/tasaCambio"

type EnsureEcommerceUserResult = {
  ecommerceUserId: number
  contact: ContactLogInterface | null
}

/**
 * Extensión compatible con el AuthState actual.
 *
 * Evita errores de TypeScript mientras agregas estos campos
 * formalmente a la interfaz AuthState.
 */
type AuthStateWithPdfData = RootState["auth"] & {
  fullName?: string | null
  nickname?: string | null
  companyName?: string | null
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
  retiraSucursal: SINO

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
  fetchByContactId: (
    contactId: number
  ) => Promise<LogCartResponseDto | null>

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
   * Limpia visualmente el carrito después de vender.
   */
  resetCartPanelUi: () => void

  /**
   * Dispatch de Redux.
   */
  dispatch: AppDispatch

  /**
   * Indica si el agente está usando multipago.
   */
  multiPagoActivo?: boolean

  /**
   * Pagos agregados en multipago.
   */
  pagosMultiples?: PagoSeleccionado[]
}

const normalizarDivisas = (
  data: unknown
): ObtenerDivisaPagosTipoRes[] => {
  const list = Array.isArray(data)
    ? data as ObtenerDivisaPagosTipoRes[]
    : data
      ? [data as ObtenerDivisaPagosTipoRes]
      : []

  return list
    .filter(Boolean)
    .map((item) => ({
      nombre: safeStr(item.nombre),
      codigo: safeStr(item.codigo),
      codigoExterno: safeStr(item.codigoExterno),
      tipo: safeStr(item.tipo),
      banco: safeStr(item.banco),
      aCambio: safeStr(item.aCambio)
    }))
    .filter(
      (item) =>
        item.codigo ||
        item.codigoExterno ||
        item.nombre
    )
}

/**
 * Hook encargado del pago directo del agente.
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
  dispatch,
  multiPagoActivo = false,
  pagosMultiples = []
}: UseAgentCartPaymentParams) => {
  /**
   * El flujo del agente siempre tiene sesión activa.
   */
  const isRoot = useSelector(selectIsRoot)

  /**
   * Datos del usuario autenticado.
   *
   * Se usa fullName primero y nickname como respaldo.
   */
  const sessionFullName = useSelector(
    (state: RootState) => {
      const auth =
        state.auth as AuthStateWithPdfData

      return safeStr(auth.fullName)
    }
  )

  const sessionNickname = useSelector(
    (state: RootState) => {
      const auth =
        state.auth as AuthStateWithPdfData

      return safeStr(auth.nickname)
    }
  )

  const sessionCompanyName = useSelector(
    (state: RootState) => {
      const auth =
        state.auth as AuthStateWithPdfData

      return safeStr(auth.companyName)
    }
  )

  /**
   * Para Root se obtiene la empresa actualmente seleccionada.
   */
  const activeCompanyName = useSelector(
    selectActiveCompanyName
  )

  /**
   * Nombre final del vendedor.
   *
   * Prioridad:
   * 1. Nombre completo.
   * 2. Nickname.
   * 3. Texto de respaldo.
   */
  const sellerName =
    sessionFullName ||
    sessionNickname ||
    "Agente"

  /**
   * Nombre final de la empresa.
   *
   * Root:
   * usa primero la empresa activa seleccionada.
   *
   * Usuario normal:
   * usa la empresa guardada en la sesión.
   */
  const companyName =
    (
      isRoot
        ? safeStr(activeCompanyName)
        : ""
    ) ||
    sessionCompanyName ||
    safeStr(activeCompanyName) ||
    "Empresa"

  const [divisaOpts, setDivisaOpts] =
    useState<ObtenerDivisaPagosTipoRes[]>([])

  const [divisaLoading, setDivisaLoading] =
    useState(false)

  const [payLoading, setPayLoading] =
    useState(false)

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
   * Carga bancos o tipos de pago usando el método seleccionado.
   */
  const loadDivisa = useCallback(
    async (
      nextMethod: CheckoutPaymentMethod | null
    ) => {
      if (
        !nextMethod ||
        nextMethod === "cash"
      ) {
        setDivisaOpts([])
        setDivisaSelected(null)
        return
      }

      setDivisaLoading(true)

      try {
        const req: ObtenerDivisaPagosTipoReq = {
          codigo: "0",
          formulario: "1-",
          opcion:
            getPaymentCodeByMethod(nextMethod)
        }

        const resp =
          await CartService.GetDivisaPagosTipoAsync(
            req
          )

        const fixed =
          normalizarDivisas(resp?.data)

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

  /**
   * Carga bancos o tipos de pago para multipago.
   */
  const cargarDivisasPorMoneda = useCallback(
    async (
      item: Currencyto
    ): Promise<ObtenerDivisaPagosTipoRes[]> => {
      setDivisaLoading(true)

      try {
        const req: ObtenerDivisaPagosTipoReq = {
          codigo: "0",
          formulario: "1-",
          opcion: safeStr(item.codPago)
        }

        const resp =
          await CartService.GetDivisaPagosTipoAsync(
            req
          )

        return normalizarDivisas(resp?.data)
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

  /**
   * Busca la dirección final para la factura.
   */
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

        return safeStr(
          selected?.descripcion
        )
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

  /**
   * Busca la referencia final para la factura.
   */
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

        return safeStr(
          selected?.referencia
        )
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

  /**
   * Valida que los totales en pantalla coincidan con PCG.
   */
  const validateTotalsBeforeInvoice =
    useCallback(
      async ({
        totals,
        codSucursalFactura
      }: {
        totals: InvoiceTotalsDto
        codSucursalFactura: string
      }) => {
        const req = {
          descuentoPantalla:
            totals.descuento ?? 0,

          exonerado: "N",

          ivaPantalla:
            totals.iva ?? 0,

          maquina:
            `CRM-${contactId}`,

          sucursal:
            codSucursalFactura,

          tabla:
            "det_factura_tempo",

          totalEnPantalla:
            totals.subTotal ?? 0,

          usuario:
            contactId.toString()
        }

        const validacionTotales =
          await CartService.sp_valida_SobTotalFactura(
            req
          )

        const {
          pasasub,
          pasadesc,
          pasaiva
        } =
          validacionTotales.data?.[0] ?? {}

        const errores: Record<string, string> = {
          pasasub:
            "Subtotal no válido, diferencia con el valor real.",

          pasadesc:
            "Descuento no válido, diferencia con el valor real.",

          pasaiva:
            "IVA no válido, diferencia con el valor real."
        }

        const fallo = [
          {
            key: "pasasub",
            value: pasasub
          },
          {
            key: "pasadesc",
            value: pasadesc
          },
          {
            key: "pasaiva",
            value: pasaiva
          }
        ].find(
          (item) =>
            item.value === "N"
        )

        if (fallo) {
          throw new Error(
            `(${errores[fallo.key]})`
          )
        }
      },
      [contactId]
    )

  /**
   * Construye el detalle de pago final.
   */
  const construirDetallePagoFinal =
    useCallback(
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
      }) => {
        if (multiPagoActivo) {
          const error =
            validarPagosSeleccionados(
              pagosMultiples,
              totalFinal
            )

          if (error) {
            throw new Error(error)
          }

          const facturaParaPago = {
            ...facturaBase,

            tasaCambio,

            moneda:
              safeStr(facturaBase.moneda) ||
              "1",

            codEmpresa:
              safeStr(facturaBase.codEmpresa)
          } as FacturaTempo

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
            divisaSelected,
            codSucursal:
              codSucursalFactura,
            tasaCambio,
            transfer,
            manualCardData,

            moneda:
              safeStr(facturaBase.moneda) ||
              "1",

            codEmpresa:
              safeStr(
                facturaBase.codEmpresa
              )
          })
        ]
      },
      [
        multiPagoActivo,
        pagosMultiples,
        method,
        canPay,
        divisaSelected,
        transfer,
        manualCardData
      ]
    )

  /**
   * Procesa la venta directa del agente.
   */
  const handleAgentPayNow =
    useCallback(async () => {
      if (payLoading) {
        return
      }

      if (
        !multiPagoActivo &&
        !method
      ) {
        toast.error(
          "Selecciona un método de pago."
        )

        return
      }

      if (
        !multiPagoActivo &&
        !canPay
      ) {
        toast.error(
          "Completa la información del pago."
        )

        return
      }

      if (multiPagoActivo) {
        const error =
          validarPagosSeleccionados(
            pagosMultiples,
            totalPagar
          )

        if (error) {
          toast.error(error)
          return
        }
      }

      if (
        !orderId ||
        orderId <= 0
      ) {
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
        } =
          await ensureEcommerceUser()

        if (
          !ecommerceUserId ||
          !contact
        ) {
          toast.error(
            "No se pudo obtener el usuario ecommerce."
          )

          return
        }

        const existingLog =
          currentLog ??
          (
            await fetchByContactId(
              contactId
            )
          )

        if (!existingLog?.id) {
          toast.error(
            "Log no encontrado."
          )

          return
        }

        const totals =
          await getFreshInvoiceTotals()

        await persistLogWithTotals(
          existingLog,
          ecommerceUserId,
          totals
        )

        const logForInvoice =
          (
            await fetchByContactId(
              contactId
            )
          ) ??
          existingLog

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

          documento:
            "OrdenFactura"
        }

        const dataconse =
          await CartService.GetConsecDocAsync(
            falote
          )

        const consecutivo =
          Number(
            dataconse?.data?.consecutivo ??
            0
          )

        if (!consecutivo) {
          toast.error(
            "No fue posible obtener el consecutivo de factura."
          )

          return
        }

        const facturaBase =
          await loadFacturaTempo()

        /**
         * Nombre del contacto. Si el input de a nombre cotiene informacion se recupera
         */
        const nombreCliente =
          safeStr(contact.fullName) ||
          safeStr(contact.waName) ||
          safeStr(contact.phone) ||
          "Cliente"

        /**
         * Número del contacto.
         */
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
            observacion: observation,

            serie:
              logForInvoice?.serie ??
              existingLog.serie,

            detallePago,
            tasa:tasaCambio,
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
          fullName: nombreCliente
        } as Payload

        await procesarVentaCheckout({
          source: "agent",

          paymentMethod:
            multiPagoActivo
              ? "cash"
              : method as CheckoutPaymentMethod,

          paymentState:
            payment.paymentState,

          invoiceReqFinal,
          payload,
          orderId,

          transactionIdentifier: "",

          usarPdfPagoElectronico:
            false,

          codSucursalFactura,
          consecutivo,

          /**
           * Datos adicionales del PDF.
           */
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
    }, [
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
      sellerName,
      companyName
    ])

  /**
   * Carga opciones cuando cambia el método de pago.
   */
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