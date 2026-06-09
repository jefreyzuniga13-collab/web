import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import type { AppDispatch } from "@/Context"
import type { LockedInfo, ProductoPCGInterface, WithCodPrecio } from "@/Interfaces/Chat/ProductPCGInterface"
import type {AddProductInput, AddProductsInput, DetalleFacturaTempoData, DetalleFacturaTempoRequest, FaloteRequestDto, 
  PickerSelectValue, ResolveOrderResult, SelectedModifierOption, SucursalPickerProps,} from "@/Interfaces/Crm/CartPCGInterface"
import type {LogCartRequestDto, LogCartResponseDto} from "@/Interfaces/Crm/LogCartInterface"
import {addProductTempoAsync, getProductFromCarAsync} from "@/Context/Slices/Ecommerce/cartSlice"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import {selectCompanySistema, selectCodReferenciaPCG} from "@/Context/Slices/Auth/authSlice"
import { FechaManagua } from "@/Utils/FechaManagua"
import { clampQty, cleanText } from "@/Utils/ECommerce/formatters"

type CartServiceWithCleanup = typeof CartService & {
  LimpiarFacturaTempo?: (
    usuario: string,
    maquina: string
  ) => Promise<unknown>
}
const getCodPrecio = (value: unknown) => {
  const item = value as WithCodPrecio | null
  return cleanText(item?.codPrecio ?? item?.codprecio ?? item?.CodPrecio)
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

export const useCartPCGFlow = (
  conversationId: number,
  contactId: number,
  metaChannel: string
) => {
  const dispatch = useDispatch<AppDispatch>()

  const {
    create: createLogCart,
    fetchByContactId,
    UpdatedStatus,
  } = useLogCart()

  const companySistema = useSelector(selectCompanySistema)
  const codReferenciaPCG = useSelector(selectCodReferenciaPCG)
  const [locked, setLockedState] = useState<LockedInfo | null>(null)
  const [codPrecioActivo, setCodPrecioActivoState] = useState("")
  const [openSucursalModal, setOpenSucursalModal] = useState(false)
  const [sucursalItems, setSucursalItems] = useState<ExistenciaSucursalItem[]>([])
  const [loadingSucursalItems, setLoadingSucursalItems] = useState(false)
  const [pendingProduct, setPendingProduct] =
    useState<ProductoPCGInterface | null>(null)
  const [pendingQuantity, setPendingQuantity] = useState(1)
  const [pendingObservacion, setPendingObservacion] = useState("")
  const [pendingModifiers, setPendingModifiers] = useState<
    SelectedModifierOption[]
  >([])
  const [pendingBatchItems, setPendingBatchItems] =
    useState<AddProductsInput>([])
  const hydratedRef = useRef(false)
  const addLockRef = useRef(false)
  const batchLockRef = useRef(false)

  const setCodPrecioActivo = useCallback(
    (value: string | null | undefined) => {
      setCodPrecioActivoState(cleanText(value))
    },
    []
  )

  const setLocked = useCallback((value: LockedInfo | null) => {
    setLockedState(value)
    setCodPrecioActivoState(cleanText(value?.codPrecio))
  }, [])

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
          branchName: cleanText(existingLog.branchName),
          wherehouse: cleanText(existingLog.wherehouse),
          wherehouseCode: cleanText(existingLog.wherehouseCode),
          serie: cleanText(existingLog.serie),
          codPrecio: getCodPrecio(existingLog),
        })
      }
    }

    void run()
  }, [contactId, fetchByContactId, setLocked])

  const buildCartRequest = useCallback(
    (
      product: ProductoPCGInterface,
      qty: number,
      branch: string,
      wherehouseCode: string,
      noPedido: string,
      observacion: string,
      codPrecio: string,
      metaChannelValue: string
    ): DetalleFacturaTempoRequest => {
      return {
        sucursal: branch,
        usuario: String(contactId),
        maquina: `CRM-${contactId}`,
        fecha: FechaManagua.obtenerFormatoLimpio(),
        codproducto: cleanText(product.codProducto),
        codprecio: cleanText(codPrecio),
        precio: Number(product.precio ?? 0),
        bodega: cleanText(wherehouseCode),
        cantidadmovimiento: clampQty(qty),
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
        producto: cleanText(product.descripcion),
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
        pol_Sumacant: "S",
        codModificador: "00000",
        tipoComponente: "P",
        unico: "",
        sistema: String(companySistema),
        ordenServicio: codReferenciaPCG,
        tipoFac: metaChannelValue,
      }
    },
    [contactId, companySistema, codReferenciaPCG]
  )

  const buildModifierCartRequest = useCallback(
    (
      option: SelectedModifierOption,
      branch: string,
      wherehouseCode: string,
      noPedido: string,
      codModificador: string,
      unico: string,
      codPrecio: string
    ): DetalleFacturaTempoRequest => {
      return {
        sucursal: branch,
        usuario: String(contactId),
        maquina: `CRM-${contactId}`,
        fecha: FechaManagua.obtenerFormatoLimpio(),
        codproducto: cleanText(option.codOpcion),
        codprecio: cleanText(codPrecio) || "01",
        precio: Number(option.precioVenta),
        bodega: cleanText(wherehouseCode),
        cantidadmovimiento: clampQty(option.cantidad),
        medidamovimiento: cleanText(option.codUm),
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
        producto: cleanText(option.descripcionOp),
        tabla: "det_factura_tempo",
        vincularse: "N",
        servicioventa: 1,
        facturaexonerada: "N",
        lote: "Sin Lote",
        vencimiento: "20260116",
        vienedelabusqueda: "N",
        observacion: cleanText(option.descripcionMod),
        iddescuentolineal: 0,
        vienedebusquedaprioridadproducto: "S",
        pol_Sumacant: "S",
        codModificador,
        tipoComponente: "O",
        unico,
        sistema: String(companySistema),
        ordenServicio: codReferenciaPCG,
        tipoFac: metaChannel,
      }
    },
    [contactId, companySistema, codReferenciaPCG, metaChannel]
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

      const rows = Array.isArray(updated) ? updated : []

      const count =
        rows[0]?.listDetalle?.reduce((sum, detalle) => {
          if (detalle.tipoComponente === "O") return sum
          return sum + Number(detalle.cantidad ?? 0)
        }, 0) ?? 0

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
    async (branch: string, codPrecio: string): Promise<ResolveOrderResult> => {
      const existingLog = await fetchByContactId(contactId)

      if (existingLog?.orderId && existingLog?.branch) {
        return {
          existingLog,
          noPedido: String(existingLog.orderId),
          branch: existingLog.branch,
          branchName: cleanText(existingLog.branchName),
          wherehouse: cleanText(existingLog.wherehouse),
          wherehouseCode: cleanText(existingLog.wherehouseCode),
          serie: cleanText(existingLog.serie),
          codPrecio: getCodPrecio(existingLog) || cleanText(codPrecio),
        }
      }

      const falote: FaloteRequestDto = {
        codSucursal: branch,
        documento: "GetConsecDoc",
      }

      const conse = await CartService.GetConsecDocAsync(falote)
      const consecutivo = Number(conse.data.consecutivo)

      if (!consecutivo || consecutivo < 0) {
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
        codPrecio: cleanText(codPrecio),
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
        codPrecio: info.codPrecio,
      }

      const created = await createLogCart(logOrderRequest)

      if (!created?.id) {
        throw new Error("No se pudo crear el LogCart del carrito.")
      }

      return created
    },
    [contactId, conversationId, createLogCart]
  )

  const resetCartFlow = useCallback(() => {
    setLockedState(null)
    setCodPrecioActivoState("")

    setOpenSucursalModal(false)
    setSucursalItems([])
    setLoadingSucursalItems(false)

    setPendingProduct(null)
    setPendingQuantity(1)
    setPendingObservacion("")
    setPendingModifiers([])
    setPendingBatchItems([])

    hydratedRef.current = false
    addLockRef.current = false
    batchLockRef.current = false
  }, [])

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
        return false
      }

      if (!lockInfo.wherehouseCode) {
        toast.error("Debe seleccionar una bodega válida.")
        return false
      }

      const noPedido = Number(order.noPedido)

      if (!noPedido || noPedido <= 0) {
        toast.error("No se pudo obtener el número de pedido.")
        return false
      }

      const codPrecioFinal =
        cleanText(lockInfo.codPrecio) || cleanText(order.codPrecio) || "01"

      const mainPayload = buildCartRequest(
        product,
        clampQty(qty),
        lockInfo.branch,
        lockInfo.wherehouseCode,
        order.noPedido,
        observacion,
        codPrecioFinal,
        metaChannel
      )

      let createdLog: LogCartResponseDto | null = null

      try {
        createdLog = await createLogIfNeeded(
          noPedido,
          {
            ...lockInfo,
            codPrecio: codPrecioFinal,
          },
          order.existingLog
        )

        const resProduct: DetalleFacturaTempoData = await dispatch(
          addProductTempoAsync(mainPayload)
        ).unwrap()

        const [createdDetail] = resProduct.detalle

        if (!createdDetail || !createdDetail.unico) {
          throw new Error("No se pudo obtener el identificador del producto.")
        }

        const modifierPayloads = modifierOptions.map((option) =>
          buildModifierCartRequest(
            option,
            lockInfo.branch,
            lockInfo.wherehouseCode,
            order.noPedido,
            option.codModificador,
            createdDetail.unico,
            codPrecioFinal
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
        return false
      }

      setLocked({
        ...lockInfo,
        codPrecio: codPrecioFinal,
      })

      await refreshBadge(noPedido)

      return true
    },
    [
      buildCartRequest,
      buildModifierCartRequest,
      createLogIfNeeded,
      dispatch,
      metaChannel,
      refreshBadge,
      rollbackCreatedLog,
      setLocked,
    ]
  )

  const openBranchPickerForProduct = useCallback(
    async (
      product: ProductoPCGInterface,
      qty: number,
      observacion: string,
      modifierOptions: SelectedModifierOption[],
      batchItems: AddProductsInput = []
    ) => {
      setPendingProduct(product)
      setPendingQuantity(clampQty(qty))
      setPendingObservacion(observacion)
      setPendingModifiers(modifierOptions)
      setPendingBatchItems(batchItems)
      setOpenSucursalModal(true)
      setLoadingSucursalItems(true)

      try {
        const cod = cleanText(product.codProducto)

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

  const resolveExistingOrderAsLock = useCallback(
    async (): Promise<{
      lockInfo: LockedInfo
      order: ResolveOrderResult
    } | null> => {
      const existingLog = await fetchByContactId(contactId)

      if (!existingLog?.branch || !existingLog?.orderId) return null

      const lockInfo: LockedInfo = {
        branch: existingLog.branch,
        branchName: cleanText(existingLog.branchName),
        wherehouse: cleanText(existingLog.wherehouse),
        wherehouseCode: cleanText(existingLog.wherehouseCode),
        serie: cleanText(existingLog.serie),
        codPrecio: getCodPrecio(existingLog) || "01",
      }

      const order: ResolveOrderResult = {
        existingLog,
        noPedido: String(existingLog.orderId),
        branch: lockInfo.branch,
        branchName: lockInfo.branchName,
        wherehouse: lockInfo.wherehouse,
        wherehouseCode: lockInfo.wherehouseCode,
        serie: lockInfo.serie,
        codPrecio: lockInfo.codPrecio,
      }

      return {
        lockInfo,
        order,
      }
    },
    [contactId, fetchByContactId]
  )

  const addProductCore = useCallback(
    async (args: AddProductInput, options?: { skipPicker?: boolean }) => {
      if (addLockRef.current) return false
      addLockRef.current = true

      try {
        const {
          product,
          qty,
          observacion = "",
          branch = "",
          branchName = "",
          wherehouse = "",
          wherehouseCode = "",
          serie = "",
          codPrecio = "",
          modifierOptions = [],
        } = args

        const safeQty = clampQty(Number(qty))
        const safeCodPrecio = cleanText(codPrecio)

        if (!safeQty || safeQty <= 0) {
          toast.warning("La cantidad debe ser al menos 1.")
          return false
        }

        if (locked) {
          const order = await resolveOrder(locked.branch, locked.codPrecio)

          return await commitProductToCart(
            product,
            safeQty,
            observacion,
            locked,
            order,
            modifierOptions
          )
        }

        if (branch && wherehouseCode) {
          const order = await resolveOrder(branch, safeCodPrecio)

          const lockInfo: LockedInfo = {
            branch: order.branch,
            branchName: cleanText(branchName || order.branchName),
            wherehouse: cleanText(wherehouse || order.wherehouse),
            wherehouseCode: cleanText(wherehouseCode || order.wherehouseCode),
            serie: cleanText(serie || order.serie),
            codPrecio: safeCodPrecio || order.codPrecio || "01",
          }

          return await commitProductToCart(
            product,
            safeQty,
            observacion,
            lockInfo,
            order,
            modifierOptions
          )
        }

        const existing = await resolveExistingOrderAsLock()

        if (existing) {
          return await commitProductToCart(
            product,
            safeQty,
            observacion,
            existing.lockInfo,
            existing.order,
            modifierOptions
          )
        }

        if (options?.skipPicker) {
          toast.error("Debe seleccionar una sucursal.")
          return false
        }

        await openBranchPickerForProduct(
          product,
          safeQty,
          observacion,
          modifierOptions
        )

        return false
      } finally {
        addLockRef.current = false
      }
    },
    [
      locked,
      resolveOrder,
      commitProductToCart,
      resolveExistingOrderAsLock,
      openBranchPickerForProduct,
    ]
  )

  const addProduct = useCallback(
    async (args: AddProductInput) => {
      await addProductCore(args)
    },
    [addProductCore]
  )

  const addProducts = useCallback(
    async (items: AddProductsInput) => {
      if (batchLockRef.current) return

      if (!items.length) {
        toast.warning("No hay productos seleccionados.")
        return
      }

      batchLockRef.current = true

      try {
        if (!locked) {
          const existing = await resolveExistingOrderAsLock()

          if (!existing) {
            const first = items[0]

            await openBranchPickerForProduct(
              first.product,
              first.qty,
              first.observacion ?? "",
              first.modifierOptions ?? [],
              items
            )

            return
          }
        }

        let addedCount = 0

        for (const item of items) {
          const added = await addProductCore(
            {
              ...item,
              onDoneUiReset: false,
            },
            { skipPicker: true }
          )

          if (added) addedCount += 1
        }

        if (addedCount > 0) {
          toast.success(
            `${addedCount} producto${addedCount === 1 ? "" : "s"} agregado${
              addedCount === 1 ? "" : "s"
            } al carrito.`
          )
        }
      } finally {
        batchLockRef.current = false
      }
    },
    [
      locked,
      addProductCore,
      resolveExistingOrderAsLock,
      openBranchPickerForProduct,
    ]
  )

  const onSelectSucursal = useCallback(
    async (value: PickerSelectValue) => {
      const product = pendingProduct
      const qty = pendingQuantity
      const observacion = pendingObservacion
      const modifierOptions = pendingModifiers
      const batchItems = pendingBatchItems

      setOpenSucursalModal(false)
      setPendingProduct(null)
      setPendingModifiers([])
      setPendingBatchItems([])

      const lockInfo: LockedInfo = {
        branch: value.codsucursal,
        branchName: value.sucursal,
        wherehouse: value.nombodega,
        wherehouseCode: value.codBodega,
        serie: value.serie,
        codPrecio: getCodPrecio(value) || "01",
      }

      setCodPrecioActivo(lockInfo.codPrecio)

      if (batchItems.length > 0) {
        let addedCount = 0

        for (const item of batchItems) {
          const added = await addProductCore(
            {
              ...item,
              ...lockInfo,
              onDoneUiReset: false,
            },
            { skipPicker: true }
          )

          if (added) addedCount += 1
        }

        if (addedCount > 0) {
          toast.success(
            `${addedCount} producto${addedCount === 1 ? "" : "s"} agregado${
              addedCount === 1 ? "" : "s"
            } al carrito.`
          )
        }

        return
      }

      if (!product) return

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
      pendingBatchItems,
      setCodPrecioActivo,
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
        setPendingBatchItems([])
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
    codPrecioActivo,

    setLocked,
    setCodPrecioActivo,

    addProduct,
    addProducts,

    pickerProps,
    resetCartFlow,
  }
}