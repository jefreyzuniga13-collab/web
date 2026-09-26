import { store } from "@/Context"
import { logout } from "@/Context/Slices/Auth/authSlice"
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice"
import { limpiarSesionYRedirigir } from "@/Utils/clearClientStorage"

let expulsando = false

const MENSAJE_SESION_INVALIDA =
  "Tu sesión expiró. Inicia sesión nuevamente."

export function sesionYaEnExpulsion(): boolean {
  return expulsando
}

export function esErrorSesionInvalida(error: unknown): boolean {
  const err = error as {
    statusCode?: number
    status?: number
    message?: string
    response?: {
      status?: number
      data?: { message?: string }
    }
  }

  const status =
    err?.response?.status ?? err?.statusCode ?? err?.status ?? 0
  const message = String(
    err?.response?.data?.message ?? err?.message ?? "",
  )

  if (status === 401) return true

  return /401|sesión fue cerrada|revocada|expiró|expiro|caduc/i.test(
    message,
  )
}

/**
 * Limpia la sesión local y vuelve al login.
 * No llama a /Auth/logout para no encadenar otro 401.
 */
export async function expulsarSesionExpirada(
  message = MENSAJE_SESION_INVALIDA,
): Promise<void> {
  if (expulsando) return

  if (
    typeof window !== "undefined" &&
    /\/login\/?$/.test(window.location.pathname)
  ) {
    return
  }

  expulsando = true

  try {
    const { stopHubConnection } = await import("@/Services/signalr")
    await stopHubConnection()
  } catch {
    /*
     * El redirect continúa aunque SignalR no se detenga.
     */
  }

  store.dispatch(logout())
  store.dispatch(clearCompanyState())

  await limpiarSesionYRedirigir(message)
}
