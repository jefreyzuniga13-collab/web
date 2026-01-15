import { useState } from "react"
import type {
  ProductoModificadorPCGInterface,
  ProductoPCGInterface
} from "@/Interfaces/Chat/ProductPCGInterface"
import Tooltip from "@mui/material/Tooltip"
// import noimageavailable from "@/assets/noimageavailable.webp"
import Button from "@/Components/Common/Button"
import { IoMdSend } from "react-icons/io"
import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG"
import {
  // sendMedia, 
  SendMediaECommerceFromUrlAsync, 
  // sendText
} from "@/Services/chat/MessageService"
import { MdInventory } from "react-icons/md";
import "@/Styles/Ecommerce/ProductPCGTab.css"
import { toast } from "react-toastify"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { FaShoppingCart } from "react-icons/fa"
import aguamarina from '@/assets/aguamarina.png'

interface Props {
  prod: ProductoPCGInterface
  onClick?: (product: ProductoPCGInterface) => void
  conversationId: number;
  simpleQuantity: number;
  handleChangeSimpleQuantity: (e: React.ChangeEvent<HTMLInputElement>)=> void;
  handleSimpleAdd: (productDetail: ProductoPCGInterface)=> void;
  cartLoading: boolean;
}
export const ProductPCGTab = ({ prod, onClick,
  conversationId,
  cartLoading,
  handleChangeSimpleQuantity,
  handleSimpleAdd,
  simpleQuantity

}: Props) => {
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

      if (optionMessage.length <= 1024) {
        lines.push(optionMessage)
      }
    })

    if (!lines.length) {
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

      // if (prod.imagen) {
        //si no tiene url el prod.image, se envia la imagen que esta en loa assets
        // await SendMediaECommerceFromUrlAsync(conversationId, {
        //   mediaUrl: prod.imagen || aguamarina,
        //   caption,
        //   externalId: null,
        //   repliedParentMessageId: null
        // })
        const mediaUrl =
          prod.imagen && prod.imagen.trim() !== ""
            ? prod.imagen
            : 'https://i.ibb.co/ccjvL5Nh/aguamarina.png'

        await SendMediaECommerceFromUrlAsync(conversationId, {
          mediaUrl,
          caption,
          externalId: null,
          repliedParentMessageId: null
        })
      // }
      // else {
      //   await sendText({
      //     conversationId,
      //     senderId: userId,
      //     content: caption,
      //     messageType: "Text",
      //     repliedParentMessageId: null
      //   }
      //   )
      // }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="productPCG-row">
      <div className="productPCG-row-header"onClick={handleClick} >
        <div className="productPCG-row__image">
          <img
            // src={prod.imagen != null ? prod.imagen : noimageavailable}
             src={prod.imagen || aguamarina}
            aria-label="product image"
            className="product-image"
          />
        </div>
        <div className="product-rowContent">
          <span className="product-row__description">
            <Tooltip title={prod.descripcion}>
              <p className="product-row__description-text product-row__description-text-margin">{prod.codProducto} <span className="product-row__description-text">{prod.descripcion ?? ""}</span></p>
            </Tooltip>
          </span>
          {/* <span className="product-row__price">
        <Tooltip title={prod.contenido}>
          <span className="product-row__price__value">{prod.contenido ?? ""}</span>
        </Tooltip>
      </span> */}
      <span className="product-row__description-marca">{prod.marca ?? ""}</span>  
      <span className="product-row__description-existencia">{prod.existencia > 0 ? 
      <>
      <MdInventory fontSize={12}/>
      {prod.existencia }
      </>
      :
       ""}</span>
        <span className="product-row__description-text-price">{prod.precio > 0 ? "C$ " + prod.precio : ""}</span>
        </div>
      </div>

      <div className="productTab-simpleAddBar">
        <div className="productTab-simpleAddBar-cart">
          <input
          type="number"
          min={1}
          max={1000}
          value={simpleQuantity}
          onChange={handleChangeSimpleQuantity}
          className="productTab-simpleAddBar__input"
        />
        <button
          type="button"
          className="productTab-buyButton__general"
          onClick={() => handleSimpleAdd(prod)}
          disabled={simpleQuantity <= 0 || cartLoading}
        >
          <FaShoppingCart fontSize={12} />
        </button>
      </div>
            
            
      <Button
        variant="tertiary"
        className="product-row__btn"
        disabled={sending}
        onClick={handleSendProductMessage}
      >
        {sending ? <AiOutlineLoading3Quarters
          fontSize={12}
          className="product-row__iconBtn" /> :
          <IoMdSend fontSize={12} className="product-row__iconBtn" />}
      </Button>
      </div>

    </div>
  )
}