import type { ReactNode } from "react"
import { formatearDecimales } from "@/Utils/calcularIVA"

type Props = {
  /**
   * Monto a mostrar.
   */
  amount: number

  /**
   * Símbolo de moneda. Por defecto córdoba nicaragüense.
   */
  symbol?: string

  /**
   * Clase CSS opcional.
   */
  className?: string

  /**
   * Contenido alternativo (si no se quiere amount numérico).
   */
  children?: ReactNode
}

/**
 * Monto con símbolo protegido contra traducción del navegador (CAD).
 */
export default function MoneyAmount({
  amount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  symbol = "C\u200B$",
  className,
  children
}: Props) {
  return (
    <span className={className ? `notranslate ${className}` : "notranslate"} translate="no">
      {children ?? `NIO ${formatearDecimales(amount)}`}
    </span>
  )
}
