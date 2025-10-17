/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/Utils/ApiConfig';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';
import type { PagedResponse } from '@/Interfaces/GlobalInterface';
import type {
  ServiceResponseDto,
  ServiceRequestDto,
} from '@/Interfaces/Crm/ServiceInterface';

import type { AxiosError } from 'axios';

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>;
  const message = axiosError.response?.data?.message ?? axiosError.message;
  return new Error(message);
}

class Service {
  async getAllAsync(
    filter: string,
    page = 1, 
    size = 20): Promise<PagedResponse<ServiceResponseDto>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<ServiceResponseDto>>>(
        '/Service/GetAllByPagination',
        { params: { 
          globalFilter: filter,
          PageNumber: page, 
          PageSize: size } }
      );
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async getByIdAsync(id: number): Promise<ServiceResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<ServiceResponseDto>>(`/Service/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async createAsync(values: ServiceRequestDto): Promise<ServiceResponseDto> {
    try {
      const { data } = await api.post<ApiResponse<ServiceResponseDto>>('/Service', values);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async updateAsync(id: number, values: ServiceRequestDto): Promise<ServiceResponseDto> {
    try {
      const { data } = await api.put<ApiResponse<ServiceResponseDto>>(`/Service/${id}`, values);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async toggleStatusAsync(id: number): Promise<ServiceResponseDto> {
    try {
      const { data } = await api.patch<ApiResponse<ServiceResponseDto>>(`/Service/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }
}

export const ServiceService = new Service();