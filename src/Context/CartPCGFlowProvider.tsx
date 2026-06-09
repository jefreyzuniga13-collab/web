import { createContext, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { useCartPCGFlow } from "@/Hooks/Ecommerce/payment/useCartPCGFlow"
import type {AddProductParams, AddProductsInput, LockedInfo, SucursalPickerProps} from "@/Interfaces/Crm/CartPCGInterface"

type CartPCGFlowContextValue = {
  conversationId: number
  contactId: number
  locked: LockedInfo | null
  codPrecioActivo: string
  setLocked: (value: LockedInfo | null) => void
  setCodPrecioActivo: (value: string | null | undefined) => void
  addProduct: (args: AddProductParams) => Promise<void>
  addProducts: (items: AddProductsInput) => Promise<void>
  pickerProps: SucursalPickerProps
  resetCartFlow: () => void
}

type CartPCGFlowProviderProps = {
  conversationId: number
  contactId: number
  metaChannel: string
  children: ReactNode
}

const CartPCGFlowContext = createContext<CartPCGFlowContextValue | null>(null)

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
    pickerProps,
    resetCartFlow,
  } = useCartPCGFlow(conversationId, contactId, metaChannel)

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

export const useCartPCGFlowCtx = (): CartPCGFlowContextValue => {
  const context = useContext(CartPCGFlowContext)

  if (context === null) {
    throw new Error(
      "useCartPCGFlowCtx debe usarse dentro de CartPCGFlowProvider."
    )
  }

  return context
}