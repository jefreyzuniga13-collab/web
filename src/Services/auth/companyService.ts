import api from "@/Utils/ApiConfig";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { CompanySelectorItem } from "@/Interfaces/Auth/CompanyInterface";

const COMPANY_ENDPOINTS = {
  selector: "/Companies",
};

export const companyService = {
  async getSelectorAsync(): Promise<ApiResponse<CompanySelectorItem[]>> {
    const { data } = await api.get<ApiResponse<CompanySelectorItem[]>>(
      COMPANY_ENDPOINTS.selector
    );

    return data;
  },
};