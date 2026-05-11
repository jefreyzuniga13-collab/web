import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dayjs from "dayjs"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"

import type { AppDispatch } from "@/Context"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import type {
  DetalleFacturaTempoData,
  DetalleFacturaTempoRequest,
  FaloteRequestDto,
} from "@/Interfaces/Crm/CartPCGInterface"
import type {
  LogCartRequestDto,
  LogCartResponseDto,
} from "@/Interfaces/Crm/LogCartInterface"
import {
  addProductTempoAsync,
  getProductFromCarAsync,
} from "@/Context/Slices/Ecommerce/cartSlice"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import { selectCompanySistema } from '@/Context/Slices/Auth/authSlice';

export type LockedInfo = {
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie?: string
}

export type SelectedModifierOption = {
  codTipoModificador: string
  codModificador: string
  descripcionMod: string
  codOpcion: string
  descripcionOp: string
  codPrecio: string
  precioVenta: number
  cantidad: number
  codUm: string
  aplicaIva?: string
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
  modifierOptions?: SelectedModifierOption[]
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
  existingLog: LogCartResponseDto | null
  noPedido: string
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
}

type CartServiceWithCleanup = typeof CartService & {
  LimpiarFacturaTempo?: (
    usuario: string,
    maquina: string
  ) => Promise<unknown>
}

const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1000) return 1000
  return Math.floor(n)
}

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error
  if (error instanceof Error) return error.message

  const payload = error as {
    message?: string
    response?: {
      data?: {
        message?: string
        data?: {
          header?: {
            msj?: string
          }
        }
      }
    }
  }

  return (
    payload.response?.data?.data?.header?.msj ||
    payload.response?.data?.message ||
    payload.message ||
    "No se pudo agregar el producto."
  )
}

