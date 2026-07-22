import { createAsyncThunk } from "@reduxjs/toolkit";

import type { AppDispatch, RootState } from "@/Context";

import { logout } from "@/Context/Slices/Auth/authSlice";
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice";

import { authService } from "@/Services/auth/AuthService";
import { stopHubConnection } from "@/Services/signalr";

import { limpiarSesionYRedirigir } from "@/Utils/clearClientStorage";

/**
 * Ejecuta el cierre normal de la sesión actual.
 *
 * Flujo:
 * 1. Notifica a la API.
 * 2. Detiene los hubs autenticados.
 * 3. Limpia Redux.
 * 4. Limpia la información privada del navegador.
 * 5. Redirige al login.
 */
export const logoutThunk = createAsyncThunk<
  void,
  void,
  {
    dispatch: AppDispatch;
    state: RootState;
    rejectValue: string;
  }
>(
  "auth/logoutThunk",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await authService.logoutAsync();
    } catch (error) {
      console.warn(
        "[logoutThunk] No se pudo cerrar la sesión en la API.",
        error,
      );
    }

    try {
      await stopHubConnection();
    } catch (error) {
      console.warn(
        "[logoutThunk] No se pudieron detener los hubs autenticados.",
        error,
      );
    }

    try {
      dispatch(logout());
      dispatch(clearCompanyState());

      await limpiarSesionYRedirigir(
        "Sesión cerrada correctamente.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo limpiar la sesión.";

      return rejectWithValue(message);
    }
  },
);