import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import type { AppDispatch } from "@/Context"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import { TipoDescuento } from "@/Interfaces/Crm/CartPCGInterface"
import type { AddProductInput, AddProductsInput, AplicarDescuentoGlobalParams, AplicarDescuentoProductoParams, DescuentoGlobalReq, DetalleFacturaTempoData, 
  DetalleFacturaTempoRequest, FaloteRequestDto, LockedInfo, PickerSelectValue, ResolveOrderResult, SelectedModifierOption, SucursalPickerProps} 
  from "@/Interfaces/Crm/CartPCGInterface"
import type {LogCartRequestDto, LogCartResponseDto} from "@/Interfaces/Crm/LogCartInterface"
import {addProductTempoAsync, getProductFromCarAsync} from "@/Context/Slices/Ecommerce/cartSlice"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import {selectCompanySistema, selectCodReferenciaPCG} from "@/Context/Slices/Auth/authSlice"
import { FechaManagua } from "@/Utils/FechaManagua"
import { clampQty, cleanText } from "@/Utils/ECommerce/formatters"
import { buildCalculationRequest } from "@/Utils/ECommerce/utils"
import { MAX_DESCUENTO_PORCENTUAL_UI, normalizarDescuentoInput, prepararDescuentoGlobal} from "@/Utils/ECommerce/descuentoGlobal"
import { GENERAL_STATUS } from "@/Constants/status"
import { tasaCambio } from "@/Constants/tasaCambio"
import { TipoFalote } from "@/Constants/falote"

// type CartServiceWithCleanup = typeof CartService & {
//   LimpiarFacturaTempo?: (
//     usuario: string,
//     maquina: string
//   ) => Promise<unknown>
// }

const getErrorMessage = (
  error: unknown,
  fallback = "No se pudo agregar el producto."
) => {
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
    fallback
  )
}


// Enviar decimal, cuando se aplique el monto el procentaje o bien en absoluto cundo se haga el descuento pt pocucto
//no se puede por ejemplo si el usuariio escribe 40, se envia 0.4, o si el monto es 100 y el subtotoal 900, se hace el caclulo y se envia el deciaml
//dame este componente completo yactualizado
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
  const discountLockRef = useRef(false)

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
          codPrecio: existingLog.codPrecio,
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
        tasacambio: tasaCambio,
        financiamiento: 1,
        descuento: 0,
        // codvendedor: "004",
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
        tipoComponente: companySistema == "P" ? "" : "P",
        unico: "",
        sistema: String(companySistema),
        codvendedor: companySistema == "P" ? codReferenciaPCG : "000",
        ordenServicio:  companySistema == "A" ? codReferenciaPCG : "",
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
        tasacambio: tasaCambio,
        financiamiento: 0,
        descuento: 0,
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
       tipoComponente: companySistema == "P" ? "" : "O",
        unico,
        
        sistema: String(companySistema),//pcg o atento
        codvendedor: companySistema == "P" ? codReferenciaPCG : "000",
        ordenServicio:  companySistema == "A" ? codReferenciaPCG : "",
        tipoFac: metaChannel,
      }
    },
    [contactId, companySistema, codReferenciaPCG, metaChannel]
  )

  // const cleanupFacturaTempo = useCallback(async () => {
  //   const service = CartService as CartServiceWithCleanup
  //   const usuario = String(contactId)
  //   const maquina = `CRM-${contactId}`

  //   try {
  //     if (service.LimpiarFacturaTempo) {
  //       await service.LimpiarFacturaTempo(usuario, maquina)
  //     }
  //   } catch {
  //     toast.warning("No se pudo limpiar la factura temporal.")
  //   }
  // }, [contactId])

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

  /**
   * Obtiene el subtotal real calculado por VspConsolidadoFactura.
   * Se utiliza para validar descuentos absolutos y convertir
   * el caso PCG + monto absoluto sin modificar el SP compartido.
   */
  const getFreshSubtotal = useCallback(async (): Promise<number> => {
    const calculationRequest = buildCalculationRequest(contactId, 0)
    const response = await CartService.VspConsolidadoFactura(
      calculationRequest
    )

    const subtotal = Number(response.data?.[0]?.subTotal ?? 0)

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new Error(
        "No se pudo obtener un subtotal válido para aplicar el descuento."
      )
    }

    return subtotal
  }, [contactId])

  const aplicarDescuentoGlobal = useCallback(
    async ({
      descuento,
      tipo,
    }: AplicarDescuentoGlobalParams): Promise<boolean> => {
      if (discountLockRef.current) return false

      discountLockRef.current = true

      try {
        const existingLog = await fetchByContactId(contactId)
        const noPedido = Number(existingLog?.orderId ?? 0)
        const sucursal = cleanText(existingLog?.branch || locked?.branch)

        if (!noPedido || noPedido <= 0) {
          toast.warning(
            "No existe una orden activa para aplicar el descuento."
          )
          return false
        }

        if (!sucursal) {
          toast.warning(
            "No se pudo identificar la sucursal de la orden."
          )
          return false
        }

        /**
         * Los descuentos absolutos usan el subtotal real del
         * consolidado para validar y, en PCG, calcular el factor.
         */
        const subtotal =
          tipo === TipoDescuento.A
            ? await getFreshSubtotal()
            : null

        const descuentoPreparado = prepararDescuentoGlobal({
          sistema: companySistema,
          tipo,
          valor: descuento,
          subtotal,
        })

        const request: DescuentoGlobalReq = {
          descuento: descuentoPreparado.descuentoApi,
          usuario: String(contactId),
          maquina: `CRM-${contactId}`,
          sucursal,
          cliente: "00000",
          idDescuento: "0",
          sumaDescuento: "N",
          exonerado: "N",
          sistema: descuentoPreparado.sistema,
          tipo: descuentoPreparado.tipo,

          /**
           * Atento necesita cuenta y orden para filtrar
           * correctamente la factura temporal.
           */
          idCuenta: "0",
          idOrden: "0"
        }

        const response =
          await CartService.AplicarDescuentoGlobal(request)

        if (response.success === false) {
          throw new Error(
            response.message ||
              "No se pudo aplicar el descuento global."
          )
        }

        /**
         * Ejecuta nuevamente OrdenEn para actualizar carPCG
         * y el badge con la respuesta más reciente.
         */
        await refreshBadge(noPedido)

        toast.success(
          response.message ||
            "Descuento global aplicado correctamente."
        )

        return true
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "No se pudo aplicar el descuento global."
          )
        )

        return false
      } finally {
        discountLockRef.current = false
      }
    },
    [
      companySistema,
      contactId,
      fetchByContactId,
      getFreshSubtotal,
      locked?.branch,
      refreshBadge,
    ]
  )

  /**
   * Aplica descuento únicamente sobre un producto principal
   * que ya existe dentro de det_factura_tempo.
   *
   * El SP recibe el porcentaje visible, por ejemplo 10, porque
   * su rama %desc. realiza internamente la división entre 100.
   */
