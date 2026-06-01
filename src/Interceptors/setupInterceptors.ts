import type { AxiosInstance } from "axios"
import { toast } from "react-toastify"
import { store } from "@/Context";
import { AxiosHeaders } from "axios"


export function setupEmpresaInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const state = store.getState();

    //Si es usuario la empresa se recupera de la sesión del contexto
    //caso contrario cuando el contacto accede al link del carrito, se resuelve y recupera el empresaId persistiendolo en sessionStorage
    const EmpresaId =
      state.auth.empresaId ||
      sessionStorage.getItem("EmpresaId") ||
      "";
      
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (EmpresaId.length > 1) {
      config.headers.set("empresa", EmpresaId);
    }

    return config;
  });
}

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