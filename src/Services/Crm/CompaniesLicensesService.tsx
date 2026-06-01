import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { CompaniesLicenseProj, CompaniesLicenseRequest } from '@/Interfaces/Crm/LicenseInterfaz'
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface'

class CompaniesLicensesServ {
  async getAllAsync(
    globalFilter: string ="",
    page: number,
    pageSize: number,
    companyId?: number | null,
    licenseId?: number | null
  ): Promise<PagedResponse<CompaniesLicenseProj>> {
    const { data } = await api.get<ApiResponse<PagedResponse<CompaniesLicenseProj>>>(
      '/CompaniesLicense',
      {
        params: {
          globalFilter:globalFilter,
          PageNumber: page,
          PageSize: pageSize,
          companyId: companyId,
          licenseId: licenseId,
        },
      }
    )

    return data.data;
  }

  async getByIdAsync(id: number): Promise<CompaniesLicenseProj> {
    const { data } = await api.get<ApiResponse<CompaniesLicenseProj>>(`/CompaniesLicense/${id}`);
    return data.data;
  }

  async createAsync(req: CompaniesLicenseRequest): Promise<ApiResponse<CompaniesLicenseProj>> {
    const { data } = await api.post<ApiResponse<CompaniesLicenseProj>>(
      '/CompaniesLicense',
      req
    )

    return data
  }

  async updateAsync(id: number, req: CompaniesLicenseRequest): Promise<ApiResponse<CompaniesLicenseProj>> {
    const { data } = await api.put<ApiResponse<CompaniesLicenseProj>>(
      `/CompaniesLicense/${id}`,
      req
    )

    return data
  }

  async toggleAsync(
    id: number
  ): Promise<ApiResponse<CompaniesLicenseProj>> {
    const { data } = await api.patch<ApiResponse<CompaniesLicenseProj>>(
      `/CompaniesLicense/toogle/${id}`
    )

    return data
  }

  async toogleLockedAsync(
    id: number
  ): Promise<ApiResponse<CompaniesLicenseProj>> {
    const { data } = await api.patch<ApiResponse<CompaniesLicenseProj>>(
      `/CompaniesLicense/locked/${id}`
    )

    return data
  }

  async toogleSuspendAsync(
    id: number
  ): Promise<ApiResponse<CompaniesLicenseProj>> {
    const { data } = await api.patch<ApiResponse<CompaniesLicenseProj>>(
      `/CompaniesLicense/toogle-suspend/${id}`
    )

    return data
  }
}

export const CompaniesLicensesService = new CompaniesLicensesServ()