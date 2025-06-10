
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