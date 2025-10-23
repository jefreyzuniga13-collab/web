export interface RoleResponseDto {
  roleId: number
  roleName: string
  description?: string | null
  isActive: boolean
}

export interface CreateRoleRequest {
  roleName: string
  description?: string | null
}

export interface UpdateRoleRequest {
  roleId: number
  roleName: string
  description?: string | null
}

export interface AssignRoleMenuRequest {
  roleId: number
  menuId: number
}

export interface SyncRoleMenusRequest {
  roleId: number
  menuIds: number[]
}


export interface MenuResponseDto {
  menuId: number
  name: string
  description: string
  url: string
  index: number
  icon: string
  isActive: boolean
}

export interface RoleMenuResponseDto {
  roleId: number
  menuId: number
  isActive: boolean
  assignedAt: string
  updateAt: string
  roleName?: string | null
  menuName?: string | null
  menuUrl?: string | null
  menuIndex?: number | null
  menuIcon?: string | null
}