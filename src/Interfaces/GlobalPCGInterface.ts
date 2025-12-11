export interface ApiPCGResponse<T> {
    success: boolean
    message: string
    data: T
}

export interface TempLinkResolveResponseDto{
    conversationId: number;
    fullName: string;
    ecommerceUserId: number;
    email: string;
    expiresAtUtc: Date
    orderId: number
    contactId: number
    userId: number;
}