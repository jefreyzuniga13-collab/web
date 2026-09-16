import type { AutoCleanedCartSummary } from "@/Interfaces/Crm/AutoCleanedCart"
import { store } from "@/Context"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { logCartService } from "@/Services/Crm/LogCartService"
import { CartService } from "@/Services/Ecommerce/CarPCGService"

export const CART_AUTO_CLEAN_STORAGE_KEY = "cartAutoCleanSummary"
export const CART_AUTO_CLEAN_READY_EVENT = "CartAutoCleanSummaryReady"

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

    for (const item of cleaned) {
      const contactId = Number(item.contactId)

      if (contactId <= 0) continue

      store.dispatch(
        setContactCartBadge({
          contactId,
          hasCart: false,
          count: 0,
        })
      )
    }

    sessionStorage.setItem(
      CART_AUTO_CLEAN_STORAGE_KEY,
      JSON.stringify(cleaned)
    )

    window.dispatchEvent(
      new Event(CART_AUTO_CLEAN_READY_EVENT)
    )
  } catch {
    // El login no debe fallar si la limpieza no corre.
  }
}
