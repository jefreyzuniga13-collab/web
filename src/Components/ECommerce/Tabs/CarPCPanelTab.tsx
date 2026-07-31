/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { toast } from "react-toastify"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import { selectCarPCG,selectCartError,selectCartLoading,getProductFromCarAsync,updateCarAsync,setActiveContactId} from "@/Context/Slices/Ecommerce/cartSlice"
import { selectCartBadgeByContactId, setContactCartBadge} from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { selectCompanySistema, selectPermiteMultipago} from "@/Context/Slices/Auth/authSlice"
import { useCart } from "@/Hooks/Ecommerce/tabs/useCart"
import { useChatWindow } from "@/Hooks/Chat/useChatWindow"
import useContact from "@/Hooks/Auth/useContact"
import { useUserEcommerce } from "@/Hooks/Ecommerce/tabs/useUserEcommerce"
import useLogCart from "@/Hooks/Crm/useLogCard"
import useInvoiceOrder from "@/Hooks/Ecommerce/payment/useInvoiceOrder"
import { useAgentCartPayment } from "@/Hooks/Ecommerce/tabs/useAgentCartPayment"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import CartPanelProductStep from "@/Components/ECommerce/Tabs/CartPanelProductStep"
import CartPanelDeliveryStep from "@/Components/ECommerce/Tabs/CartPanelDeliveryStep"
import CartPanelPaymentStep from "@/Components/ECommerce/Tabs/CartPanelPaymentStep"
import CartPanelStepNavigation from "@/Components/ECommerce/Tabs/CartPanelStepNavigation"
import CartPanelTotals from "@/Components/ECommerce/Tabs/CartPanelTotals"
import CartPanelActions from "@/Components/ECommerce/Tabs/CartPanelActions"
import type {CarDto,InvoiceTotalsDto} from "@/Interfaces/Crm/CartPCGInterface"
import type {AddressPayload,CartDetailView,DraftState, LogCartResponseDto} from "@/Interfaces/Crm/LogCartInterface"
import type {ContactLogInterface} from "@/Interfaces/Auth/ContactInterface"
import type {ClientLocationDto} from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type {UserEcommerceDto} from "@/Interfaces/Ecommerce/UserEcommerceInterface"
import type { SendLinkRequestDto} from "@/Interfaces/Ecommerce/SendLinkInterface"
import type {SendInteractiveMessajeRequestDto} from "@/Interfaces/Chat/ChatInterfaces"
import type { PagoSeleccionado} from "@/Interfaces/Ecommerce/MultiPagoTypes"
import {CART_AGENT_STEP,type CartAgentStep} from "@/Interfaces/Ecommerce/CartAgentCheckoutInterface"
import { sendInterctiveMessage } from "@/Services/chat/MessageService"
import { UserSessionService } from "@/Services/auth/UserSessionService"
import { ClientLocationService } from "@/Services/Ecommerce/ClientLocationService"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { generateCartPdfFile } from "@/Utils/Pdf/GenerateCartPdfFile"
import {generateRandomString,formatCurrencyNIO} from "@/Utils/ECommerce/formatters"
import {buildCalculationRequest,buildLogUpdateRequest,countMainProducts,normalizeDraft,safeNumber,safePositiveNumber,toLogCartFormValues} from "@/Utils/ECommerce/utils"
import { formatearDecimales } from "@/Utils/calcularIVA"
import { GENERAL_STATUS } from "@/Constants/status"
import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"
import Lottie from "lottie-react"
import EmptyCartPlayer from "@/assets/lottie/Empty.json"
import "@/Styles/Ecommerce/cardPCGTab.css"

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

interface Props {
  conversationId: number
  contactId: number
}

