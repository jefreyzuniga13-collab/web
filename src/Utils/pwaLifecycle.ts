import { registerSW } from "virtual:pwa-register";

const SILENCE_RELOAD_KEY = "orbitra.pwa.silence-login";
const UPDATE_CHECK_MS = 60 * 1000;

let registered = false;
let updatingServiceWorker = false;
let controllerChanged = false;

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isPwaSilentPath(pathname = window.location.pathname): boolean {
  const path = normalizePath(pathname);

  return (
    path.endsWith("/login") ||
    path.endsWith("/signup") ||
    path.endsWith("/forgot-password") ||
    path.endsWith("/reset-password") ||
    path.endsWith("/check-email") ||
    path.endsWith("/verify-account") ||
    path.endsWith("/payment-hosted") ||
    path.endsWith("/payment-result")
  );
}

export function removeManifestLinks(): void {
  document
    .querySelectorAll('link[rel="manifest"]')
    .forEach((node) => node.remove());
}

function injectManifestLink(): void {
  if (document.querySelector('link[rel="manifest"]')) {
    return;
  }

  const link = document.createElement("link");
  link.rel = "manifest";
  link.href = `${import.meta.env.BASE_URL}manifest.json`;
  document.head.appendChild(link);
}

export async function silencePwaOnPublicRoute(): Promise<boolean> {
  removeManifestLinks();

  if (!isPwaSilentPath() || !("serviceWorker" in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const hadController = Boolean(navigator.serviceWorker.controller);

  await Promise.all(
    registrations.map((registration) => registration.unregister())
  );

  if (!hadController || sessionStorage.getItem(SILENCE_RELOAD_KEY) === "1") {
    return false;
  }

  sessionStorage.setItem(SILENCE_RELOAD_KEY, "1");
  window.location.reload();
  return true;
}

function requestServiceWorkerUpdate(
  registration: ServiceWorkerRegistration | undefined
): void {
  if (!registration) {
    return;
  }

  void registration.update().catch((error: unknown) => {
    console.warn("[PWA] No se pudo comprobar una actualización:", error);
  });
}

export function enablePwa(): void {
  if (registered || isPwaSilentPath()) {
    return;
  }

  registered = true;
  sessionStorage.removeItem(SILENCE_RELOAD_KEY);
  injectManifestLink();

  const updateSW = registerSW({
    immediate: true,

    onNeedRefresh(): void {
      if (updatingServiceWorker) {
        return;
      }

      updatingServiceWorker = true;

      void updateSW(true).catch((error: unknown) => {
        updatingServiceWorker = false;
        console.error("[PWA] No se pudo activar la nueva versión:", error);
      });
    },

    onRegisteredSW(
      _swUrl: string,
      registration: ServiceWorkerRegistration | undefined
    ): void {
      if (!registration) {
        return;
      }

      requestServiceWorkerUpdate(registration);

      window.setInterval(() => {
        requestServiceWorkerUpdate(registration);
      }, UPDATE_CHECK_MS);

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          requestServiceWorkerUpdate(registration);
        }
      });

      window.addEventListener("focus", () => {
        requestServiceWorkerUpdate(registration);
      });
    },

    onRegisterError(error: unknown): void {
      console.error("[PWA] No se pudo registrar el Service Worker:", error);
    },
  });

  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", (): void => {
    if (controllerChanged || isPwaSilentPath()) {
      return;
    }

    controllerChanged = true;
    window.location.reload();
  });
}
