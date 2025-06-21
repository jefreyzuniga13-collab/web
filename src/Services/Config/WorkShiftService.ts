/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type {PagedResponse} from '@/Interfaces/GlobalInterface'
import {type WorkShiftInterface} from '@/Interfaces/Setting/WorkShiftInterface'
import {AxiosError} from 'axios'

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

class WorkShift {
  async getAllAsync(): Promise<WorkShiftInterface[]> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<WorkShiftInterface>>>(
        '/WorkShift',
        { params: { PageNumber: 1, PageSize: 20 } }
      )
      return data.data.items
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByIdAsync(id: number): Promise<WorkShiftInterface>{
    try{
        const {data} = await api.get<ApiResponse<WorkShiftInterface>>(
            `/WorkShift/${id}`
        )
        return data.data;
    }catch(error){
        throw formatError(error);
    }
  }

  async createAsync(values: WorkShiftInterface): Promise<WorkShiftInterface>{
    try{
        const {data} = await api.post<ApiResponse<WorkShiftInterface>>(
            "/WorkShift",
            values
        )

        return data.data;
    }catch(error){
        throw formatError(error);
    }
  }

  async updateAsync(id: number, values: WorkShiftInterface): Promise<WorkShiftInterface>{
    try{
        const {data} = await api.put<ApiResponse<WorkShiftInterface>>(
        `/WorkShift/${id}`,
        values
    )
    return data.data
    }catch(err){
        throw formatError(err);
    }
    }

    async toggleAsync(id: number): Promise<WorkShiftInterface>{
        try{
            const {data} = await api.patch<ApiResponse<WorkShiftInterface>>(
                `/WorkShift${id}`
            )
            return data.data;
        }catch(err){
            throw formatError(err)
        }
    }
}

export const WorkShiftService = new WorkShift();