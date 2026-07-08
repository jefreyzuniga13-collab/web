export interface ClientLocationDto {
  idDireccion?: number
  nombre?: string
  referencia?: string
  descripcion?: string
  latitud?: number
  longitud?: number
  idUsuario?: number
}

export interface Coords {
  latitud: number
  longitud: number
}

export type LocationMode = "existing" | "new"

export interface ClientLocation2Dto {
  idDireccion?: number
  nombre?: string
  referencia?: string
  descripcion?: string
  latitud?: number
  longitud?: number
}

export interface CalculationResultDto {
  pasasub: "S" | "N"
  resulsub: number
  pasadesc: "S" | "N"
  resuldesc: number
  pasaiva: "S" | "N"
  resuliva: number
}

export interface CalculationReqDto {
  usuario: string
  maquina: string
  tasa: number
  tabla: string
  ir: string
  imi: string
  tipoServicio: string
  valorTransporte: number
  aplicaPropina: string
  exonerada: string
}

export interface TotalesPantallaReqDTO {
  usuario: string
  maquina: string
  sucursal: string
  totalEnPantalla: number
  tabla: string
  descuentoPantalla: number
  ivaPantalla: number
  exonerado: string
}