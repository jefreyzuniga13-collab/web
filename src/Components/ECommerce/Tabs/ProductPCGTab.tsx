import { useCallback } from "react"
import type { ChangeEvent, MouseEvent } from "react"
import Tooltip from "@mui/material/Tooltip"
import { IoMdSend } from "react-icons/io"
import { MdInventory } from "react-icons/md"
import { FaShoppingCart } from "react-icons/fa"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { toast } from "react-toastify"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import Button from "@/Components/Common/Button"
import vacio from "@/assets/vacio.png"
import "@/Styles/Ecommerce/ProductPCGTab.css"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/tabs/useProductMessageComposer"
import { formatearDecimales } from "@/Utils/calcularIVA"

interface Props {
  prod: ProductoPCGInterface
  onClick?: (product: ProductoPCGInterface) => void
  conversationId: number
  simpleQuantity: number
  handleChangeSimpleQuantity: (e: ChangeEvent<HTMLInputElement>) => void
  cartLoading: boolean
}

const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1000) return 1000
  return Math.floor(n)
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
    const qty = clampQty(Number(simpleQuantity))

    if (qty <= 0) {
      toast.warning("La cantidad debe ser al menos 1.")
      return
    }

    if (prod.tieneOpcion) {
      toast.info(
        "Este producto tiene modificadores. Debe abrir el detalle para seleccionar las opciones."
      )
      handleOpenDetail()
      return
    }

    await addProduct({
      product: prod,
      qty,
      observacion: "",
      modifierOptions: [],
      onDoneUiReset: false,
      branch: "",
      branchName: "",
      wherehouse: "",
      wherehouseCode: "",
      serie: "",
      codPrecio:""
    })
  }, [addProduct, prod, simpleQuantity, handleOpenDetail])

  const handleSendMessage = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
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
            src={prod.imagen || vacio}
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
            {prod.precio > 0 ? `C$ ${formatearDecimales(prod.precio) }` : ""}
          </span>
        </div>
      </div>

      <div className="productTab-simpleAddBar">
        <div className="productTab-simpleAddBar-cart">
          <input
            type="number"
            min={1}
            max={100}
            value={simpleQuantity}
            onChange={handleChangeSimpleQuantity}
            className="productTab-simpleAddBar__input"
          />

          <Button
            type="button"
            onClick={handleSimpleAdd}
            className="productTab-simpleAddBar__btn simpleAddBar-secondary"
            disabled={simpleQuantity <= 0 || cartLoading}
            title={
              prod.tieneOpcion
                ? "Abrir detalle para seleccionar opciones"
                : "Agregar al carrito"
            }
          >
            <FaShoppingCart fontSize={12} />
          </Button>

        <Button
          variant="primary"
          disabled={sending}
          onClick={handleSendMessage}
          className="productTab-simpleAddBar__btn"
        >
          {sending ? (
            <AiOutlineLoading3Quarters
              fontSize={12}

            />
          ) : (
            <IoMdSend fontSize={12}  />
          )}
        </Button>
        </div>
      </div>
    </div>
  )
}