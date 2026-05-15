import type { ProductoModificadorPCGInterface, listaOpciones } from "@/Interfaces/Chat/ProductPCGInterface"
import { formatearDecimales } from "@/Utils/calcularIVA"

type BuildModifiersTextOptions = {
  maxLen?: number
  includeRequiredTag?: boolean
  includePrices?: boolean
  currencyPrefix?: string
  headerPrefix?: string
  title?: string
}

export const buildModifiersText = (
  mods: ProductoModificadorPCGInterface[] | null | undefined,
  options?: BuildModifiersTextOptions
) => {
  if (!mods || mods.length === 0) return ""

  const maxLen = options?.maxLen ?? 1024
  const includeRequiredTag = options?.includeRequiredTag ?? true
  const includePrices = options?.includePrices ?? true
  const currencyPrefix = options?.currencyPrefix ?? "C$ "
  const headerPrefix = options?.headerPrefix ?? ""
  const title = options?.title ?? "Opciones:"

  const lines: string[] = []

  mods.forEach((mod) => {
    const required = includeRequiredTag && mod.esRequerido === "S" ? " (requerido)" : ""
    const header = `\n${headerPrefix}${mod.descripcionMod ?? ""}${required}:`

    const opciones = (mod.listOpciones ?? [])
      .map((op: listaOpciones) => {
        const precio =
          includePrices && Number(op.precioVenta ?? 0) > 0 ? ` - ${currencyPrefix}${formatearDecimales(op.precioVenta)}` : ""
        return `• ${op.descripcionOp ?? ""}${precio}`
      })
      .join("\n")

    const chunk = `${header}\n${opciones}`.trim()

    if (chunk.length <= maxLen) lines.push(chunk)
  })

  if (!lines.length) return ""

  const body = `${title}\n${lines.join("\n")}`.trim()
  if (body.length > maxLen) return ""

  return `\n\n${body}`
}
