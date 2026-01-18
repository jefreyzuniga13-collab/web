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
  branch: string;
  addressId?: number
  transCost?: number;
}

export interface LogCartRequestDto {
  orderId: number
  contactId: number
  conversationId: number
  statusId: number
  branch?: string;
  addressId?: number
  transCost?: number;
}

export interface LogCartFormValues {
  orderId: number
  contactId: number
  conversationId: number
  statusId: number
  branch?: string
  addressId?: number
  transCost?: number;
}