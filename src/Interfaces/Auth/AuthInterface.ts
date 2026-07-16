export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  userId: string;
  empresaId: string;
  companyImageUrl?: string;
  companySistema: string;
  permiteMultiPago: boolean;
  permitePasarela: boolean;
  codReferenciaPCG?: string;
  isRoot: boolean;
  isAdmin: boolean;

  // Licencia de usuario.
  licenseExpireAt: string;
  showLicenseWarning: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = ApiResponse<AuthData>;

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  companyId: number;
  phone: string;
  identifier: string;
}

export type RegisterResponse = ApiResponse<AuthData>;

export interface ForgotPasswordRequest {
  email: string;
}

export type ForgotPasswordResponse = ApiResponse<string>;

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type ResetPasswordResponse = ApiResponse<string>;

export interface VerifyEmailRequest {
  token: string;
}

export type VerifyEmailResponse = ApiResponse<string>;

export interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  companyId: number;
  phone: string;
  identifier: string;
}

export interface RoleResponseDto {
  roleId: number;
  roleName: string;
  description: string;
  isActive?: boolean;
}

export interface SystemParamResponseDto {
  id: number;
  name: string;
  value: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
  type: string;
}

export interface SystemParamRequestDto {
  id: number;
  name: string;
  value?: string;
  description: string;
  type: string;
  isActive?: boolean;
}

export interface LogOutAtResponseDto {
  isSuccess?: boolean;
  message?: string;
}

export interface JwtPayload {
  role: string;
}

export interface AuthMe {
  userId: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  empresaId: string;
  companyImageUrl?: string;
  companySistema: string;
  permiteMultiPago: boolean;
  permitePasarela: boolean;
  codReferenciaPCG?: string;
  isRoot: boolean;
  isAdmin: boolean;
  licenseExpireAt: string;
  showLicenseWarning: boolean;
}

//  Solicitudes de acceso
export const LOGIN_ACCESS_REQUEST_STATUS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export type LoginAccessRequestStatus =
  (typeof LOGIN_ACCESS_REQUEST_STATUS)[keyof typeof LOGIN_ACCESS_REQUEST_STATUS];

/**
 * Respuesta 409 cuando el usuario ya tiene una sesión activa.
 */
export interface LoginConflictResponseDto {
  code: "ACTIVE_SESSION_EXISTS";
  requestKey: string;
  status: string;
  requestedAt: string;
  expiresAt: string;
  currentDevice?: string | null;
  currentLocation?: string | null;
  currentPublicIp?: string | null;
}

/**
 * Estado completo de una solicitud de acceso.
 */
export interface LoginAccessRequestResponseDto {
  id: number;
  requestKey: string;
  userId: number;
  currentSessionId: number;
  status: LoginAccessRequestStatus;
  publicIp?: string | null;
  location?: string | null;
  device?: string | null;
  userAgent?: string | null;
  origin?: string | null;
  referer?: string | null;
  requestedAt: string;
  expiresAt: string;
  resolvedAt?: string | null;
  completedAt?: string | null;
}

// Eventos SignalR


/**
 * Solicitud recibida por el dispositivo actualmente conectado.
 */
export interface LoginApprovalRequestedDto {
  requestKey: string;
  status: string;
  publicIp?: string | null;
  location?: string | null;
  device?: string | null;
  userAgent?: string | null;
  requestedAt: string;
  expiresAt: string;
}

/**
 * Resolución recibida por el dispositivo que está esperando.
 */
export interface LoginRequestResolvedDto {
  requestKey: string;
  status: string;
  message: string;
  resolvedAt?: string | null;
}

/**
 * Evento que fuerza el cierre de la sesión anterior.
 */
export interface ForceLogoutDto {
  code: string;
  message: string;
  revokedAt: string;
}