/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { CredentialRequestDTO, CredentialResponseDTO } from '@/Interfaces/Crm/ClientInterface'
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface'
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

class CredentialsServiceClass {
  async createHostingAsync(
    clientId: number,
    credential: CredentialRequestDTO
  ): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<CredentialResponseDTO>>(
        `/Credentials/${clientId}/hosting`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async createForDeviceAsync(
    clientId: number,
    deviceId: number,
    credential: CredentialRequestDTO
  ): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<CredentialResponseDTO>>(
        `/Credentials/${clientId}/devices/${deviceId}`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async createForClientSystemAsync(
    clientId: number,
    clientOutsourcedSystemId: number,
    credential: CredentialRequestDTO
  ): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.post<ApiResponse<CredentialResponseDTO>>(
        `/Credentials/${clientId}/systems/${clientOutsourcedSystemId}`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async updateAsync(id: number, credential: CredentialRequestDTO): Promise<CredentialResponseDTO> {
    try {
      const payload = transformPayload(credential)
      const { data } = await api.put<ApiResponse<CredentialResponseDTO>>(
        `/Credentials/${id}`,
        payload
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async toggleAsync(id: number): Promise<CredentialResponseDTO> {
    try {
      const { data } = await api.patch<ApiResponse<CredentialResponseDTO>>(
        `/Credentials/${id}/toggle`
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getByClientAsync(
    clientId: number,
    page: number,
    pageSize: number,
    filter?: string
  ): Promise<PagedResponse<CredentialResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<CredentialResponseDTO>>>(
        `/Credentials/client/${clientId}`,
        { params: { PageNumber: page, PageSize: pageSize, filter } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getByDeviceAsync(
    deviceId: number,
    page: number,
    pageSize: number,
    filter?: string
  ): Promise<PagedResponse<CredentialResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<CredentialResponseDTO>>>(
        `/Credentials/device/${deviceId}`,
        { params: { PageNumber: page, PageSize: pageSize, filter } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }

  async getByClientSystemAsync(
    clientSystemId: number,
    page: number,
    pageSize: number,
    filter?: string
  ): Promise<PagedResponse<CredentialResponseDTO>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<CredentialResponseDTO>>>(
        `/Credentials/system/${clientSystemId}`,
        { params: { PageNumber: page, PageSize: pageSize, filter } }
      )
      return data.data
    } catch (e) {
      throw formatError(e)
    }
  }
}

export const CredentialsService = new CredentialsServiceClass()