const CarPCPanelTab = ({ conversationId, contactId }: Props) => {
  const dispatch = useAppDispatch()

  const carPCG = useAppSelector(selectCarPCG)
  const loading = useAppSelector(selectCartLoading)
  const error = useAppSelector(selectCartError)
  const badgeMap = useAppSelector(selectCartBadgeByContactId)
  const companySistema = useAppSelector(selectCompanySistema)
  const permiteMultiPago = useAppSelector(selectPermiteMultipago)

  const contactHasCart = badgeMap?.[contactId] ?? {
    hasCart: false,
    count: 0
  }
  const [search, setSearch] = useState("")
  const [orderId, setOrderId] = useState<number | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [sendChatLoading, setSendChatLoading] = useState(false)
  const [activeStep, setActiveStep] = useState<CartAgentStep>(CART_AGENT_STEP.carrito)
  const [addDescription, setAddDescription] = useState("")
  const [retiraSucursal, setRetiraSucursal] = useState<SINO>("N")
  const [onlyTextAddress, setOnlyTextAddress] = useState<boolean>(false)
  const [transCost, setTransCost] = useState(0)
  const [debouncedTransCost, setDebouncedTransCost] = useState(0)
  const [invoiceTotalsDto, setInvoiceTotalsDto] =
    useState<InvoiceTotalsDto | null>(null)
  const [totalsLoading, setTotalsLoading] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addresses, setAddresses] = useState<ClientLocationDto[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [addressSearch, setAddressSearch] = useState("")
  const [selectedAddressId, setSelectedAddressId] =
    useState<number | null>(null)
  const [invoiceName, setInvoiceName] = useState("")
  const [observation, setObservation] = useState("")
  const [currentLog, setCurrentLog] =
    useState<LogCartResponseDto | null>(null)
  const [multiPagoActivo, setMultiPagoActivoState] = useState(false)
  const [pagosMultiples, setPagosMultiples] =
    useState<PagoSeleccionado[]>([])

  const totalsReqRef = useRef(0)
  const reqRef = useRef(0)
  const hydratedRef = useRef(false)
  const skipPersistOnceRef = useRef(false)
  const cartClearedRef = useRef(false)

  /**
   * Permite limpiar también el estado de pago aunque el reset principal
   * se declare antes de crear el hook de pago.
   */
  const paymentResetRef = useRef<(() => void) | null>(null)

  const ensureEcommerceRef = useRef<Promise<{
    ecommerceUserId: number
    contact: ContactLogInterface | null
  }> | null>(null)

  const {
    setLocked,
    aplicarDescuentoGlobal,
    aplicarDescuentoProducto,
  } = useCartPCGFlowCtx()
  const {sendMessageLinkAsync,getMessageLinkAsync,error: errorCart,loading: loadingCart} = useCart()
  const {UpdatedStatus,fetchByContactId,update: updatedLogCart} = useLogCart()
  const { UpdateEcommerceUserAsync, getById } = useContact()
  const { createAsync } = useUserEcommerce()

  const {
    currency,
    GetCurrencyAsync,
    InsertaFacturaAsync
  } = useInvoiceOrder()

  const { handleSend, sending } = useChatWindow({
    conversationId
  })

  const draftKey = useMemo(
    () => `cartDraft:v1:${conversationId}:${contactId}`,
    [conversationId, contactId]
  )

  const cart = carPCG?.[0]
  const detailsCount = cart?.listDetalle?.length ?? 0

  const hasItems = useMemo(
    () => carPCG != null && carPCG.length > 0,
    [carPCG]
  )

  const showEmpty = !contactHasCart.hasCart || detailsCount === 0

  const isPickup = retiraSucursal === "S"
  const isOnlyTextAddress = onlyTextAddress === true
  const hasSelectedAddress =
    safeNumber(selectedAddressId, 0) > 0
  const hasManualAddress = addDescription.trim().length > 0
  const hasDeliveryAddress = hasSelectedAddress || hasManualAddress

  /** Transporte válido para dirección definida o captura de solo texto. */
  const effectiveShipping =
    !isPickup && (isOnlyTextAddress || hasDeliveryAddress)
      ? safePositiveNumber(transCost)
      : 0

  const addressInputsDisabled =
    isPickup || isOnlyTextAddress || hasSelectedAddress

  /** El transporte se bloquea únicamente cuando el pedido se retira. */
  const transportDisabled = isPickup

  const pickupDisabled =
    isOnlyTextAddress || hasSelectedAddress || hasManualAddress

  const onlyTextAddressDisabled =
    isPickup || hasSelectedAddress || hasManualAddress

  const showAddressButton =
    !isPickup && !isOnlyTextAddress && !hasManualAddress

  const totalPagarAgente = useMemo(() => {
    return safePositiveNumber(invoiceTotalsDto?.total ?? 0)
  }, [invoiceTotalsDto?.total])

  const readDraft = useCallback((): DraftState | null => {
    try {
      return normalizeDraft(localStorage.getItem(draftKey))
    } catch {
      return null
    }
  }, [draftKey])

  const writeDraft = useCallback(
    (state: DraftState) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(state))
      } catch {}
    },
    [draftKey]
  )

  const removeDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
      sessionStorage.removeItem(draftKey)
    } catch {}
  }, [draftKey])

  /**
   * Activa o desactiva el multipago del agente.
   *
   * El agente solo puede usar multipago cuando la empresa lo permite
   * en su sesión autenticada.
   */
  const setMultiPagoActivo = useCallback(
    (value: boolean) => {
      if (value && !permiteMultiPago) {
        setMultiPagoActivoState(false)
        setPagosMultiples([])
        return
      }

      setMultiPagoActivoState(value)

      if (value) {
        paymentResetRef.current?.()
        return
      }

      setPagosMultiples([])
    },
    [permiteMultiPago]
  )

  /**
   * Limpia el panel completo cuando se cancela, se vacía o se procesa venta.
   */
  const resetCartPanelUi = useCallback(() => {
    cartClearedRef.current = true

    setSearch("")
    setOrderId(null)
    setCancelLoading(false)
    setSendChatLoading(false)
    setActiveStep(CART_AGENT_STEP.carrito)

    setAddDescription("")
    setRetiraSucursal("N")
    setOnlyTextAddress(false)
    setTransCost(0)
    setDebouncedTransCost(0)

    setInvoiceTotalsDto(null)
    setTotalsLoading(false)

    setShowAddressModal(false)
    setAddresses([])
    setAddressLoading(false)
    setAddressSearch("")

    setSelectedAddressId(null)
    setInvoiceName("")
    setObservation("")
    setCurrentLog(null)

    setMultiPagoActivoState(false)
    setPagosMultiples([])

    paymentResetRef.current?.()

    setLocked(null)
    removeDraft()
  }, [removeDraft, setLocked])

  const getShippingForTotals = useCallback(
    (opts?: { cost?: number; pickup?: boolean }) => {
      const pickup = opts?.pickup ?? retiraSucursal === "S"
      const cost = safePositiveNumber(opts?.cost ?? transCost)

      const allowShipping =
        !pickup &&
        (
          onlyTextAddress ||
          safeNumber(selectedAddressId, 0) > 0 ||
          addDescription.trim().length > 0
        )

      return allowShipping ? cost : 0
    },
    [
      addDescription,
      onlyTextAddress,
      retiraSucursal,
      selectedAddressId,
      transCost
    ]
  )

  /**
   * Calcula totales del carrito usando el transporte del paso 2.
   */
  const calcTotals = useCallback(
    async (opts?: { cost?: number; pickup?: boolean; silent?: boolean }) => {
      if (!contactId) return null

      const myReq = ++totalsReqRef.current
      const shipping = getShippingForTotals(opts)
      const calculationReqDto = buildCalculationRequest(contactId, shipping)

      if (!opts?.silent) setTotalsLoading(true)

      try {
        const res = await CartService.VspConsolidadoFactura(calculationReqDto)

        if (myReq !== totalsReqRef.current) return null

        const totals = res.data?.[0] ?? null
        setInvoiceTotalsDto(totals)

        return totals
      } catch {
        if (myReq !== totalsReqRef.current) return null

        setInvoiceTotalsDto(null)
        toast.error("No se pudo calcular el total")

        return null
      } finally {
        if (!opts?.silent) setTotalsLoading(false)
      }
    },
    [contactId, getShippingForTotals]
  )

  const getFreshInvoiceTotals = useCallback(async () => {
    const totals = await calcTotals({ silent: true })

    if (!totals) {
      throw new Error("No se pudo calcular el total del carrito")
    }

    return totals
  }, [calcTotals])

  /**
   * Obtiene o crea el usuario ecommerce relacionado al contacto.
   */
  const ensureEcommerceUser = useCallback(async (): Promise<{
    ecommerceUserId: number
    contact: ContactLogInterface | null
  }> => {
    if (ensureEcommerceRef.current) return ensureEcommerceRef.current

    ensureEcommerceRef.current = (async () => {
      try {
        const contact = await getById(contactId)

        if (!contact) {
          toast.error("No se pudo obtener el contacto")
          return { ecommerceUserId: 0, contact: null }
        }

        const existingId = safeNumber(contact.ecommerceUserId, 0)

        if (existingId > 0) {
          return { ecommerceUserId: existingId, contact }
        }

        const date = new Date()

        const phone = String(contact.phone ?? "")
          .replace(/^505/, "")
          .trim()

        const createUserEcommerce: UserEcommerceDto = {
          nombres: (contact.fullName ?? contact.waName ?? "").trim(),
          apellidos: (contact.fullName ?? contact.waName ?? "").trim(),
          codReferencia: "",
          idUsuario: 0,
          correo: (contact.email ?? "").trim(),
          telefono: phone,
          tokenReferencia: "",
          clave: generateRandomString(),
          fechaNacimiento: `${date.getDate()}/${
            date.getMonth() + 1
          }/${date.getFullYear() - 20}`
        }

        const res = await createAsync(createUserEcommerce)
        const ecommerceUserId = safeNumber(res, 0)

        if (ecommerceUserId <= 0) {
          toast.error("No se pudo crear el usuario ecommerce")
          return { ecommerceUserId: 0, contact }
        }

        await UpdateEcommerceUserAsync(contactId, ecommerceUserId)

        return {
          ecommerceUserId,
          contact: {
            ...contact,
            ecommerceUserId
          }
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Error inesperado al asegurar usuario ecommerce"

        toast.error(msg)

        return { ecommerceUserId: 0, contact: null }
      }
    })()

    try {
      return await ensureEcommerceRef.current
    } finally {
      ensureEcommerceRef.current = null
    }
  }, [
    UpdateEcommerceUserAsync,
    contactId,
    createAsync,
    getById
  ])

  /**
   * Construye la dirección que debe persistirse en LogCart.
   */
  const getAddressPayload = useCallback(
    async (ecommerceUserId: number): Promise<AddressPayload> => {
      if (onlyTextAddress) {
        return {
          addressId: null,
          retiraSucursal: "N",
          transCost: effectiveShipping
        }
      }

      if (retiraSucursal === "S") {
        return {
          addressId: null,
          retiraSucursal: "S",
          transCost: 0
        }
      }

      const validSelectedAddressId = safeNumber(selectedAddressId, 0)

      if (validSelectedAddressId > 0) {
        return {
          addressId: validSelectedAddressId,
          retiraSucursal: "N",
          transCost: effectiveShipping
        }
      }

      const manualAddress = addDescription.trim()

      if (manualAddress.length > 0) {
        const reqAddr: ClientLocationDto = {
          descripcion: manualAddress,
          nombre: manualAddress,
          referencia: "",
          idUsuario: ecommerceUserId
        }

        const response = await ClientLocationService.Create(reqAddr)
        const responseAny = response as any

        const createdAddress =
          responseAny?.data?.data ??
          responseAny?.data ??
          responseAny

        const newAddressId = safeNumber(
          createdAddress?.idDireccion ??
            createdAddress?.addressId ??
            createdAddress?.id,
          0
        )

        if (newAddressId <= 0) {
          console.error("Respuesta inválida al crear dirección:", response)

          throw new Error(
            "La dirección fue creada, pero la API no devolvió un ID válido."
          )
        }

        const createdLocation: ClientLocationDto = {
          ...reqAddr,
          ...createdAddress,
          idDireccion: newAddressId
        }

        setSelectedAddressId(newAddressId)

        setAddresses((previous) => {
          const alreadyExists = previous.some(
            (item) => Number(item.idDireccion) === newAddressId
          )

          return alreadyExists
            ? previous
            : [createdLocation, ...previous]
        })

        setAddDescription("")

        return {
          addressId: newAddressId,
          retiraSucursal: "N",
          transCost: effectiveShipping
        }
      }

      return {
        addressId: null,
        retiraSucursal: "N",
        transCost: 0
      }
    },
    [
      addDescription,
      effectiveShipping,
      onlyTextAddress,
      retiraSucursal,
      selectedAddressId
    ]
  )

  /**
   * Persiste dirección, transporte, observación y totales frescos en LogCart.
   */
  const persistLogWithTotals = useCallback(
    async (
      log: LogCartResponseDto,
      ecommerceUserId: number,
      totals: InvoiceTotalsDto
    ) => {
      if (!log?.id) return log

      const addressPayload = await getAddressPayload(ecommerceUserId)

      const req = buildLogUpdateRequest({
        log,
        contactId,
        conversationId,
        addressPayload,
        totals,
        observation,
        invoiceName,
        onlyTextAddress
      })

      await updatedLogCart(log.id, toLogCartFormValues(req as any, log))

      const updatedLog = {
        ...log,
        addressId: addressPayload.addressId ?? undefined,
        transCost: req.transCost ?? 0,
        retiraSucursal: req.retiraSucursal,
        ivaPantalla: req.ivaPantalla ?? 0,
        descuentoPantalla: req.descuentoPantalla ?? 0,
        totalEnPantalla: req.totalEnPantalla ?? 0,
        propina: req.propina ?? 0,
        subTotal: req.subTotal ?? 0,
        observacion: req.observacion ?? "",
        invoiceName: req.invoiceName ?? "",
        onlyTextAddress: req.onlyTextAddress ?? false
      } as LogCartResponseDto

      setCurrentLog(updatedLog)

      removeDraft()

      return updatedLog
    },
    [
      contactId,
      conversationId,
      getAddressPayload,
      invoiceName,
      observation,
      onlyTextAddress,
      removeDraft,
      updatedLogCart
    ]
  )

  /**
   * Persiste solo la dirección cuando el agente selecciona una guardada.
   */
  const persistLogAddressOnly = useCallback(
    async (log: LogCartResponseDto, nextAddressId: number | null) => {
      if (!log?.id) return

      const addressPayload: AddressPayload = {
        addressId: nextAddressId,
        retiraSucursal: "N",
        transCost: safePositiveNumber(transCost)
      }

      const req = buildLogUpdateRequest({
          log,
          contactId,
          conversationId,
          addressPayload,
          totals: null,
          observation,
          invoiceName,
          onlyTextAddress
        })

      await updatedLogCart(log.id, toLogCartFormValues(req, log))

      setCurrentLog({
        ...log,
        addressId: nextAddressId ?? undefined,
        retiraSucursal: "N",
        transCost: addressPayload.transCost,
        observacion: observation,
        invoiceName: req.invoiceName ?? "",
        onlyTextAddress: req.onlyTextAddress ?? false
      } as LogCartResponseDto)
    },
    [
        contactId,
        conversationId,
        invoiceName,
        observation,
        onlyTextAddress,
        transCost,
        updatedLogCart
      ]
  )

  const agentPayment = useAgentCartPayment({
    contactId,
    conversationId,
    orderId,
    totalPagar: totalPagarAgente,
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
    multiPagoActivo,
    pagosMultiples
  })

  paymentResetRef.current = agentPayment.payment.resetPayment

  const {
    payment,
    divisaOpts,
    divisaLoading,
    payLoading,
    handleAgentPayNow,
    cargarDivisasPorMoneda
  } = agentPayment

  const {
    method,
    setMethod,
    divisaSelected,
    setDivisaSelected,
    cashAmount,
    setCashAmount,
    transfer,
    setTransfer,
    manualCardData,
    setManualCardData,
    canPay
  } = payment

  const handleAgentPayNowSafe = useCallback(async () => {
    if (multiPagoActivo && !permiteMultiPago) {
      setMultiPagoActivo(false)

      toast.error(
        "El multipago no está habilitado para esta empresa."
      )

      return
    }

    await handleAgentPayNow()
  }, [
    handleAgentPayNow,
    multiPagoActivo,
    permiteMultiPago,
    setMultiPagoActivo
  ])

  /** Activa dirección de solo texto sin eliminar el costo de transporte. */
  const handleToggleOnlyTextAddress = useCallback((checked: boolean) => {
    setOnlyTextAddress(checked)

    if (checked) {
      setRetiraSucursal("N")
      setSelectedAddressId(null)
      setAddDescription("")
      setShowAddressModal(false)
    }
  }, [])

  const loadAddresses = async () => {
    if (onlyTextAddress) return

    try {
      setAddressLoading(true)

      const { ecommerceUserId } = await ensureEcommerceUser()

      if (!ecommerceUserId) {
        toast.error("No se pudo obtener el usuario ecommerce")
        return
      }

      const res = await ClientLocationService.Get(ecommerceUserId)
      setAddresses(res.data ?? [])
    } catch {
      toast.error("No se pudieron cargar las direcciones")
    } finally {
      setAddressLoading(false)
    }
  }

  const applySelectedAddressToLog = async (addressId: number) => {
    try {
      if (retiraSucursal === "S") return
      if (onlyTextAddress) return
      if (addDescription.trim().length > 0) return

      const log = await fetchByContactId(contactId)

      if (!log?.id) return

      const nextId =
        safeNumber(selectedAddressId, 0) === addressId
          ? null
          : addressId

      setSelectedAddressId(nextId)
      setRetiraSucursal("N")

      await persistLogAddressOnly(log, nextId)

      toast.success(
        nextId ? "Dirección seleccionada" : "Dirección deseleccionada"
      )
    } catch {
      toast.error("No se pudo actualizar la dirección")
    }
  }

  const refreshCartBadge = useCallback(
    async (noPedido: number) => {
      const updated = await dispatch(
        getProductFromCarAsync({
          codCliente: contactId,
          noPedido
        })
      ).unwrap()

      const arr = Array.isArray(updated) ? updated : []
      const count = countMainProducts(arr)

      dispatch(
        setContactCartBadge({
          contactId,
          hasCart: count > 0,
          count
        })
      )

      return { hasCart: count > 0, count }
    },
    [contactId, dispatch]
  )

  const clearCartStateAfterEmpty = useCallback(
    async (noPedido: number) => {
      setAddDescription("")
      setRetiraSucursal("N")
      setOnlyTextAddress(false)
      setTransCost(0)
      setDebouncedTransCost(0)
      setSelectedAddressId(null)
      setInvoiceName("")
      setObservation("")
      setCurrentLog(null)
      setOrderId(null)
      setInvoiceTotalsDto(null)
      setMultiPagoActivoState(false)
      setPagosMultiples([])
      setLocked(null)

      paymentResetRef.current?.()

      try {
        if (noPedido > 0) {
          await UserSessionService.revokeCartTempLink(noPedido)
        }
      } catch {}

      const existingLog = await fetchByContactId(contactId)

      if (existingLog?.id) {
        await UpdatedStatus(existingLog.id, GENERAL_STATUS.Cancelada)
      }

      removeDraft()
    },
    [UpdatedStatus, contactId, fetchByContactId, removeDraft, setLocked]
  )

  const handleRemoveItem = async (
    idUsuario: number,
    noPedido: number,
    codProducto = "",
    unico: string
  ) => {
    if (!noPedido) return

    await dispatch(
      updateCarAsync({
        idUsuario,
        noPedido,
        codProducto,
        unico
      })
    ).unwrap()

    const { count } = await refreshCartBadge(noPedido)

    if (count === 0) {
      await clearCartStateAfterEmpty(noPedido)
    }
  }

  const filteredAddresses = useMemo(() => {
    const term = addressSearch.trim().toLowerCase()

    const base = !term
      ? addresses
      : addresses.filter((address) => {
          const name = String(address.nombre ?? "").toLowerCase()
          const description = String(address.descripcion ?? "").toLowerCase()
          const reference = String(address.referencia ?? "").toLowerCase()

          return (
            name.includes(term) ||
            description.includes(term) ||
            reference.includes(term)
          )
        })

    if (selectedAddressId == null) return base

    const selected = base.find(
      (address) => Number(address.idDireccion) === selectedAddressId
    )

    if (!selected) return base

    return [
      selected,
      ...base.filter(
        (address) => Number(address.idDireccion) !== selectedAddressId
      )
    ]
  }, [addressSearch, addresses, selectedAddressId])

  const filteredDetails: CartDetailView[] = useMemo(() => {
    if (!hasItems) return []

    const term = search.trim().toLowerCase()
    const result: CartDetailView[] = []

    carPCG.forEach((cartItem) => {
      cartItem.listDetalle.forEach((detail) => {
        const description = String(detail.descripcion ?? "").toLowerCase()

        if (!term || description.includes(term)) {
          result.push({ cart: cartItem, detail })
        }
      })
    })

    return result
  }, [carPCG, hasItems, search])

  const buildCartChatMessage = (
    currentCart: CarDto,
    totals: InvoiceTotalsDto,
    opts?: {
      orderId?: number | null
      deliveryDate?: string | null
      existingLog?: LogCartResponseDto | null
    }
  ) => {
    const lines: string[] = []
    const existingLog = opts?.existingLog ?? null

    if (existingLog?.branch) {
      lines.push(`🏬 Sucursal: ${existingLog.branchName ?? ""}`)
    }

    if (invoiceName.trim().length > 0) {
      lines.push(`👤 A nombre de: ${invoiceName.trim()}`)
    }

    if (onlyTextAddress) {
      lines.push("📍 Dirección: el cliente la escribirá en el checkout")
    }

    lines.push("")
    lines.push("🛒 Artículos:")
    lines.push("")

    let productCounter = 0

    currentCart.listDetalle?.forEach((detail) => {
      const qty = safeNumber(detail.cantidad, 0)
      const description = String(detail.descripcion ?? "").trim()
      const note = String(detail.observaciones ?? "").trim()
      const title = [description, note].filter(Boolean).join(" - ")

      if (!title) return

      if (detail.tipoComponente === "P") {
        productCounter++

        const price =
          safeNumber(detail.precioV, 0) > 0
            ? `C$ ${formatearDecimales(detail.precioV)}`
            : ""

        lines.push(`${productCounter}. *${title} - ${price}*`)
        lines.push(`   Cantidad: ${qty}`)
      }

      if (detail.tipoComponente === "O") {
        const price =
          safeNumber(detail.precioV, 0) > 0
            ? `C$ ${formatearDecimales(detail.precioV)}`
            : "Incluido"

        lines.push(`-  ${title.toLocaleLowerCase()} - ${price}`)
        lines.push(`   cantidad: ${qty}`)
      }

      lines.push("")
    })

    const total = safeNumber(totals.total, 0)

    if (retiraSucursal === "S") {
      lines.push(`*🪙 Total:* ${formatCurrencyNIO(total)}`)
      lines.push("🏬 Retira en sucursal")

      if (observation.trim().length > 0) {
        lines.push(`📝 Observación: ${observation.trim()}`)
      }

      return lines.join("\n").trim()
    }

    const envio = safePositiveNumber(effectiveShipping)

    if (envio > 0) {
      lines.push(`🚚 Envío: ${formatCurrencyNIO(envio)}`)
    }

    lines.push(`*🪙 Total:* ${formatCurrencyNIO(total)}`)

    if (hasSelectedAddress) {
      const selected = addresses.find(
        (address) => Number(address.idDireccion) === Number(selectedAddressId)
      )

      const addressText = [
        String(selected?.nombre ?? "").trim(),
        String(selected?.descripcion ?? "").trim(),
        String(selected?.referencia ?? "").trim()
      ]
        .filter(Boolean)
        .join(" | ")

      if (addressText.length > 0) {
        lines.push(`📍 Dirección cliente: ${addressText}`)
      }
    } else if (addDescription.trim().length > 0) {
      lines.push(`📍 Dirección cliente: ${addDescription.trim()}`)
    }

    if (observation.trim().length > 0) {
      lines.push(`📝 Observación: ${observation.trim()}`)
    }

    return lines.join("\n").trim()
  }

  const handleSendCartPdf = async () => {
    if (!cart || sending) return

    try {
      setSendChatLoading(true)

      const contact = await getById(contactId)

      if (!contact) {
        toast.error("No se pudo obtener el contacto")
        return
      }

      const totals = await getFreshInvoiceTotals()

      const selected =
        selectedAddressId != null
          ? addresses.find(
              (address) =>
                Number(address.idDireccion) === Number(selectedAddressId)
            )
          : null

      const addressName = String(selected?.nombre ?? "").trim()

      const addressText = hasSelectedAddress
        ? [
            String(selected?.descripcion ?? "").trim(),
            String(selected?.referencia ?? "").trim()
          ]
            .filter(Boolean)
            .join(" | ")
        : addDescription.trim()

      const pdfContact = {
        ...contact,
        fullName: invoiceName.trim() || contact.fullName,
        waName: invoiceName.trim() || contact.waName
      }

  const pdfFile = generateCartPdfFile(
    cart,
    totals,
    pdfContact,
    {
      retiraSucursal,
      transCost: effectiveShipping,
      addressName: addressName.length > 0 ? addressName : null,
      addressText: addressText.length > 0 ? addressText : null,
      observation: observation.trim() || null,
      finalTotal: totals.total
    },
    currentLog?.branchName ?? ""
  )

      await handleSend([pdfFile], "Resumen de carrito")
    } catch {
      toast.error("No se pudo enviar el PDF")
    } finally {
      setSendChatLoading(false)
    }
  }

  const handleSendLink = async (returnLink = false) => {
    setSendChatLoading(true)

    try {
      const { ecommerceUserId, contact } = await ensureEcommerceUser()

      if (!ecommerceUserId || !contact) return

      const existingLog = await fetchByContactId(contactId)

      if (!existingLog) {
        toast.error("Log no encontrado")
        return
      }

      const orderIdToSend = safeNumber(existingLog.orderId, 0)

      if (!orderIdToSend) {
        toast.error("No hay pedido asociado a este contacto.")
        return
      }

      const totals = await getFreshInvoiceTotals()
      await persistLogWithTotals(existingLog, ecommerceUserId, totals)

      const sendLinkRequest: SendLinkRequestDto = {
        conversationId,
        orderId: orderIdToSend,
        ecommerceUserId,
        email: contact.email ?? "",
        fullName: invoiceName.trim() || (contact.fullName ?? ""),
        contactId
      }

      if (returnLink) {
        return await getMessageLinkAsync(sendLinkRequest)
      }

      await sendMessageLinkAsync(sendLinkRequest)

      removeDraft()
    } catch {
      toast.error("No se pudo enviar el link")
    } finally {
      setSendChatLoading(false)
    }
  }

  const handleSendCartChat = async () => {
    if (!cart || sending) return

    setSendChatLoading(true)

    try {
      const { ecommerceUserId } = await ensureEcommerceUser()

      if (!ecommerceUserId) return

      const existingLog = await fetchByContactId(contactId)

      if (!existingLog) {
        toast.error("Log no encontrado")
        return
      }

      const totals = await getFreshInvoiceTotals()

      const msg = buildCartChatMessage(cart, totals, {
        orderId,
        deliveryDate: format(cart.fecha, "dd/MM/yyyy"),
        existingLog
      })

      if (!msg) return

      if (existingLog.orderId) {
        await persistLogWithTotals(existingLog, ecommerceUserId, totals)
      }

      const req: SendInteractiveMessajeRequestDto = {
        conversationId,
        contactId,
        body: msg
      }

      await sendInterctiveMessage(req)

      removeDraft()
    } catch {
      toast.error("No se pudo confirmar el carrito")
    } finally {
      setSendChatLoading(false)
    }
  }

  const Cancel = async () => {
    if (!orderId || orderId <= 0) return

    setCancelLoading(true)

    try {
      const res = await UserSessionService.revokeCartTempLink(orderId)

      if (res?.success) {
        toast.success(res.message ?? "Link revocado")
      } else {
        toast.success("Link revocado")
      }

      removeDraft()
    } catch {
      toast.error("No se pudo revocar el link")
    } finally {
      setCancelLoading(false)
    }
  }

  useEffect(() => {
    cartClearedRef.current = false
  }, [contactId, conversationId])

  useEffect(() => {
    const onCleared = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          contactId: number
          orderId: number
          conversationId: number
        }>
      ).detail

      if (!detail) return
      if (Number(detail.contactId) !== Number(contactId)) return

      resetCartPanelUi()
    }

    window.addEventListener("CartClearedForActiveContact", onCleared)

    return () => {
      window.removeEventListener("CartClearedForActiveContact", onCleared)
    }
  }, [contactId, resetCartPanelUi])

  useEffect(() => {
    if (!conversationId || !contactId) return

    const draft = readDraft()

    if (!draft) {
      hydratedRef.current = true
      return
    }

    skipPersistOnceRef.current = true

    const draftWithInvoiceName = draft as DraftState & {
      invoiceName?: string | null
    }

    setInvoiceName(String(draftWithInvoiceName.invoiceName ?? "").trim())
    setAddDescription(draft.addDescription)
    setRetiraSucursal(draft.retiraSucursal)
    setOnlyTextAddress(Boolean(draft.onlyTextAddress))
    setTransCost(draft.transCost)
    setSelectedAddressId(draft.selectedAddressId)
    setObservation(draft.observation)

    hydratedRef.current = true
  }, [conversationId, contactId, readDraft])

  useEffect(() => {
    if (!hydratedRef.current) return
    if (!carPCG || carPCG.length === 0) return

    if (skipPersistOnceRef.current) {
      skipPersistOnceRef.current = false
      return
    }

    const nextDraft = {
      addDescription,
      retiraSucursal,
      transCost: safePositiveNumber(transCost),
      selectedAddressId,
      invoiceName,
      observation,
      onlyTextAddress
    } as DraftState

    writeDraft(nextDraft)
  }, [
    carPCG,
    addDescription,
    retiraSucursal,
    transCost,
    selectedAddressId,
    invoiceName,
    observation,
    onlyTextAddress,
    writeDraft
  ])

  useEffect(() => {
    if (isPickup) {
      if (selectedAddressId != null) setSelectedAddressId(null)
      if (addDescription.trim().length > 0) setAddDescription("")
      if (showAddressModal) setShowAddressModal(false)
      if (transCost !== 0) setTransCost(0)
    }
  }, [isPickup, selectedAddressId, addDescription, showAddressModal, transCost])

  useEffect(() => {
    if (isOnlyTextAddress) {
      if (retiraSucursal === "S") setRetiraSucursal("N")
      if (selectedAddressId != null) setSelectedAddressId(null)
      if (addDescription.trim().length > 0) setAddDescription("")
      if (showAddressModal) setShowAddressModal(false)
    }
  }, [
    isOnlyTextAddress,
    retiraSucursal,
    selectedAddressId,
    addDescription,
    showAddressModal
  ])

  useEffect(() => {
    if (hasSelectedAddress) {
      if (retiraSucursal === "S") setRetiraSucursal("N")
      if (addDescription.trim().length > 0) setAddDescription("")
    }
  }, [hasSelectedAddress, retiraSucursal, addDescription])

  useEffect(() => {
    if (!showAddressModal) setAddressSearch("")
  }, [showAddressModal])

  useEffect(() => {
    if (!contactId) return

    dispatch(setActiveContactId(contactId))

    return () => {
      dispatch(setActiveContactId(null))
    }
  }, [contactId, dispatch])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTransCost(safePositiveNumber(transCost))
    }, 350)

    return () => clearTimeout(timer)
  }, [transCost])

  useEffect(() => {
    if (!contactId || detailsCount === 0) return
    if (cartClearedRef.current) return

    void calcTotals({
      cost: debouncedTransCost,
      pickup: retiraSucursal === "S"
    })
  }, [
    contactId,
    carPCG,
    detailsCount,
    debouncedTransCost,
    retiraSucursal,
    selectedAddressId,
    addDescription,
    onlyTextAddress,
    calcTotals
  ])

  useEffect(() => {
    if (!contactId || !conversationId) return

    const myReq = ++reqRef.current

    const loadCart = async () => {
      if (cartClearedRef.current) return

      const log = await fetchByContactId(contactId)

      if (cartClearedRef.current) return
      if (myReq !== reqRef.current) return

      setCurrentLog(log ?? null)

      const noPedido = log?.orderId && log.orderId > 0 ? log.orderId : 0
      setOrderId(noPedido > 0 ? noPedido : null)

      const draft = readDraft()

      if (cartClearedRef.current) return

      const draftAddressId = safeNumber(draft?.selectedAddressId, 0)
      const logAddressId = safeNumber(log?.addressId, 0)

      if (draftAddressId > 0) {
        setSelectedAddressId(draftAddressId)
      } else if (logAddressId > 0) {
        setSelectedAddressId(logAddressId)
      } else {
        setSelectedAddressId(null)
      }

      if (draft?.transCost != null) {
        setTransCost(safePositiveNumber(draft.transCost))
      } else if (log?.transCost != null) {
        setTransCost(safePositiveNumber(log.transCost))
      }

      if (draft?.retiraSucursal === "S" || draft?.retiraSucursal === "N") {
        setRetiraSucursal(draft.retiraSucursal)
      } else if (log?.retiraSucursal === "S" || log?.retiraSucursal === "N") {
        setRetiraSucursal(log.retiraSucursal)
      }

      if (draft?.addDescription?.trim()) {
        setAddDescription(draft.addDescription)
      }

      if (draft?.onlyTextAddress != null) {
        setOnlyTextAddress(Boolean(draft.onlyTextAddress))
      } else if (log?.onlyTextAddress != null) {
        setOnlyTextAddress(Boolean(log.onlyTextAddress))
      }

      const draftWithInvoiceName = draft as
        | (DraftState & { invoiceName?: string | null })
        | null

      const logWithInvoiceName = log as
        | (LogCartResponseDto & {
            invoiceName?: string | null
            nombreFactura?: string | null
            nombreCliente?: string | null
          })
        | null

      const invoiceNameFromDraft = String(
        draftWithInvoiceName?.invoiceName ?? ""
      ).trim()

      const invoiceNameFromLog = String(
        logWithInvoiceName?.invoiceName ??
          logWithInvoiceName?.nombreFactura ??
          logWithInvoiceName?.nombreCliente ??
          ""
      ).trim()

      if (invoiceNameFromDraft) {
        setInvoiceName(invoiceNameFromDraft)
      } else if (invoiceNameFromLog) {
        setInvoiceName(invoiceNameFromLog)
      }

      if (draft?.observation?.trim()) {
        setObservation(draft.observation)
      } else if (String(log?.observacion ?? "").trim().length > 0) {
        setObservation(String(log?.observacion))
      }

      if (cartClearedRef.current) return

      const updated = await dispatch(
        getProductFromCarAsync({
          codCliente: contactId,
          noPedido
        })
      ).unwrap()

      if (cartClearedRef.current) return
      if (myReq !== reqRef.current) return

      const arr = Array.isArray(updated) ? updated : []
      const count = countMainProducts(arr)

      dispatch(
        setContactCartBadge({
          contactId,
          hasCart: count > 0,
          count
        })
      )
    }

    void loadCart()
  }, [contactId, conversationId, dispatch, fetchByContactId, readDraft])

  useEffect(() => {
    if (!permiteMultiPago && multiPagoActivo) {
      setMultiPagoActivo(false)
    }
  }, [permiteMultiPago, multiPagoActivo, setMultiPagoActivo])

  useEffect(() => {
    if (activeStep !== CART_AGENT_STEP.pago) return

    void GetCurrencyAsync()
  }, [activeStep, GetCurrencyAsync])

  const actionsDisabled =
    loadingCart ||
    loading ||
    sending ||
    sendChatLoading ||
    cancelLoading ||
    totalsLoading ||
    payLoading

  if (loadingCart || loading) {
    return (
      <div className="cartPanel-loadingCartContiner">
        <p className="cartPanel-loadingCartText">Cargando...</p>
      </div>
    )
  }

  if (errorCart) {
    return (
      <div className="cartPanel-errorContiner">
        <p className="cartPanel-errorText">{errorCart.message}</p>
      </div>
    )
  }

  if (showEmpty) {
    return (
      <div className="carPCPanel-container">
        <header className="carPCPanel-header">
          <h5 className="productTab-content-header__title">Carrito</h5>
        </header>

        <div className="carPCPanel-emptyContainer">
          <Lottie loop={false} autoplay animationData={EmptyCartPlayer} />

          <p className="cardPanel--emptyText">
            No hay productos en el carrito.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="carPCPanel-container">
      <header className="carPCPanel-header">
        <h5 className="productTab-content-header__title">
          Carrito{" "}
          {currentLog?.branchName ? `- Sucursal ${currentLog.branchName}` : ""}
        </h5>
      </header>

      <section className="carPCPanel-content">
        {activeStep === CART_AGENT_STEP.carrito && (
          <CartPanelProductStep
            search={search}
            setSearch={setSearch}
            filteredDetails={filteredDetails}
            companySistema={companySistema}
            handleRemoveItem={handleRemoveItem}
            cartUserId={cart?.idUsuario ?? 0}
            aplicarDescuentoGlobal={aplicarDescuentoGlobal}
            aplicarDescuentoProducto={aplicarDescuentoProducto}
          />
        )}

        {activeStep === CART_AGENT_STEP.entrega && (
          <CartPanelDeliveryStep
            invoiceName={invoiceName}
            setInvoiceName={setInvoiceName}
            observation={observation}
            setObservation={setObservation}
            addDescription={addDescription}
            setAddDescription={setAddDescription}
            transCost={transCost}
            setTransCost={setTransCost}
            retiraSucursal={retiraSucursal}
            setRetiraSucursal={setRetiraSucursal}
            onlyTextAddress={onlyTextAddress}
            setOnlyTextAddress={handleToggleOnlyTextAddress}
            onlyTextAddressDisabled={onlyTextAddressDisabled}
            addressInputsDisabled={addressInputsDisabled}
            transportDisabled={transportDisabled}
            pickupDisabled={pickupDisabled}
            showAddressModal={showAddressModal}
            setShowAddressModal={setShowAddressModal}
            filteredAddresses={filteredAddresses}
            addressLoading={addressLoading}
            addressesLength={addresses.length}
            addressSearch={addressSearch}
            setAddressSearch={setAddressSearch}
            selectedAddressId={selectedAddressId}
            applySelectedAddressToLog={applySelectedAddressToLog}
          />
        )}

        {activeStep === CART_AGENT_STEP.pago && (
          <CartPanelPaymentStep
            method={method}
            setMethod={setMethod}
            divisaOpts={divisaOpts}
            divisaSelected={divisaSelected}
            setDivisaSelected={setDivisaSelected}
            divisaLoading={divisaLoading}
            cashAmount={cashAmount}
            setCashAmount={setCashAmount}
            transfer={transfer}
            setTransfer={setTransfer}
            manualCardData={manualCardData}
            setManualCardData={setManualCardData}
            totalPagar={totalPagarAgente}
            transpCost={effectiveShipping}
            invoiceTotalsDto={invoiceTotalsDto}
            carPCG={carPCG}
            currentLog={currentLog}
            payLoading={payLoading}
            actionsDisabled={actionsDisabled}
            canPay={canPay}
            onBack={() => setActiveStep(CART_AGENT_STEP.entrega)}
            handlePayNow={handleAgentPayNowSafe}
            permiteMultiPago={permiteMultiPago}
            multiPagoActivo={multiPagoActivo}
            setMultiPagoActivo={setMultiPagoActivo}
            pagosMultiples={pagosMultiples}
            setPagosMultiples={setPagosMultiples}
            currency={currency}
            cargarDivisas={cargarDivisasPorMoneda}
          />
        )}

        <div className="carPCPanel-bottom">
          <CartPanelStepNavigation
            activeStep={activeStep}
            setActiveStep={setActiveStep}
          />

          
          <CartPanelTotals
            invoiceTotalsDto={invoiceTotalsDto}
            effectiveShipping={effectiveShipping}
            retiraSucursal={retiraSucursal}
            selectedAddressId={selectedAddressId}
            addDescription={addDescription}
          />

          <CartPanelActions
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            showAddressButton={showAddressButton}
            actionsDisabled={actionsDisabled}
            sending={sending}
            sendChatLoading={sendChatLoading}
            cancelLoading={cancelLoading}
            loadAddresses={loadAddresses}
            setShowAddressModal={setShowAddressModal}
            handleSendCartPdf={handleSendCartPdf}
            handleSendCartChat={handleSendCartChat}
            Cancel={Cancel}
            handleSendLink={handleSendLink}
          />
        </div>
      </section>
    </div>
  )
}

export default CarPCPanelTab