import { useCallback } from "react"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import Tooltip from "@mui/material/Tooltip"
import Button from "@/Components/Common/Button"
import { IoMdSend } from "react-icons/io"
import { MdInventory } from "react-icons/md"
import { FaShoppingCart } from "react-icons/fa"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import aguamarina from "@/assets/aguamarina.png"
import "@/Styles/Ecommerce/ProductPCGTab.css"

import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/useProductMessageComposer"

interface Props {
  prod: ProductoPCGInterface
  onClick?: (product: ProductoPCGInterface) => void
  conversationId: number
  simpleQuantity: number
  handleChangeSimpleQuantity: (e: React.ChangeEvent<HTMLInputElement>) => void
  cartLoading: boolean
}

export const ProductPCGTab = ({
  prod,
  onClick,
  conversationId,
  simpleQuantity,
  handleChangeSimpleQuantity,
  cartLoading,
}: Props) => {
  const { addProduct } = useCartPCGFlowCtx()
  const { sending, sendProductMessage } = useProductMessageComposer()

  const handleOpenDetail = useCallback(() => {
    if (onClick) onClick(prod)
  }, [onClick, prod])

  const handleSimpleAdd = useCallback(async () => {
    await addProduct({
      product: prod,
      qty: simpleQuantity,
      onDoneUiReset: false,
    })
  }, [addProduct, prod, simpleQuantity])

  const handleSendMessage = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()

      await sendProductMessage({
        product: prod,
        conversationId,
      })
    },
    [sendProductMessage, prod, conversationId]
  )

  return (
    <div className="productPCG-row">
      <div className="productPCG-row-header" onClick={handleOpenDetail}>
        <div className="productPCG-row__image">
          <img
            src={prod.imagen || aguamarina}
            aria-label="product image"
            className="product-image"
          />
        </div>

        <div className="product-rowContent">
          <span className="product-row__description">
            <Tooltip title={prod.descripcion}>
              <p className="product-row__description-text product-row__description-text-margin">
                {prod.codProducto}{" "}
                <span className="product-row__description-text">
                  {prod.descripcion ?? ""}
                </span>
              </p>
            </Tooltip>
          </span>

          <span className="product-row__description-marca">
            {prod.marca ?? ""}
          </span>

          <span className="product-row__description-existencia">
            {prod.existencia > 0 && (
              <>
                <MdInventory fontSize={12} />
                {prod.existencia}
              </>
            )}
          </span>

          <span className="product-row__description-text-price">
            {prod.precio > 0 ? `C$ ${prod.precio}` : ""}
          </span>
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
            onClick={handleSimpleAdd}
            disabled={simpleQuantity <= 0 || cartLoading}
          >
            <FaShoppingCart fontSize={12} />
          </button>
        </div>

        <Button
          variant="tertiary"
          className="product-row__btn"
          disabled={sending}
          onClick={handleSendMessage}
        >
          {sending ? (
            <AiOutlineLoading3Quarters
              fontSize={12}
              className="product-row__iconBtn"
            />
          ) : (
            <IoMdSend fontSize={12} className="product-row__iconBtn" />
          )}
        </Button>
      </div>
    </div>
  )
}