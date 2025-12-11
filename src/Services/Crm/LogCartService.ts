import api from "@/Utils/ApiConfig"
import type { ApiResponse } from "@/Interfaces/User/UserInterfaces"
import type { LogCartRequestDto, LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface"

class LogCartService {
  async getAllAsync(): Promise<LogCartResponseDto[]> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto[]>>("/LogCart")
    return data.data
  }

  async getByIdAsync(id: number): Promise<LogCartResponseDto> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto>>(`/LogCart/${id}`)
    return data.data
  }

  async GetByContactAndStatus(contactId: number): Promise<LogCartResponseDto> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto>>(`/LogCart/GetByContactAndStatus/${contactId}`)
    return data.data
  }

  async getByOrderIdAsync(id: number): Promise<LogCartResponseDto> {
    const { data } = await api.get<ApiResponse<LogCartResponseDto>>(`/LogCart/getByOrderId/${id}`)
    return data.data
  }

  async createAsync(payload: LogCartRequestDto): Promise<LogCartResponseDto> {
    const { data } = await api.post<ApiResponse<LogCartResponseDto>>("/LogCart", payload)
    return data.data
  }

  async updateAsync(id: number, payload: LogCartRequestDto): Promise<LogCartResponseDto> {
    const { data } = await api.put<ApiResponse<LogCartResponseDto>>(`/LogCart/${id}`, payload)
    return data.data
  }

  async toggleAsync(id: number): Promise<LogCartResponseDto> {
    const { data } = await api.patch<ApiResponse<LogCartResponseDto>>(`/LogCart/${id}`)
    return data.data
  }

   async UpdatedStatusAsync(id: number, statusId: number): Promise<LogCartResponseDto> {
    const { data } = await api.patch<ApiResponse<LogCartResponseDto>>(`/LogCart/UpdatedStatus/${id}/${statusId}`)
    return data.data
  }
}

export const logCartService = new LogCartService()

