import type { AxiosInstance } from "axios";
import { AxiosHeaders } from "axios";
import { store } from "@/Context";
import { isPaynowPublicContext } from "@/Utils/ECommerce/publicEmpresa";

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

    /**
     * En paynow prioriza sessionStorage (empresa del link).
     * Evita que un login CRM viejo en el iPhone mande otra empresa
     * y el carrito salga vacío.
     */
    const paynowPublic = isPaynowPublicContext();

    const empresaIdFromStorage = paynowPublic
      ? (
          sessionStorage.getItem("EmpresaId") ||
          localStorage.getItem("EmpresaId") ||
          getStorageValue("empresaId") ||
          ""
        )
      : (
          getStorageValue("EmpresaId") ||
          getStorageValue("empresaId")
        );

    const empresaId = paynowPublic
      ? empresaIdFromStorage || empresaIdAuth
      : isRoot
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
