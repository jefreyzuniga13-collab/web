/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse, SystemParamRequestDto, SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import api from '@/Utils/ApiConfig'
import type { AxiosError } from 'axios'

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

function transformPayload(input: SystemParamRequestDto): SystemParamRequestDto {
  return cleanPayload(input)
}

class SystemParam{
  async getAllAsync(
      page: number,
      pageSize: number
    ): Promise<PagedResponse<SystemParamResponseDto>> {
      try {
        const { data } = await api.get<ApiResponse<PagedResponse<SystemParamResponseDto>>>(
          '/SystemParam',
          { params: { PageNumber: page, PageSize: pageSize } }
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }


  async getByIdAsync(id: number): Promise<SystemParamResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<SystemParamResponseDto>>(
        `/SystemParam/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByNameAsync(name: string): Promise<SystemParamResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<SystemParamResponseDto>>(
        `/SystemParam/name/${name}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async createAsync(values: SystemParamRequestDto): Promise<SystemParamResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.post<ApiResponse<SystemParamResponseDto>>(
        '/SystemParam',
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateAsync(id: number, values: SystemParamRequestDto): Promise<SystemParamResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.put<ApiResponse<SystemParamResponseDto>>(
        `/SystemParam/${id}`,
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleStatusAsync(
      id: number
    ): Promise<SystemParamResponseDto> {
      try {
        const { data } = await api.patch<ApiResponse<SystemParamResponseDto>>(
          `/SystemParam/${id}`
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }
}

export const SystemParamService = new SystemParam()