/* eslint-disable no-empty */
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/Context";
import { logout } from "@/Context/Slices/Auth/authSlice";
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice";
import { clearLoginAccessState } from "@/Context/Slices/Auth/loginAccessSlice";
import {onForceLogout,offForceLogout,stopHubConnection,} from "@/Services/signalr";
import type { ForceLogoutDto } from "@/Interfaces/Auth/AuthInterface";
import { limpiarSesionYRedirigir } from "@/Utils/clearClientStorage";

const FORCE_LOGOUT_STORAGE_KEY = "forceLogout";

/**
 * Escucha el cierre forzado de la sesión actual.
 *
 * SignalR atiende la pestaña conectada y localStorage
 * replica el cierre hacia las demás pestañas.
 */
export function useForceLogoutListener() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    let handlingLogout = false;

    const executeForceLogout = async (message: string) => {
      if (handlingLogout) {
        return;
      }

      handlingLogout = true;

      /*
       * La API ya revocó la sesión.
       * No se llama nuevamente al endpoint /logout.
       */
      try {
        await stopHubConnection();
      } catch {}

      dispatch(logout());
      dispatch(clearCompanyState());
      dispatch(clearLoginAccessState());

      await limpiarSesionYRedirigir(message);
    };

    const handleSignalRForceLogout = (payload: ForceLogoutDto) => {
      const message =
        payload.message || "Tu sesión fue cerrada desde otro dispositivo.";

      /*
       * Notifica a las demás pestañas del mismo navegador.
       */
      try {
        localStorage.setItem(
          FORCE_LOGOUT_STORAGE_KEY,
          JSON.stringify({
            message,
            revokedAt: payload.revokedAt || new Date().toISOString(),
            nonce: crypto.randomUUID(),
          }),
        );
      } catch {}

      void executeForceLogout(message);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== FORCE_LOGOUT_STORAGE_KEY || !event.newValue) {
        return;
      }

      let message = "Tu sesión fue cerrada desde otro dispositivo.";

      try {
        const parsed = JSON.parse(event.newValue) as {
          message?: string;
        };

        if (parsed.message) {
          message = parsed.message;
        }
      } catch {}

      void executeForceLogout(message);
    };

    onForceLogout(handleSignalRForceLogout);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      offForceLogout(handleSignalRForceLogout);

      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);
}
