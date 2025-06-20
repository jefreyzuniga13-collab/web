/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type { OpeningHourInterface, OpeningHourFormValues } from '@/Interfaces/Setting/OpeningHour'
import api from '@/Utils/ApiConfig'
import type { AxiosError } from 'axios'

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

class OpeningHour {
  async getOpeningHourAsync(): Promise<OpeningHourInterface[]> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<OpeningHourInterface>>>(
        '/OpeningHour',
        { params: { PageNumber: 1, PageSize: 10 } }
      )
      return data.data.items
    } catch (error) {
      throw formatError(error)
    }
  }

  async getOpeningHourByIdAsync(id: number): Promise<OpeningHourInterface> {
    try {
      const { data } = await api.get<ApiResponse<OpeningHourInterface>>(
        `/OpeningHour/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async createOpeningHourAsync(
    values: OpeningHourFormValues
  ): Promise<OpeningHourInterface> {
    try {
      const { data } = await api.post<ApiResponse<OpeningHourInterface>>(
        '/OpeningHour',
        values
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateOpeningHourAsync(
    id: number,
    values: OpeningHourFormValues
  ): Promise<OpeningHourInterface> {
    try {
      const { data } = await api.put<ApiResponse<OpeningHourInterface>>(
        `/OpeningHour/${id}`,
        values
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleOpeningHourStatusAsync(
    id: number
  ): Promise<OpeningHourInterface> {
    try {
      const { data } = await api.patch<ApiResponse<OpeningHourInterface>>(
        `/OpeningHour/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }
}

export const OpeningHourService = new OpeningHour();