// const aplicarDescuentoProducto = useCallback(
//   async ({
//     detalle,
//     descuento,
//     tipo,
//   }: AplicarDescuentoProductoParams): Promise<boolean> => {
//     if (discountLockRef.current) return false

//     if (detalle.tipoComponente !== "P") {
//       toast.warning(
//         "El descuento solo puede aplicarse al producto principal."
//       )
//       return false
//     }

//     if (detalle.permiteDescuento !== "S") {
//       toast.warning("Este producto no permite aplicar descuento.")
//       return false
//     }

//     let valorNormalizado = ""

//     try {
//       valorNormalizado = normalizarDescuentoInput(descuento)
//     } catch (error) {
//       toast.warning(
//         getErrorMessage(error, "Ingrese un descuento válido.")
//       )
//       return false
//     }

//     if (!valorNormalizado) {
//       toast.warning("Debe ingresar un descuento.")
//       return false
//     }

//     const valorNumerico = Number(valorNormalizado)

//     if (!Number.isFinite(valorNumerico) || valorNumerico < 0) {
//       toast.warning("Ingrese un descuento válido.")
//       return false
//     }

//     const cantidad = Number(detalle.cantidad ?? 0)
//     const precioUnitario = Number(detalle.precioV ?? 0)
//     const subtotalLinea = cantidad * precioUnitario

//     if (
//       !Number.isFinite(subtotalLinea) ||
//       subtotalLinea <= 0
//     ) {
//       toast.warning(
//         "No se pudo calcular el subtotal del producto."
//       )
//       return false
//     }

//     if (
//       tipo === TipoDescuento.P &&
//       valorNumerico > MAX_DESCUENTO_PORCENTUAL_UI
//     ) {
//       toast.warning(
//         `El descuento porcentual debe estar entre 0 y ${MAX_DESCUENTO_PORCENTUAL_UI}.`
//       )
//       return false
//     }

//     if (
//       tipo === TipoDescuento.A &&
//       valorNumerico > subtotalLinea
//     ) {
//       toast.warning(
//         "El descuento no puede superar el subtotal del producto."
//       )
//       return false
//     }

