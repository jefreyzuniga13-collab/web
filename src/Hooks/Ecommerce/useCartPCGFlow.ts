// src/Hooks/Ecommerce/useCartPCGFlow.ts
import { useCallback, useEffect, useMemo, useState } from "react"
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
}

export type AddProductParams = {
  product: ProductoPCGInterface
  qty: number
  observacion?: string
  branch?: string
  branchName?: string
  wherehouse?: string
  wherehouseCode?: string
  onDoneUiReset?: boolean
}

type PickerSelectValue = {
  codsucursal: string
  sucursal: string
  nombodega?: string
  codBodega?: string
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

  useEffect(() => {
    const run = async () => {
      if (!contactId) return
      if (locked) return
      const existingLog = await fetchByContactId(contactId)
      if (existingLog?.branch && existingLog?.orderId) {
        setLocked({
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? "",
        })
      }
    }
    run()
  }, [contactId, fetchByContactId, locked])

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
        tasacambio: 36.0,
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
    async (branch: string) => {
      const existingLog = await fetchByContactId(contactId)

      if (existingLog?.orderId && existingLog?.branch) {
        return {
          existingLog,
          noPedido: String(existingLog.orderId),
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? "",
        }
      }

      const falote: FaloteRequestDto = { codSucursal: branch, documento: "GetConsecDoc" }
      const conse = await CartService.GetConsecDocAsync(falote)
      const consecutivo = Number(conse.data.consecutivo)

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        existingLog: null as any,
        noPedido: String(consecutivo),
        branch,
        branchName: "",
        wherehouse: "",
        wherehouseCode: "",   // ← CLAVE
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
      const { product, qty, observacion = "", branch, branchName, wherehouse, wherehouseCode } = args
      const safeQty = Number(qty)

      if (!product) return
      if (!safeQty || safeQty <= 0) return

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

      const existingLog = await fetchByContactId(contactId)
      if (existingLog?.branch && existingLog?.orderId) {
        const lockInfo: LockedInfo = {
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? "",
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

      if (!branch) {
        if (options?.skipPicker) {
          toast.error("Debe seleccionar una sucursal.")
          return
        }
        await openBranchPickerForProduct(product, safeQty, observacion)
        return
      }

      const ord = await resolveOrder(branch)

      const lockInfo: LockedInfo = {
        branch: ord.branch,
        branchName: (branchName ?? ord.branchName ?? "").trim(),
        wherehouse: (wherehouse ?? ord.wherehouse ?? "").trim(),
        wherehouseCode: (wherehouseCode ?? ord.wherehouseCode ?? "").trim(),
      }

      console.log("", lockInfo)
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

      await addProductCore(
        {
          product: prod,
          qty,
          observacion: obs,
          branch: v.codsucursal,
          branchName: v.sucursal,
          wherehouse: v.nombodega ?? "",
          wherehouseCode: v.codBodega ?? "",
        },
        { skipPicker: true }
      )
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