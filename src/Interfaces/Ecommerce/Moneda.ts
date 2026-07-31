/**
 * Moneda disponible para registrar pagos en PCG.
 *
 * El campo `id` es el valor que debe enviarse en la propiedad
 * `moneda` del detalle de pago y de FacturaTempo.
 */
export interface MonedaInterface {
  /**
   * Identificador de la moneda en PCG.
   *
   * Ejemplos:
   * - "1": Córdoba
   * - "2": Dólar
   */
  id: string

  /**
   * Nombre completo de la moneda.
   *
   * Ejemplos:
   * - Córdoba
   * - Dólar
   */
  moneda: string

  /**
   * Símbolo utilizado para mostrar la moneda.
   *
   * Ejemplos:
   * - C$
   * - US$
   */
  simbolo: string

  /**
   * Abreviatura de la moneda.
   *
   * Ejemplos:
   * - NIO
   * - USD
   */
  abreviatura: string

  /**
   * Indica si la moneda está activa.
   *
   * Valores esperados:
   * - "S": activa
   * - "N": inactiva
   */
  activo: string
}

/**
 * Tasa de cambio correspondiente a una fecha determinada.
 */
export interface TasaCambioInterface {
  /**
   * Fecha utilizada para obtener la tasa.
   */
  fechaCambio: string

  /**
   * Valor de la tasa retornada por PCG.
   *
   * Se mantiene como string porque así lo devuelve el servicio.
   * Debe convertirse a number antes de realizar cálculos.
   */
  tasaCambio: string
}