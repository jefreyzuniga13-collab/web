import api from "@/Utils/ApiConfig";
import { store } from "@/Context/index";
import { refreshTokenThunk } from "@/Context/Slices/Auth/authSlice";
import { openReLoginModal } from "@/Context/Slices/Chat/uiSlice";

export function setupResponseInterceptor() {
  api.interceptors.response.use(
    response => response,
    async error => {
      const config = error?.config ?? {};
      const resp = error?.response;
      const status = resp?.status ?? 0;

      if (status === 401 && !config._retry) {
        config._retry = true;
        const result = await store.dispatch(refreshTokenThunk());
        if (refreshTokenThunk.fulfilled.match(result)) {
          const token = result.payload.accessToken;
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
          config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
          return api(config);
        }
        store.dispatch(openReLoginModal());
        return Promise.reject(error);
      }

      // if (status === 429) {
      //   return Promise.reject(error);
      // }

      // if (status === 400 || status === 403) {
      //   store.dispatch(logout());
      // }

      return Promise.reject(error);
    }
  );
}