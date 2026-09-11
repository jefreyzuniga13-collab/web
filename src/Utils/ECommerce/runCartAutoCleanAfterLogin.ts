import type { AutoCleanedCartSummary } from "@/Interfaces/Crm/AutoCleanedCart"
import { store } from "@/Context"
import { logCartService } from "@/Services/Crm/LogCartService"
import { CartService } from "@/Services/Ecommerce/CarPCGService"

export const CART_AUTO_CLEAN_STORAGE_KEY = "cartAutoCleanSummary"

let autoCleanInFlight: Promise<void> | null = null

export async function runCartAutoCleanAfterLogin(): Promise<void> {
  if (autoCleanInFlight) {
    return autoCleanInFlight
  }

  autoCleanInFlight = runCartAutoCleanAfterLoginInternal().finally(() => {
    autoCleanInFlight = null
  })

  return autoCleanInFlight
}

async function runCartAutoCleanAfterLoginInternal(): Promise<void> {
  try {
    const empresaId = String(store.getState().auth.empresaId ?? "").trim()

    if (empresaId) {
      localStorage.setItem("EmpresaId", empresaId)
      sessionStorage.setItem("EmpresaId", empresaId)
    }

    const pending = await logCartService.getPendingAutoClean()
    const items = pending.data ?? []

    if (items.length === 0) return

    const cleaned: AutoCleanedCartSummary[] = []

    for (const item of items) {
      const contactId = Number(item.contactId)
      const orderId = Number(item.orderId)

      if (!contactId || !orderId) continue

      const cleared = await CartService.clearCart(contactId, orderId)

      if (cleared) cleaned.push(item)
    }

    if (cleaned.length === 0) return

    await logCartService.confirmAutoClean(
      cleaned.map((item) => item.logCartId)
    )

    sessionStorage.setItem(
      CART_AUTO_CLEAN_STORAGE_KEY,
      JSON.stringify(cleaned)
    )
  } catch {
    // El login no debe fallar si la limpieza no corre.
  }
}
