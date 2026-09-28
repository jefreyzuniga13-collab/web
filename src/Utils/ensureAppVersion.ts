const VERSION_STORAGE_KEY = "orbitra.app.buildId";

type AppVersionPayload = {
  buildId: string;
};

function versionUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}version.json?t=${Date.now()}`;
}

export async function purgeServiceWorkerCaches(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }

  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
}

/**
 * Compara version.json del servidor (sin caché) con la guardada localmente.
 * Si el deploy cambió — o hay un SW viejo sin versión — limpia y recarga.
 * No borra la sesión (login).
 */
export async function ensureLatestAppVersion(): Promise<boolean> {
  if (import.meta.env.DEV) {
    return false;
  }

  try {
    const response = await fetch(versionUrl(), {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as AppVersionPayload;
    const buildId = String(payload?.buildId ?? "").trim();

    if (!buildId) {
      return false;
    }

    const previous = window.localStorage.getItem(VERSION_STORAGE_KEY);
    const hasController = Boolean(navigator.serviceWorker?.controller);

    if (previous === buildId) {
      return false;
    }

    window.localStorage.setItem(VERSION_STORAGE_KEY, buildId);

    // Primera visita limpia (sin SW): solo registra versión.
    if (!previous && !hasController) {
      return false;
    }

    await purgeServiceWorkerCaches();
    window.location.reload();
    return true;
  } catch (error) {
    console.warn("[AppVersion] No se pudo verificar la versión:", error);
    return false;
  }
}
