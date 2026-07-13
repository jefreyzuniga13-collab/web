import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"

/**
 * Dirección guardada de un usuario ecommerce.
 *
 * Las coordenadas son opcionales porque una dirección puede provenir
 * del flujo de solo texto.
 */
export interface ClientLocationDto {
  idDireccion?: number
  nombre?: string
  referencia?: string
  descripcion?: string
  latitud?: number
  longitud?: number
  idUsuario?: number
}

/**
 * Coordenadas seleccionadas en el mapa.
 */
export interface Coords {
  latitud: number
  longitud: number
}

/**
 * Modos de captura de dirección disponibles en checkout.
 *
 * existing:
 * Usa una dirección guardada.
 *
 * new:
 * Crea una nueva dirección utilizando el mapa.
 *
 * text:
 * Permite ingresar únicamente texto, sin mapa ni coordenadas.
 */
export type LocationMode =
  | "existing"
  | "new"
  | "text"

/**
 * Modelo alternativo de dirección utilizado por algunos servicios.
 */
export interface ClientLocation2Dto {
  idDireccion?: number
  nombre?: string
  referencia?: string
  descripcion?: string
  latitud?: number
  longitud?: number
}

/**
 * Resultado de la validación de totales.
 */
export interface CalculationResultDto {
  pasasub: SINO
  resulsub: number
  pasadesc: SINO
  resuldesc: number
  pasaiva: SINO
  resuliva: number
}

/**
 * Solicitud para calcular totales del checkout.
 */
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

/**
 * Solicitud para validar los totales mostrados en pantalla.
 */
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