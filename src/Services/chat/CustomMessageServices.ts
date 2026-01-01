/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { CustomMessageRequestDto, CustomMessageResponseDto } from "@/Interfaces/Crm/CustomMessageInterface";
import api from '@/Utils/ApiConfig';
import type { AxiosError } from "axios";

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

function cleanPayload<T extends Record<string, any>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([, value]) => value !== null && value !== undefined && value !== ''
    )
  ) as T
}

function transformPayload(input: CustomMessageRequestDto): CustomMessageRequestDto {
  return cleanPayload(input)
}

class CustomMessageServ {
    async getAllAsync(
    ): Promise<CustomMessageResponseDto[]> {
      try {
        const { data } = await api.get<ApiResponse<CustomMessageResponseDto[]>>(
          '/CustomMessage',
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }


  async getByIdAsync(id: number): Promise<CustomMessageResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<CustomMessageResponseDto>>(
        `/CustomMessage/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }
  async createAsync(values: CustomMessageRequestDto): Promise<CustomMessageResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.post<ApiResponse<CustomMessageResponseDto>>(
        '/CustomMessage',
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateAsync(id: number, values: CustomMessageRequestDto): Promise<CustomMessageResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.put<ApiResponse<CustomMessageResponseDto>>(
        `/CustomMessage/${id}`,
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleStatusAsync(
      id: number
    ): Promise<CustomMessageResponseDto> {
      try {
        const { data } = await api.patch<ApiResponse<CustomMessageResponseDto>>(
          `/CustomMessage/${id}`
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }
}

export const CustomMessageServices = new CustomMessageServ();