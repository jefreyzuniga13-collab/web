export interface CatCredencialRequestDto{
    id?: number;
    name?: string;
    description?: string;
    isActive: boolean;
}

export interface CatCredencialResponseDto{
    id: number;
    name: string;
    description?: string;
    isActive?: boolean;
    createdById?: number;
    createdByName?: string;
    updatedById?: number;
    updatedByName?: string;
}