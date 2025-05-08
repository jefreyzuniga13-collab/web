import api from '@/Utils/ApiConfig'
import type {
  ApiResponse,
  AuthData,
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from '@/Interfaces/Auth/AuthInterface'
import type { AxiosError } from 'axios'

function formatError<T>(error: unknown): Error {
  const axiosError = error as AxiosError<ApiResponse<T>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

class AuthService {
  async loginAsync({ email, password }: LoginRequest): Promise<AuthData> {
    if (!email || !password) throw new Error('Email y contraseña son requeridos')
    try {
      const { data } = await api.post<ApiResponse<AuthData>>('Auth/login', { email, password })
      return data.data
    } catch (error) {
      throw formatError<AuthData>(error)
    }
  }

  async registerAsync({
    fullName,
    email,
    password,
    companyName,
    contactName,
    phone,
    country
  }: RegisterRequest): Promise<string> {
    if (
      !fullName ||
      !email ||
      !password ||
      !companyName ||
      !contactName ||
      !phone ||
      !country
    ) {
      throw new Error('Todos los campos son requeridos')
    }
    try {
      const { data } = await api.post<ApiResponse<string>>('/Auth/register', {
        fullName,
        email,
        password,
        companyName,
        contactName,
        phone,
        country
      })
      return data.data
    } catch (error) {
      throw formatError<AuthData>(error)
    }
  }

  async refreshTokenAsync({ refreshToken }: RefreshRequest): Promise<AuthData> {
    if (!refreshToken) throw new Error('Refresh token es requerido')
    try {
      const { data } = await api.post<ApiResponse<AuthData>>('/Auth/refresh', {
        refreshToken
      })
      return data.data
    } catch (error) {
      throw formatError<AuthData>(error)
    }
  }

  async forgotPasswordAsync({ email }: ForgotPasswordRequest): Promise<string> {
    if (!email) throw new Error('Email es requerido')
    try {
      const { data } = await api.post<ApiResponse<string>>('/Auth/forgot-password', {
        email
      })
      return data.data
    } catch (error) {
      throw formatError<string>(error)
    }
  }

  async resetPasswordAsync({
    token,
    newPassword
  }: ResetPasswordRequest): Promise<string> {
    if (!token || !newPassword) throw new Error('Token y nueva contraseña son requeridos')
    try {
      const { data } = await api.post<ApiResponse<string>>('/Auth/reset-password', {
        token,
        newPassword
      })
      return data.data
    } catch (error) {
      throw formatError<string>(error)
    }
  }

  async verifyEmailAsync({ token }: VerifyEmailRequest): Promise<string> {
    if (!token) throw new Error('Token es requerido')
    try {
      const { data } = await api.get<ApiResponse<string>>('/Auth/verify-email', {
        params: { token }
      })
      return data.data
    } catch (error) {
      throw formatError<string>(error)
    }
  }
}

export const authService = new AuthService()