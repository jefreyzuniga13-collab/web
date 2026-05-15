/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Input from "@/Components/Common/Input"
import type { CarDto, ListDetalleCarrito, InvoiceTotalsDto } from "@/Interfaces/Crm/CartPCGInterface"
import { toast } from "react-toastify"
import "@/Styles/Ecommerce/cardPCGTab.css"
import Button from "@/Components/Common/Button"
import { useCart } from "@/Hooks/Ecommerce/tabs/useCart"
// import noimageavailable from "@/assets/img/noimageavailable.webp"
import { useChatWindow } from "@/Hooks/Chat/useChatWindow"
import { MdDelete } from "react-icons/md"
import { selectCarPCG, selectCartError, selectCartLoading, getProductFromCarAsync, updateCarAsync, setActiveContactId } from "@/Context/Slices/Ecommerce/cartSlice"
import { format } from "date-fns"
import { FaFilePdf, 
  // FaLongArrowAltLeft, FaLongArrowAltRight 
} from "react-icons/fa"
import { FaMapMarkerAlt } from "react-icons/fa";
import { IoIosChatboxes } from "react-icons/io"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import useContact from "@/Hooks/Auth/useContact"
import { useUserEcommerce } from "@/Hooks/Ecommerce/tabs/useUserEcommerce"
import type { UserEcommerceDto } from "@/Interfaces/Ecommerce/UserEcommerceInterface"
import type { SendLinkRequestDto } from "@/Interfaces/Ecommerce/SendLinkInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import { UserSessionService } from "@/Services/auth/UserSessionService"
import type { ContactLogInterface } from "@/Interfaces/Auth/ContactInterface"
import { sendInterctiveMessage } from "@/Services/chat/MessageService"
import type { SendInteractiveMessajeRequestDto } from "@/Interfaces/Chat/ChatInterfaces"
import { MdOutlineCancelScheduleSend } from "react-icons/md"
import { IoSend } from "react-icons/io5"
import { selectCartBadgeByContactId, setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { generateCartPdfFile } from "@/Utils/Pdf/GenerateCartPdfFile"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { generateRandomString } from "@/Utils/ECommerce/formatters"
import { formatCurrencyNIO } from "@/Utils/ECommerce/formatters"
import { ClientLocationService } from "@/Services/Ecommerce/ClientLocationService"
import type { CalculationReqDto, ClientLocationDto } from "@/Interfaces/Ecommerce/ClientLocationInterface"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import type { LogCartResponseDto, LogCartUpdateRequestDto } from "@/Interfaces/Crm/LogCartInterface"
import EmptyCartPlayer from '@/assets/lottie/Empty.json'
import Lottie from "lottie-react";
import { PCG_SERVICES } from "@/Constants/pcgservices"
import vacio from '@/assets/vacio.png'
import { calcularIVA, formatearDecimales } from "@/Utils/calcularIVA"
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

interface Props {
  conversationId: number
  contactId: number
}

type DraftState = {
  addDescription: string
  retiraSucursal: "S" | "N"
  transCost: number
  selectedAddressId: number | null
  observation: string
}

const CarPCPanelTab = ({ conversationId, contactId }: Props) => {
  const [search, setSearch] = useState<string>("")
  const [orderId, setOrderId] = useState<number | null>(null)
  const [cancelLoading, setCancelLoading] = useState<boolean>(false)
  const [sendChatoading, setSendChatoading] = useState<boolean>(false)
  const [activeStep, setActiveStep] = useState<number>(1)

  const [addDescription, setAddDescription] = useState<string>("")
  const [retiraSucursal, setRetiraSucursal] = useState<"S" | "N">("N")
  const [transCost, setTransCost] = useState<number>(0)

  const [invoiceTotalsDto, setInvoiceTotalsDto] = useState<InvoiceTotalsDto | null>(null)
  const [totalsLoading, setTotalsLoading] = useState<boolean>(false)

  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addresses, setAddresses] = useState<ClientLocationDto[]>([])
  const [addressLoading, setAddressLoading] = useState(false)
  const [observation, setObservation] = useState<string>("")

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [addressSearch, setAddressSearch] = useState<string>("")

  const [currentLog, setCurrentLog] = useState<LogCartResponseDto | null>(null)

  const [debouncedTransCost, setDebouncedTransCost] = useState<number>(0)
  const totalsReqRef = useRef(0)
  const { setLocked } = useCartPCGFlowCtx()
  const dispatch = useAppDispatch()
  const carPCG = useAppSelector(selectCarPCG)
  const loading = useAppSelector(selectCartLoading)
  const error = useAppSelector(selectCartError)
  const badgeMap = useAppSelector(selectCartBadgeByContactId)
  const contactHasCart = badgeMap?.[contactId] ?? { hasCart: false, count: 0 }

  const ensureEcommerceRef = useRef<Promise<{ ecommerceUserId: number; contact: ContactLogInterface | null }> | null>(null)
  const reqRef = useRef(0)
  const hydratedRef = useRef(false)
  const skipPersistOnceRef = useRef(false)

  const { sendMessageLinkAsync, getMessageLinkAsync, error: errorCart, loading: loadingCart } = useCart()
  const { UpdatedStatus, fetchByContactId, update: updatedLogCart } = useLogCart()
  const { UpdateEcommerceUserAsync, getById } = useContact()

  const { createAsync } = useUserEcommerce()
  const { setFile, setText, handleSend, sending } = useChatWindow({ conversationId })

  const draftKey = useMemo(() => `cartDraft:v1:${conversationId}:${contactId}`, [conversationId, contactId])

  const isPickup = retiraSucursal === "S"
  const hasSelectedAddress = selectedAddressId != null
  const hasManualAddress = addDescription.trim().length > 0
  const hasDeliveryAddress = hasSelectedAddress || hasManualAddress
  const effectiveShipping = !isPickup && hasDeliveryAddress ? Number(transCost ?? 0) : 0

  const addressInputsDisabled = isPickup || hasSelectedAddress
  const transportDisabled = isPickup
  const pickupDisabled = hasSelectedAddress || hasManualAddress

  const showAddressButton = !isPickup && !hasManualAddress

  const readDraft = useCallback((): DraftState | null => {
    try {
      const raw = localStorage.getItem(draftKey)

      if (!raw) return null
      const parsed = JSON.parse(raw) as Partial<DraftState>
      const next: DraftState = {
        addDescription: String(parsed.addDescription ?? ""),
        retiraSucursal: parsed.retiraSucursal === "S" ? "S" : "N",
        transCost: Number(parsed.transCost ?? 0),
        selectedAddressId:
          parsed.selectedAddressId != null && Number.isFinite(Number(parsed.selectedAddressId))
            ? Number(parsed.selectedAddressId)
            : null,
        observation: String(parsed.observation ?? "")
      }
      if (!Number.isFinite(next.transCost) || next.transCost < 0) next.transCost = 0
      return next
    } catch {
      return null
    }
  }, [draftKey])


  const writeDraft = (state: DraftState) => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(state))
    } catch { }
  }

  const calcTotals = useCallback(async (opts?: { cost?: number; pickup?: boolean; silent?: boolean }) => {
    if (!contactId) return
    const myReq = ++totalsReqRef.current

    const pickup = opts?.pickup ?? (retiraSucursal === "S")
    const cost = Number(opts?.cost ?? transCost ?? 0)
    const safeCost = Number.isFinite(cost) && cost > 0 ? cost : 0
    const allowShipping = !pickup && (selectedAddressId != null || addDescription.trim().length > 0)

    const calculationReqDto: CalculationReqDto = {
      maquina: `CRM-${contactId}`,
      usuario: `${contactId}`,
      aplicaPropina: "N",
      exonerada: "N",
      imi: "N",
      ir: "N",
      tabla: "det_factura_tempo",
      tasa: 36.6243,
      tipoServicio: PCG_SERVICES.CRM.toString(),
      valorTransporte: allowShipping ? safeCost : 0
    }

    if (!opts?.silent) setTotalsLoading(true)
    try {
      const res = await CartService.VspConsolidadoFactura(calculationReqDto)
      if (myReq !== totalsReqRef.current) return
      setInvoiceTotalsDto(res.data?.[0] ?? null)
    } catch {
      if (myReq !== totalsReqRef.current) return
      setInvoiceTotalsDto(null)
      toast.error("No se pudo calcular el total")
    } finally {
      if (!opts?.silent) setTotalsLoading(false)
    }
  }, [
    // addDescription, 
    contactId, retiraSucursal, selectedAddressId, transCost])

  useEffect(() => {
    if (!conversationId || !contactId) return
    const draft = readDraft()
    if (!draft) {
      hydratedRef.current = true
      return
    }
    skipPersistOnceRef.current = true
    setAddDescription(draft.addDescription)
    setRetiraSucursal(draft.retiraSucursal)
    setTransCost(draft.transCost)
    setSelectedAddressId(draft.selectedAddressId)
    setObservation(draft.observation)
    hydratedRef.current = true
  }, [draftKey, conversationId, contactId, readDraft])

