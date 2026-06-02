import { createContext, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { useCartPCGFlow } from "@/Hooks/Ecommerce/payment/useCartPCGFlow"
import type { AddProductParams, LockedInfo, SucursalPickerProps } from "@/Interfaces/Chat/ProductPCGInterface"

type CartPCGFlowContextValue = {
  conversationId: number
  contactId: number
  locked: LockedInfo | null
  codPrecioActivo: string
  setLocked: (value: LockedInfo | null) => void
  setCodPrecioActivo: (value: string | null | undefined) => void
  addProduct: (args: AddProductParams) => Promise<void>
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
    pickerProps,
    resetCartFlow
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
