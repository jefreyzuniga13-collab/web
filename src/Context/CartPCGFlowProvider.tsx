import { createContext, useContext, useMemo } from "react"
import type { ReactNode } from "react"

import { useCartPCGFlow } from "@/Hooks/Ecommerce/payment/useCartPCGFlow"
import type {
  AddProductParams,
  LockedInfo,
  SucursalPickerProps,
} from "@/Hooks/Ecommerce/payment/useCartPCGFlow"

type CartPCGFlowContextValue = {
  conversationId: number
  contactId: number
  locked: LockedInfo | null
  setLocked: (value: LockedInfo | null) => void
  addProduct: (args: AddProductParams) => Promise<void>
  pickerProps: SucursalPickerProps
}

type CartPCGFlowProviderProps = {
  conversationId: number
  contactId: number
  children: ReactNode
}

const CartPCGFlowContext = createContext<CartPCGFlowContextValue | null>(null)

export const CartPCGFlowProvider = ({
  conversationId,
  contactId,
  children,
}: CartPCGFlowProviderProps) => {
  const { locked, setLocked, addProduct, pickerProps } = useCartPCGFlow(
    conversationId,
    contactId
  )

  const value = useMemo<CartPCGFlowContextValue>(
    () => ({
      conversationId,
      contactId,
      locked,
      setLocked,
      addProduct,
      pickerProps,
    }),
    [
      conversationId,
      contactId,
      locked,
      setLocked,
      addProduct,
      pickerProps,
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