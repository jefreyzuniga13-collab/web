/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/Utils/ApiConfig';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface';
import type {
    CatCredencialRequestDto,
    CatCredencialResponseDto
} from '@/Interfaces/Crm/CatCredential';
import type { AxiosError } from 'axios';

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>;
  const message = axiosError.response?.data?.message ?? axiosError.message;
  return new Error(message);
}

class CatCredentialServ {
  async getAllAsync(
    filter: string,
    page = 1, 
    size = 20): Promise<PagedResponse<CatCredencialResponseDto>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<CatCredencialResponseDto>>>(
        '/CatCredencial/GetAllByPagination',
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

  async getByIdAsync(id: number): Promise<CatCredencialResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<CatCredencialResponseDto>>(`/CatCredencial/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

   async getByNameAsync(name: string): Promise<CatCredencialResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<CatCredencialResponseDto>>(`/CatCredencial/name/${name}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }
  
  async createAsync(values: CatCredencialRequestDto): Promise<CatCredencialResponseDto> {
    try {
      const payload = {
        ...values
      };
      const { data } = await api.post<ApiResponse<CatCredencialResponseDto>>('/CatCredencial', payload);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async updateAsync(id: number, payload: CatCredencialRequestDto): Promise<CatCredencialResponseDto> {
    try {
      const { data } = await api.put<ApiResponse<CatCredencialResponseDto>>(`/CatCredencial/${id}`, payload);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async toggleStatusAsync(id: number): Promise<CatCredencialResponseDto> {
    try {
      const { data } = await api.patch<ApiResponse<CatCredencialResponseDto>>(`/CatCredencial/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }
}

export const CatCredentialService = new CatCredentialServ();