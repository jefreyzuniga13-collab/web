// src/Services/UserService.ts
import api from '@/Utils/ApiConfig'
import type {
  ApiResponse,
  PaginatedUsers,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserHistoryItem,
  PresenceDto
} from '@/Interfaces/User/UserInterfaces'

class UserService {
  async getUsersAsync(page = 1, pageSize = 10, searchQuery = ''): Promise<PaginatedUsers> {
    let url = `/Users?PageNumber=${page}&PageSize=${pageSize}`

    if (searchQuery) {
      url += `&Search=${encodeURIComponent(searchQuery)}`
    }

    const { data } = await api.get<ApiResponse<PaginatedUsers>>(url)
    return data.data
  }

  async getUserAsync(userId: number): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>(`/Users/${userId}`)
    console.log('Usuario obtenido desde la API:', data)
    return data.data
  }

  async createUserAsync(request: CreateUserRequest): Promise<User> {
    console.log('Información enviada:', request)
    const { data } = await api.post<ApiResponse<User>>('/Users', request)
    return data.data
  }

  async updateUserAsync(userId: number, request: UpdateUserRequest): Promise<void> {
    await api.put(`/Users/${userId}`, request)
  }

  async deleteUserAsync(userId: number): Promise<void> {
    await api.patch(`/Users/${userId}`)
  }

  async getRolesAsync(): Promise<{ roleId: number; roleName: string }[]> {
    const { data } = await api.get<ApiResponse<{ roleId: number; roleName: string }[]>>('/Roles')
    return data.data
  }

  async getCompaniesAsync(): Promise<{ id: number; name: string }[]> {
    const { data } = await api.get<ApiResponse<{ id: number; name: string }[]>>('/Companies')
    return data.data
  }

  async getUserHistoryAsync(userId: number): Promise<UserHistoryItem[]> {
    const { data } = await api.get<ApiResponse<UserHistoryItem[]>>(`/Users/${userId}/history`)
    return data.data
  }

  async getUserPresence(userId: number): Promise<PresenceDto> {

    console.log("Solicitud de estado de usuario");
    console.log("UserId Es", userId);
    const { data } = await api.get<ApiResponse<PresenceDto>>(`/Users/${userId}/status`)
      console.log("Si retorna esto", JSON.stringify(data));
    return data.data
  }
}

export const userService = new UserService()