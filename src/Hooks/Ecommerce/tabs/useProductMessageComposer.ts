import { useCallback, useMemo, useState } from "react"
import type {
  ProductoPCGInterface,
  ProductoModificadorPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface"
import { buildModifiersText } from "@/Utils/ECommerce/buildModifiersText"
import { SendMediaECommerceFromUrlAsync } from "@/Services/chat/MessageService"
import { useProductPCG } from "@/Hooks/Ecommerce/tabs/useProductPCG"
import { toast } from "react-toastify"
import { selectUserId } from '@/Context/Slices/Auth/authSlice';
import { useSelector } from "react-redux"
import vacio from '@/assets/vacio.png'

type SendProductMessageArgs = {
  product: ProductoPCGInterface
  conversationId: number
  observation?: string
  maxLen?: number
  fallbackMediaUrl?: string 
  includeModifiers?: boolean
}


const buildBaseCaption = (p: ProductoPCGInterface): string => {
  const parts: string[] = []
  if (p.descripcion) parts.push(`*Producto:* ${p.descripcion}`)
  if (p.contenido) parts.push(`*Contenido:* ${p.contenido}`)
  if (p.precio && Number(p.precio) > 0) {
    parts.push(`*Precio:* C$ ${(p.precio)}`)
  }
  return parts.join("\n").trim()
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
    }: SendProductMessageArgs) => {
      if (sending) return
      if (!conversationId) return

      if (!userId) return

      setSending(true)
      try {
        const base = buildBaseCaption(product)
        if (!base) return

        let modsText = ""
        if (includeModifiers && product.tieneOpcion) {
          const mods = (await getProductModifiers(
            product.codProducto
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

        const obsText =
          observation && observation.trim().length > 0
            ? `\n\n*📝 Observación :* ${observation.trim()}`
            : ""

        const caption = `${base}${modsText}${obsText}`.trim()

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