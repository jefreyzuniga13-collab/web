import { useState } from "react"
import type { ProductoModificadorPCGInterface, ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import Tooltip from "@mui/material/Tooltip"
import noimageavailable from "@/assets/noimageavailable.webp"
import Button from "@/Components/Common/Button"
import { IoMdSend } from "react-icons/io"
import { useProductPCG } from "@/Hooks/useProductPCG"
import { 
  // sendMedia, 
  SendMediaECommerceFromUrlAsync, sendText } from "@/Services/MessageService"
import "@/Styles/Chat/DetailPanel/ProductPCGTab.css"
import { toast } from "react-toastify"
import { AiOutlineLoading3Quarters } from "react-icons/ai"

interface Props {
  prod: ProductoPCGInterface
  onClick?: (product: ProductoPCGInterface) => void
  conversationId: number
}

export const ProductPCGTab = ({ prod, onClick, conversationId }: Props) => {
  const { getProductModifiers } = useProductPCG()
  const [sending, setSending] = useState(false)

  const authRaw = localStorage.getItem("auth") || "{}";
  const { userId } = JSON.parse(authRaw);

  const handleClick = () => {
    if (onClick) onClick(prod)
  }

  const buildModifiersMessage = (mods: ProductoModificadorPCGInterface[] | null | undefined) => {
    if (!mods || mods.length === 0) return ""
    const lines: string[] = []
    
    mods.forEach((mod) => {
      const required = mod.esRequerido === "S" ? " (requerido)" : ""
      // const multiple = mod.esMultipleSeleccion === "S" ? " (múltiple)" : ""
      const header = `\n${mod.descripcionMod}${required}$:`
      // {multiple}:`
      const opciones = mod.listOpciones
        .map((op) => {
          const precio = op.precioVenta > 0 ? ` - ${op.precioVenta.toFixed(2)}` : ""
          return `• ${op.descripcionOp}${precio}`
        })
        .join("\n")


        const optionMessage = `${header}\n${opciones}`;
            
            if(optionMessage.length <= 1024){
                   lines.push(optionMessage)
            }
    })

   if (!lines.length){
         toast.warn("El texto permitido para la imagen es de 1024 caractares");
          return ""
    }
       
    return `\n\nOpciones:\n${lines.join("\n")}`
  }

  const handleSendProductMessage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (sending) return
    if (!conversationId || !userId) return

    setSending(true)
    try {
      const parts: string[] = []

      if (prod.descripcion) parts.push(`Producto: ${prod.descripcion}`)
      if (prod.contenido) parts.push(`Contenido: ${prod.contenido}`)
      if (prod.precio && prod.precio > 0) parts.push(`Precio: ${prod.precio.toFixed(2)}`)

      let modifiersMsg = ""
      if (prod.tieneOpcion) {
        const mods = (await getProductModifiers(prod.codProducto)) as unknown as ProductoModificadorPCGInterface[] | null
        modifiersMsg = buildModifiersMessage(mods)
      }

      const caption = `${parts.join("\n")}${modifiersMsg}`.trim()
      if (!caption) return
      
      if (prod.imagen) {
          await SendMediaECommerceFromUrlAsync(conversationId, {
            mediaUrl: prod.imagen,
            caption,
            externalId: null,
            repliedParentMessageId: null
          })
        }
      else {
        await sendText({
          conversationId,
          senderId: userId,
          content: caption,
          messageType: "Text",
          repliedParentMessageId: null
          }
        )
      }
    } finally {
      setSending(false)
    }
  }
  
  return (
    <div className="productPCG-row" onClick={handleClick}>
      <div className="productPCG-row__image">
        <img
          src={prod.imagen != null ? prod.imagen : noimageavailable}
          aria-label="product image"
          className="product-image"
        />
      </div>
      <div className="product-rowContent">
              <span className="product-row__description">
        <Tooltip title={prod.descripcion}>
          <span>{prod.descripcion ?? ""}</span>
        </Tooltip>
      </span>

      <span className="product-row__price">
        <Tooltip title={prod.contenido}>
          <span className="product-row__price__value">{prod.contenido ?? ""}</span>
        </Tooltip>
      </span>
      </div>

      <Button
        variant="tertiary"
        className="product-row__btn"
        disabled={sending}
        onClick={handleSendProductMessage}
      >
        {sending ? <AiOutlineLoading3Quarters fontSize={12}  className="product-row__iconBtn" /> :         <IoMdSend fontSize={12} className="product-row__iconBtn" />}
      </Button>
    </div>
  )
}