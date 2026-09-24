const RESET_KEY = "orbitra.pwa.clean.v4";

function isPaymentPath(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "");
  return path.endsWith("/payment-hosted") || path.endsWith("/payment-result");
}

/**
 * Una sola vez por cliente: quita un Service Worker de la raíz
 * (si quedó de un deploy anterior) y registra el de /crm/.
 */
export async function cleanStalePwa(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  if (isPaymentPath()) {
    return false;
  }

  if (window.localStorage.getItem(RESET_KEY) === "done") {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const cacheKeys = await caches.keys();

  await Promise.all(
    registrations.map((registration) => registration.unregister())
  );

  await Promise.all(cacheKeys.map((key) => caches.delete(key)));

  window.localStorage.setItem(RESET_KEY, "done");
  window.location.reload();
  return true;
}
