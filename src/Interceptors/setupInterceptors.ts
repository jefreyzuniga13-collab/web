import type { AxiosInstance } from "axios"
import { toast } from "react-toastify"

export function setupNetworkInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (r) => r,
    (error) => {
      const code = error?.code ?? ""
      const hasResponse = !!error?.response
      const isTimeout = code === "ECONNABORTED"
      const isNetwork = !hasResponse && !isTimeout

      if (isTimeout) toast.error("La operación tardó demasiado. Intenta de nuevo.")
      else if (isNetwork) toast.error("No se pudo conectar al servidor. Verifica tu conexión.")

      return Promise.reject(error)
    }
  )
}