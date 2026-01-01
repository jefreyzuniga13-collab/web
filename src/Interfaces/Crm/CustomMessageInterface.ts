export interface CustomMessageRequestDto{
    content: string;
    isActive: boolean;
}

export interface CustomMessageResponseDto{
    id: number;
    content: string;
    isActive: boolean;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
    createdByName: string;
    createdById: number;
    updatedById: number | null;
    updatedByName: Date | string | null;
}