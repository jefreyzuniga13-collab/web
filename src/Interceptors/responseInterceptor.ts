import type { AxiosInstance } from "axios"
import { store } from "@/Context"
import { refreshTokenThunk } from "@/Context/Slices/Auth/authSlice"
import { openReLoginModal } from "@/Context/Slices/Chat/uiSlice"

export function setupResponseInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config ?? {}
      const status = error?.response?.status ?? 0

      if (status === 401 && !config._retry) {
        config._retry = true

        const result = await store.dispatch(refreshTokenThunk())
        if (refreshTokenThunk.fulfilled.match(result)) {
          const token = result.payload.accessToken
          instance.defaults.headers.common.Authorization = `Bearer ${token}`
          config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
          return instance(config)
        }

        store.dispatch(openReLoginModal())
      }

      return Promise.reject(error)
    }
  )
}
