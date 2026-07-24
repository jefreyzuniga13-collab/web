import { TipoDescuento, Vertical, type DescuentoGlobalPreparado, type PrepararDescuentoGlobalParams } from "@/Interfaces/Crm/CartPCGInterface"

/**
 * Porcentaje máximo que el agente puede ingresar visualmente.
 *
 * Ejemplo:
 * 10 representa un descuento del 10%.
 */
export const MAX_DESCUENTO_PORCENTUAL_UI = 100

/**
 * Cantidad máxima de decimales conservados
 * para los factores porcentuales enviados a la API.
 *
 * Ejemplo:
 * 4.5% se convierte en 0.045.
 */
const DECIMALES_FACTOR_PORCENTUAL = 6

/**
 * Cantidad de decimales utilizada
 * para los montos monetarios.
 */
const DECIMALES_MONTO_ABSOLUTO = 2

/**
 * Redondea un número evitando errores comunes
 * de precisión de punto flotante.
 */
const redondear = (
  valor: number,
  decimales: number
): number => {
  const factor = 10 ** decimales

  return (
    Math.round(
      (valor + Number.EPSILON) * factor
    ) / factor
  )
}

/**
 * Convierte un número a texto decimal eliminando
 * ceros innecesarios y respetando una cantidad mínima.
 *
 * Ejemplos:
 * 0.1 con mínimo 2 decimales devuelve "0.10".
 * 0.045 con mínimo 2 decimales devuelve "0.045".
 */
const formatearDecimal = (
  valor: number,
  maximoDecimales: number,
  minimoDecimales = 0
): string => {
  const valorRedondeado = redondear(
    valor,
    maximoDecimales
  )

  const [parteEntera, decimales = ""] =
    valorRedondeado
      .toFixed(maximoDecimales)
      .split(".")

  let parteDecimal = decimales

  while (
    parteDecimal.length > minimoDecimales &&
    parteDecimal.endsWith("0")
  ) {
    parteDecimal = parteDecimal.slice(0, -1)
  }

  if (!parteDecimal) {
    return parteEntera
  }

  return `${parteEntera}.${parteDecimal}`
}

/**
 * Normaliza el valor ingresado por el agente.
 *
 * Permite:
 * - números enteros;
 * - números decimales;
 * - coma o punto como separador decimal.
 *
 * No permite:
 * - valores negativos;
 * - letras;
 * - más de un separador decimal.
 */
export const normalizarDescuentoInput = (
  valor: string | number
): string => {
  const textoOriginal = String(valor ?? "")
    .trim()
    .replace(",", ".")

  if (!textoOriginal) {
    return ""
  }

  const textoNormalizado =
    textoOriginal.startsWith(".")
      ? `0${textoOriginal}`
      : textoOriginal

  if (!/^\d+(?:\.\d+)?$/.test(textoNormalizado)) {
    throw new Error(
      "Ingrese un descuento numérico válido."
    )
  }

  return textoNormalizado
}

/**
 * Convierte el sistema de la empresa al enum
 * utilizado por el endpoint.
 */
const normalizarSistema = (
  sistema: string | null | undefined
): Vertical => {
  const valor = String(sistema ?? "")
    .trim()
    .toUpperCase()

  if (valor === Vertical.A) {
    return Vertical.A
  }

  if (valor === Vertical.P) {
    return Vertical.P
  }

  throw new Error(
    "El sistema de la empresa no es válido."
  )
}

/**
 * Valida que el tipo de descuento recibido
 * sea soportado por la aplicación.
 */
const validarTipoDescuento = (
  tipo: TipoDescuento
): void => {
  if (
    tipo !== TipoDescuento.A &&
    tipo !== TipoDescuento.P
  ) {
    throw new Error(
      "El tipo de descuento no es válido."
    )
  }
}

/**
 * Valida el subtotal utilizado para comparar
 * o convertir un descuento absoluto.
 */
const validarSubtotal = (
  subtotal: number | null | undefined
): number | null => {
  if (subtotal == null) {
    return null
  }

  const valorNumerico = Number(subtotal)

  if (
    !Number.isFinite(valorNumerico) ||
    valorNumerico <= 0
  ) {
    throw new Error(
      "No existe un subtotal válido para aplicar el descuento."
    )
  }

  return valorNumerico
}

