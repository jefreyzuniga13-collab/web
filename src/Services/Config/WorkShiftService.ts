/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type {
  WorkShiftInterface,
  WorkShiftFormValues,
} from '@/Interfaces/Setting/WorkShiftInterface'
import type { AxiosError } from 'axios'

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

function toDateOnlyString(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString().split('T')[0]
}

class WorkShift {
  async getAll(page = 1, size = 20): Promise<PagedResponse<WorkShiftInterface>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<WorkShiftInterface>>>(
        '/WorkShift',
        { params: { PageNumber: page, PageSize: size } }
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getById(id: number): Promise<WorkShiftInterface> {
    try {
      const { data } = await api.get<ApiResponse<WorkShiftInterface>>(`/WorkShift/${id}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async create(values: WorkShiftFormValues): Promise<WorkShiftInterface> {
    try {
      const payload = {
        ...values,
        validFrom: toDateOnlyString(values.validFrom),
        validTo: toDateOnlyString(values.validTo),
      }
      const { data } = await api.post<ApiResponse<WorkShiftInterface>>(
        '/WorkShift',
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async update(id: number, values: WorkShiftFormValues): Promise<WorkShiftInterface> {
    try {
      const payload = {
        ...values,
        validFrom: toDateOnlyString(values.validFrom),
        validTo: toDateOnlyString(values.validTo),
      }
      const { data } = await api.put<ApiResponse<WorkShiftInterface>>(
        `/WorkShift/${id}`,
        payload
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleStatus(id: number): Promise<WorkShiftInterface> {
    try {
      const { data } = await api.patch<ApiResponse<WorkShiftInterface>>(
        `/WorkShift/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByDate(date: Date | string): Promise<WorkShiftInterface[]> {
    try {
      const dateStr = toDateOnlyString(date)!
      const { data } = await api.get<ApiResponse<WorkShiftInterface[]>>(
        '/WorkShift/by-date',
        { params: { date: dateStr } }
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getActiveCount(date: Date | string): Promise<number> {
    try {
      const dateStr = toDateOnlyString(date)!
      const { data } = await api.get<ApiResponse<number>>(
        '/WorkShift/count-by-date',
        { params: { date: dateStr } }
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }
}

export const WorkShiftService = new WorkShift()