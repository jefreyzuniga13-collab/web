/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type {
  ClientRequestDTO,
  ClientUpdateRequestDTO,
  ClientResponseDTO,
  DeviceRequestDTO,
  CredentialRequestDTO,
  SystemRequestDTO,
  CredentialResponseDTO,
  OutsourcedDeviceResponseDTO,
  OutsourcedSystemsResponseDTO,
  ContactLogLiteResponseDto,
  ClientProcResponse,
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

class ClientsServiceClass {

  async getAllClientAsyn(filter: string, page: number, pageSize: number): Promise<PagedResponse<ClientProcResponse>>{
    try{
      const {data} = await api.get<ApiResponse<PagedResponse<ClientProcResponse>>>(
        'Clients/GetAllClient',{
        params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } 
        }
      )

      return data.data;
    }catch(e){
      throw formatError(e)
    }
  }

   async getClientFromMultipleSource(id: number): Promise<ClientProcResponse> {
    try {
      const { data } = await api.get<ApiResponse<ClientProcResponse>>(`/Clients/getClientFromMultipleSource/${id}`)
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getAllAsync(
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ClientResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<ClientResponseDTO>>>(
        '/Clients',
        { params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getByIdAsync(id: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.get<ApiResponse<ClientResponseDTO>>(`/Clients/${id}`)
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getByCodeAsync(code: string): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.get<ApiResponse<ClientResponseDTO>>(
        `/Clients/code/${encodeURIComponent(code)}`
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async createAsync(values: ClientRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.post<ApiResponse<ClientResponseDTO>>('/Clients', payload)
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async addCredentialHostingAsync(
    clientId: number,
    credential: CredentialRequestDTO
  ): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<CredentialResponseDTO>>(
        `/Clients/${clientId}/credentials/hosting`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async addCredentialForDeviceAsync(
    clientId: number,
    deviceId: number,
    credential: CredentialRequestDTO
  ): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<CredentialResponseDTO>>(
        `/Clients/${clientId}/devices/${deviceId}/credentials`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async addCredentialForSystemAsync(
    clientId: number,
    clientSystemId: number,
    credential: CredentialRequestDTO
  ): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<CredentialResponseDTO>>(
        `/Clients/${clientId}/systems/${clientSystemId}/credentials`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async updateAsync(id: number, values: ClientUpdateRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.put<ApiResponse<ClientResponseDTO>>(`/Clients/${id}`, payload)
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async toggleStatusAsync(id: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.patch<ApiResponse<ClientResponseDTO>>(`/Clients/${id}`)
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async addDeviceAsync(
    clientId: number,
    device: DeviceRequestDTO
  ): Promise<OutsourcedDeviceResponseDTO> {
    try {
      const payload = transformPayload(device)
      const { data } = await api.post<ApiResponse<OutsourcedDeviceResponseDTO>>(
        `/Clients/${clientId}/devices`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async addSystemByIdAsync(
    clientId: number,
    outsourcedSystemId: number
  ): Promise<OutsourcedSystemsResponseDTO> {
    try {
      const { data } = await api.post<ApiResponse<OutsourcedSystemsResponseDTO>>(
        `/Clients/${clientId}/systems/${outsourcedSystemId}`
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async addSystemAsync(
    clientId: number,
    system: SystemRequestDTO
  ): Promise<OutsourcedSystemsResponseDTO> {
    try {
      const payload = transformPayload(system)
      const { data } = await api.post<ApiResponse<OutsourcedSystemsResponseDTO>>(
        `/Clients/${clientId}/systems`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async linkExistingContactsAsync(clientId: number, contactIds: number[]): Promise<number> {
    try {
      const { data } = await api.post<ApiResponse<number>>(
        `/Clients/${clientId}/contacts/link`,
        contactIds
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }
}

export const ClientsService = new ClientsServiceClass()

class PickersServiceClass {
  async systemPickerAsync(
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<OutsourcedSystemsResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<OutsourcedSystemsResponseDTO>>>(
        '/Clients/pickers/systems',
        { params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async devicePickerAsync(
    clientId: number,
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<OutsourcedDeviceResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<OutsourcedDeviceResponseDTO>>>(
        `/Clients/${clientId}/pickers/devices`,
        { params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async contactPickerAsync(
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ContactLogLiteResponseDto>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<ContactLogLiteResponseDto>>>(
        '/Clients/pickers/contacts',
        { params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }
}

export const PickersService = new PickersServiceClass()

export default {
  ClientsService,
  PickersService,
}