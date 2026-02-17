/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/Utils/ApiConfig';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';
import type { AxiosError } from 'axios';
import type { CompanySystemParamsInterface } from '@/Interfaces/Crm/CompanySystemParams';

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>;
  const message = axiosError.response?.data?.message ?? axiosError.message;
  return new Error(message);
}

class CompanySystemParamsServ {

  async getByIdAsync(id: number): Promise<CompanySystemParamsInterface> {
    try {
      const { data } = await api.get<ApiResponse<CompanySystemParamsInterface>>(`/CompanySystemParam/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }
}

export const CompanySystemParamsService = new CompanySystemParamsServ();