export interface NearestBranchRequestDto{
    latitud :number;
    longitud: number;
}

export interface NearestBranchResponseDto{
    codSucursal: string;
    sucursal: string;
    serie: string;
    latitud: number;
    longitud: number;
}

