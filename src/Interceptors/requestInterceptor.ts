import type { AxiosInstance } from "axios";
import { store } from "@/Context";

const COMPANY_HEADER_NAME = "X-Company-Id";

export function setupRequestInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const state = store.getState();

    // Si el usuario root selecciona empresa, se envie en el header, 
    // y se prioriza arriba de la empresa por defecto
    const activeCompanyId = state.company?.activeCompanyId;
    const isRoot = state.auth?.isRoot;

    if (isRoot && activeCompanyId && activeCompanyId > 0) {
      config.headers[COMPANY_HEADER_NAME] = String(activeCompanyId);
    } else {
      delete config.headers[COMPANY_HEADER_NAME];
    }

    return config;
  });
}