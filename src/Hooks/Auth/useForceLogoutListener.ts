import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";

import type { AppDispatch } from "@/Context";
import type { ForceLogoutDto } from "@/Interfaces/Auth/AuthInterface";

import { logout } from "@/Context/Slices/Auth/authSlice";
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice";

import {
  offForceLogout,
  onForceLogout,
  stopHubConnection,
} from "@/Services/signalr";

import { limpiarSesionYRedirigir } from "@/Utils/clearClientStorage";

const FORCE_LOGOUT_STORAGE_KEY = "forceLogout";

const DEFAULT_FORCE_LOGOUT_MESSAGE =
  "Tu sesión fue cerrada desde otro dispositivo.";

type ForceLogoutStoragePayload = {
  message: string;
  revokedAt: string;
  nonce: string;
};

function createNonce(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Escucha el cierre forzado de la sesión actual.
 *
 * SignalR atiende la pestaña conectada y localStorage replica
 * el cierre hacia las demás pestañas abiertas en el mismo navegador.
 */
export function useForceLogoutListener(): void {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  useEffect(() => {
    let handlingLogout = false;
    let disposed = false;

    const executeForceLogout = async (
      message: string,
    ): Promise<void> => {
      if (handlingLogout || disposed) {
        return;
      }

      handlingLogout = true;

      /*
       * La API ya revocó la sesión anterior.
       * No se llama nuevamente a /Auth/logout para evitar
       * una petición redundante o un 401.
       */
      await stopHubConnection();

      if (disposed) {
        return;
      }

      dispatch(logout());
      dispatch(clearCompanyState());

      /*
       * Elimina todo el caché privado asociado con la sesión revocada.
       */
      queryClient.clear();

      await limpiarSesionYRedirigir(message);
    };

    const handleSignalRForceLogout = (
      payload: ForceLogoutDto,
    ): void => {
      const message =
        payload.message?.trim() ||
        DEFAULT_FORCE_LOGOUT_MESSAGE;

      /*
       * El evento storage no se dispara en la misma pestaña
       * que ejecuta setItem; por eso esta pestaña también
       * ejecuta el cierre directamente.
       */
      try {
        const storagePayload: ForceLogoutStoragePayload = {
          message,
          revokedAt:
            payload.revokedAt || new Date().toISOString(),
          nonce: createNonce(),
        };

        localStorage.setItem(
          FORCE_LOGOUT_STORAGE_KEY,
          JSON.stringify(storagePayload),
        );
      } catch {
        /*
         * El cierre local continúa aunque localStorage esté bloqueado.
         */
      }

      void executeForceLogout(message);
    };

    const handleStorageChange = (
      event: StorageEvent,
    ): void => {
      if (
        event.storageArea !== localStorage ||
        event.key !== FORCE_LOGOUT_STORAGE_KEY ||
        !event.newValue
      ) {
        return;
      }

      let message = DEFAULT_FORCE_LOGOUT_MESSAGE;

      try {
        const parsed = JSON.parse(
          event.newValue,
        ) as Partial<ForceLogoutStoragePayload>;

        if (
          typeof parsed.message === "string" &&
          parsed.message.trim()
        ) {
          message = parsed.message.trim();
        }
      } catch {
        /*
         * Si el valor no es JSON válido se utiliza el mensaje estándar.
         */
      }

      void executeForceLogout(message);
    };

    onForceLogout(handleSignalRForceLogout);

    window.addEventListener(
      "storage",
      handleStorageChange,
    );

    return () => {
      disposed = true;

      offForceLogout(handleSignalRForceLogout);

      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
    };
  }, [dispatch, queryClient]);
}