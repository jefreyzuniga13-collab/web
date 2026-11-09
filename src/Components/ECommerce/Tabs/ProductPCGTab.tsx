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
import {
  memo,
  useCallback,
  useRef,
} from "react"
import type {
  ChangeEvent,
  MouseEvent,
} from "react"
import Tooltip from "@mui/material/Tooltip"
import { MdInventory } from "react-icons/md"
import { CirclePlus, CircleMinus, ClipboardList } from "lucide-react"
import { FaFileInvoiceDollar, FaShoppingCart } from "react-icons/fa"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { toast } from "react-toastify"

import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import Button from "@/Components/Common/Button"
import vacio from "@/assets/vacio.png"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/tabs/useProductMessageComposer"
import { formatearDecimales } from "@/Utils/calcularIVA"
import { clampQty } from "@/Utils/ECommerce/formatters"

import "@/Styles/Ecommerce/ProductPCGTab.css"

interface Props {
  prod: ProductoPCGInterface
  onClick?: (
    product: ProductoPCGInterface
  ) => void
  conversationId: number
  simpleQuantity: number
  handleChangeSimpleQuantity: (
    event: ChangeEvent<HTMLInputElement>
  ) => void
  cartLoading: boolean

  batchMode?: boolean
  selectedCount?: number
  isSelected?: boolean
  isConfigured?: boolean
  onToggleSelect?: (
    product: ProductoPCGInterface
  ) => void
  onChangeBatchQuantity?: (
    product: ProductoPCGInterface,
    qty: number
  ) => void
}

const ProductPCGTabComponent = ({
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
  const {
    sending,
    sendProductMessage,
  } = useProductMessageComposer()

  /*
   * Evitan que dos clics rápidos entren antes de que
   * React alcance a actualizar los estados de loading.
   */
  const addLockRef = useRef(false)
  const sendLockRef = useRef(false)

  const hasActiveSelection =
    batchMode && selectedCount > 0

  const productName =
    String(prod.descripcion ?? "").trim() ||
    String(prod.codProducto ?? "").trim() ||
    "Producto"

  const handleOpenDetail = useCallback(() => {
    onClick?.(prod)
  }, [onClick, prod])

  const handleToggleSelection = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      event.preventDefault()

      onToggleSelect?.(prod)
    },
    [onToggleSelect, prod]
  )

  const handleBatchQuantityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const qty = clampQty(
        Number(event.target.value)
      )

      onChangeBatchQuantity?.(prod, qty)
    },
    [onChangeBatchQuantity, prod]
  )

  const handleSimpleAdd = useCallback(async () => {
    if (addLockRef.current || cartLoading) {
      return
    }

    const qty = clampQty(
      Number(simpleQuantity)
    )

    if (qty <= 0) {
      toast.warning(
        "La cantidad debe ser al menos 1."
      )
      return
    }

    if (prod.tieneOpcion) {
      handleOpenDetail()
      return
    }

    addLockRef.current = true

    try {
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
    } finally {
      addLockRef.current = false
    }
  }, [
    addProduct,
    cartLoading,
    prod,
    simpleQuantity,
    handleOpenDetail,
  ])

  const handleCartButtonClick = useCallback(
    async (
      event: MouseEvent<HTMLButtonElement>
    ) => {
      event.stopPropagation()
      event.preventDefault()

      if (hasActiveSelection) {
        return
      }

      await handleSimpleAdd()
    },
    [
      hasActiveSelection,
      handleSimpleAdd,
    ]
  )

  const handleSendMessage = useCallback(
    async (
      event: MouseEvent<HTMLButtonElement>,
      includeModifiers: boolean
    ) => {
      event.stopPropagation()
      event.preventDefault()

      if (
        sendLockRef.current ||
        sending ||
        conversationId <= 0
      ) {
        return
      }

      sendLockRef.current = true

      try {
        await sendProductMessage({
          product: prod,
          conversationId,
          includeModifiers,
        })
      } finally {
        sendLockRef.current = false
      }
    },
    [
      sendProductMessage,
      prod,
      conversationId,
      sending,
    ]
  )

  const handleQuoteClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      event.preventDefault()

      if (prod.tieneOpcion) {
        handleOpenDetail()
        return
      }

      void handleSendMessage(event, false)
    },
    [handleOpenDetail, handleSendMessage, prod.tieneOpcion]
  )

  const disabledCartButton =
    cartLoading ||
    simpleQuantity <= 0 ||
    hasActiveSelection

  const quantityDisabled =
    batchMode && !isSelected

  return (
    <div
      className={`productPCG-row ${
        isSelected
          ? "productPCG-row--selected"
          : ""
      }`}
    >
      <div
        className="productPCG-row-header"
        onClick={handleOpenDetail}
      >
        <div className="productPCG-row__image">
          <img
            src={prod.imagen || vacio}
            alt={productName}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="product-image"
          />
        </div>

        <div className="product-rowContent">
          <span className="product-row__description">
            <Tooltip title={productName}>
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
            {prod.precio > 0
              ? `C$ ${formatearDecimales(
                  prod.precio
                )}`
              : ""}
          </span>

          {batchMode && isSelected && (
            <span
              className={`product-row__batchStatus ${
                isConfigured
                  ? "product-row__batchStatus--configured"
                  : "product-row__batchStatus--pending"
              }`}
            >
              {isConfigured
                ? "✓ Listo"
                : "Pendiente"}
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
            aria-label={`Cantidad de ${productName}`}
          />

          {batchMode && (
            <Tooltip
              title={
                isSelected
                  ? "Deseleccionar"
                  : "Seleccionar"
              }
            >
              <span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleToggleSelection}
                  className={`productTab-simpleAddBar__btn simpleAddBar-select ${
                    isSelected
                      ? "simpleAddBar-select--active"
                      : ""
                  }`}
                  disabled={cartLoading}
                >
                  {isSelected ? (
                    <CircleMinus size={18} strokeWidth={2.2} />
                  ) : (
                    <CirclePlus size={18} strokeWidth={2.2} />
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
                variant="secondary"
                onClick={handleCartButtonClick}
                className="productTab-simpleAddBar__btn simpleAddBar-cart"
                disabled={disabledCartButton}
              >
                <FaShoppingCart fontSize={20} />
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Enviar cotización">
            <span>
              <Button
                type="button"
                variant="secondary"
                disabled={
                  prod.tieneOpcion
                    ? false
                    : sending || conversationId <= 0
                }
                onClick={handleQuoteClick}
                className="productTab-simpleAddBar__btn simpleAddBar-quote"
              >
                {sending && !prod.tieneOpcion ? (
                  <AiOutlineLoading3Quarters
                    fontSize={20}
                  />
                ) : (
                  <FaFileInvoiceDollar fontSize={18} />
                )}
              </Button>
            </span>
          </Tooltip>
          
          {prod.tieneOpcion && (
            <Tooltip title="Enviar resumen del producto">
              <span>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={
                    sending ||
                    conversationId <= 0
                  }
                  onClick={(event) =>
                    void handleSendMessage(event, true)
                  }
                  className="productTab-simpleAddBar__btn simpleAddBar-options"
                >
                  {sending ? (
                    <AiOutlineLoading3Quarters
                      fontSize={20}
                    />
                  ) : (
                    <ClipboardList size={18} strokeWidth={2.2} />
                  )}
                </Button>
              </span>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

export const ProductPCGTab = memo(
  ProductPCGTabComponent
)