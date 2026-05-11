import api from "@/Utils/ApiConfig"
import type { ApiResponse } from "@/Interfaces/Auth/UserInterfaces"
import type {
  LogCartDetailRequestDto,
  LogCartDetailResponseDto,
} from "@/Interfaces/Crm/LogCartDetailInterface"

class LogCartDetailService {
  async getAllAsync(): Promise<ApiResponse<LogCartDetailResponseDto[]>> {
    const { data } = await api.get<ApiResponse<LogCartDetailResponseDto[]>>(
      "/LogCartDetail"
    )

    return data
  }

  async getByIdAsync(
    id: number
  ): Promise<ApiResponse<LogCartDetailResponseDto | null>> {
    const { data } = await api.get<ApiResponse<LogCartDetailResponseDto | null>>(
      `/LogCartDetail/${id}`
    )

    return data
  }

  async getByUnicoAsync(
    unico: string
  ): Promise<ApiResponse<LogCartDetailResponseDto | null>> {
    const { data } = await api.get<ApiResponse<LogCartDetailResponseDto | null>>(
      `/LogCartDetail/${unico}`
    )

    return data
  }

  async getByCodProductoAsync(
    codProducto: string
  ): Promise<ApiResponse<LogCartDetailResponseDto | null>> {
    const { data } = await api.get<ApiResponse<LogCartDetailResponseDto | null>>(
      `/LogCartDetail/${codProducto}/codProducto`
    )

    return data
  }

  async createAsync(
    payload: LogCartDetailRequestDto
  ): Promise<ApiResponse<LogCartDetailResponseDto>> {
    const { data } = await api.post<ApiResponse<LogCartDetailResponseDto>>(
      "/LogCartDetail",
      payload
    )

    return data
  }

  async updateAsync(
    id: number,
    payload: LogCartDetailRequestDto
  ): Promise<ApiResponse<LogCartDetailResponseDto>> {
    const { data } = await api.put<ApiResponse<LogCartDetailResponseDto>>(
      `/LogCartDetail/${id}`,
      payload
    )

    return data
  }

  async toggleAsync(
    id: number
  ): Promise<ApiResponse<LogCartDetailResponseDto>> {
    const { data } = await api.put<ApiResponse<LogCartDetailResponseDto>>(
      `/LogCartDetail/${id}`
    )

    return data
  }
}

export const logCartDetailService = new LogCartDetailService()