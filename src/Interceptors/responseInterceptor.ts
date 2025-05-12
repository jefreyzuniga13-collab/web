import api from "@/Utils/ApiConfig";
import { store } from "@/Context/index";
import { refreshTokenThunk, logout } from "@/Context/Slices/authSlice";
import { openReLoginModal } from "@/Context/Slices/uiSlice";
import { toast } from "react-toastify";
import { t } from "i18next";

export function setupResponseInterceptor() {
  api.interceptors.response.use(
    response => response,
    async error => {
      const { config, response } = error;
      // const url = config.url as string;
      const status = response?.status;

      // // 1) NO disparar ningún toast para la verificación de email:
      // if (url.endsWith("/Auth/verify-email")) {
      //   return Promise.reject(error);
      // }

      // if (url.endsWith("/Auth/reset-password")) {
      //   return Promise.reject(error);
      // }

      // 401 → refresh / re-login
      if (status === 401 && !config._retry) {
        config._retry = true;
        const result = await store.dispatch(refreshTokenThunk());
        if (refreshTokenThunk.fulfilled.match(result)) {
          const token = result.payload.accessToken;
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        }
        store.dispatch(openReLoginModal());
        return Promise.reject(error);
      }

      // 429 → too many requests
      if (status === 429) {
        toast.error(t("errors.tooManyRequests"));
        return Promise.reject(error);
      }

      // 500+
      if (status && status >= 500) {
        toast.error(t("errors.serverError"));
        return Promise.reject(error);
      }

      // mensaje genérico o de la API
      // toast.error(response?.data?.message || t("errors.generic"));

      // 400/403 en protegidos → logout
      if (status === 400 || status === 403) {
        store.dispatch(logout());
      }

      return Promise.reject(error);
    }
  );
}