useEffect(() => {
  if (!hydratedRef.current) return
  if (!carPCG || carPCG.length === 0) return

  if (skipPersistOnceRef.current) {
    skipPersistOnceRef.current = false
    return
  }

  writeDraft({
    addDescription,
    retiraSucursal,
    transCost: Number(transCost ?? 0),
    selectedAddressId,
    observation
  })
}, [carPCG, addDescription, retiraSucursal, transCost, selectedAddressId, observation, draftKey])

  useEffect(() => {
    if (isPickup) {
      if (selectedAddressId != null) setSelectedAddressId(null)
      if (addDescription.trim().length > 0) setAddDescription("")
      if (showAddressModal) setShowAddressModal(false)
      if (transCost !== 0) setTransCost(0)
    }
  }, [isPickup, selectedAddressId, addDescription, showAddressModal, transCost])

  useEffect(() => {
    if (hasSelectedAddress) {
      if (retiraSucursal === "S") setRetiraSucursal("N")
      if (addDescription.trim().length > 0) setAddDescription("")
    }
  }, [hasSelectedAddress, retiraSucursal, addDescription])

  const filteredAddresses = useMemo(() => {
    const term = addressSearch.trim().toLowerCase()

    const base = !term
      ? addresses
      : addresses.filter((a) => {
        const n = String(a.nombre ?? "").toLowerCase()
        const d = String(a.descripcion ?? "").toLowerCase()
        const r = String(a.referencia ?? "").toLowerCase()
        return n.includes(term) || d.includes(term) || r.includes(term)
      })

    if (selectedAddressId == null) return base

    const selected = base.find((a) => Number(a.idDireccion) === selectedAddressId)
    if (!selected) return base

    return [selected, ...base.filter((a) => Number(a.idDireccion) !== selectedAddressId)]
  }, [addresses, addressSearch, selectedAddressId])

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
    const t = setTimeout(() => {
      setDebouncedTransCost(Number(transCost ?? 0))
    }, 350)
    return () => clearTimeout(t)
  }, [transCost])

  useEffect(() => {
    if (!contactId) return
    void calcTotals({ cost: debouncedTransCost, pickup: retiraSucursal === "S" })
  }, [contactId, debouncedTransCost, retiraSucursal, selectedAddressId, addDescription, calcTotals])

  useEffect(() => {
    if (!contactId || !conversationId) return
    const myReq = ++reqRef.current

    const loadCart = async () => {
      const log = await fetchByContactId(contactId)
      if (myReq !== reqRef.current) return

      setCurrentLog(log ?? null)

      const noPedido = log?.orderId && log.orderId > 0 ? log.orderId : 0
      setOrderId(noPedido > 0 ? noPedido : null)

      const draft = readDraft()

      if (draft?.selectedAddressId != null) setSelectedAddressId(draft.selectedAddressId)
      else if (log?.addressId != null) setSelectedAddressId(Number(log.addressId))

      if (draft?.transCost != null) setTransCost(Number(draft.transCost ?? 0))
      else if (log?.transCost != null) setTransCost(Number(log.transCost ?? 0))

      if (draft?.retiraSucursal === "S" || draft?.retiraSucursal === "N") setRetiraSucursal(draft.retiraSucursal)
      else if (log?.retiraSucursal === "S" || log?.retiraSucursal === "N") setRetiraSucursal(log.retiraSucursal)

      if (draft?.addDescription != null && String(draft.addDescription).trim().length > 0) {
        setAddDescription(String(draft.addDescription))
      }

      if (draft?.observation != null && String(draft.observation).trim().length > 0) {
        setObservation(String(draft.observation))
      } else {
        const obs = (log)?.observacion
        if (String(obs ?? "").trim().length > 0) setObservation(String(obs))
      }

      const updated = await dispatch(getProductFromCarAsync({ codCliente: contactId, noPedido })).unwrap()
      if (myReq !== reqRef.current) return

      const arr = Array.isArray(updated) ? updated : []

      const count = arr[0]?.listDetalle?.reduce((sum, d) => {
        // Solo sumamos si tipoComponente NO es "O"
        if (d.tipoComponente !== "O") {
          return sum + Number(d.cantidad ?? 0);
        }
        // Si es "O", retornamos el acumulador tal cual
        return sum;
      }, 0) ?? 0;
      
      dispatch(setContactCartBadge({ contactId, hasCart: count > 0, count }))

      const calcTrans = Number(draft?.transCost ?? log?.transCost ?? transCost ?? 0)
      setDebouncedTransCost(calcTrans)
      void calcTotals({
        cost: calcTrans,
        pickup: (draft?.retiraSucursal ?? log?.retiraSucursal ?? retiraSucursal) === "S",
        silent: true
      })
    }

    void loadCart()
  }, [contactId, conversationId, dispatch, fetchByContactId, draftKey, readDraft, transCost, calcTotals, retiraSucursal])

  const ensureEcommerceUser = async (): Promise<{ ecommerceUserId: number; contact: ContactLogInterface | null }> => {
    if (ensureEcommerceRef.current) return ensureEcommerceRef.current

    ensureEcommerceRef.current = (async () => {
      try {
        const contact = await getById(contactId)
        if (!contact) {
          toast.error("No se pudo obtener el contacto")
          return { ecommerceUserId: 0, contact: null }
        }

        const existingId = Number(contact.ecommerceUserId ?? 0)
        if (existingId > 0) return { ecommerceUserId: existingId, contact }

        const date = new Date()
        const phone = (contact.phone ?? "").replace(/^505/, "").trim()

        const createUserEcommerce: UserEcommerceDto = {
          nombres: (contact.fullName ?? contact.waName ?? "").trim(),
          apellidos: (contact.fullName ?? contact.waName ?? "").trim(),
          codReferencia: "",
          idUsuario: 0,
          correo: (contact.email ?? "").trim(),
          telefono: phone,
          tokenReferencia: "",
          clave: generateRandomString(),
          fechaNacimiento: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear() - 20}`
        }

        const res = await createAsync(createUserEcommerce)
        const ecommerceUserId = Number(res)

        //accede aqui aunque realmente si se crea y da
        console.log()
        if (!ecommerceUserId || Number.isNaN(ecommerceUserId) || ecommerceUserId <= 0) {
          toast.error("No se pudo crear el usuario ecommerce")
          return { ecommerceUserId: 0, contact }
        }

        await UpdateEcommerceUserAsync(contactId, ecommerceUserId)
        return { ecommerceUserId, contact: { ...contact, ecommerceUserId } }
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? err?.message ?? "Error inesperado al asegurar usuario ecommerce"
        toast.error(msg)
        return { ecommerceUserId: 0, contact: null }
      }
    })()

    try {
      return await ensureEcommerceRef.current
    } finally {
      ensureEcommerceRef.current = null
    }
  }

  const loadAddresses = async () => {
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
      if (addDescription.trim().length > 0) return

      const log = await fetchByContactId(contactId)
      if (!log?.id) return

      const nextId = selectedAddressId === addressId ? null : addressId

      setCurrentLog({ ...log, addressId: nextId ?? undefined })
      setSelectedAddressId(nextId)

      const req: LogCartUpdateRequestDto = {
        orderId: Number(log.orderId ?? 0),
        contactId: Number(log.contactId ?? 0),
        userId: Number(log.userId ?? 0),
        conversationId: Number(log.conversationId ?? 0),
        statusId: Number(log.statusId ?? 0),
        branch: (log)?.branch ?? null,
        branchName: (log)?.branchName ?? null,
        wherehouse: (log)?.wherehouse ?? null,
        wherehouseCode: (log)?.wherehouseCode ?? null,
        retiraSucursal: "N",
        addressId: nextId,
        transCost: Number(transCost ?? 0),
        totalEnPantalla: Number((invoiceTotalsDto)?.total ?? (log)?.totalEnPantalla ?? 0) || null,
        descuentoPantalla: Number((invoiceTotalsDto)?.descuento ?? (log)?.DescuentoPantalla ?? 0) || null,
        ivaPantalla: Number((invoiceTotalsDto)?.iva ?? (log)?.ivaPantalla ?? 0) || null,
        exonerado: (log)?.Exonerado ?? null,
        propina: Number((invoiceTotalsDto)?.propina ?? (log)?.propina ?? 0) || null,
        subTotal: Number((invoiceTotalsDto)?.subTotal ?? (log)?.subTotal ?? 0) || null,
        observacion: observation ?? "",

        // Actualizar cuando estos log estos dos campos son basios o null
        destinationBranchCode: "",
        destinationWherehouseCode: "",
        serie: log.serie
      }

      await updatedLogCart(log.id, req as any)
      toast.success(nextId ? "Dirección seleccionada" : "Dirección deseleccionada")
    } catch {
      toast.error("No se pudo actualizar la dirección")
    }
  }

  const handleRemoveItem = async (idUsuario: number, noPedido: number, codProducto: string = '', unico: string) => {
    if (!noPedido) return

    //Eliminar no solo el producto, tambien las opciones
     await dispatch(updateCarAsync({ idUsuario, noPedido, codProducto, unico })).unwrap()

    const updated = await dispatch(getProductFromCarAsync({  codCliente: contactId ?? 0, noPedido })).unwrap()
    const arr = Array.isArray(updated) ? updated : []
    // const count = arr[0]?.listDetalle?.length ?? 0
    
      const count = arr[0]?.listDetalle?.reduce((sum, d) => {
        // Solo sumamos si tipoComponente NO es "O"
        if (d.tipoComponente !== "O") {
          return sum + Number(d.cantidad ?? 0);
        }
        // Si es "O", retornamos el acumulador tal cual
        return sum;
      }, 0) ?? 0;
    
    const empty = count === 0

    dispatch(setContactCartBadge({ contactId, hasCart: !empty, count }))

    if (empty) {
          setAddDescription("")
          setRetiraSucursal("N")
          setTransCost(0)
          setSelectedAddressId(null)
          setObservation("")
          setCurrentLog(null)
          setOrderId(null)
          setLocked(null)

      try {
        if (noPedido && noPedido > 0) await UserSessionService.revokeCartTempLink(noPedido)
      } catch { }
      const existingLog = await fetchByContactId(contactId)
      if (existingLog?.id) await UpdatedStatus(existingLog.id, 3)
      try {
        localStorage.removeItem(draftKey)
      } catch { }
    }
  }

  const hasItems = useMemo(() => carPCG != null && carPCG.length > 0, [carPCG])

  const filteredDetails: { cart: CarDto; detail: ListDetalleCarrito }[] = useMemo(() => {
    if (!hasItems) return []
    const term = search.trim().toLowerCase()
    const result: { cart: CarDto; detail: ListDetalleCarrito }[] = []
    carPCG.forEach((cart) => {
      cart.listDetalle.forEach((detail) => {
        if (!term || detail.descripcion.toLowerCase().includes(term)) result.push({ cart, detail })
      })
    })
    return result
  }, [carPCG, hasItems, search])

  if (loading) return <span>Cargando...</span>

  if (loadingCart)
    return (
      <div className="cartPanel-loadingCartContiner">
        <p className="cartPanel-loadingCartText">Cargando...</p>
      </div>
    )

  if (errorCart)
    return (
      <div className="cartPanel-errorContiner">
        <p className="cartPanel-errorText">{errorCart.message}</p>
      </div>
    )

  const cart = carPCG?.[0]
  const detailsCount = cart?.listDetalle?.length ?? 0
  const showEmpty = !contactHasCart.hasCart || detailsCount === 0

  if (showEmpty) {
    return (
      <div className="carPCPanel-container">
        <header className="carPCPanel-header">
          <h5 className="productTab-content-header__title">Carrito</h5>
        </header>
        <div className="carPCPanel-emptyContainer">
          <Lottie loop={false} autoplay animationData={EmptyCartPlayer} />
          <p className="cardPanel--emptyText">No hay productos en el carrito.</p>
        </div>
      </div>
    )
  }

  const handleSendCartPdf = async () => {
    if (!cart || sending) return
    const contact = await getById(contactId)
    if (!contact) {
      toast.error("No se pudo obtener el contacto")
      return
    }

    const selected = selectedAddressId != null ? addresses.find((a) => Number(a.idDireccion) === Number(selectedAddressId)) : null
    const addressName = String(selected?.nombre ?? "").trim()
    const addressText = hasSelectedAddress
      ? [String(selected?.descripcion ?? "").trim(), String(selected?.referencia ?? "").trim()].filter(Boolean).join(" | ")
      : addDescription.trim()

    const file = generateCartPdfFile(cart, invoiceTotalsDto, contact, {
      retiraSucursal,
      transCost,
      addressName: addressName.length > 0 ? addressName : null,
      addressText: addressText.length > 0 ? addressText : null,
      finalTotal: invoiceTotalsDto?.total
    })

    setFile(file)
    setText("Resumen de carrito")
    await handleSend()
  }

  const buildCartChatMessage = (cart: CarDto, opts?: { orderId?: number | null; deliveryDate?: string | null }) => {
    const lines: string[] = []
    lines.push(`🛍️ Pedido No ${opts?.orderId ?? cart.noPedido ?? "N/D"}`)
    lines.push("")
    lines.push("🛒 Artículos:")
    lines.push("")

    cart.listDetalle?.forEach((d) => {
      const qty = d.cantidad ?? 0
      const title = (d.descripcion ?? "").trim() + " - " + d.observaciones
      if (!title) return
      lines.push(`*${title}* - ${qty}`)

      const opciones =
        d.listOpciones
          ?.map((o) => (o.descripcionOp.trim() + " - " + o.cantidad.toString().trim()).trim())
          .filter(Boolean) ?? []

      opciones.forEach((op) => lines.push(`   ${op}`))
      lines.push("")
    })

    const total =
      (formatearDecimales(invoiceTotalsDto?.total ?? 0))

    if (retiraSucursal === "S") {
      lines.push(`*🪙 Total:* ${formatCurrencyNIO(Number(total))}`)
      lines.push("🏬 Retira en sucursal")
      if (observation.trim().length > 0) lines.push(`📝 Observación: ${observation.trim()}`)
    } else {
      const envio = effectiveShipping
      const hasEnvio = Number.isFinite(envio) && envio > 0

      if (hasEnvio) lines.push(`🚚 Envío: C$ ${envio.toFixed(2)}`)
      // lines.push(`*🪙 Total:* ${formatCurrencyNIO(total)}${hasEnvio ? " | *Más envío*" : ""}`)
      lines.push(`*🪙 Total:* ${formatCurrencyNIO(Number(total))}`)

      if (hasSelectedAddress) {
        const selected = addresses.find((a) => Number(a.idDireccion) === Number(selectedAddressId))
        const addrName = String(selected?.nombre ?? "").trim()
        const addrDesc = String(selected?.descripcion ?? "").trim()
        const addrRef = String(selected?.referencia ?? "").trim()
        const best = [addrName, addrDesc, addrRef].filter((x) => x.length > 0).join(" | ")
        if (best.length > 0) lines.push(`📍 Dirección: ${best}`)
      } else if (addDescription.trim().length > 0) {
        lines.push(`📍 Dirección: ${addDescription.trim()}`)
      }

      if (observation.trim().length > 0) lines.push(`📝 Observación: ${observation.trim()}`)
    }

    if (opts?.deliveryDate) lines.push(`🗓️ Fecha de entrega: ${opts.deliveryDate}`)
    return lines.join("\n").trim()
  }

  const handlePersistLog = async (log: LogCartResponseDto, ecommerceUserId: number) => {
    if (!log?.id) return log

    let addressId: number | null = null

    if (retiraSucursal === "S") {
      addressId = null
    } else {
      if (selectedAddressId != null) {
        addressId = selectedAddressId
      } else if (addDescription && addDescription.trim().length > 0) {
        const reqAddr: ClientLocationDto = {
          descripcion: addDescription.trim(),
          nombre: addDescription.trim(),
          referencia: addDescription.trim(),
          idUsuario: ecommerceUserId
        }
        const address = await ClientLocationService.Create(reqAddr)
        const newId = address?.data?.idDireccion
        addressId = newId ? Number(newId) : null
      } else {
        addressId = null
      }
    }

    const req: LogCartUpdateRequestDto = {
      orderId: Number(log.orderId ?? 0),
      contactId: Number(log.contactId ?? 0),
      userId: Number(log.userId ?? 0),
      conversationId: Number(log.conversationId ?? 0),
      statusId: Number(log.statusId ?? 0),
      branch: (log)?.branch ?? null,
      branchName: (log)?.branchName ?? null,
      wherehouse: (log)?.wherehouse ?? null,
      wherehouseCode: (log)?.wherehouseCode ?? null,
      retiraSucursal,
      addressId,
      transCost: retiraSucursal === "S" ? 0 : effectiveShipping,
      ivaPantalla: (invoiceTotalsDto)?.iva ?? null,
      descuentoPantalla: (invoiceTotalsDto)?.descuento ?? null,
      totalEnPantalla: (invoiceTotalsDto)?.total ?? null,
      propina: (invoiceTotalsDto)?.propina ?? null,
      subTotal: (invoiceTotalsDto)?.subTotal ?? null,
      exonerado: (log)?.Exonerado ?? null,
      observacion: observation ?? "",
    }

    await updatedLogCart(log.id, req as any)

    setCurrentLog({
      ...log,
      addressId: addressId ?? undefined,
      transCost: req.transCost ?? 0,
      retiraSucursal,
      ivaPantalla: req.ivaPantalla ?? 0,
      DescuentoPantalla: req.descuentoPantalla ?? 0,
      totalEnPantalla: req.totalEnPantalla ?? 0,
      propina: req.propina ?? 0,
      subTotal: req.subTotal ?? 0,
      observacion: req.observacion ?? ""
    })

    try {
      localStorage.removeItem(draftKey)
    } catch { }

    return log
  }

  const handleSendLink = async (returnLink: boolean = false) => {
    setSendChatoading(true)
    try {
      const { ecommerceUserId, contact } = await ensureEcommerceUser()
      if (!ecommerceUserId || !contact) {
        setSendChatoading(false)
        return
      }

      const existingLog = await fetchByContactId(contactId)
      const orderIdToSend = existingLog?.orderId ?? 0

      if (!orderIdToSend) {
        toast.error("No hay pedido asociado a este contacto.")
        setSendChatoading(false)
        return
      }

      if (existingLog == null) {
        toast.error("Log no encontrado")
        setSendChatoading(false)
        return
      }

      await handlePersistLog(existingLog, ecommerceUserId)

      const sendLinkRequest: SendLinkRequestDto = {
        conversationId,
        orderId: orderIdToSend,
        ecommerceUserId,
        email: contact.email ?? "",
        fullName: contact.fullName ?? "",
        contactId
      }

      if (returnLink) {
        setSendChatoading(false)
        return getMessageLinkAsync(sendLinkRequest)
      }

      await sendMessageLinkAsync(sendLinkRequest)
      setSendChatoading(false)

      localStorage.removeItem(draftKey)
    } catch {
      setSendChatoading(false)
      toast.error("No se pudo enviar el link")
    }
  }

  const handleSendCartChat = async () => {
    if (!cart || sending) return
    const { ecommerceUserId } = await ensureEcommerceUser()
    if (!ecommerceUserId) return

    const msg = buildCartChatMessage(cart, { orderId, deliveryDate: format(cart.fecha, "dd/MM/yyyy") })
    if (!msg) return

    const existingLog = await fetchByContactId(contactId)
    if (existingLog?.orderId) await handlePersistLog(existingLog, ecommerceUserId)

    const req: SendInteractiveMessajeRequestDto = { conversationId, contactId, body: msg }

    await sendInterctiveMessage(req)

    localStorage.removeItem(draftKey)
  }

  const Cancel = async () => {
    if (!orderId || orderId <= 0) return
    setCancelLoading(true)
    try {
      const res = await UserSessionService.revokeCartTempLink(orderId)
      if (res?.success) toast.success(res.message ?? "Link revocado")
      else toast.success("Link revocado")
      try {
        localStorage.removeItem(draftKey)
      } catch { }
    } catch {
      toast.error("No se pudo revocar el link")
    } finally {
      setCancelLoading(false)
    }
  }

  const actionsDisabled = loadingCart || loading || sending || sendChatoading || cancelLoading || totalsLoading

  return (
  <div className="carPCPanel-container">
    <header className="carPCPanel-header">
      <h5 className="productTab-content-header__title">
        Carrito {`- Sucursal ${currentLog?.branchName}`}
      </h5>
    </header>

    <section className="carPCPanel-content">
      {activeStep === 1 && (
        <div className="carPCPanel-stepContent">
          <Input
            id="searchProduct"
            name="searchProduct"
            value={search}
            placeholder="Buscar categoría o producto"
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="carPCPanel-products">
            {filteredDetails.map(({ detail }, index) => {
              if (detail.tipoComponente === "P") {
                return (
                  <div key={index} className="carPCPanel-content__list">
                    <div className="carPCPanel-content__list-imgContainer">
                      <img
                        src={detail.imagen ?? vacio}
                        aria-label="product image"
                        className="carPCPanel-content__list-image"
                      />

                      <p className="carPCPanel-content__list-flootingQuantity">
                        {detail.cantidad}
                      </p>
                    </div>

                    <div className="carPCPanel-content__list-info">
                      <p className="carPCPanel-content__list-text">
                        {detail.descripcion}
                      </p>

                      <p className="carPCPanel-content__list-price">
                       {detail.precioV > 0 ? " C$ " + formatearDecimales(detail.precioV) : ""}
                      </p>
                    </div>

                    <MdDelete
                      fontSize={24}
                      onClick={() =>
                        handleRemoveItem(
                          cart.idUsuario ?? 0,
                          detail.noPedido,
                          "",
                          detail.unico!
                        )
                      }
                      className="carPCPanel-content__removeIcon"
                    />
                  </div>
                )
              }

              if (detail.tipoComponente === "O") {
                return (
                  <div key={index} className="carPCPanel-content__list__opcion">

                    <div className="carPCPanel-content__list-info-opcion">
                      <p className="carPCPanel-content__list-opcion">
                        {detail.descripcion}
                      </p>

                      <p className="carPCPanel-content__list-price">
                        
                         {/* {detail.precioV.toFixed(2)} */}
                        {(detail.precioV ?? 0) > 0 ? "C$ " + calcularIVA(detail.precioV) : ""}
                      </p>
                    </div>

                    <div className="carPCPanel-content__list-imgContainer">
                      <p className="carPCPanel-content__list-flootingQuantity-opcion">
                        {detail.cantidad}
                      </p>
                    </div>
                  </div>
                )
              }

              return null
            })}
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="carPCPanel-stepContent">
          <div className="productTab-content-footer">
            <div className="productTab-content__inputContaner">
              <div className="productTab-content__inputs">
                <textarea
                  rows={5}
                  name="observation"
                  id="observation"
                  className="productTab-content__input"
                  placeholder="Observación"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />

                <textarea
                  rows={5}
                  name="descripcion"
                  id="descripcion"
                  className="productTab-content__input"
                  placeholder="Dirección"
                  value={addDescription}
                  disabled={addressInputsDisabled}
                  onChange={(e) => {
                    if (addressInputsDisabled) return
                    setAddDescription(e.target.value)
                  }}
                />

                <div className="transportationCost__input">
                  <input
                    type="number"
                    min={0}
                    name="shipment"
                    id="shipment"
                    placeholder="C$ transporte"
                    value={transCost}
                    disabled={transportDisabled}
                    onChange={(e) => {
                      if (transportDisabled) return
                      setTransCost(e.target.value === "" ? 0 : Number(e.target.value))
                    }}
                    className="productTab-content__input transportationCost"
                  />
                </div>

                <div className="transportationCost__checkbox">
                  <input
                    type="checkbox"
                    id="retiraSucursal"
                    checked={retiraSucursal === "S"}
                    disabled={pickupDisabled}
                    onChange={(e) => setRetiraSucursal(e.target.checked ? "S" : "N")}
                  />

                  <label htmlFor="retiraSucursal">Retira en sucursal</label>
                </div>
              </div>
            </div>
          </div>

          {showAddressModal && (
            <div className="addressMenu">
              <div className="addressMenu__header">
                <strong>Direcciones</strong>

                <button
                  className="addressMenu-close"
                  onClick={() => setShowAddressModal(false)}
                >
                  Cerrar
                </button>
              </div>

              <div className="addressMenu__content">
                <input
                  type="text"
                  className="addressMenu-search"
                  placeholder="Buscar dirección..."
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                />

                {addressLoading && <p>Cargando direcciones...</p>}

                {!addressLoading && filteredAddresses.length === 0 && (
                  <p>
                    {addresses.length === 0
                      ? "No hay direcciones registradas"
                      : "No hay resultados"}
                  </p>
                )}

                {!addressLoading &&
                  filteredAddresses.map((a) => (
                    <div
                      key={a.idDireccion}
                      className={`addressMenu-item ${
                        selectedAddressId === a.idDireccion
                          ? "addressMenu-item--active"
                          : ""
                      }`}
                      onClick={async () => {
                        if (retiraSucursal === "S") return
                        await applySelectedAddressToLog(Number(a.idDireccion))
                        setShowAddressModal(false)
                      }}
                    >
                      <strong>{a.nombre}</strong>
                      <p>{a.descripcion}</p>
                      <small>{a.referencia}</small>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="carPCPanel-bottom">
        
        {/* <div className="carPCPanel-stepActions">
          <button
            className="carPCPanel-stepBtn"
            disabled={activeStep === 1}
            onClick={() => setActiveStep(1)}
          >
           <FaLongArrowAltLeft />
          </button>

          <button
            className="carPCPanel-stepBtn"
            disabled={activeStep === 2}
            onClick={() => setActiveStep(2)}
          >
            <FaLongArrowAltRight />
          </button>
        </div> */}

        <div className="carPCPanel-steps">
        <button
          type="button"
          className={`carPCPanel-step ${activeStep === 1 ? "carPCPanel-step--active" : ""}`}
          onClick={() => setActiveStep(1)}
        >
          1
        </button>

        <div className="carPCPanel-stepLine" />

        <button
          type="button"
          className={`carPCPanel-step ${activeStep === 2 ? "carPCPanel-step--active" : "carPCPanel-step--inactive"}`}
          onClick={() => setActiveStep(2)}
        >
          2
        </button>
      </div>

        <div className="productTab-content-footer carPCPanel-totals">
          {invoiceTotalsDto?.subTotal != null && invoiceTotalsDto.subTotal > 0 && (
            <div className="productTab-content__container">
              <p className="productTab-content-footer__title">Subtotal:</p>
              <span className="productTab-content-footer__value">
                C$ 
                {/* {invoiceTotalsDto.subTotal ?? ""} */}
                {formatearDecimales(invoiceTotalsDto.subTotal)}
              </span>
            </div>
          )}

          {invoiceTotalsDto?.descuento != null && invoiceTotalsDto.descuento > 0 && (
            <div className="productTab-content__container">
              <p className="productTab-content-footer__title">Descuento:</p>
              <span className="productTab-content-footer__value">
                C$ 
                {/* {invoiceTotalsDto.descuento ?? ""} */}
                 {formatearDecimales(invoiceTotalsDto.descuento)}
              </span>
            </div>
          )}

          {invoiceTotalsDto?.iva != null && invoiceTotalsDto.iva > 0 && (
            <div className="productTab-content__container">
              <p className="productTab-content-footer__title">IVA:</p>
              <span className="productTab-content-footer__value">
                C$
                 {/* {invoiceTotalsDto.iva ?? ""} */}
                 {formatearDecimales(invoiceTotalsDto.iva)}
              </span>
            </div>
          )}

          {transCost > 0 && (
            <div className="productTab-content__container">
              <p className="productTab-content-footer__title">Transporte:</p>
              <span className="productTab-content-footer__value">
                C$ 
                {/* {transCost ?? 0} */}
                {formatearDecimales(transCost)}
              </span>
            </div>
          )}

          {invoiceTotalsDto?.total && invoiceTotalsDto.total > 0 && (
            <div className="productTab-content__container">
              <p className="productTab-content-footer__title">
                {`Total${
                  retiraSucursal === "N" &&
                  selectedAddressId == null &&
                  addDescription.trim().length === 0
                    ? " Más envío"
                    : ""
                }:`}
              </p>

              <span className="productTab-content-footer__totalValue">
                C$ 
                {/* {invoiceTotalsDto.total} */}
                 {formatearDecimales(invoiceTotalsDto.total)}
              </span>
            </div>
          )}
        </div>

        <div className="productTab-footer__payment">
          {showAddressButton && (
            <Button
              className="carPanel-btn"
              disabled={actionsDisabled}
              onClick={async () => {
                await loadAddresses()
                setShowAddressModal(true)
                setActiveStep(2)
              }}
            >
              <FaMapMarkerAlt size={12}/>
            </Button>
          )}

          <Button
            className="carPanel-btn"
            disabled={actionsDisabled}
            onClick={handleSendCartPdf}
          >
            {sending ? (
              <AiOutlineLoading3Quarters fontSize={18} />
            ) : (
              <FaFilePdf fontSize={18} />
            )}
          </Button>

          <Button
            className="carPanel-btn"
            disabled={actionsDisabled}
            onClick={handleSendCartChat}
          >
            {sendChatoading ? (
              <AiOutlineLoading3Quarters fontSize={18} />
            ) : (
              <IoIosChatboxes fontSize={18} />
            )}
          </Button>

          <Button className="cancelPanel-btn" disabled={actionsDisabled} onClick={Cancel}>
            {cancelLoading ? (
              <AiOutlineLoading3Quarters fontSize={18} />
            ) : (
              <MdOutlineCancelScheduleSend fontSize={18} />
            )}
          </Button>

          <Button
            className="payment-btn"
            disabled={actionsDisabled}
            onClick={async () => await handleSendLink(false)}
          >
            {loadingCart ? (
              <AiOutlineLoading3Quarters fontSize={18} />
            ) : (
              <IoSend fontSize={16} />
            )}
          </Button>
        </div>
      </div>
    </section>
  </div>
)
}
export default CarPCPanelTab