import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type {
  LicensePeriodProj,
    LicenseProj,
    LicenseRequest
} from '@/Interfaces/Crm/LicenseInterfaz'
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface'

class LicensesServ {
  async getAllAsync(
    globalFilter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<LicenseProj>> {
      const { data } = await api.get<ApiResponse<PagedResponse<LicenseProj>>>(
        '/License',
        {
          params: {
            globalFilter,
            PageNumber: page,
            PageSize: pageSize
          },
        }
      )
      return data.data;
  }

  async getByIdAsync(id: number): Promise<ApiResponse<LicenseProj>> {
      const { data } = await api.get<ApiResponse<LicenseProj>>(`/License/${id}`);
      return data;
  }

  async createAsync(req: LicenseRequest): Promise<ApiResponse<LicenseProj>> {
      const { data } = await api.post<ApiResponse<LicenseProj>>(
        '/License',
        req
      )

      return data
  }

  async updateAsync(id: number, req: LicenseRequest): Promise<ApiResponse<LicenseProj>> {
      const { data } = await api.put<ApiResponse<LicenseProj>>(
        `/License/${id}`,
        req
      )

      return data
  }

  async toggleAsync(
    id: number
  ): Promise<ApiResponse<LicenseProj>> {
      const { data } = await api.patch<ApiResponse<LicenseProj>>(
        `/License/toogle/${id}`
      )

      return data
  }

   async getAllLicensePeriodsAsync(): Promise<LicensePeriodProj[]> {
    const { data } = await api.get<ApiResponse<LicensePeriodProj[]>>(
      '/License/periods'
    )

    return data.data ?? []
  }
}

export const LicensesService = new LicensesServ()