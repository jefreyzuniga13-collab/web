import api from '@/Utils/ApiConfig'
import type { AxiosError } from 'axios'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'
import type {
  RoleResponseDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleMenuRequest,
  SyncRoleMenusRequest,
} from '@/Interfaces/Auth/MenuInterfaces'
import type { MenuResponseDto, RoleMenuResponseDto } from '@/Interfaces/Auth/MenuInterfaces'

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<unknown>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

class RoleService {
  async getAllAsync(pageNumber = 1, pageSize = 20): Promise<PagedResponse<RoleResponseDto>> {
    try {
      const { data } = await api.get<ApiResponse<PagedResponse<RoleResponseDto>>>('/Roles', {
        params: { PageNumber: pageNumber, PageSize: pageSize },
      })
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async getByIdAsync(id: number): Promise<RoleResponseDto> {
    try {
      const { data } = await api.get<ApiResponse<RoleResponseDto>>(`/Roles/${id}`)
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async createAsync(payload: CreateRoleRequest): Promise<RoleResponseDto> {
    try {
      const { data } = await api.post<ApiResponse<RoleResponseDto>>('/Roles', payload)
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async updateAsync(id: number, payload: UpdateRoleRequest): Promise<void> {
    try {
      await api.put(`/Roles/${id}`, payload)
    } catch (err) {
      throw formatError(err)
    }
  }

  async toggleAsync(id: number): Promise<void> {
    try {
      await api.patch(`/Roles/${id}/toggle`)
    } catch (err) {
      throw formatError(err)
    }
  }

  async getMenusByRoleAsync(roleId: number): Promise<MenuResponseDto[]> {
    try {
      const { data } = await api.get<ApiResponse<MenuResponseDto[]>>(`/roles/${roleId}/menus`)
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async getRelationsByRoleAsync(roleId: number): Promise<RoleMenuResponseDto[]> {
    try {
      const { data } = await api.get<ApiResponse<RoleMenuResponseDto[]>>(
        `/roles/${roleId}/menus/relations`
      )
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async assignMenuAsync(payload: AssignRoleMenuRequest): Promise<RoleMenuResponseDto> {
    try {
      const { roleId, menuId } = payload
      const { data } = await api.post<ApiResponse<RoleMenuResponseDto>>(
        `/roles/${roleId}/menus/${menuId}`
      )
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async toggleMenuAsync(payload: AssignRoleMenuRequest): Promise<RoleMenuResponseDto> {
    try {
      const { roleId, menuId } = payload
      const { data } = await api.patch<ApiResponse<RoleMenuResponseDto>>(
        `/roles/${roleId}/menus/${menuId}/toggle`
      )
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }

  async syncMenusAsync(payload: SyncRoleMenusRequest): Promise<MenuResponseDto[]> {
    try {
      const { roleId, menuIds } = payload
      const { data } = await api.put<ApiResponse<MenuResponseDto[]>>(
        `/roles/${roleId}/menus/sync`,
        { roleId, menuIds }
      )
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }
}

export const RolesService = new RoleService()