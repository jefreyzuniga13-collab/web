// src/Services/MenuService.ts
import api from '@/Utils/ApiConfig'
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'
import type { MenuDto } from '@/Interfaces/Chat/ChatInterfaces'
import type { AxiosError } from 'axios'

function formatError(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<MenuDto[]>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

class MenuService {
  async getMenusAsync(): Promise<MenuDto[]> {
    try {
      const { data } = await api.get<ApiResponse<MenuDto[]>>('/Menus')
      return data.data
    } catch (err) {
      throw formatError(err)
    }
  }
}

export const menuService = new MenuService()