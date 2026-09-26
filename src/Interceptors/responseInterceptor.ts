import type { AxiosInstance } from "axios";
import { store } from "@/Context";
import { refreshTokenThunk } from "@/Context/Slices/Auth/authSlice";
import { expulsarSesionExpirada } from "@/Utils/expulsarSesion";

function esRutaAuthPublica(url?: string): boolean {
  if (!url) return false;

  return (
    url.includes("/Auth/login") ||
    url.includes("/Auth/refresh") ||
    url.includes("/Auth/me") ||
    url.includes("/Auth/logout")
  );
}

export function setupResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,

    async (error) => {
      const config = error?.config ?? {};
      const status = error?.response?.status ?? 0;
      const tokenExpired =
        error?.response?.headers?.["x-token-expired"] === "true";

      if (status === 401 && !esRutaAuthPublica(config?.url)) {
        if (tokenExpired && !config._retry) {
          config._retry = true;

          const result = await store.dispatch(refreshTokenThunk());

          if (refreshTokenThunk.fulfilled.match(result)) {
            return instance(config);
          }
        }

        void expulsarSesionExpirada(
          error?.response?.data?.message ||
            "Tu sesión expiró. Inicia sesión nuevamente.",
        );
      }

      return Promise.reject(error);
    }
  );
}
