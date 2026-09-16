import { store } from "@/Context"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { logCartService } from "@/Services/Crm/LogCartService"
import { CartService } from "@/Services/Ecommerce/CarPCGService"
import { countMainProducts } from "@/Utils/ECommerce/utils"

type ConversationCartHint = {
  clientContactId?: number | null
  isItemsInCart?: boolean
}

export async function hydrateCartBadges(
  conversations: ConversationCartHint[]
): Promise<void> {
  const badges = store.getState().cartBadge.byContactId

  const contactIds = [
    ...new Set(
      conversations
        .filter((conversation) => conversation.isItemsInCart)
        .map((conversation) => Number(conversation.clientContactId ?? 0))
        .filter((contactId) => contactId > 0)
    ),
  ].filter((contactId) => badges[contactId]?.hasCart !== false)

  for (const contactId of contactIds) {
    try {
      const log = await logCartService.GetByContactAndStatus(contactId)
      const orderId = Number(log.data?.orderId ?? 0)
      const cart = await CartService.getProductFromCar(
        contactId,
        orderId > 0 ? orderId : 0
      )
      const count = countMainProducts(Array.isArray(cart) ? cart : [])

      store.dispatch(
        setContactCartBadge({
          contactId,
          hasCart: count > 0,
          count,
        })
      )
    } catch {
      store.dispatch(
        setContactCartBadge({
          contactId,
          hasCart: false,
          count: 0,
        })
      )
    }
  }
}
