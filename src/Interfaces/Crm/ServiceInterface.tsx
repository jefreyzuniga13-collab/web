export interface ServiceResponseDto{
    id: number;
    name: string;
    description: string;
    createdById: number;
    createdByName: string;
    updatedById?: number;
    updatedByName?: string;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean
}

export interface ServiceRequestDto{
    name: string;
    description: string;
    isActive: boolean;
}