/**
 * Prepara el descuento ingresado por el agente
 * antes de enviarlo al endpoint.
 *
 * Sistema P + Tipo P:
 * El agente ingresa 10.
 * La API recibe descuento 0.10 y tipo P.
 *
 * Sistema A + Tipo P:
 * El agente ingresa 10.
 * La API recibe descuento 0.10 y tipo P.
 *
 * Sistema P + Tipo A:
 * El agente ingresa un monto, por ejemplo 150.
 * El utility calcula 150 / subtotal.
 * La API recibe el factor calculado y tipo P.
 *
 * Sistema A + Tipo A:
 * El agente ingresa un monto, por ejemplo 150.
 * La API recibe descuento 150.00 y tipo A.
 */
export const prepararDescuentoGlobal = ({
  sistema,
  tipo,
  valor,
  subtotal,
}: PrepararDescuentoGlobalParams): DescuentoGlobalPreparado => {
  const sistemaNormalizado =
    normalizarSistema(sistema)

  validarTipoDescuento(tipo)

  const valorNormalizado =
    normalizarDescuentoInput(valor)

  if (!valorNormalizado) {
    throw new Error(
      "Debe ingresar un descuento."
    )
  }

  const valorNumerico = Number(valorNormalizado)

  if (
    !Number.isFinite(valorNumerico) ||
    valorNumerico < 0
  ) {
    throw new Error(
      "Ingrese un descuento válido."
    )
  }

  /**
   * Descuento porcentual para ambos sistemas.
   *
   * El agente ingresa 10 y la API recibe 0.10.
   */
  if (tipo === TipoDescuento.P) {
    if (
      valorNumerico >
      MAX_DESCUENTO_PORCENTUAL_UI
    ) {
      throw new Error(
        `El descuento porcentual debe estar entre 0 y ${MAX_DESCUENTO_PORCENTUAL_UI}.`
      )
    }

    const factorPorcentual =
      valorNumerico / 100

    return {
      sistema: sistemaNormalizado,
      tipo: TipoDescuento.P,
      descuentoApi: formatearDecimal(
        factorPorcentual,
        DECIMALES_FACTOR_PORCENTUAL,
        2
      ),
      requiereCuentaOrden:
        sistemaNormalizado === Vertical.A,
    }
  }

  const montoAbsoluto = redondear(
    valorNumerico,
    DECIMALES_MONTO_ABSOLUTO
  )

  const subtotalValidado =
    validarSubtotal(subtotal)

  if (
    subtotalValidado != null &&
    montoAbsoluto > subtotalValidado
  ) {
    throw new Error(
      "El descuento absoluto no puede superar el subtotal."
    )
  }

  /**
   * PCG no convierte internamente el monto absoluto.
   *
   * Por eso el CRM debe convertirlo a factor:
   *
   * monto absoluto / subtotal
   *
   * Ejemplo:
   * 10 / 200 = 0.05
   *
   * Se envía tipo P porque el SP utilizará
   * el valor como factor porcentual.
   */
  if (
    sistemaNormalizado === Vertical.P &&
    tipo === TipoDescuento.A
  ) {
    if (subtotalValidado == null) {
      throw new Error(
        "Se requiere el subtotal para aplicar un descuento absoluto en PCG."
      )
    }

    const factorCalculado =
      montoAbsoluto / subtotalValidado

    return {
      sistema: Vertical.P,
      tipo: TipoDescuento.P,
      descuentoApi: formatearDecimal(
        factorCalculado,
        DECIMALES_FACTOR_PORCENTUAL,
        2
      ),
      requiereCuentaOrden: false,
    }
  }

  /**
   * Atento recibe el monto absoluto directamente.
   *
   * Ejemplo:
   * 150 se envía como "150.00" y tipo A.
   */
  return {
    sistema: Vertical.A,
    tipo: TipoDescuento.A,
    descuentoApi: montoAbsoluto.toFixed(
      DECIMALES_MONTO_ABSOLUTO
    ),
    requiereCuentaOrden: true,
  }
}