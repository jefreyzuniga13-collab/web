import axios from "axios"

import api from "@/Utils/ApiConfig"

import type {
  ApiResponse,
  AuthData,
  AuthMe,
  ForgotPasswordRequest,
  LoginAccessRequestResponseDto,
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
 * El formulario utilizará este error para mostrar
 * la pantalla de espera en lugar de un mensaje genérico.
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

    Object.setPrototypeOf(this, ActiveSessionConflictError.prototype)
  }
}

class AuthService {
  /**
   * Inicia sesión normalmente.
   *
   * Si la API devuelve 409 ACTIVE_SESSION_EXISTS,
   * transforma la respuesta en ActiveSessionConflictError.
   */
  async loginAsync(
    request: LoginRequest
  ): Promise<ApiResponse<AuthData>> {
    const email = request.email?.trim()
    const password = request.password

    if (!email || !password) {
      throw new Error("Email y contraseña son requeridos.")
    }

    try {
      const { data } = await api.post<ApiResponse<AuthData>>(
        "/Auth/login",
        {
          email,
          password,
        }
      )

      return data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status

        const response =
          error.response
            ?.data as ApiResponse<LoginConflictResponseDto> | undefined

        const conflict = response?.data

        if (
          statusCode === 409 &&
          conflict?.code === "ACTIVE_SESSION_EXISTS" &&
          conflict.requestKey
        ) {
          throw new ActiveSessionConflictError(
            conflict,
            response?.message ||
              "Existe una sesión activa esperando autorización."
          )
        }
      }

      throw error
    }
  }

  /**
   * Consulta el estado de una solicitud.
   *
   * También sirve como respaldo cuando SignalR se desconecta.
   */
  async getLoginAccessRequestAsync(
    requestKey: string
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>> {
    this.validateRequestKey(requestKey)

    const { data } = await api.get<
      ApiResponse<LoginAccessRequestResponseDto>
    >(`/Auth/login-requests/${encodeURIComponent(requestKey)}`)

    return data
  }

  /**
   * Aprueba la solicitud desde la sesión actualmente conectada.
   */
  async approveLoginAccessRequestAsync(
    requestKey: string
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>> {
    this.validateRequestKey(requestKey)

    const { data } = await api.post<
      ApiResponse<LoginAccessRequestResponseDto>
    >(
      `/Auth/login-requests/${encodeURIComponent(
        requestKey
      )}/approve`
    )

    return data
  }

  /**
   * Rechaza la solicitud desde la sesión actualmente conectada.
   */
  async rejectLoginAccessRequestAsync(
    requestKey: string
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>> {
    this.validateRequestKey(requestKey)

    const { data } = await api.post<
      ApiResponse<LoginAccessRequestResponseDto>
    >(
      `/Auth/login-requests/${encodeURIComponent(
        requestKey
      )}/reject`
    )

    return data
  }

  /**
   * Cancela la espera desde el nuevo dispositivo.
   */
  async cancelLoginAccessRequestAsync(
    requestKey: string
  ): Promise<ApiResponse<LoginAccessRequestResponseDto>> {
    this.validateRequestKey(requestKey)

    const { data } = await api.post<
      ApiResponse<LoginAccessRequestResponseDto>
    >(
      `/Auth/login-requests/${encodeURIComponent(
        requestKey
      )}/cancel`
    )

    return data
  }

  /**
   * Completa el inicio de sesión después de que la solicitud
   * fue aprobada por el dispositivo anterior.
   *
   * La API vuelve a validar correo y contraseña antes
   * de emitir las cookies de la nueva sesión.
   */
  async completeApprovedLoginAsync(
    requestKey: string,
    request: LoginRequest
  ): Promise<ApiResponse<AuthData>> {
    this.validateRequestKey(requestKey)

    const email = request.email?.trim()
    const password = request.password

    if (!email || !password) {
      throw new Error("Email y contraseña son requeridos.")
    }

    const { data } = await api.post<ApiResponse<AuthData>>(
      `/Auth/login-requests/${encodeURIComponent(
        requestKey
      )}/complete`,
      {
        email,
        password,
      }
    )

    return data
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

  /**
   * Evita construir endpoints con un RequestKey vacío.
   */
  private validateRequestKey(requestKey: string): void {
    if (!requestKey?.trim()) {
      throw new Error("RequestKey es requerido.")
    }
  }
}

export const authService = new AuthService()