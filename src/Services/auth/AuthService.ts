import api from '@/Utils/ApiConfig';
import type {
  ApiResponse,
  AuthData,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  LogOutAtResponseDto,
  AuthMe
} from '@/Interfaces/Auth/AuthInterface';
class AuthService {
  async loginAsync({ email, password }: LoginRequest): Promise<ApiResponse<AuthData>> {
    if (!email || !password) {
      throw new Error('Email y contraseña son requeridos');
    }
    const { data } = await api.post<ApiResponse<AuthData>>('/Auth/login', {
      email,
      password
    });

    return data;
  }

  async logoutAsync(): Promise<LogOutAtResponseDto> {
    const { data } = await api.post<ApiResponse<LogOutAtResponseDto>>('/Auth/logout');
    return data.data;
  }

  async registerAsync(req: RegisterRequest): Promise<ApiResponse<string>> {
    const { data } = await api.post<ApiResponse<string>>('/Auth/register', {
      fullName: req.fullName,
      email: req.email,
      password: req.password,
      companyId: req.companyId,
      phone: req.phone,
      identifier: req.identifier
    });

    return data;
  }

  async refreshTokenAsync(): Promise<AuthData> {
    const { data } = await api.post<ApiResponse<AuthData>>('/Auth/refresh');
    return data.data;
  }

  async forgotPasswordAsync({ email }: ForgotPasswordRequest): Promise<ApiResponse<string>> {
    if (!email) {
      throw new Error('Email es requerido');
    }

    const { data } = await api.post<ApiResponse<string>>('/Auth/forgot-password', {
      email
    });

    return data;
  }

  async resetPasswordAsync({
    token,
    newPassword
  }: ResetPasswordRequest): Promise<ApiResponse<string>> {
    if (!token || !newPassword) {
      throw new Error('Token y nueva contraseña son requeridos');
    }

    const { data } = await api.post<ApiResponse<string>>('/Auth/reset-password', {
      token,
      newPassword
    });

    return data;
  }

  async verifyEmailAsync({ token }: VerifyEmailRequest): Promise<ApiResponse<string>> {
    if (!token) {
      throw new Error('Token es requerido');
    }

    const { data } = await api.get<ApiResponse<string>>('/Auth/verify-email', {
      params: { token }
    });

    return data;
  }

  async meAsync(): Promise<AuthMe> {
    const { data } = await api.get<ApiResponse<AuthMe>>('/Auth/me');
    return data.data;
  }
}

export const authService = new AuthService();