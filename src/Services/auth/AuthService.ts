import axios from "axios"

import api from "@/Utils/ApiConfig"

import type {
  ApiResponse,
  AuthData,
  AuthMe,
  ForgotPasswordRequest,
  LoginConflictResponseDto,
  LoginRequest,
  LogOutAtResponseDto,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "@/Interfaces/Auth/AuthInterface"

/**
 * Error controlado para diferenciar una sesión activa
 * de cualquier otro fallo de autenticación.
 *
 * El formulario usará este error para mostrar el modal local:
 * "Ya existe una sesión activa. ¿Deseas reemplazarla?"
 */
export class ActiveSessionConflictError extends Error {
  readonly conflict: LoginConflictResponseDto

  constructor(
    conflict: LoginConflictResponseDto,
    message = "El usuario ya tiene una sesión activa."
  ) {
    super(message)

    this.name = "ActiveSessionConflictError"
    this.conflict = conflict

    Object.setPrototypeOf(
      this,
      ActiveSessionConflictError.prototype
    )
  }
}

class AuthService {
  /**
   * Inicia sesión normalmente.
   *
   * Si la API devuelve 409 ACTIVE_SESSION_EXISTS,
   * se lanza ActiveSessionConflictError para que el frontend
   * muestre el modal de reemplazo en la máquina nueva.
   */
  async loginAsync(
    request: LoginRequest
  ): Promise<ApiResponse<AuthData>> {
    const payload = this.buildLoginPayload(request)

    try {
      const { data } = await api.post<ApiResponse<AuthData>>(
        "/Auth/login",
        payload
      )

      return data
    } catch (error) {
      this.throwIfActiveSessionConflict(error)

      throw error
    }
  }

  /**
   * Fuerza el reemplazo de la sesión activa anterior.
   *
   * Flujo:
   * 1. La máquina 2 confirma que desea continuar.
   * 2. La API revoca la sesión anterior.
   * 3. La API crea la nueva sesión.
   * 4. La API envía ForceLogout a la máquina 1.
   * 5. La máquina 2 queda autenticada.
   */
  async forceReplaceLoginAsync(
    request: LoginRequest
  ): Promise<ApiResponse<AuthData>> {
    const payload = this.buildLoginPayload(request)

    try {
      const { data } = await api.post<ApiResponse<AuthData>>(
        "/Auth/force-replace-login",
        payload
      )

      return data
    } catch (error) {
      this.throwIfActiveSessionConflict(error)

      throw error
    }
  }

  /**
   * Cierra la sesión actual.
   *
   * SessionKey no se envía desde el frontend:
   * la API lo obtiene del claim session_id.
   */
  async logoutAsync(): Promise<LogOutAtResponseDto> {
    const { data } = await api.post<
      ApiResponse<LogOutAtResponseDto>
    >("/Auth/logout")

    return data.data
  }

  async registerAsync(
    request: RegisterRequest
  ): Promise<ApiResponse<string>> {
    const { data } = await api.post<ApiResponse<string>>(
      "/Auth/register",
      {
        fullName: request.fullName,
        email: request.email,
        password: request.password,
        companyId: request.companyId,
        phone: request.phone,
        identifier: request.identifier,
        imageUrl: "",
      }
    )

    return data
  }

  async refreshTokenAsync(): Promise<AuthData> {
    const { data } = await api.post<ApiResponse<AuthData>>(
      "/Auth/refresh"
    )

    return data.data
  }

  async forgotPasswordAsync(
    request: ForgotPasswordRequest
  ): Promise<ApiResponse<string>> {
    const email = request.email?.trim()

    if (!email) {
      throw new Error("Email es requerido.")
    }

    const { data } = await api.post<ApiResponse<string>>(
      "/Auth/forgot-password",
      {
        email,
      }
    )

    return data
  }

  async resetPasswordAsync(
    request: ResetPasswordRequest
  ): Promise<ApiResponse<string>> {
    if (!request.token || !request.newPassword) {
      throw new Error(
        "Token y nueva contraseña son requeridos."
      )
    }

    const { data } = await api.post<ApiResponse<string>>(
      "/Auth/reset-password",
      {
        token: request.token,
        newPassword: request.newPassword,
      }
    )

    return data
  }

  async verifyEmailAsync(
    request: VerifyEmailRequest
  ): Promise<ApiResponse<string>> {
    if (!request.token) {
      throw new Error("Token es requerido.")
    }

    const { data } = await api.get<ApiResponse<string>>(
      "/Auth/verify-email",
      {
        params: {
          token: request.token,
        },
      }
    )

    return data
  }

  async meAsync(): Promise<AuthMe> {
    const { data } = await api.get<ApiResponse<AuthMe>>(
      "/Auth/me"
    )

    return data.data
  }

  private buildLoginPayload(
    request: LoginRequest
  ): LoginRequest {
    const email = request.email?.trim()
    const password = request.password

    if (!email || !password) {
      throw new Error("Email y contraseña son requeridos.")
    }

    return {
      email,
      password,
    }
  }

  private throwIfActiveSessionConflict(
    error: unknown
  ): never | void {
    if (!axios.isAxiosError(error)) {
      return
    }

    const statusCode = error.response?.status

    const response =
      error.response
        ?.data as ApiResponse<LoginConflictResponseDto> | undefined

    const conflict = response?.data

    if (
      statusCode === 409 &&
      conflict?.code === "ACTIVE_SESSION_EXISTS"
    ) {
      throw new ActiveSessionConflictError(
        conflict,
        response?.message ||
          "El usuario ya tiene una sesión activa."
      )
    }
  }
}

export const authService = new AuthService()