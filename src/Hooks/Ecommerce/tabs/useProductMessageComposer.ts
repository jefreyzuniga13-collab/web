import { useCallback, useMemo, useState } from "react"
import type {ProductoPCGInterface, ProductoModificadorPCGInterface} from "@/Interfaces/Chat/ProductPCGInterface"
import { buildModifiersText } from "@/Utils/ECommerce/buildModifiersText"
import { SendMediaECommerceFromUrlAsync } from "@/Services/chat/MessageService"
import { useProductPCG } from "@/Hooks/Ecommerce/tabs/useProductPCG"
import { toast } from "react-toastify"
import { selectUserId } from '@/Context/Slices/Auth/authSlice';
import { useSelector } from "react-redux"
import vacio from '@/assets/vacio.png'
import { formatearDecimales } from "@/Utils/calcularIVA"

export type ProductQuoteOption = {
  group: string
  name: string
  qty: number
  price: number
}

type Props = {
  product: ProductoPCGInterface
  conversationId: number
  observation?: string
  maxLen?: number
  fallbackMediaUrl?: string 
  includeModifiers?: boolean
  codPrecio?: string
  quantity?: number
  quoteOptions?: ProductQuoteOption[]
}

const buildBaseCaption = (
  p: ProductoPCGInterface,
  quantity?: number
): string => {
  const parts: string[] = []
  if (p.descripcion) parts.push(`*Producto:* ${p.descripcion}`)
  if (p.contenido) parts.push(`*Contenido:* ${p.contenido}`)
  if (quantity && quantity > 1) parts.push(`*Cantidad:* ${quantity}`)
  // if (p.precio && Number(p.precio) > 0) {
  //   parts.push(`*Precio:* C$ ${formatearDecimales(p.precio)}`)
  // }
  return parts.join("\n").trim()
}

const buildQuoteCaption = (
  unitPrice: number,
  quantity: number,
  lines: ProductQuoteOption[] | undefined
): string => {
  const selected = lines ?? []
  const qty = Math.max(1, quantity || 1)
  const hasSelection = selected.length > 0
  const price = Number(unitPrice ?? 0)

  if (!hasSelection) {
    if (price <= 0) return ""

    const chunks = [`*Precio:* C$ ${formatearDecimales(price)}`]

    if (qty > 1) {
      chunks.push(`*Total:* C$ ${formatearDecimales(qty * price)}`)
    }

    return `\n\n${chunks.join("\n")}`
  }

  const chunks: string[] = []
  let optionsTotal = 0

  if (hasSelection) {
    const groups = new Map<string, ProductQuoteOption[]>()

    selected.forEach((line) => {
      const key = line.group.trim() || "Opciones"
      const current = groups.get(key) ?? []
      current.push(line)
      groups.set(key, current)
    })

    chunks.push("*Opciones:*")

    let groupNumber = 0
    groups.forEach((items, group) => {
      groupNumber += 1
      chunks.push(`${groupNumber}. ${group}:`)
      items.forEach((item, optionIndex) => {
        const optionQty = Math.max(1, item.qty || 1)
        const price = Number(item.price ?? 0)
        optionsTotal += optionQty * price
        const qtyText = optionQty > 1 ? ` x${optionQty}` : ""
        // const priceText = price > 0 ? ` - C$ ${formatearDecimales(price)}` : ""
        chunks.push(
          // `${groupNumber}.${optionIndex + 1} ${item.name}${qtyText}${priceText}`
          `${groupNumber}.${optionIndex + 1} ${item.name}${qtyText}`
        )
      })
    })
  }

  const total = qty * Number(unitPrice ?? 0) + optionsTotal
  if (total > 0) {
    chunks.push(`*Total:* C$ ${formatearDecimales(total)}`)
  }

  if (!chunks.length) return ""
  return `\n\n${chunks.join("\n")}`
}

export const useProductMessageComposer = () => {
  const { getProductModifiers } = useProductPCG()
  const [sending, setSending] = useState(false)
  
  const userId = useSelector(selectUserId);
  
    const sendProductMessage = useCallback(
    async ({
      product,
      conversationId,
      observation,
      maxLen = 1024,
      fallbackMediaUrl,
      includeModifiers = true,
      codPrecio,
      quantity,
      quoteOptions,
    }: Props) => {
      if (sending) return
      if (!conversationId) return

      if (!userId) return

      setSending(true)
      try {
        const base = buildBaseCaption(product, quantity)
        if (!base) return

        let modsText = ""
        if (includeModifiers && product.tieneOpcion) {
          
          const mods = (await getProductModifiers(
          product.codProducto,
          codPrecio || "01"
        )) as ProductoModificadorPCGInterface[] | null

          modsText = buildModifiersText(mods, {
            maxLen,
            includeRequiredTag: true,
            includePrices: true,
            currencyPrefix: "C$ ",
            title: "*Opciones:*",
          })

          if (!modsText && mods && mods.length > 0) {
            toast.warn("El texto permitido para la imagen es de 1024 caracteres.")
          }
        }

        const quoteText = includeModifiers
          ? ""
          : buildQuoteCaption(
              Number(product.precio ?? 0),
              quantity ?? 1,
              quoteOptions
            )

        const obsText =
          observation && observation.trim().length > 0
            ? `\n\n*📝 Observación :* ${observation.trim()}`
            : ""

        const caption = `${base}${quoteText}${modsText}${obsText}`.trim()

        if (!caption) return
        
        if (caption.length > maxLen) {
          toast.warn("El texto permitido para la imagen es de 1024 caracteres.")
          return
        }

        const mediaUrl =
          product.imagen && product.imagen.trim() !== ""
            ? product.imagen
            : fallbackMediaUrl ??
              vacio

        await SendMediaECommerceFromUrlAsync(conversationId, {
          mediaUrl,
          caption,
          externalId: null,
          repliedParentMessageId: null,
        })
      } finally {
        setSending(false)
      }
    },
    [getProductModifiers, sending]
  )

  return useMemo(
    () => ({
      sending,
      sendProductMessage,
    }),
    [sending, sendProductMessage]
  )
}
