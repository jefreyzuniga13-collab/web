import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dayjs from "dayjs"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/Context"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import type { DetalleFacturaTempoRequest, FaloteRequestDto } from "@/Interfaces/Crm/CartPCGInterface"
import type { LogCartRequestDto } from "@/Interfaces/Crm/LogCartInterface"
import { addProductTempoAsync, getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import { toast } from "react-toastify"

export type LockedInfo = {
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie?: string
}

export type AddProductParams = {
  product: ProductoPCGInterface
  qty: number
  observacion?: string
  branch?: string
  branchName?: string
  wherehouse?: string
  wherehouseCode?: string
  serie?: string
  onDoneUiReset?: boolean
}

type PickerSelectValue = {
  codsucursal: string
  sucursal: string
  nombodega?: string
  codBodega?: string
  serie?: string
}

export type SucursalPickerProps = {
  open: boolean
  loading: boolean
  codProducto: string
  items: ExistenciaSucursalItem[]
  selectedCodSucursal: string | null
  onClose: () => void
  onSelect: (v: PickerSelectValue) => void | Promise<void>
}

type ResolveOrderResult = {
  existingLog: unknown | null
  noPedido: string
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
}

export const useCartPCGFlow = (conversationId: number, contactId: number) => {
  const dispatch = useDispatch<AppDispatch>()
  const { create: createLogCart, fetchByContactId } = useLogCart()

  const [locked, setLocked] = useState<LockedInfo | null>(null)

  const [openSucursalModal, setOpenSucursalModal] = useState(false)
  const [sucursalItems, setSucursalItems] = useState<ExistenciaSucursalItem[]>([])
  const [loadingSucursalItems, setLoadingSucursalItems] = useState(false)

  const [pendingProduct, setPendingProduct] = useState<ProductoPCGInterface | null>(null)
  const [pendingQuantity, setPendingQuantity] = useState<number>(1)
  const [pendingObservacion, setPendingObservacion] = useState<string>("")

  const hydratedRef = useRef(false)

  useEffect(() => {
    hydratedRef.current = false
    setLocked(null)

    const run = async () => {
      if (!contactId) return
      if (hydratedRef.current) return
      hydratedRef.current = true

      const existingLog = await fetchByContactId(contactId)
      if (existingLog?.branch && existingLog?.orderId) {
        setLocked((prev) => ({
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? prev?.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? prev?.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? prev?.wherehouseCode ?? "",
          serie: existingLog.serie ?? prev?.serie ?? "",
        }))
      }
    }

    run()
  }, [contactId, fetchByContactId])


  //agregar datos inciales, no incluri aqui directamente ejemplo los de facturas.
  const buildCartRequest = useCallback(
    (
      product: ProductoPCGInterface,
      qty: number,
      branch: string,
      wherehouseCode: string,
      noPedido: string,
      observacion: string
    ): DetalleFacturaTempoRequest => {
      return {
        sucursal: branch,
        usuario: String(contactId),
        maquina: `CRM-${contactId}`,
        fecha: dayjs().format("YYYYMMDD"),
        codproducto: (product.codProducto ?? "").trim(),
        codprecio: "01",
        precio: product.precio,
        bodega: (wherehouseCode ?? "").trim(),
        cantidadmovimiento: qty,
        medidamovimiento: "",
        nofactura: noPedido,
        tipo: "1",
        tipodesc: "N",
        tipotrabajo: "INSERT",
        tasacambio: 36.6243,
        financiamiento: 0,
        descuento: 0,
        codvendedor: "004",
        codcliente: "00000",
        autorizado: "N",
        producto: (product.descripcion ?? "").trim(),
        tabla: "det_factura_tempo",
        vincularse: "N",
        servicioventa: 1,
        facturaexonerada: "N",
        lote: "Sin Lote",
        vencimiento: "20260116",
        vienedelabusqueda: "N",
        observacion: observacion,
        iddescuentolineal: 0,
        vienedebusquedaprioridadproducto: "S",
        pol_Sumacant: "S",
      }
    },
    [contactId]
  )


  const refreshBadge = useCallback(
    async (noPedido: number) => {
      const updated = await dispatch(getProductFromCarAsync({ codCliente: contactId ?? 0, noPedido })).unwrap()
      const arr = Array.isArray(updated) ? updated : []
      const count = arr[0]?.listDetalle?.reduce((sum, d) => sum + Number(d.cantidad ?? 0), 0) ?? 0

      dispatch(
        setContactCartBadge({
          contactId,
          hasCart: count > 0,
          count,
        })
      )
    },
    [contactId, dispatch]
  )

  const resolveOrder = useCallback(
    async (branch: string): Promise<ResolveOrderResult> => {
      const existingLog = await fetchByContactId(contactId)

      if (existingLog?.orderId && existingLog?.branch) {
        return {
          existingLog,
          noPedido: String(existingLog.orderId),
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? "",
          serie: existingLog.serie ?? "",
        }
      }

      const falote: FaloteRequestDto = { codSucursal: branch, documento: "GetConsecDoc" }
      const conse = await CartService.GetConsecDocAsync(falote)
      const consecutivo = Number(conse.data.consecutivo)

      return {
        existingLog: null,
        noPedido: String(consecutivo),
        branch,
        branchName: "",
        wherehouse: "",
        wherehouseCode: "",
        serie: "",
      }
    },
    [contactId, fetchByContactId]
  )

  const createLogIfNeeded = useCallback(
    async (noPedido: number, info: LockedInfo, hadExistingLog: boolean) => {
      if (hadExistingLog) return
      if (Number(noPedido) <= 0) throw new Error("No se pudo obtener el noPedido para crear el LogCart.")

      const logOrderRequest: LogCartRequestDto = {
        orderId: Number(String(noPedido).trim()),
        contactId,
        conversationId,
        statusId: 1,
        branch: info.branch,
        branchName: info.branchName,
        wherehouse: info.wherehouse,
        wherehouseCode: info.wherehouseCode,
        serie: info.serie,
      }

      await createLogCart(logOrderRequest)
    },
    [contactId, conversationId, createLogCart]
  )

  const openBranchPickerForProduct = useCallback(async (prod: ProductoPCGInterface, qty: number, observacion: string) => {
    setPendingProduct(prod)
    setPendingQuantity(qty)
    setPendingObservacion(observacion)
    setOpenSucursalModal(true)
    setLoadingSucursalItems(true)

    try {
      const cod = (prod.codProducto ?? "").trim()
      if (!cod) {
        setSucursalItems([])
        return
      }

      const res = await CartService.getProductFromTempTotal(cod)
      const data = Array.isArray(res) ? (res as ExistenciaSucursalItem[]) : []
      setSucursalItems(data)
    } catch {
      setSucursalItems([])
    } finally {
      setLoadingSucursalItems(false)
    }
  }, [])

  const addProductCore = useCallback(
    async (args: AddProductParams, options?: { skipPicker?: boolean }) => {
      const { product, qty, observacion = "", branch, branchName, wherehouse, wherehouseCode, serie } = args
      const safeQty = Number(qty)

      if (!product) return
      if (!safeQty || safeQty <= 0) return

      // Si ya existe lock, usarlo como fuente de verdad para no depender de respuestas lentas del backend.
      if (locked) {
        const ord = await resolveOrder(locked.branch)

        const payload = buildCartRequest(product, safeQty, locked.branch, locked.wherehouseCode, ord.noPedido, observacion)

        try {
          await dispatch(addProductTempoAsync(payload)).unwrap()
        } catch (msg) {
          toast.error(String(msg))
          return
        }
        await createLogIfNeeded(Number(ord.noPedido), locked, !!ord.existingLog)
        await refreshBadge(Number(ord.noPedido))
        return
      }

      // Si vienen datos de sucursal/bodega por argumentos (flujo desde picker),
      // priorizarlos antes de consultar existingLog para evitar condiciones de carrera.
      if (branch && wherehouseCode) {
        const ord = await resolveOrder(branch)

        const lockInfo: LockedInfo = {
          branch: ord.branch,
          branchName: (branchName ?? ord.branchName ?? "").trim(),
          wherehouse: (wherehouse ?? ord.wherehouse ?? "").trim(),
          wherehouseCode: (wherehouseCode ?? ord.wherehouseCode ?? "").trim(),
          serie: (serie ?? ord.serie ?? "").trim(),
        }

        if (!lockInfo.wherehouseCode) {
          toast.error("Debe seleccionar una bodega válida (codBodega).")
          return
        }

        const payload = buildCartRequest(product, safeQty, lockInfo.branch, lockInfo.wherehouseCode, ord.noPedido, observacion)

        try {
          await dispatch(addProductTempoAsync(payload)).unwrap()
        } catch (msg) {
          toast.error(String(msg))
          return
        }

        await createLogIfNeeded(Number(ord.noPedido), lockInfo, !!ord.existingLog)
        await refreshBadge(Number(ord.noPedido))
        setLocked(lockInfo)
        return
      }

      // Si no hay lock y tampoco se enviaron datos de sucursal/bodega,
      // consultar si ya existe LogCart persistido.
      const existingLog = await fetchByContactId(contactId)

      if (existingLog?.branch && existingLog?.orderId) {
        const lockInfo: LockedInfo = {
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? "",
          serie: existingLog.serie ?? "",
        }

        setLocked(lockInfo)

        const payload = buildCartRequest(product, safeQty, lockInfo.branch, lockInfo.wherehouseCode, String(existingLog.orderId), observacion)

        try {
          await dispatch(addProductTempoAsync(payload)).unwrap()
        } catch (msg) {
          toast.error(String(msg))
          return
        }

        await refreshBadge(Number(existingLog.orderId))
        return
      }

      // Si no existe LogCart y no se recibió sucursal, solicitar selección.
      if (!branch) {
        if (options?.skipPicker) {
          toast.error("Debe seleccionar una sucursal.")
          return
        }
        await openBranchPickerForProduct(product, safeQty, observacion)
      }
    },
    [
      locked,
      resolveOrder,
      buildCartRequest,
      dispatch,
      createLogIfNeeded,
      refreshBadge,
      fetchByContactId,
      contactId,
      openBranchPickerForProduct,
    ]
  )

  const addProduct = useCallback(async (args: AddProductParams) => {
    await addProductCore(args)
  }, [addProductCore])

  const onSelectSucursal = useCallback(
    async (v: PickerSelectValue) => {
      const prod = pendingProduct
      const qty = pendingQuantity
      const obs = pendingObservacion

      setOpenSucursalModal(false)
      setPendingProduct(null)

      if (!prod) return

      const lockInfo: LockedInfo = {
        branch: v.codsucursal,
        branchName: v.sucursal,
        wherehouse: v.nombodega ?? "",
        wherehouseCode: v.codBodega ?? "",
        serie: v.serie ?? "",
      }

      // Establecer el lock antes de ejecutar operaciones remotas para evitar estados intermedios.
      setLocked(lockInfo)

      await addProductCore({ product: prod, qty, observacion: obs, ...lockInfo }, { skipPicker: true })
    },
    [addProductCore, pendingObservacion, pendingProduct, pendingQuantity]
  )

  const pickerProps: SucursalPickerProps = useMemo(
    () => ({
      open: openSucursalModal,
      loading: loadingSucursalItems,
      codProducto: pendingProduct?.codProducto ?? "",
      items: sucursalItems,
      selectedCodSucursal: locked?.branch ?? null,
      onClose: () => {
        setOpenSucursalModal(false)
        setPendingProduct(null)
      },
      onSelect: onSelectSucursal,
    }),
    [openSucursalModal, loadingSucursalItems, pendingProduct, sucursalItems, locked?.branch, onSelectSucursal]
  )

  return {
    locked,
    setLocked,
    addProduct,
    pickerProps,
  }
}