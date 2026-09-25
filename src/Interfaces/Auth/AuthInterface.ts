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

  fullName?: string;
  email?: string;
  imageUrl?: string | null;

  empresaId: string;

  companyImageUrl?: string;

  companySistema: string;

  permiteMultiPago: boolean;
  permitePasarela: boolean;
  aplicaDescuento: boolean;
  aplicaMultimoneda?: boolean;

  codReferenciaPCG?: string;

  isRoot: boolean;
  isAdmin: boolean;

  licenseExpireAt: string;
  showLicenseWarning: boolean;

  isAutomaticallyAssigned: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse =
  ApiResponse<AuthData>;

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  companyId: number;
  phone: string;
  identifier: string;
}

export type RegisterResponse =
  ApiResponse<AuthData>;

export interface ForgotPasswordRequest {
  email: string;
}

export type ForgotPasswordResponse =
  ApiResponse<string>;

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type ResetPasswordResponse =
  ApiResponse<string>;

export interface VerifyEmailRequest {
  token: string;
}

export type VerifyEmailResponse =
  ApiResponse<string>;

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
  imageUrl?: string | null;

  roles?: string[];

  empresaId: string;

  companyImageUrl?: string;

  companySistema: string;

  permiteMultiPago: boolean;
  permitePasarela: boolean;
  aplicaDescuento: boolean;
  aplicaMultimoneda?: boolean;

  codReferenciaPCG?: string;

  isRoot: boolean;
  isAdmin: boolean;

  licenseExpireAt: string;
  showLicenseWarning: boolean;

  isAutomaticallyAssigned: boolean;
}

/**
 * Respuesta 409 cuando el usuario ya tiene
 * una sesión activa.
 */
export interface LoginConflictResponseDto {
  code: "ACTIVE_SESSION_EXISTS";
  currentDevice?: string | null;
  currentLocation?: string | null;
  currentPublicIp?: string | null;
}

/**
 * Evento que fuerza el cierre de la sesión anterior.
 */
export interface ForceLogoutDto {
  code: string;
  message: string;
  revokedAt: string;
}