export interface ApiPCGResponse<T> {
    success: boolean;
    message: string;
    data: T;

    //agregaron este campo a la paginaciones de productos
    totalItems?: string;
}

export interface TempLinkResolveResponseDto {
  conversationId: number
  fullName: string
  ecommerceUserId: number
  email: string
  expiresAtUtc: string
  orderId: number
  contactId: number
  userId: number
  empresaId: string

  permiteMultiPago: boolean
  permitePasarela: boolean
  aplicaMultimoneda: boolean
}
