import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';
import type { CompanyInterface } from '@/Interfaces/Company/CompanyInterface';
import api from '@/Utils/ApiConfig'

class Company{
  async getAllAsync(): Promise<CompanyInterface[]> {
    const {data} = await api.get<ApiResponse<CompanyInterface[]>>('/Companies');
    return data.data;
  }
}

export const CompanyService = new Company();