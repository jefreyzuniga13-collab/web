/* eslint-disable @typescript-eslint/no-unused-vars */
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
function cleanPayload(payload: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(payload).filter(([_, value]) => value !== null && value !== undefined && value !== '')
  );
}


function transformPayload(input: OpeningHourFormValues): any {
  return cleanPayload({
    ...input,
    specificDate: input.specificDate instanceof Date ? input.specificDate.toISOString().split('T')[0] : input.specificDate,
    effectiveFrom: input.effectiveFrom instanceof Date ? input.effectiveFrom.toISOString().split('T')[0] : input.effectiveFrom,
    effectiveTo: input.effectiveTo instanceof Date ? input.effectiveTo.toISOString().split('T')[0] : input.effectiveTo,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
  });
}

class OpeningHour {
 async getAll(
    page: number,
    pageSize: number
  ): Promise<PagedResponse<OpeningHourInterface>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<OpeningHourInterface>>>(
        '/OpeningHour',
        { params: { PageNumber: page, PageSize: pageSize } }
      )
      return data.data
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
      
      const payload = transformPayload(values);
      const { data } = await api.post<ApiResponse<OpeningHourInterface>>(
        '/OpeningHour',
        payload
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
      const payload = transformPayload(values);
      const { data } = await api.put<ApiResponse<OpeningHourInterface>>(
        `/OpeningHour/${id}`,
        payload
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