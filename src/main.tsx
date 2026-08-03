import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistGate } from "redux-persist/integration/react";
import { registerSW } from "virtual:pwa-register";

import App from "@/App";
import { persistor, store } from "@/Context";
import { queryClient } from "@/Utils/Https/reactQuery";
import api, { apiPCG } from "@/Utils/ApiConfig";
import { setupRequestInterceptor } from "@/Interceptors/requestInterceptor";
import { setupResponseInterceptor } from "@/Interceptors/responseInterceptor";
import { setupEmpresaInterceptor } from "@/Interceptors/setupInterceptors";

import "@/index.css";

setupRequestInterceptor(api);
setupResponseInterceptor(api);
setupEmpresaInterceptor(apiPCG);

/**
 * Evita ejecutar dos actualizaciones
 * del Service Worker al mismo tiempo.
 */
let updatingServiceWorker = false;

/**
 * Evita recargar la aplicación más de una vez
 * cuando el nuevo Service Worker toma el control.
 */
let controllerChanged = false;

/**
 * Registra manualmente el Service Worker.
 */
const updateSW = registerSW({
  immediate: true,

  /**
   * Se ejecuta cuando existe una nueva versión
   * del frontend disponible.
   */
  onNeedRefresh(): void {
    if (updatingServiceWorker) {
      return;
    }

    updatingServiceWorker = true;

    void updateSW(true).catch((error: unknown) => {
      updatingServiceWorker = false;

      console.error(
        "[PWA] No se pudo activar la nueva versión:",
        error
      );
    });
  },

  /**
   * Se ejecuta cuando el Service Worker
   * fue registrado correctamente.
   */
  onRegisteredSW(
    _swUrl: string,
    registration: ServiceWorkerRegistration | undefined
  ): void {
    if (!registration) {
      return;
    }

    /**
     * Revisa cada cinco minutos si existe
     * una nueva versión desplegada.
     */
    window.setInterval(() => {
      void registration
        .update()
        .catch((error: unknown) => {
          console.warn(
            "[PWA] No se pudo comprobar una actualización:",
            error
          );
        });
    }, 10_000);
  },

  /**
   * Se ejecuta si falla el registro
   * inicial del Service Worker.
   */
  onRegisterError(error: unknown): void {
    console.error(
      "[PWA] No se pudo registrar el Service Worker:",
      error
    );
  },
});

/**
 * Cuando el Service Worker nuevo toma el control,
 * recarga la página para usar el build actualizado.
 */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener(
    "controllerchange",
    (): void => {
      if (controllerChanged) {
        return;
      }

      controllerChanged = true;
      window.location.reload();
    }
  );
}

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename="/crm">
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);