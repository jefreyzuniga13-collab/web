/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type {
  OutsourcedDeviceResponseDTO,
  OutsourcedDeviceRequestDTO,
} from '@/Interfaces/Crm/ClientInterface'
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
    Object.entries(payload).filter(([, v]) => v !== null && v !== undefined && v !== '')
  ) as T
}

function transformPayload<T extends Record<string, any>>(input: T): T {
  return cleanPayload(input)
}

class OutsourcedDevicesServiceClass {
  async getAllAsync(
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<OutsourcedDeviceResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<OutsourcedDeviceResponseDTO>>>(
        '/OutsourcedDevices',
        { params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getByIdAsync(id: number): Promise<OutsourcedDeviceResponseDTO> {
    try {
      const { data } = await api.get<ApiResponse<OutsourcedDeviceResponseDTO>>(
        `/OutsourcedDevices/${id}`
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async createAsync(
    clientId: number,
    payloadIn: OutsourcedDeviceRequestDTO
  ): Promise<OutsourcedDeviceResponseDTO> {
    try {
      const payload = transformPayload(payloadIn)
      const { data } = await api.post<ApiResponse<OutsourcedDeviceResponseDTO>>(
        `/OutsourcedDevices/client/${clientId}`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async updateAsync(
    id: number,
    payloadIn: OutsourcedDeviceRequestDTO
  ): Promise<OutsourcedDeviceResponseDTO> {
    try {
      const payload = transformPayload(payloadIn)
      const { data } = await api.put<ApiResponse<OutsourcedDeviceResponseDTO>>(
        `/OutsourcedDevices/${id}`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async toggleAsync(id: number): Promise<OutsourcedDeviceResponseDTO> {
    try {
      const { data } = await api.patch<ApiResponse<OutsourcedDeviceResponseDTO>>(
        `/OutsourcedDevices/${id}`
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }
}

export const OutsourcedDevicesService = new OutsourcedDevicesServiceClass()