import type { AxiosInstance } from "axios"
import { toast } from "react-toastify"
import { store } from "@/Context";
import { AxiosHeaders } from "axios"

// export function setupEmpresaInterceptor(instance: AxiosInstance) {
//   instance.interceptors.request.use((config) => {
//     const state = store.getState();
//     //recuperar el desde el contexto de sesión global del usuario. Recuperado en el endpoint /me
//     const empresaId = state.auth.empresaId;

//     if (!config.headers) {
//       config.headers = new AxiosHeaders();
//     }

//     //agregar encabezado
//     if (empresaId) {
//       config.headers.set("empresa", empresaId);
//     }

//     return config;
//   });
// }

export function setupEmpresaInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const state = store.getState();

    const EmpresaId =
      state.auth.empresaId ||
      sessionStorage.getItem("EmpresaId") ||
      "";

      console.log("EmpresaId en el interceptor es", EmpresaId)
      
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