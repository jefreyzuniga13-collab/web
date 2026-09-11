import { useEffect, useState } from "react"
import { useSelector } from "react-redux"

import { CartAutoCleanModal } from "@/Components/ECommerce/CartAutoCleanModal"
import type { AutoCleanedCartSummary } from "@/Interfaces/Crm/AutoCleanedCart"
import type { RootState } from "@/Context"
import { CART_AUTO_CLEAN_STORAGE_KEY } from "@/Utils/ECommerce/runCartAutoCleanAfterLogin"

function readSummary(): AutoCleanedCartSummary[] {
  try {
    const raw = sessionStorage.getItem(CART_AUTO_CLEAN_STORAGE_KEY)

    if (!raw) return []

    const parsed = JSON.parse(raw) as AutoCleanedCartSummary[]

    return Array.isArray(parsed) ? parsed : []
  } catch {
    sessionStorage.removeItem(CART_AUTO_CLEAN_STORAGE_KEY)
    return []
  }
}

export function CartAutoCleanModalWatcher() {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  )
  const checkingSession = useSelector(
    (state: RootState) => state.auth.checkingSession
  )

  const [items, setItems] = useState<AutoCleanedCartSummary[]>([])

  useEffect(() => {
    if (checkingSession || !isAuthenticated) return

    const summary = readSummary()

    if (summary.length === 0) return

    setItems(summary)
  }, [checkingSession, isAuthenticated])

  if (items.length === 0) return null

  return (
    <CartAutoCleanModal
      items={items}
      onClose={() => {
        sessionStorage.removeItem(CART_AUTO_CLEAN_STORAGE_KEY)
        setItems([])
      }}
    />
  )
}
