export interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
    errors: string[]
  }
  
  export interface AuthData {
    accessToken: string
    refreshToken: string
    expiresAt: string
    userId: string
  }
  
  export interface LoginRequest {
    email: string
    password: string
  }
  
  export type LoginResponse = ApiResponse<AuthData>
  
export interface RegisterRequest {
  fullName:   string
  email:      string
  password:   string
  companyId:  number
  phone:      string
  identifier: string 
}
  

  export type RegisterResponse = ApiResponse<AuthData>
  
  export interface RefreshRequest {
    refreshToken: string
  }
  
  export type RefreshResponse = ApiResponse<AuthData>
  
  export interface ForgotPasswordRequest {
    email: string
  }
  
  export type ForgotPasswordResponse = ApiResponse<string>
  
  export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
    confirmNewPassword:string;
  }
  
  export type ResetPasswordResponse = ApiResponse<string>
  
  export interface VerifyEmailRequest {
    token: string
  }
  
  export type VerifyEmailResponse = ApiResponse<string>

export interface RegisterForm {
  fullName:  string
  email:     string
  password:  string
  companyId: number
  phone:     string
  identifier:string
}

export interface RoleResponseDto {
  roleId: number;
  roleName: string;
  description: string;
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
  value: string;
  description: string;
  type: string;
}