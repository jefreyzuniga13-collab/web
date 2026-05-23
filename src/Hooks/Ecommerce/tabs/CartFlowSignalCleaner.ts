import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useQueryClient } from "@tanstack/react-query"
import type { AppDispatch } from "@/Context"
import { clearCart } from "@/Context/Slices/Ecommerce/cartSlice"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"

type Props = {
  contactId: number
  conversationId: number
}

export function CartFlowSignalCleaner({ contactId, conversationId }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const { resetCartFlow } = useCartPCGFlowCtx()

  useEffect(() => {
    const onCleared = (e: Event) => {
      const detail = (e as CustomEvent<{
        contactId: number
        orderId: number
        conversationId: number
      }>).detail

      if (!detail) return
      if (Number(detail.contactId) !== Number(contactId)) return

      const draftKey = `cartDraft:v1:${conversationId}:${contactId}`

      localStorage.removeItem(draftKey)
      sessionStorage.removeItem(draftKey)

      queryClient.removeQueries({
        queryKey: ["log-cart", "contact-status", contactId],
        exact: true,
      })

      queryClient.removeQueries({
        queryKey: ["log-cart"],
        exact: false,
      })

      dispatch(clearCart())

      dispatch(
        setContactCartBadge({
          contactId,
          hasCart: false,
          count: 0,
        })
      )

      resetCartFlow()
    }

    window.addEventListener("CartClearedForActiveContact", onCleared)

    return () => {
      window.removeEventListener("CartClearedForActiveContact", onCleared)
    }
  }, [
    contactId,
    conversationId,
    dispatch,
    queryClient,
    resetCartFlow,
  ])

  return null
}