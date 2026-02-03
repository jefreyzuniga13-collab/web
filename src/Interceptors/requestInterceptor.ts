import type { AxiosInstance } from "axios"

export function setupRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    try {
      const authRaw = localStorage.getItem("auth")
      if (authRaw && config.headers) {
        const { accessToken } = JSON.parse(authRaw)
        if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
      }
    } catch {
      // continuar sin header
    }
    return config
  })
}