import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type {
  CompanySystemParamProj,
  CompanySystemParamRequest,
  CompanySystemParamsInterface,
} from '@/Interfaces/Crm/CompanySystemParams'
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface'

class CompanySystemParamsServ {
  async getAllAsync(
    globalFilter: string,
    page: number,
    pageSize: number,
    companyId?: number | null,
    systemParamId?: number | null,
    metaChannelId?: number | null
  ): Promise<PagedResponse<CompanySystemParamProj>> {
      const { data } = await api.get<ApiResponse<PagedResponse<CompanySystemParamProj>>>(
        '/CompanySystemParam/GetAll',
        {
          params: {
            globalFilter,
            PageNumber: page,
            PageSize: pageSize,
            companyId: companyId,
            systemParamId: systemParamId,
            metaChannelId: metaChannelId,
          },
        }
      )

      return data.data;
  }

  async getByIdAsync(id: number): Promise<CompanySystemParamsInterface> {
      const { data } = await api.get<ApiResponse<CompanySystemParamsInterface>>(`/CompanySystemParam/${id}`);
      return data.data;
  }
  
  async getByCompanyId(companyId: number): Promise<PagedResponse<CompanySystemParamProj[]>> {
      const { data } = await api.get<PagedResponse<CompanySystemParamProj[]>>(
        `/CompanySystemParam/GetByCompanyId/${companyId}`
      )

      return data
  }

  async getByCompanySystemParamMetaChannelAsync(
    companyId: number,
    systemParamId: number,
    metaChannelId: number,
    globalFilter: string,
    page: number,
    pageSize: number
  ): Promise<ApiResponse<CompanySystemParamProj>> {

      const { data } = await api.get<ApiResponse<CompanySystemParamProj>>(
        `/CompanySystemParam/getByCompanySystemParamMetaChannel/${companyId}/${systemParamId}/${metaChannelId}`,
        {
          params: {
            globalFilter,
            PageNumber: page,
            PageSize: pageSize,
          },
        }
      )

      return data
  }

  async createAsync(req: CompanySystemParamRequest): Promise<ApiResponse<CompanySystemParamProj>> {
      const { data } = await api.post<ApiResponse<CompanySystemParamProj>>(
        '/CompanySystemParam',
        req
      )

      return data
  }

  async updateAsync(req: CompanySystemParamRequest): Promise<ApiResponse<CompanySystemParamProj>> {
      const { data } = await api.put<ApiResponse<CompanySystemParamProj>>(
        '/CompanySystemParam',
        req
      )

      return data
  }

  async toggleAsync(
    companyId: number,
    systemParamId: number,
    metaChannelId: number
  ): Promise<ApiResponse<CompanySystemParamProj>> {
      const { data } = await api.patch<ApiResponse<CompanySystemParamProj>>(
        `/CompanySystemParam/Toggle/${companyId}/${systemParamId}/${metaChannelId}`
      )

      return data
  }
  async getBySystemParamAsync(systemParamId: number): Promise<CompanySystemParamProj | null> {
  const { data } = await api.get<ApiResponse<CompanySystemParamProj>>(
    `/CompanySystemParam/${systemParamId}`
  )

  return data.data ?? null
}
}

export const CompanySystemParamsService = new CompanySystemParamsServ()