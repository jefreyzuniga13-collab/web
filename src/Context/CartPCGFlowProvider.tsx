// src/Context/CartPCGFlowProvider.tsx
import React, { createContext, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { useCartPCGFlow } from "@/Hooks/Ecommerce/useCartPCGFlow"
import type { AddProductParams, LockedInfo, SucursalPickerProps } from "@/Hooks/Ecommerce/useCartPCGFlow"

type CartPCGFlowContextValue = {
  conversationId: number
  contactId: number
  locked: LockedInfo | null
  setLocked: (v: LockedInfo | null) => void
  addProduct: (args: AddProductParams) => Promise<void>
  pickerProps: SucursalPickerProps
}

const CartPCGFlowContext = createContext<CartPCGFlowContextValue | null>(null)

type ProviderProps = {
  conversationId: number
  contactId: number
  children: ReactNode
}

export const CartPCGFlowProvider = ({ conversationId, contactId, children }: ProviderProps) => {
  const flow = useCartPCGFlow(conversationId, contactId)

  const value = useMemo<CartPCGFlowContextValue>(
    () => ({
      conversationId,
      contactId,
      locked: flow.locked,
      setLocked: flow.setLocked,
      addProduct: flow.addProduct,
      pickerProps: flow.pickerProps,
    }),
    [conversationId, contactId, flow.locked, flow.setLocked, flow.addProduct, flow.pickerProps]
  )

  return <CartPCGFlowContext.Provider value={value}>{children}</CartPCGFlowContext.Provider>
}

export const useCartPCGFlowCtx = () => {
  const ctx = useContext(CartPCGFlowContext)
  if (!ctx) throw new Error("useCartPCGFlowCtx debe usarse dentro de CartPCGFlowProvider")
  return ctx
}