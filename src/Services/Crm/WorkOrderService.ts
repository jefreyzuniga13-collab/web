/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/Utils/ApiConfig';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';
import type { PagedResponse } from '@/Interfaces/GlobalInterface';
import type {
  WorkOrderRequestDto,
  WorkOrderResponseDto,
} from '@/Interfaces/Crm/WorkOrderInterface';

import type { AxiosError } from 'axios';

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<any>>;
  const message = axiosError.response?.data?.message ?? axiosError.message;
  return new Error(message);
}

class WorkOrderServ {
  async getAllAsync(
    filter: string,
    page = 1, 
    size = 20): Promise<PagedResponse<WorkOrderResponseDto>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<WorkOrderResponseDto>>>(
        '/WorkOrder/GetAllByPagination',
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

  async getByIdAsync(id: number): Promise<WorkOrderResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<WorkOrderResponseDto>>(`/WorkOrder/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async createAsync(values: WorkOrderRequestDto): Promise<WorkOrderResponseDto> {
    try {
      const { data } = await api.post<ApiResponse<WorkOrderResponseDto>>('/WorkOrder', values);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async updateAsync(id: number, values: WorkOrderRequestDto): Promise<WorkOrderResponseDto> {
    try {
      const { data } = await api.put<ApiResponse<WorkOrderResponseDto>>(`/WorkOrder/${id}`, values);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  async toggleStatusAsync(id: number): Promise<WorkOrderResponseDto> {
    try {
      const { data } = await api.patch<ApiResponse<WorkOrderResponseDto>>(`/WorkOrder/${id}`);
      return data.data;
    } catch (error) {
      throw formatError(error);
    }
  }

  //Enviar firma del cliente usado la dependencia react-signature-canvas.
  async sendSignature(signatureDataURL: string, contactId: string): Promise<any> {
  const formData = new FormData();
  const byteCharacters = atob(signatureDataURL.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const signatureBlob = new Blob([byteArray], { type: 'image/png' });

  formData.append('signature', signatureBlob, 'signature.png');
  formData.append('contactId', contactId);

  try {
    const response = await api.post(`/WorkOrder/Signature`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

        return response.data;
    
        } catch (error) {
            console.error("Error al enviar la firma:", error);
            throw error;
        }
    };
}

export const WorkOrderService = new WorkOrderServ();