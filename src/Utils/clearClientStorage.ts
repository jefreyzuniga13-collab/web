import { persistor } from "@/Context";
import { queryClient } from "@/Utils/Https/reactQuery";

const BASE_URL = import.meta.env.BASE_URL || "/";

const PERSIST_ROOT_KEY = "persist:root";
const LOGOUT_MESSAGE_KEY = "logoutMessage";
const FORCE_LOGOUT_STORAGE_KEY = "forceLogout";

function buildLoginUrl(): string {
  const normalizedBase = BASE_URL.endsWith("/")
    ? BASE_URL
    : `${BASE_URL}/`;

  return `${normalizedBase}login`;
}

/**
 * Elimina los datos privados asociados con la sesión actual.
 *
 * No elimina el service worker ni los cachés públicos de la PWA.
 */
export async function limpiarSesionCliente(): Promise<void> {
  try {
    queryClient.clear();
  } catch (error) {
    console.warn(
      "[clearClientStorage] No se pudo limpiar React Query.",
      error,
    );
  }

  try {
    persistor.pause();
    await persistor.purge();
    await persistor.flush();
  } catch (error) {
    console.warn(
      "[clearClientStorage] No se pudo limpiar Redux Persist.",
      error,
    );
  }

  try {
    localStorage.removeItem(PERSIST_ROOT_KEY);
    localStorage.removeItem(FORCE_LOGOUT_STORAGE_KEY);
    sessionStorage.clear();
  } catch (error) {
    console.warn(
      "[clearClientStorage] No se pudo limpiar el almacenamiento web.",
      error,
    );
  }
}

/**
 * Limpieza completa para mantenimiento o recuperación.
 *
 * Esta operación elimina toda la información local de la aplicación,
 * los cachés del navegador y los registros del service worker.
 * No debe ejecutarse durante un cierre de sesión normal.
 */
export async function limpiarAplicacionCompleta(): Promise<void> {
  await limpiarSesionCliente();

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.warn(
      "[clearClientStorage] No se pudo limpiar todo el almacenamiento.",
      error,
    );
  }

  try {
    if ("caches" in window) {
      const cacheNames = await caches.keys();

      await Promise.allSettled(
        cacheNames.map((cacheName) =>
          caches.delete(cacheName),
        ),
      );
    }
  } catch (error) {
    console.warn(
      "[clearClientStorage] No se pudieron eliminar los cachés.",
      error,
    );
  }

  try {
    if ("serviceWorker" in navigator) {
      const registrations =
        await navigator.serviceWorker.getRegistrations();

      await Promise.allSettled(
        registrations.map((registration) =>
          registration.unregister(),
        ),
      );
    }
  } catch (error) {
    console.warn(
      "[clearClientStorage] No se pudo desregistrar el service worker.",
      error,
    );
  }
}

/**
 * Limpia completamente los metadatos locales de la aplicación.
 *
 * Se conserva como operación explícita de mantenimiento.
 */
export async function clearSiteMetadata(): Promise<void> {
  await limpiarAplicacionCompleta();
}

/**
 * Alias temporal para llamadas existentes con el nombre anterior.
 */
export const ClearSiteMetadata = clearSiteMetadata;

/**
 * Limpia la sesión y redirige al login.
 *
 * El mensaje se guarda después de limpiar la sesión para que la pantalla
 * de login pueda mostrarlo al cargar.
 */
export async function limpiarSesionYRedirigir(
  message?: string,
): Promise<void> {
  await limpiarSesionCliente();

  if (message) {
    try {
      sessionStorage.setItem(LOGOUT_MESSAGE_KEY, message);
    } catch (error) {
      console.warn(
        "[clearClientStorage] No se pudo conservar el mensaje de salida.",
        error,
      );
    }
  }

  window.location.replace(buildLoginUrl());
}

/**
 * Alias para no romper llamadas existentes.
 *
 * Este alias únicamente limpia la sesión; no redirige.
 */
export const limpiarAlmacenamientoCliente =
  limpiarSesionCliente;