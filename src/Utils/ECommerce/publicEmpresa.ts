/**
 * El cliente del link paynow no inicia sesión.
 * PCG lee la empresa desde el header `empresa`.
 *
 * En iPhone/Safari (y WhatsApp WebView) a veces hay un EmpresaId
 * viejo de login CRM en localStorage; el flag paynowPublic fuerza
 * a usar la empresa del token del link.
 */
const PAYNOW_PUBLIC_KEY = "paynowPublic"

function safeSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value)
  } catch {
    // Safari privado / ITP puede bloquear storage.
  }
}

function safeRemove(storage: Storage, key: string) {
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
}

export function applyPublicEmpresaId(empresaId?: string | null): string {
  const value = String(empresaId ?? "").trim()

  if (value) {
    safeSet(sessionStorage, "EmpresaId", value)
    safeSet(localStorage, "EmpresaId", value)
    safeSet(sessionStorage, PAYNOW_PUBLIC_KEY, "1")
    safeSet(localStorage, PAYNOW_PUBLIC_KEY, "1")
    return value
  }

  clearPublicEmpresaContext()
  return ""
}

export function clearPublicEmpresaContext() {
  safeRemove(sessionStorage, "EmpresaId")
  safeRemove(localStorage, "EmpresaId")
  safeRemove(sessionStorage, PAYNOW_PUBLIC_KEY)
  safeRemove(localStorage, PAYNOW_PUBLIC_KEY)
}

export function isPaynowPublicContext(): boolean {
  try {
    return (
      sessionStorage.getItem(PAYNOW_PUBLIC_KEY) === "1" ||
      localStorage.getItem(PAYNOW_PUBLIC_KEY) === "1"
    )
  } catch {
    return false
  }
}

export function readPublicEmpresaId(): string {
  try {
    return (
      sessionStorage.getItem("EmpresaId") ||
      localStorage.getItem("EmpresaId") ||
      ""
    )
  } catch {
    return ""
  }
}
