import type { ApiResponse, SystemParamRequestDto, SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'
import api from '@/Utils/ApiConfig'

export default class SystemParamService {
  static async getSystemParams() {
    try {
      console.log('Fetching system parameters...')
      const response = await api.get<ApiResponse<SystemParamResponseDto[]>>('/SystemParam')
      return response.data.data
    } catch (error) {
      console.error('Error fetching system parameters:', error)
      throw error
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateSystemParams(params: SystemParamRequestDto) {
    try {
      const response = await api.put<ApiResponse<SystemParamResponseDto>>('/SystemParam', params)
      return response.data.data
    } catch (error) {
      console.error('Error updating system parameters:', error)
      throw error
    }
  }

  static async getSystemParamById(id: number) {
    // if (typeof id !== 'number' && typeof id !== 'string') {
    try {
      const response = await api.get<ApiResponse<SystemParamResponseDto>>(`/SystemParam/${id}`)
      return response.data.data
    } catch (error) {
      console.error(`Error fetching system parameter for key ${id}:`, error)
      throw error
    }
//   }
}
  static async getSystemParamByName(name: string){
    try {
      const response = await api.get<ApiResponse<SystemParamResponseDto>>(`/SystemParam/name/${name}`)
      return response.data.data
    } catch (error) {
      console.error(`Error fetching system parameter for name ${name}:`, error)
      throw error
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createSystemParam(param: Record<string, any>) {
    try {
      const response = await api.post<ApiResponse<SystemParamResponseDto>>('/SystemParam', param)
      return response.data.data
    } catch (error) {
      console.error('Error creating system parameter:', error)
      throw error
    }
  }
  static async deleteSystemParam(id: string) {
    try {
      const response = await api.delete(`/SystemParam/${id}`)
      return response.data.data
    } catch (error) {
      console.error(`Error deleting system parameter with id ${id}:`, error)
      throw error
    }
  }
}