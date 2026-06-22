/**
 * Item visual de producto PCG.
 *
 * Muestra la información básica del producto y sus acciones.
 * Permite abrir detalle, enviar por mensaje, agregar individualmente
 * o seleccionar/deseleccionar para agregar varios desde el botón global.
 *
 * La sucursal no se maneja aquí. El flujo global del carrito aplica una sola
 * sucursal para todos los productos seleccionados.
 */
import { useCallback } from "react"
import type { ChangeEvent, MouseEvent } from "react"
import Tooltip from "@mui/material/Tooltip"
import { IoMdSend } from "react-icons/io"
import { MdInventory, MdAddTask, MdCheckCircle } from "react-icons/md"
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
import { clampQty } from "@/Utils/ECommerce/formatters"

interface Props {
  prod: ProductoPCGInterface
  onClick?: (product: ProductoPCGInterface) => void
  conversationId: number
  simpleQuantity: number
  handleChangeSimpleQuantity: (e: ChangeEvent<HTMLInputElement>) => void
  cartLoading: boolean

  batchMode?: boolean
  selectedCount?: number
  isSelected?: boolean
  isConfigured?: boolean
  onToggleSelect?: (product: ProductoPCGInterface) => void
  onChangeBatchQuantity?: (product: ProductoPCGInterface, qty: number) => void
}

export const ProductPCGTab = ({
  prod,
  onClick,
  conversationId,
  simpleQuantity,
  handleChangeSimpleQuantity,
  cartLoading,

  batchMode = false,
  selectedCount = 0,
  isSelected = false,
  isConfigured = false,
  onToggleSelect,
  onChangeBatchQuantity,
}: Props) => {
  const { addProduct } = useCartPCGFlowCtx()
  const { sending, sendProductMessage } = useProductMessageComposer()

  const hasActiveSelection = batchMode && selectedCount > 0

  const handleOpenDetail = useCallback(() => {
    onClick?.(prod)
  }, [onClick, prod])

  const handleToggleSelection = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()

      onToggleSelect?.(prod)
    },
    [onToggleSelect, prod]
  )

  const handleBatchQuantityChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const qty = clampQty(Number(e.target.value))
      onChangeBatchQuantity?.(prod, qty)
    },
    [onChangeBatchQuantity, prod]
  )

  const handleSimpleAdd = useCallback(async () => {
    const qty = clampQty(Number(simpleQuantity))

    if (qty <= 0) {
      toast.warning("La cantidad debe ser al menos 1.")
      return
    }

    if (prod.tieneOpcion) {
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
      codPrecio: "",
    })
  }, [addProduct, prod, simpleQuantity, handleOpenDetail])

  const handleCartButtonClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      e.preventDefault()

      if (hasActiveSelection) return

      await handleSimpleAdd()
    },
    [hasActiveSelection, handleSimpleAdd]
  )

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

  const disabledCartButton =
    cartLoading || simpleQuantity <= 0 || hasActiveSelection

  const quantityDisabled = batchMode && !isSelected

  return (
    <div
      className={`productPCG-row ${
        isSelected ? "productPCG-row--selected" : ""
      }`}
    >
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
            {prod.precio > 0 ? `C$ ${formatearDecimales(prod.precio)}` : ""}
          </span>

          {batchMode && isSelected && (
            <span
              className={`product-row__batchStatus ${
                isConfigured
                  ? "product-row__batchStatus--configured"
                  : "product-row__batchStatus--pending"
              }`}
            >
              {isConfigured ? "✓ Listo" : "Pendiente"}
            </span>
          )}
        </div>
      </div>

      <div className="productTab-simpleAddBar">
        <div className="productTab-simpleAddBar-cart">
          <input
            type="number"
            min={1}
            max={100}
            value={simpleQuantity}
            onChange={
              batchMode && isSelected
                ? handleBatchQuantityChange
                : handleChangeSimpleQuantity
            }
            className="productTab-simpleAddBar__input"
            disabled={quantityDisabled}
          />

          {batchMode && (
            <Tooltip title={isSelected ? "Deseleccionar" : "Seleccionar"}>
              <span>
                <Button
                  type="button"
                  onClick={handleToggleSelection}
                  className={`productTab-simpleAddBar__btn simpleAddBar-select ${
                    isSelected ? "simpleAddBar-select--active" : ""
                  }`}
                  disabled={cartLoading}
                >
                  {isSelected ? (
                    <MdCheckCircle fontSize={20} />
                  ) : (
                    <MdAddTask fontSize={20} />
                  )}
                </Button>
              </span>
            </Tooltip>
          )}

          <Tooltip
            title={
              hasActiveSelection
                ? "Agregar desde el botón global"
                : prod.tieneOpcion
                  ? "Abrir detalle para configurar"
                  : "Agregar al carrito"
            }
          >
            <span>
              <Button
                type="button"
                onClick={handleCartButtonClick}
                className="productTab-simpleAddBar__btn simpleAddBar-secondary"
                disabled={disabledCartButton}
              >
                <FaShoppingCart fontSize={20} />
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Enviar producto">
            <span>
              <Button
                variant="primary"
                disabled={sending}
                onClick={handleSendMessage}
                className="productTab-simpleAddBar__btn"
              >
                {sending ? (
                  <AiOutlineLoading3Quarters fontSize={20} />
                ) : (
                  <IoMdSend fontSize={20} />
                )}
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}