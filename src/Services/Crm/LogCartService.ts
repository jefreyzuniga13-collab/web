import api from "@/Utils/ApiConfig"
import type { ApiResponse } from "@/Interfaces/Auth/UserInterfaces"
import type {
  LogCartRequestDto,
  LogCartResponseDto,
} from "@/Interfaces/Crm/LogCartInterface"

class LogCartService {
  async getAllAsync(): Promise<ApiResponse<LogCartResponseDto[]>> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto[]>>(
      "/LogCart"
    )

    return data
  }

  async getByIdAsync(
    id: number
  ): Promise<ApiResponse<LogCartResponseDto | null>> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto | null>>(
      `/LogCart/${id}`
    )

    return data
  }

  async GetByContactAndStatus(
    contactId: number
  ): Promise<ApiResponse<LogCartResponseDto | null>> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto | null>>(
      `/LogCart/GetByContactAndStatus/${contactId}`
    )

    return data
  }

  async getByOrderIdAsync(
    id: number
  ): Promise<ApiResponse<LogCartResponseDto | null>> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto | null>>(
      `/LogCart/getByOrderId/${id}`
    )

    return data
  }

  async createAsync(
    payload: LogCartRequestDto
  ): Promise<ApiResponse<LogCartResponseDto>> {
    const { data } = await api.post<ApiResponse<LogCartResponseDto>>(
      "/LogCart",
      payload
    )

    return data
  }

  async updateAsync(
    id: number,
    payload: LogCartRequestDto
  ): Promise<ApiResponse<LogCartResponseDto>> {
    const { data } = await api.put<ApiResponse<LogCartResponseDto>>(
      `/LogCart/${id}`,
      payload
    )

    return data
  }

  async toggleAsync(id: number): Promise<ApiResponse<LogCartResponseDto>> {
    const { data } = await api.patch<ApiResponse<LogCartResponseDto>>(
      `/LogCart/${id}`
    )

    return data
  }

  async UpdatedStatusAsync(
    id: number,
    statusId: number
  ): Promise<ApiResponse<LogCartResponseDto>> {
    const { data } = await api.patch<ApiResponse<LogCartResponseDto>>(
      `/LogCart/UpdatedStatus/${id}/${statusId}`
    )

    return data
  }
}

export const logCartService = new LogCartService()