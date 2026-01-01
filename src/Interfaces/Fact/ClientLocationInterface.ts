export interface ClientLocationDto{
    idDireccion: number;
    nombre: string;
    referencia: string;
    descripcion: string;
    latitud: number;
    longitud: number;
    idUsuario: number;
}


export interface Coords {
  latitud: number;
  longitud: number;
}

export type LocationMode = "existing" | "new";