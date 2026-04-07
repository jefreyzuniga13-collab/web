import type { AxiosInstance } from "axios";
import { store } from "@/Context";
import { refreshTokenThunk, logout } from "@/Context/Slices/Auth/authSlice";
import { openReLoginModal } from "@/Context/Slices/Chat/uiSlice";

export function setupResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config ?? {};
      const status = error?.response?.status ?? 0;
      const tokenExpired = error?.response?.headers?.["x-token-expired"] === "true";

      const isRefreshRequest =
        typeof config?.url === "string" &&
          config.url.includes("/Auth/refresh");

      if (status === 401 && tokenExpired && !config._retry && !isRefreshRequest) {
        config._retry = true;

        const result = await store.dispatch(refreshTokenThunk());

        if (refreshTokenThunk.fulfilled.match(result)) {
          return instance(config);
        }

        store.dispatch(logout());
        store.dispatch(openReLoginModal());
      }

      return Promise.reject(error);
    }
  );
}