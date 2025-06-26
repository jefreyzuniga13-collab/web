import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';
import type { CompanyInterface } from '@/Interfaces/Company/CompanyInterface';
import api from '@/Utils/ApiConfig'

class Company{
  async getAllAsync(): Promise<CompanyInterface[]> {
    const {data} = await api.get<ApiResponse<CompanyInterface[]>>('/Companies');
    console.log("Data from server: ", JSON.stringify(data))
    return data.data;
  }
}

export const CompanyService = new Company();