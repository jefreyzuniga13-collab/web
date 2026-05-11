export interface LogCartDetailRequestDto {
    codProducto: string;
    unico: string;
    logCartId: number;
}

export interface LogCartDetailResponseDto {
    id: number;
    codProducto: string;
    unico: string;
    isActive: boolean;
    createdById: number;
    createdByName: number;
    updatedById: number | null;
    updatedByName: number | null;
    logCartId: number;
    createdAt: string;
    updatedAt: string | null;
}