export const useCartPCGFlow = (conversationId: number, contactId: number) => {
  const dispatch = useDispatch<AppDispatch>()

  const {
    create: createLogCart,
    fetchByContactId,
    UpdatedStatus,
  } = useLogCart()

  const [locked, setLocked] = useState<LockedInfo | null>(null)

  const [openSucursalModal, setOpenSucursalModal] = useState(false)
  const [sucursalItems, setSucursalItems] = useState<ExistenciaSucursalItem[]>([])
  const [loadingSucursalItems, setLoadingSucursalItems] = useState(false)

  const [pendingProduct, setPendingProduct] =
    useState<ProductoPCGInterface | null>(null)

  const [pendingQuantity, setPendingQuantity] = useState<number>(1)
  const [pendingObservacion, setPendingObservacion] = useState<string>("")
  const [pendingModifiers, setPendingModifiers] = useState<
    SelectedModifierOption[]
  >([])


  const companySistema = useSelector(selectCompanySistema);
    
  const hydratedRef = useRef(false)
  const addLockRef = useRef(false)

  useEffect(() => {
    hydratedRef.current = false
    setLocked(null)

    const run = async () => {
      if (!contactId) return
      if (hydratedRef.current) return

      hydratedRef.current = true

      const existingLog = await fetchByContactId(contactId)

      if (existingLog?.branch && existingLog?.orderId) {
        setLocked({
          branch: existingLog.branch,
          branchName: existingLog.branchName ?? "",
          wherehouse: existingLog.wherehouse ?? "",
          wherehouseCode: existingLog.wherehouseCode ?? "",
          serie: existingLog.serie ?? "",
        })
      }
    }

    void run()
  }, [contactId, fetchByContactId])

  const buildCartRequest = useCallback(
    (
      product: ProductoPCGInterface,
      qty: number,
      branch: string,
      wherehouseCode: string,
      noPedido: string,
      observacion: string
    ): DetalleFacturaTempoRequest => {

      // Propiedades de unico, tipo componente, y cod mofificador son para vertical de restaurantes
      return {
        sucursal: branch,
        usuario: String(contactId),
        maquina: `CRM-${contactId}`,
        fecha: dayjs().format("YYYYMMDD"),
        codproducto: (product.codProducto ?? "").trim(),
        codprecio: "01",
        precio: Number(product.precio ?? 0),
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
        observacion,
        iddescuentolineal: 0,
        vienedebusquedaprioridadproducto: "S",
        pol_Sumacant: "N",

        codModificador: '00000',
        tipoComponente:'P',
        unico:'',
        sistema: String(companySistema)
      }
    },
    [contactId]
  )

  const buildModifierCartRequest = useCallback(
    (
      option: SelectedModifierOption,
      parentQty: number,
      branch: string,
      wherehouseCode: string,
      noPedido: string,
      codModificador: string,
      unico: string
    ): DetalleFacturaTempoRequest => {
      return {
        sucursal: branch,
        usuario: String(contactId),
        maquina: `CRM-${contactId}`,
        fecha: dayjs().format("YYYYMMDD"),
        codproducto: option.codOpcion.trim(),
        codprecio: option.codPrecio?.trim() || "01",
        precio: Number(option.precioVenta),
        bodega: (wherehouseCode ?? "").trim(),
        cantidadmovimiento: clampQty(option.cantidad) * clampQty(parentQty),
        medidamovimiento: option.codUm?.trim() ?? "",
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
        producto: option.descripcionOp.trim(),
        tabla: "det_factura_tempo",
        vincularse: "N",
        servicioventa: 1,
        facturaexonerada: "N",
        lote: "Sin Lote",
        vencimiento: "20260116",
        vienedelabusqueda: "N",
        observacion: option.descripcionMod,
        iddescuentolineal: 0,
        vienedebusquedaprioridadproducto: "S",
        pol_Sumacant: "N",
        codModificador: codModificador,
        tipoComponente:'O',
        unico: unico,
        sistema: String(companySistema)
      }
    },
    [contactId]
  )

  const cleanupFacturaTempo = useCallback(async () => {
    const service = CartService as CartServiceWithCleanup
    const usuario = String(contactId)
    const maquina = `CRM-${contactId}`

    try {
      if (service.LimpiarFacturaTempo) {
        await service.LimpiarFacturaTempo(usuario, maquina)
      }
    } catch {
      toast.warning("No se pudo limpiar la factura temporal.")
    }
  }, [contactId])

  const refreshBadge = useCallback(
    async (noPedido: number) => {
      const updated = await dispatch(
        getProductFromCarAsync({
          codCliente: contactId,
          noPedido,
        })
      ).unwrap()

      const arr = Array.isArray(updated) ? updated : []

      const count = arr[0]?.listDetalle?.reduce((sum, d) => {
        // Solo sumamos si tipoComponente NO es "O"
        if (d.tipoComponente !== "O") {
          return sum + Number(d.cantidad ?? 0);
        }
        // Si es "O", retornamos el acumulador tal cual
        return sum;
      }, 0) ?? 0;

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

      const falote: FaloteRequestDto = {
        codSucursal: branch,
        documento: "GetConsecDoc",
      }

      const conse = await CartService.GetConsecDocAsync(falote)
      const consecutivo = Number(conse.data.consecutivo)

      if (!consecutivo || consecutivo <= 0) {
        throw new Error("No se pudo obtener el consecutivo del pedido.")
      }

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
    async (
      noPedido: number,
      info: LockedInfo,
      existingLog: LogCartResponseDto | null
    ) => {
      if (existingLog?.id) return null

      if (!noPedido || noPedido <= 0) {
        throw new Error("No se pudo obtener el noPedido para crear el LogCart.")
      }

      const logOrderRequest: LogCartRequestDto = {
        orderId: noPedido,
        contactId,
        conversationId,
        statusId: 1,
        branch: info.branch,
        branchName: info.branchName,
        wherehouse: info.wherehouse,
        wherehouseCode: info.wherehouseCode,
        serie: info.serie,
      }

      const created = await createLogCart(logOrderRequest)

      if (!created?.id) {
        throw new Error("No se pudo crear el LogCart del carrito.")
      }

      return created
    },
    [contactId, conversationId, createLogCart]
  )

  const rollbackCreatedLog = useCallback(
    async (createdLog: LogCartResponseDto | null) => {
      if (!createdLog?.id) return

      try {
        await UpdatedStatus(createdLog.id, 3)
      } catch {
        toast.warning("No se pudo cancelar el LogCart creado.")
      }

      await cleanupFacturaTempo()
    },
    [UpdatedStatus, cleanupFacturaTempo]
  )

  const commitProductToCart = useCallback(
    async (
      product: ProductoPCGInterface,
      qty: number,
      observacion: string,
      lockInfo: LockedInfo,
      order: ResolveOrderResult,
      modifierOptions: SelectedModifierOption[] = []
    ) => {
      if (!lockInfo.branch) {
        toast.error("Debe seleccionar una sucursal válida.")
        return
      }

      if (!lockInfo.wherehouseCode) {
        toast.error("Debe seleccionar una bodega válida.")
        return
      }

      const noPedido = Number(order.noPedido)

      if (!noPedido || noPedido <= 0) {
        toast.error("No se pudo obtener el número de pedido.")
        return
      }

      const mainPayload = buildCartRequest(
        product,
        qty,
        lockInfo.branch,
        lockInfo.wherehouseCode,
        order.noPedido,
        observacion
      )


      let createdLog: LogCartResponseDto | null = null

      try {
        createdLog = await createLogIfNeeded(
          noPedido,
          lockInfo,
          order.existingLog
        )

        // Se recupera el unico
        const resProduct: DetalleFacturaTempoData = await dispatch(addProductTempoAsync(mainPayload)).unwrap()

         const modifierPayloads = modifierOptions.map((option) =>
            buildModifierCartRequest(
              option,
              qty,
              lockInfo.branch,
              lockInfo.wherehouseCode,
              order.noPedido,
              option.codModificador,
              //Se envia el mismo unico a los modificadores, de esta forma se agrupan
              resProduct.detalle[0].unico
            )
          )

        for (const payload of modifierPayloads) {
          await dispatch(addProductTempoAsync(payload)).unwrap()
        }

      } catch (error) {
        if (createdLog?.id) {
          await rollbackCreatedLog(createdLog)
        }

        toast.error(getErrorMessage(error))
        return
      }

      setLocked(lockInfo)
      await refreshBadge(noPedido)
    },
    [
      buildCartRequest,
      buildModifierCartRequest,
      createLogIfNeeded,
      dispatch,
      refreshBadge,
      rollbackCreatedLog,
    ]
  )

  const openBranchPickerForProduct = useCallback(
    async (
      product: ProductoPCGInterface,
      qty: number,
      observacion: string,
      modifierOptions: SelectedModifierOption[]
    ) => {
      setPendingProduct(product)
      setPendingQuantity(qty)
      setPendingObservacion(observacion)
      setPendingModifiers(modifierOptions)
      setOpenSucursalModal(true)
      setLoadingSucursalItems(true)

      try {
        const cod = (product.codProducto ?? "").trim()

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
    },
    []
  )

  const addProductCore = useCallback(
    async (args: AddProductParams, options?: { skipPicker?: boolean }) => {
      if (addLockRef.current) return
      addLockRef.current = true

      try {
        const {
          product,
          qty,
          observacion = "",
          branch,
          branchName,
          wherehouse,
          wherehouseCode,
          serie,
          modifierOptions = [],
        } = args

        const safeQty = Number(qty)

        if (!product) return

        if (!safeQty || safeQty <= 0) {
          toast.warning("La cantidad debe ser al menos 1.")
          return
        }

        if (locked) {
          const order = await resolveOrder(locked.branch)

          await commitProductToCart(
            product,
            safeQty,
            observacion,
            locked,
            order,
            modifierOptions
          )

          return
        }

        if (branch && wherehouseCode) {
          const order = await resolveOrder(branch)

          const lockInfo: LockedInfo = {
            branch: order.branch,
            branchName: (branchName ?? order.branchName ?? "").trim(),
            wherehouse: (wherehouse ?? order.wherehouse ?? "").trim(),
            wherehouseCode: (wherehouseCode ?? order.wherehouseCode ?? "").trim(),
            serie: (serie ?? order.serie ?? "").trim(),
          }

          await commitProductToCart(
            product,
            safeQty,
            observacion,
            lockInfo,
            order,
            modifierOptions
          )

          return
        }

        const existingLog = await fetchByContactId(contactId)

        if (existingLog?.branch && existingLog?.orderId) {
          const lockInfo: LockedInfo = {
            branch: existingLog.branch,
            branchName: existingLog.branchName ?? "",
            wherehouse: existingLog.wherehouse ?? "",
            wherehouseCode: existingLog.wherehouseCode ?? "",
            serie: existingLog.serie ?? "",
          }

          const order: ResolveOrderResult = {
            existingLog,
            noPedido: String(existingLog.orderId),
            branch: lockInfo.branch,
            branchName: lockInfo.branchName,
            wherehouse: lockInfo.wherehouse,
            wherehouseCode: lockInfo.wherehouseCode,
            serie: lockInfo.serie ?? "",
          }

          await commitProductToCart(
            product,
            safeQty,
            observacion,
            lockInfo,
            order,
            modifierOptions
          )

          return
        }

        if (!branch) {
          if (options?.skipPicker) {
            toast.error("Debe seleccionar una sucursal.")
            return
          }

          await openBranchPickerForProduct(
            product,
            safeQty,
            observacion,
            modifierOptions
          )
        }
      } finally {
        addLockRef.current = false
      }
    },
    [
      locked,
      resolveOrder,
      commitProductToCart,
      fetchByContactId,
      contactId,
      openBranchPickerForProduct,
    ]
  )

  const addProduct = useCallback(
    async (args: AddProductParams) => {
      await addProductCore(args)
    },
    [addProductCore]
  )

  const onSelectSucursal = useCallback(
    async (value: PickerSelectValue) => {
      const product = pendingProduct
      const qty = pendingQuantity
      const observacion = pendingObservacion
      const modifierOptions = pendingModifiers

      setOpenSucursalModal(false)
      setPendingProduct(null)
      setPendingModifiers([])

      if (!product) return

      const lockInfo: LockedInfo = {
        branch: value.codsucursal,
        branchName: value.sucursal,
        wherehouse: value.nombodega ?? "",
        wherehouseCode: value.codBodega ?? "",
        serie: value.serie ?? "",
      }

      await addProductCore(
        {
          product,
          qty,
          observacion,
          modifierOptions,
          ...lockInfo,
        },
        { skipPicker: true }
      )
    },
    [
      addProductCore,
      pendingProduct,
      pendingQuantity,
      pendingObservacion,
      pendingModifiers,
    ]
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
        setPendingModifiers([])
      },
      onSelect: onSelectSucursal,
    }),
    [
      openSucursalModal,
      loadingSucursalItems,
      pendingProduct,
      sucursalItems,
      locked?.branch,
      onSelectSucursal,
    ]
  )

  return {
    locked,
    setLocked,
    addProduct,
    pickerProps,
  }
}