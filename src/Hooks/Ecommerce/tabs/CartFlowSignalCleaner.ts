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

type CartClearedDetail = {
  contactId?: number
  orderId?: number
  conversationId?: number
}

const getDraftKey = (
  conversationId: number,
  contactId: number
): string => {
  return `cartDraft:v1:${conversationId}:${contactId}`
}

export function CartFlowSignalCleaner({
  contactId,
  conversationId,
}: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const { resetCartFlow } = useCartPCGFlowCtx()

  useEffect(() => {
    const normalizedContactId = Number(contactId)
    const normalizedConversationId = Number(conversationId)

    if (
      normalizedContactId <= 0 ||
      normalizedConversationId <= 0
    ) {
      return
    }

    const onCleared = (event: Event): void => {
      const detail = (
        event as CustomEvent<CartClearedDetail>
      ).detail

      if (!detail) return

      const eventContactId = Number(detail.contactId ?? 0)
      const eventConversationId = Number(
        detail.conversationId ?? 0
      )

      if (eventContactId !== normalizedContactId) {
        return
      }

      /*
       * Cuando el evento incluye conversación, también se valida.
       * Así no se limpia accidentalmente otro carrito del mismo contacto.
       */
      if (
        eventConversationId > 0 &&
        eventConversationId !== normalizedConversationId
      ) {
        return
      }

      const draftKey = getDraftKey(
        normalizedConversationId,
        normalizedContactId
      )

      localStorage.removeItem(draftKey)
      sessionStorage.removeItem(draftKey)

      /*
       * Se elimina únicamente la consulta del contacto activo.
       * Antes se borraba toda la caché ["log-cart"], provocando
       * nuevas solicitudes para otros contactos.
       */
      void queryClient.cancelQueries({
        queryKey: [
          "log-cart",
          "contact-status",
          normalizedContactId,
        ],
        exact: true,
      })

      queryClient.removeQueries({
        queryKey: [
          "log-cart",
          "contact-status",
          normalizedContactId,
        ],
        exact: true,
      })

      dispatch(clearCart())

      dispatch(
        setContactCartBadge({
          contactId: normalizedContactId,
          hasCart: false,
          count: 0,
        })
      )

      resetCartFlow()
    }

    window.addEventListener(
      "CartClearedForActiveContact",
      onCleared
    )

    return () => {
      window.removeEventListener(
        "CartClearedForActiveContact",
        onCleared
      )
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