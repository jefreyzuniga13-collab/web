import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { StatusResponseDto } from '@/Interfaces/Crm/StatusInterface'

class StatusServ {
  async getCompanyLicenseStatusesAsync(): Promise<StatusResponseDto[]> {
    const { data } = await api.get<ApiResponse<StatusResponseDto[]>>(
      '/Status/company-license'
    )

    return data.data ?? []
  }
}

export const StatusService = new StatusServ()