export interface LogCartResponseDto {
  id: number
  orderId: number
  userId: number
  userName: string
  contactId: number
  contactName: string
  createdAt: string
  updatedAt: string | null
  conversationId: number
  createdById: number
  createdByName: string
  updatedById: number | null
  updatedByName: string | null
  statusId: number
  statusName: string
}

export interface LogCartRequestDto {
  orderId: number
  contactId: number
  // userId: number
  conversationId: number
  statusId: number
}

export interface LogCartFormValues {
  orderId: number
  contactId: number
  // userId: number
  conversationId: number
  statusId: number
}