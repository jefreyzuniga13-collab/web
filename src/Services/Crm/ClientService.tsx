/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ApiResponse,
} from '@/Interfaces/Auth/AuthInterface'
import type {
  ClientRequestDTO,
  ClientUpdateRequestDTO,
  ClientResponseDTO,
  DeviceRequestDTO,
  CredentialRequestDTO,
  SystemRequestDTO,
  ContactRequestDTO,
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
    Object.entries(payload).filter(
      ([, value]) => value !== null && value !== undefined && value !== ''
    )
  ) as T
}

function transformPayload<T extends Record<string, any>>(input: T): T {
  return cleanPayload(input)
}

class ClientServiceClass {
  async getAllAsync(
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ClientResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<ClientResponseDTO>>>(
        '/Client',
        { params: { globalFilter: filter, PageNumber: page, PageSize: pageSize } }
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByIdAsync(id: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.get<ApiResponse<ClientResponseDTO>>(`/Client/${id}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByCodeAsync(code: string): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.get<ApiResponse<ClientResponseDTO>>(`/Client/code/${encodeURIComponent(code)}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async createAsync(values: ClientRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.post<ApiResponse<ClientResponseDTO>>('/Client', payload)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateAsync(id: number, values: ClientUpdateRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(values)
      const { data } = await api.put<ApiResponse<ClientResponseDTO>>(`/Client/${id}`, payload)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async toggleStatusAsync(id: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.patch<ApiResponse<ClientResponseDTO>>(`/Client/${id}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async addDeviceAsync(id: number, device: DeviceRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(device)
      const { data } = await api.post<ApiResponse<ClientResponseDTO>>(`/Client/${id}/devices`, payload)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async addSystemAsync(id: number, system: SystemRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(system)
      const { data } = await api.post<ApiResponse<ClientResponseDTO>>(`/Client/${id}/systems`, payload)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async addCredentialAsync(id: number, credential: CredentialRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<ClientResponseDTO>>(`/Client/${id}/credentials`, payload)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async addContactAsync(id: number, contact: ContactRequestDTO): Promise<ClientResponseDTO> {
    try {
      const payload = transformPayload(contact)
      const { data } = await api.post<ApiResponse<ClientResponseDTO>>(`/Client/${id}/contacts`, payload)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async removeDeviceAsync(id: number, deviceId: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.delete<ApiResponse<ClientResponseDTO>>(`/Client/${id}/devices/${deviceId}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async removeSystemAsync(id: number, systemId: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.delete<ApiResponse<ClientResponseDTO>>(`/Client/${id}/systems/${systemId}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async removeCredentialAsync(id: number, credentialId: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.delete<ApiResponse<ClientResponseDTO>>(`/Client/${id}/credentials/${credentialId}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async removeContactAsync(id: number, contactId: number): Promise<ClientResponseDTO> {
    try {
      const { data } = await api.delete<ApiResponse<ClientResponseDTO>>(`/Client/${id}/contacts/${contactId}`)
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }
}

export const ClientService = new ClientServiceClass()
export default ClientService