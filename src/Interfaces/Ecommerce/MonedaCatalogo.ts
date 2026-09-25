export interface MonedaCatalogo {
  id: string
  moneda: string
  simbolo: string
  abreviatura: string
  activo: string
}

export interface TasaCambioCatalogo {
  fechaCambio?: string
  FECHA_CAMBIO?: string
  tasaCambio?: string | number
  TasaCambio?: string | number
}
