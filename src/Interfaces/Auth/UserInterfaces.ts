
export interface User {
  userId: number;
  fullName: string;
  email: string;
  isActive: boolean;
  companyId: number;
  phone: string | null;
  identifier: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  clientType: string | null;
  lastOnline: string | null;
  isOnline: boolean;
  incognitoMode: boolean
  codReferenciaPCG? : string
  roles: Role[];
}

export interface Role {
  roleId: number;
  roleName: string;
  description?: string | null;
}

export interface PaginatedUsers {
  items: User[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string[] | null;
}


export interface OperationResultProj {
  // Define las propiedades que devuelve tu servicio
  id: number;
  fullName: string;
}
export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  companyId: number;
  phone?: string;
  identifier?: string;
  roleIds: number[];
  imageUrl?: string;
  sendWelcomeEmail?: boolean;
  incognitoMode?: boolean
  codReferenciaPCG? : string
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  isActive: boolean;
  companyId: number;
  phone?: string;
  identifier?: string;
  newPassword?: string;
  imageUrl?: string;
  roleIds: number[];
  incognitoMode?: boolean
    codReferenciaPCG? : string
}

export interface UserHistoryItem {
  id: number;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export interface Company {
  companyId: number;
  name: string;
}
export interface PresenceDto {
  lastOnline?: string;
  isOnline: boolean;
}

export interface ContactLog{
  id: number;
  waName: number;
  waUserId?: number;
  phone: number;
  idCard?: string;
  fullName?: string;
  company?: Company;
  isVerified?: boolean;
  status?: boolean;
  createdAt: string;
  UpdatedAt?: string;
}