/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse, } from '@/Interfaces/Auth/AuthInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type {DynamicParamRequiestDto, DynamicParamResponseDto} from '@/Interfaces/Setting/DynamicParamInterface'
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

function transformPayload(input: DynamicParamRequiestDto): DynamicParamRequiestDto {
  return cleanPayload(input)
}

class SystemParam{
  async getAllAsync(
      filter: string,
      page: number,
      pageSize: number
    ): Promise<PagedResponse<DynamicParamResponseDto>> {
      try {
        const { data } = await api.get<ApiResponse<PagedResponse<DynamicParamResponseDto>>>(
          '/DynamicParam',
          { params: 
            { 
              globalFilter: filter,
              PageNumber: page, 
              PageSize: pageSize } 
          }
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }

  async getByIdAsync(publicId: string): Promise<DynamicParamResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<DynamicParamResponseDto>>(
        `/DynamicParam/${publicId}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByNameAsync(name: string): Promise<DynamicParamResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<DynamicParamResponseDto>>(
        `/DynamicParam/name/${name}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async createAsync(values: DynamicParamRequiestDto): Promise<DynamicParamResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.post<ApiResponse<DynamicParamResponseDto>>(
        '/DynamicParam',
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateAsync(publicId: string, values: DynamicParamRequiestDto): Promise<DynamicParamResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.put<ApiResponse<DynamicParamResponseDto>>(
        `/DynamicParam/${publicId}`,
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleStatusAsync(
      publicId: string
    ): Promise<DynamicParamResponseDto> {
      try {
        const { data } = await api.patch<ApiResponse<DynamicParamResponseDto>>(
          `/DynamicParam/${publicId}`
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }
}

export const SystemParamService = new SystemParam()