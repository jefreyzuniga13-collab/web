/* eslint-disable no-empty */

import { persistor } from "@/Context"
import { queryClient } from "@/Utils/Https/reactQuery"

/**
 * Limpia los datos privados de la sesión actual.
 *
 * No elimina el service worker ni los cachés públicos de la PWA.
 */
export async function limpiarSesionCliente(): Promise<void> {
  try {
    queryClient.clear()
  } catch {}

  try {
    persistor.pause()
    await persistor.purge()
    await persistor.flush()
  } catch {}

  try {
    localStorage.removeItem("persist:root")
    sessionStorage.clear()
  } catch {}
}

/**
 * Limpieza completa para mantenimiento o recuperación.
 *
 * No debe ejecutarse en cada logout normal.
 */
export async function limpiarAplicacionCompleta(): Promise<void> {
  await limpiarSesionCliente()

  try {
    localStorage.clear()
  } catch {}

  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys()

      await Promise.all(
        cacheNames.map((name) => caches.delete(name))
      )
    }
  } catch {}

  try {
    if ("serviceWorker" in navigator) {
      const registrations =
        await navigator.serviceWorker.getRegistrations()

      await Promise.all(
        registrations.map((registration) =>
          registration.unregister()
        )
      )
    }
  } catch {}
}

/**
 * Limpiar el local storage local
 */

export async function ClearSiteMetadata(): Promise<void>{

  localStorage.clear();
  sessionStorage.clear();
  cookieStore.delete(".orbitrachat.com");
  limpiarAlmacenamientoCliente();
  limpiarAplicacionCompleta();
}

/**
 * Limpia la sesión y redirige al login.
 */
export async function limpiarSesionYRedirigir(
  message?: string
): Promise<void> {
  if (message) {
    try {
      sessionStorage.setItem(
        "logoutMessage",
        message
      )
    } catch {}
  }

  await limpiarSesionCliente()

  window.location.replace("/crm/login")
}

/**
 * Alias para no romper llamadas existentes.
 */
export const limpiarAlmacenamientoCliente =
  limpiarSesionYRedirigir