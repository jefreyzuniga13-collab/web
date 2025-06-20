import api from '@/Utils/ApiConfig'
import type {
  ApiResponse,
  PaginatedUsers,
  User,
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
    return data.data
  }

async createUserAsync(formData: FormData): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>('/Users', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data.data;
}


  async updateUserAsync(userId: number, request: UpdateUserRequest): Promise<void> {
    console.log('Datos enviados a la API:', request)
    await api.put(`/Users/${userId}`, request)
  }

  async deleteUserAsync(userId: number): Promise<void> {
    await api.patch(`/Users/${userId}`)
  }

  async getRolesAsync(): Promise<{ roleId: number; roleName: string }[]> {
    const { data } = await api.get<ApiResponse<{ roleId: number; roleName: string }[]>>('/Roles')
    return data.data
  }

  async getCompaniesAsync(): Promise<{ companyId: number; name: string }[]> {
    const { data } = await api.get<ApiResponse<{ companyId: number; name: string }[]>>('/Companies')
    return data.data
  }

  async getUserHistoryAsync(userId: number): Promise<UserHistoryItem[]> {
    const { data } = await api.get<ApiResponse<UserHistoryItem[]>>(`/Users/${userId}/history`)
    return data.data
  }

  async getUserPresence(userId: number): Promise<PresenceDto> {
    const { data } = await api.get<ApiResponse<PresenceDto>>(`/Users/${userId}/status`)
    return data.data
  }
}

export const userService = new UserService()