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
    contactId: string
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
    token: string
    newPassword: string
    confirmNewPassword:string
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