//     /*
//      * El SP espera el descuento como factor decimal:
//      *
//      * Porcentaje:
//      * 40 % => 40 / 100 => 0.4
//      *
//      * Monto absoluto:
//      * $100 sobre subtotal $900 => 100 / 900 => 0.11111111
//      */
//     // const descuentoDecimal =
//     //   tipo === TipoDescuento.P
//     //     ? valorNumerico / 100
//     //     : valorNumerico / subtotalLinea

//     if (
//       !Number.isFinite(valorNumerico) ||
//       valorNumerico < 0 ||
//       valorNumerico > 1
//     ) {
//       toast.warning(
//         "No se pudo calcular correctamente el descuento."
//       )
//       return false
//     }

//     /*
//      * Evita enviar decimales binarios extensos, por ejemplo:
//      * 0.1111111111111111
//      */
//     const descuentoApi =
//   tipo === TipoDescuento.P
//     ? valorNumerico
//     : Number((valorNumerico / subtotalLinea).toFixed(8))

//     discountLockRef.current = true

//     try {
//       const existingLog = await fetchByContactId(contactId)

//       const noPedido = Number(
//         existingLog?.orderId ?? detalle.noPedido ?? 0
//       )

//       const sucursal = cleanText(
//         existingLog?.branch || locked?.branch
//       )

//       const bodega = cleanText(
//         existingLog?.wherehouseCode ||
//           locked?.wherehouseCode
//       )

//       const codPrecio =
//         existingLog?.codPrecio ||
//         cleanText(locked?.codPrecio) ||
//         "01"

//       const codProducto = cleanText(
//         detalle.codProducto
//       )

//       const financiamiento = Number(
//         detalle.financiamiento
//       )

//       if (!noPedido || noPedido <= 0) {
//         toast.warning(
//           "No existe una orden activa para aplicar el descuento."
//         )
//         return false
//       }

//       if (!sucursal) {
//         toast.warning(
//           "No se pudo identificar la sucursal de la orden."
//         )
//         return false
//       }

//       if (!bodega) {
//         toast.warning(
//           "No se pudo identificar la bodega de la orden."
//         )
//         return false
//       }

//       if (!codProducto) {
//         toast.warning(
//           "No se pudo identificar el producto."
//         )
//         return false
//       }

//       if (!Number.isFinite(financiamiento)) {
//         toast.warning(
//           "No se pudo identificar la línea del producto."
//         )
//         return false
//       }

//       const request: DetalleFacturaTempoRequest = {
//         usuario: String(contactId),
//         maquina: `CRM-${contactId}`,
//         fecha: FechaManagua.obtenerFormatoLimpio(),

//         codproducto: codProducto,
//         codprecio: codPrecio,
//         precio: precioUnitario,
//         cantidadmovimiento: cantidad,
//         medidamovimiento: cleanText(detalle.codUm),

//         tipotrabajo:
//           tipo === TipoDescuento.P
//             ? "%desc."
//             : "Descuento",

//         financiamiento,

//         codvendedor:codReferenciaPCG,
//           // companySistema 
//           // === "P"
//           //   ? codReferenciaPCG
//           //   : "005",

//         codcliente: "00000",
//         producto: cleanText(detalle.descripcion),
//         sucursal,
//         bodega,
//         nofactura: String(noPedido),

//         tipo: "1",

//         tipodesc:
//           tipo === TipoDescuento.P ? "P" : "V",

//         tasacambio: tasaCambio,

//         /*
//          * Siempre se envía el factor decimal.
//          */
//         descuento: descuentoApi,

//         autorizado: "N",
//         tabla: "det_factura_tempo",
//         vincularse: "N",

//         servicioventa: Number(
//           detalle.tipoServicio ?? 1
//         ),

//         facturaexonerada: "N",
//         lote: "Sin Lote",
//         vencimiento: "20260116",
//         vienedelabusqueda: "N",

//         observacion: cleanText(
//           detalle.observaciones
//         ),

//         iddescuentolineal: 0,
//         vienedebusquedaprioridadproducto: "S",
//         pol_Sumacant: "N",

//         tipoComponente:
//           companySistema === "P" ? "" : "P",

//         unico: cleanText(detalle.unico),

//         codModificador:
//           cleanText(detalle.codModificador) ||
//           "00000",

//         sistema: String(companySistema),

//         ordenServicio:
//           companySistema === "A"
//             ? codReferenciaPCG
//             : "",

//         tipoFac: metaChannel,
//       }

//       const result = await dispatch(
//         addProductTempoAsync(request)
//       ).unwrap()

