import { GENERAL_STATUS } from "@/Constants/status"
import { CartService } from "@/Services/Ecommerce/CarPCGService"

type CancelLogCartParams = {
  logCartId: number
  contactId: number
  orderId: number
  updatedStatus: (
    id: number,
    statusId: number
  ) => Promise<unknown>
}

export async function cancelLogCartAndClearPcg({
  logCartId,
  contactId,
  orderId,
  updatedStatus,
}: CancelLogCartParams): Promise<void> {
  const safeContactId = Number(contactId)
  const safeOrderId = Number(orderId)

  if (safeContactId > 0 && safeOrderId > 0) {
    try {
      await CartService.clearCart(safeContactId, safeOrderId)
    } catch {
      // Si PCG no responde, igual se cancela el LogCart en CRM.
    }
  }

  if (logCartId > 0) {
    await updatedStatus(logCartId, GENERAL_STATUS.Cancelada)
  }
}
