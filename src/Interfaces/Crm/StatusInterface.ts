export interface StatusResponseDto {
  id: number
  name: string
  descripcion?: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  createdById: number
  updatedById?: number
}