//       const message = cleanText(
//         result.header?.msj
//       )

//       if (result.header?.cargaFila === "N") {
//         throw new Error(
//           message ||
//             "No se pudo aplicar el descuento al producto."
//         )
//       }

//       await refreshBadge(noPedido)

//       toast.success(
//         message ||
//           "Descuento aplicado al producto correctamente."
//       )

//       return true
//     } catch (error) {
//       toast.error(
//         getErrorMessage(
//           error,
//           "No se pudo aplicar el descuento al producto."
//         )
//       )

//       return false
//     } finally {
//       discountLockRef.current = false
//     }
//   },
//   [
//     codReferenciaPCG,
//     companySistema,
//     contactId,
//     dispatch,
//     fetchByContactId,
//     locked?.branch,
//     locked?.codPrecio,
//     locked?.wherehouseCode,
//     metaChannel,
//     refreshBadge,
//   ]
// )


const aplicarDescuentoProducto = useCallback(
  async ({
    detalle,
    descuento,
    tipo,
  }: AplicarDescuentoProductoParams): Promise<boolean> => {
    if (discountLockRef.current) return false

    if (detalle.tipoComponente !== "P") {
      toast.warning(
        "El descuento solo puede aplicarse al producto principal."
      )
      return false
    }

    if (detalle.permiteDescuento !== "S") {
      toast.warning("Este producto no permite aplicar descuento.")
      return false
    }

    let valorNormalizado = ""

    try {
      valorNormalizado = normalizarDescuentoInput(descuento)
    } catch (error) {
      toast.warning(
        getErrorMessage(
          error,
          "Ingrese un descuento válido."
        )
      )
      return false
    }

    if (!valorNormalizado) {
      toast.warning("Debe ingresar un descuento.")
      return false
    }

    const valorNumerico = Number(valorNormalizado)

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico < 0
    ) {
      toast.warning("Ingrese un descuento válido.")
      return false
    }

    const cantidad = Number(detalle.cantidad ?? 0)
    const precioUnitario = Number(detalle.precioV ?? 0)
    const subtotalLinea = cantidad * precioUnitario

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0 ||
      !Number.isFinite(precioUnitario) ||
      precioUnitario <= 0 ||
      !Number.isFinite(subtotalLinea) ||
      subtotalLinea <= 0
    ) {
      toast.warning(
        "No se pudo calcular el subtotal del producto."
      )
      return false
    }

    /*
     * PORCENTAJE:
     * El SP %desc. recibe el valor visible.
     * Ejemplo: 50 % se envía como 50.
     */
    if (
      tipo === TipoDescuento.P &&
      valorNumerico > MAX_DESCUENTO_PORCENTUAL_UI
    ) {
      toast.warning(
        `El descuento porcentual debe estar entre 0 y ${MAX_DESCUENTO_PORCENTUAL_UI}.`
      )
      return false
    }

    /*
     * ABSOLUTO:
     * El monto no puede superar el subtotal de la línea.
     */
    if (
      tipo === TipoDescuento.A &&
      valorNumerico > subtotalLinea
    ) {
      toast.warning(
        "El descuento no puede superar el subtotal del producto."
      )
      return false
    }

    /*
     * Porcentaje:
     * 50 se envía como 50 porque el SP divide entre 100.
     *
     * Absoluto:
     * C$40 sobre C$80 se convierte en 0.5.
     */
    const descuentoApi =
      tipo === TipoDescuento.P
        ? valorNumerico
        : Number(
            (valorNumerico).toFixed(8)
          )

    if (
      !Number.isFinite(descuentoApi) ||
      descuentoApi < 0 ||
      (
        tipo === TipoDescuento.A &&
        descuentoApi > 100
      )
    ) {
      toast.warning(
        "No se pudo calcular correctamente el descuento."
      )
      return false
    }

    discountLockRef.current = true

    try {
      const existingLog =
        await fetchByContactId(contactId)

      const noPedido = Number(
        existingLog?.orderId ??
          detalle.noPedido ??
          0
      )

      const sucursal = cleanText(
        existingLog?.branch ||
          locked?.branch
      )

      const bodega = cleanText(
        existingLog?.wherehouseCode ||
          locked?.wherehouseCode
      )

      const codPrecio =
        existingLog?.codPrecio ||
        cleanText(locked?.codPrecio) ||
        "01"

      const codProducto = cleanText(
        detalle.codProducto
      )

      const financiamiento = Number(
        detalle.financiamiento
      )

      if (!noPedido || noPedido <= 0) {
        toast.warning(
          "No existe una orden activa para aplicar el descuento."
        )
        return false
      }

      if (!sucursal) {
        toast.warning(
          "No se pudo identificar la sucursal de la orden."
        )
        return false
      }

      if (!bodega) {
        toast.warning(
          "No se pudo identificar la bodega de la orden."
        )
        return false
      }

      if (!codProducto) {
        toast.warning(
          "No se pudo identificar el producto."
        )
        return false
      }

      if (!Number.isFinite(financiamiento)) {
        toast.warning(
          "No se pudo identificar la línea del producto."
        )
        return false
      }

      const request: DetalleFacturaTempoRequest = {
        usuario: String(contactId),
        maquina: `CRM-${contactId}`,
        fecha: FechaManagua.obtenerFormatoLimpio(),

        codproducto: codProducto,
        codprecio: codPrecio,
        precio: precioUnitario,
        cantidadmovimiento: cantidad,
        medidamovimiento: cleanText(detalle.codUm),

        tipotrabajo:
          tipo === TipoDescuento.P
            ? "%desc."
            : "Descuento",

        financiamiento,

        codvendedor: codReferenciaPCG,
        codcliente: "00000",

        producto: cleanText(detalle.descripcion),
        sucursal,
        bodega,
        nofactura: String(noPedido),

        tipo: "1",

        tipodesc:
          tipo === TipoDescuento.P
            ? "P"
            : "V",

        tasacambio: tasaCambio,

        /*
         * Porcentaje: valor visible, por ejemplo 50.
         * Absoluto: factor decimal, por ejemplo 0.5.
         */
        descuento: descuentoApi,

        autorizado: "N",
        tabla: "det_factura_tempo",
        vincularse: "N",

        servicioventa: Number(
          detalle.tipoServicio ?? 1
        ),

        facturaexonerada: "N",
        lote: "Sin Lote",
        vencimiento: "20260116",
        vienedelabusqueda: "N",

        observacion: cleanText(
          detalle.observaciones
        ),

        iddescuentolineal: 0,
        vienedebusquedaprioridadproducto: "S",
        pol_Sumacant: "N",

        tipoComponente:
          companySistema === "P"
            ? ""
            : "P",

        unico: cleanText(detalle.unico),

        codModificador:
          cleanText(detalle.codModificador) ||
          "00000",

        sistema: String(companySistema),

        ordenServicio:
          companySistema === "A"
            ? codReferenciaPCG
            : "",

        tipoFac: metaChannel,
      }

      const result = await dispatch(
        addProductTempoAsync(request)
      ).unwrap()

      const message = cleanText(
        result.header?.msj
      )

      if (result.header?.cargaFila === "N") {
        throw new Error(
          message ||
            "No se pudo aplicar el descuento al producto."
        )
      }

      await refreshBadge(noPedido)

      toast.success(
        message ||
          "Descuento aplicado al producto correctamente."
      )

      return true
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "No se pudo aplicar el descuento al producto."
        )
      )

      return false
    } finally {
      discountLockRef.current = false
    }
  },
  [
    codReferenciaPCG,
    companySistema,
    contactId,
    dispatch,
    fetchByContactId,
    locked?.branch,
    locked?.codPrecio,
    locked?.wherehouseCode,
    metaChannel,
    refreshBadge,
  ]
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
          codPrecio: existingLog.codPrecio || cleanText(codPrecio),
        }
      }

      const falote: FaloteRequestDto = {
        codSucursal: branch,
        documento: TipoFalote.GetConsecDoc,
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
    discountLockRef.current = false
  }, [])

  const rollbackCreatedLog = useCallback(
    async (createdLog: LogCartResponseDto | null) => {
      if (!createdLog?.id) return

      try {
        await UpdatedStatus(createdLog.id, GENERAL_STATUS.Cancelada)
      } catch {
        toast.warning("No se pudo cancelar el LogCart creado.")
      }

      // await cleanupFacturaTempo()
    },
    [UpdatedStatus
      // , cleanupFacturaTempo
    ]
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

        if ((!createdDetail || !createdDetail.unico) && companySistema == 'A') {
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
        codPrecio: existingLog.codPrecio || "01",
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
    async (args: AddProductInput): Promise<boolean> => {
      return await addProductCore(args)
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
        codPrecio: value.codPrecio || "01",
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
    aplicarDescuentoGlobal,
    aplicarDescuentoProducto,

    pickerProps,
    resetCartFlow,
  }
}



// Si se escribe No se pudo cancular, 20, o mas de 10, se muestra No se pudo cancular

// !!!!