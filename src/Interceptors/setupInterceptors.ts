import type { AxiosInstance } from "axios";
import { AxiosHeaders } from "axios";
import { toast } from "react-toastify";
import { store } from "@/Context";

const getStorageValue = (key: string): string => {
  return (
    localStorage.getItem(key) ||
    sessionStorage.getItem(key) ||
    ""
  );
};

const getAuthFromStorage = () => {
  try {
    const rawAuth = localStorage.getItem("auth");

    if (!rawAuth) {
      return null;
    }

    return JSON.parse(rawAuth);
  } catch {
    return null;
  }
};

const getActiveCompanyIdFromStorage = (): string => {
  return (
    localStorage.getItem("activeCompanyId") ||
    sessionStorage.getItem("activeCompanyId") ||
    ""
  );
};

export function setupEmpresaInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const state = store.getState();

    const authStorage = getAuthFromStorage();

    const isRoot =
      state.auth.isRoot ??
      authStorage?.user?.isRoot ??
      authStorage?.isRoot ??
      false;

    const empresaIdAuth =
      state.auth.empresaId ||
      authStorage?.user?.empresaId ||
      authStorage?.empresaId ||
      "";

    const activeCompanyId =
      state.company.activeCompanyId ||
      getActiveCompanyIdFromStorage();

    const selectedCompany = state.company.companies.find(
      (company) =>
        Number(company.companyId) === Number(activeCompanyId)
    );

    const empresaIdFromSelectedCompany =
      selectedCompany?.empresaId
        ? String(selectedCompany.empresaId)
        : "";

    const empresaIdFromStorage =
      getStorageValue("EmpresaId") ||
      getStorageValue("empresaId");

    const empresaId = isRoot
      ? empresaIdFromSelectedCompany ||
        empresaIdFromStorage ||
        empresaIdAuth
      : empresaIdAuth ||
        empresaIdFromStorage;

    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    if (String(empresaId ?? "").trim()) {
      config.headers.set("empresa", String(empresaId));
    }

    return config;
  });
}

export function setupNetworkInterceptor(instance: AxiosInstance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const code = error?.code ?? "";
      const hasResponse = !!error?.response;
      const isTimeout = code === "ECONNABORTED";
      const isNetwork = !hasResponse && !isTimeout;

      if (isTimeout) {
        toast.error("La operación tardó demasiado. Intenta de nuevo.");
      } else if (isNetwork) {
        toast.error("No se pudo conectar al servidor. Verifica tu conexión.");
      }

      return Promise.reject(error);
    }
  );
}