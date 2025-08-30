/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { TemplateCategoryRequestDto, TemplateCategoryResponseDto } from '@/Interfaces/Chat/TemplateCategoryInterfaces'
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

function transformPayload(input: TemplateCategoryRequestDto): TemplateCategoryRequestDto {
  return cleanPayload(input)
}

class TemplateCategoryServ{
  async getAllAsync(
    filter: string,
      page: number,
      pageSize: number
    ): Promise<PagedResponse<TemplateCategoryResponseDto>> {
      try {
        const { data } = await api.get<ApiResponse<PagedResponse<TemplateCategoryResponseDto>>>(
          '/TemplateCategory',
          { params: { 
            globalFilter: filter,
            PageNumber: page, 
            PageSize: pageSize } }
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }


  async getByIdAsync(id: number): Promise<TemplateCategoryResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<TemplateCategoryResponseDto>>(
        `/TemplateCategory/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByNameAsync(name: string): Promise<TemplateCategoryResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<TemplateCategoryResponseDto>>(
        `/TemplateCategory/name/${name}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async createAsync(values: TemplateCategoryRequestDto): Promise<TemplateCategoryResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.post<ApiResponse<TemplateCategoryResponseDto>>(
        '/TemplateCategory',
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateAsync(id: number, values: TemplateCategoryRequestDto): Promise<TemplateCategoryResponseDto> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.put<ApiResponse<TemplateCategoryResponseDto>>(
        `/TemplateCategory/${id}`,
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleStatusAsync(
      id: number
    ): Promise<TemplateCategoryResponseDto> {
      try {
        const { data } = await api.patch<ApiResponse<TemplateCategoryResponseDto>>(
          `/TemplateCategory/${id}`
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }
}

export const TemplateCategoryService = new TemplateCategoryServ()