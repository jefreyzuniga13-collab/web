import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react"

import { useCartPCGFlow } from "@/Hooks/Ecommerce/payment/useCartPCGFlow"

import type { AddProductInput, AddProductsInput, AplicarDescuentoGlobalParams, AplicarDescuentoProductoParams, LockedInfo, SucursalPickerProps} from "@/Interfaces/Crm/CartPCGInterface"

/**
 * Valores y operaciones compartidos por el flujo
 * del carrito temporal PCG/Atento.
 */
type CartPCGFlowContextValue = {
  conversationId: number
  contactId: number

  /**
   * Sucursal, bodega, serie y código de precio
   * bloqueados para la orden activa.
   */
  locked: LockedInfo | null

  /**
   * Código de precio utilizado por la orden actual.
   */
  codPrecioActivo: string

  /**
   * Actualiza o libera la información bloqueada
   * de la orden activa.
   */
  setLocked: (value: LockedInfo | null) => void

  /**
   * Actualiza el código de precio activo.
   */
  setCodPrecioActivo: (
    value: string | null | undefined
  ) => void

  /**
   * Agrega un producto al carrito.
   *
   * Retorna true cuando el producto fue agregado
   * correctamente.
   */
  addProduct: (
    args: AddProductInput
  ) => Promise<boolean>

  /**
   * Agrega varios productos al carrito.
   */
  addProducts: (
    items: AddProductsInput
  ) => Promise<void>

  /**
   * Aplica un descuento global sobre la orden
   * y vuelve a consultar OrdenEn.
   *
   * Retorna true cuando el descuento fue aplicado.
   */
  aplicarDescuentoGlobal: (
    params: AplicarDescuentoGlobalParams
  ) => Promise<boolean>

  /**
   * Aplica un descuento únicamente al producto
   * principal seleccionado.
   *
   * No aplica el descuento a sus opciones
   * o modificadores relacionados.
   *
   * Retorna true cuando el descuento fue aplicado.
   */
  aplicarDescuentoProducto: (
    params: AplicarDescuentoProductoParams
  ) => Promise<boolean>

  /**
   * Propiedades utilizadas por el selector
   * de sucursal y bodega.
   */
  pickerProps: SucursalPickerProps

  /**
   * Reinicia el estado interno del flujo.
   */
  resetCartFlow: () => void
}

type CartPCGFlowProviderProps = {
  conversationId: number
  contactId: number
  metaChannel: string
  children: ReactNode
}

const CartPCGFlowContext =
  createContext<CartPCGFlowContextValue | null>(null)

/**
 * Proveedor principal del flujo de carrito
 * asociado a una conversación y contacto.
 */
export const CartPCGFlowProvider = ({
  conversationId,
  contactId,
  metaChannel,
  children,
}: CartPCGFlowProviderProps) => {
  const {
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
  } = useCartPCGFlow(
    conversationId,
    contactId,
    metaChannel
  )

  const value = useMemo<CartPCGFlowContextValue>(
    () => ({
      conversationId,
      contactId,
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
    }),
    [
      conversationId,
      contactId,
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
    ]
  )

  return (
    <CartPCGFlowContext.Provider value={value}>
      {children}
    </CartPCGFlowContext.Provider>
  )
}

/**
 * Accede al flujo del carrito desde cualquier
 * componente descendiente del provider.
 */
export const useCartPCGFlowCtx =
  (): CartPCGFlowContextValue => {
    const context = useContext(CartPCGFlowContext)

    if (context === null) {
      throw new Error(
        "useCartPCGFlowCtx debe usarse dentro de CartPCGFlowProvider."
      )
    }

    return context
  }