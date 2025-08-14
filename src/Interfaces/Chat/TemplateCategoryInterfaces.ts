export interface TemplateCategoryRequestDto{
    name: string;
    description: string;
    isActive: boolean;
}

export interface TemplateCategoryResponseDto{
    id: number;
    name: string;
    description: string;
    createdByName: string;
    updatedByName: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    isActive: boolean;
}