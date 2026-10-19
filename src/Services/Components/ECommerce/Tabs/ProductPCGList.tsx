/**
 * Lista productos PCG en modo selección múltiple.
 *
 * Permite seleccionar/deseleccionar productos visibles, limpiar la selección
 * y agregar todos los productos seleccionados desde un botón global.
 * Si un producto requiere configuración, se marca como pendiente y se abre
 * el detalle cuando el usuario intenta agregarlo.
 *
 * La sucursal no se maneja por producto. El flujo global del carrito debe
 * seleccionar una sola sucursal y aplicarla a todos los productos agregados.
 */
import { useCallback, useMemo, type Dispatch, type SetStateAction } from "react"
import Tooltip from "@mui/material/Tooltip"
import { toast } from "react-toastify"
import { FaShoppingCart } from "react-icons/fa"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { ListPlus, ListX } from "lucide-react"
import { ProductPCGTab } from "@/Services/Components/ECommerce/Tabs/ProductPCGTab"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import { clampQty } from "@/Utils/ECommerce/formatters"
import "@/Styles/Ecommerce/ProductPCGList.css"
import type { SelectedModifierOption } from "@/Interfaces/Crm/CartPCGInterface"

export type SelectedBatchProduct = {
  product: ProductoPCGInterface
  qty: number
  configured: boolean
  observacion: string
  modifierOptions: SelectedModifierOption[]
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
  codPrecio: string
}

interface Props {
  products: ProductoPCGInterface[]
  conversationId: number
  cartLoading?: boolean
  addingSelected: boolean
  setAddingSelected: Dispatch<SetStateAction<boolean>>
  selectedProducts: Record<string, SelectedBatchProduct>
  setSelectedProducts: Dispatch<
    SetStateAction<Record<string, SelectedBatchProduct>>
  >
  onOpenDetail?: (product: ProductoPCGInterface) => void
}

const getProductKey = (product: ProductoPCGInterface) => {
  return String(product.codProducto ?? "").trim()
}

const getProductName = (product: ProductoPCGInterface) => {
  const code = String(product.codProducto ?? "").trim()
  const desc = String(product.descripcion ?? "").trim()

  return `${code} ${desc}`.trim()
}

const ProductPCGList = ({
  products,
  conversationId,
  cartLoading = false,
  addingSelected,
  setAddingSelected,
  selectedProducts,
  setSelectedProducts,
  onOpenDetail,
}: Props) => {
  const { addProducts } = useCartPCGFlowCtx()

  const selectedItems = useMemo(() => {
    return Object.values(selectedProducts)
  }, [selectedProducts])

  const selectedCount = selectedItems.length

  const firstPendingProduct = useMemo(() => {
    return selectedItems.find((item) => !item.configured) ?? null
  }, [selectedItems])

  const getSelectedProduct = useCallback(
    (product: ProductoPCGInterface) => {
      const key = getProductKey(product)
      return selectedProducts[key] ?? null
    },
    [selectedProducts]
  )

  const buildSelectedProduct = useCallback(
    (product: ProductoPCGInterface): SelectedBatchProduct => {
      const requiresDetailConfig = !!product.tieneOpcion

      return {
        product,
        qty: 1,
        configured: !requiresDetailConfig,
        observacion: "",
        modifierOptions: [],
        branch: "",
        branchName: "",
        wherehouse: "",
        wherehouseCode: "",
        serie: "",
        codPrecio: "",
      }
    },
    []
  )

  const toggleProductSelection = useCallback(
    (product: ProductoPCGInterface) => {
      const key = getProductKey(product)

      if (!key) return

      setSelectedProducts((prev) => {
        if (prev[key]) {
          const next = { ...prev }
          delete next[key]
          return next
        }

        return {
          ...prev,
          [key]: buildSelectedProduct(product),
        }
      })
    },
    [buildSelectedProduct, setSelectedProducts]
  )

  const selectVisibleProducts = useCallback(() => {
    if (!products.length) {
      toast.warning("No hay productos para seleccionar.")
      return
    }

    setSelectedProducts((prev) => {
      const next = { ...prev }

      products.forEach((product) => {
        const key = getProductKey(product)

        if (!key) return
        if (next[key]) return

        next[key] = buildSelectedProduct(product)
      })

      return next
    })
  }, [products, buildSelectedProduct, setSelectedProducts])

  const changeBatchQuantity = useCallback(
    (product: ProductoPCGInterface, qtyValue: number) => {
      const key = getProductKey(product)
      const qty = clampQty(Number(qtyValue))

      if (!key) return

      // Mantener cantidad segura
      setSelectedProducts((prev) => {
        const current = prev[key]

        if (!current) return prev

        return {
          ...prev,
          [key]: {
            ...current,
            qty,
          },
        }
      })
    },
    [setSelectedProducts]
  )

  const addSelectedProducts = useCallback(async () => {
    if (addingSelected) return

    const items = Object.values(selectedProducts)

    if (!items.length) {
      toast.warning("Seleccione al menos un producto.")
      return
    }

    const pending = items.find((item) => !item.configured)

    if (pending) {
      toast.warning(`Falta configurar: ${getProductName(pending.product)}`)
      onOpenDetail?.(pending.product)
      return
    }

    setAddingSelected(true)

    try {
      await addProducts(
        items.map((item) => ({
          product: item.product,
          qty: item.qty,
          observacion: item.observacion,
          modifierOptions: item.modifierOptions,
          onDoneUiReset: false,
        }))
      )

      /*
        No limpiar aquí.
        addProducts puede abrir el modal de sucursal; si se limpia ahora,
        el usuario pierde la selección antes de confirmar.
      */
    } finally {
      setAddingSelected(false)
    }
  }, [
    addProducts,
    addingSelected,
    selectedProducts,
    setAddingSelected,
    onOpenDetail,
  ])

  const clearSelection = useCallback(() => {
    setSelectedProducts({})
  }, [setSelectedProducts])

  return (
    <section className="productPCGList">
      <div className="productPCGList__actions">
        <Tooltip title={`${selectedCount} seleccionados`}>
          <div className="productPCGList__summaryIcon">
            <FaShoppingCart fontSize={13} />
            <strong>{selectedCount}</strong>
          </div>
        </Tooltip>

        {firstPendingProduct && (
          <Tooltip
            title={`Falta configurar: ${getProductName(
              firstPendingProduct.product
            )}`}
          >
            <span className="productPCGList__warning">Pendiente</span>
          </Tooltip>
        )}

        <div className="productPCGList__buttons">
          <Tooltip title="Seleccionar visibles">
            <span>
              <button
                type="button"
                className="productPCGList__iconBtn productPCGList__iconBtn--select"
                onClick={selectVisibleProducts}
                disabled={products.length === 0 || addingSelected}
              >
                <ListPlus size={18} strokeWidth={2.2} />
              </button>
            </span>
          </Tooltip>

          <Tooltip title="Deseleccionar">
            <span>
              <button
                type="button"
                className="productPCGList__iconBtn productPCGList__iconBtn--clear"
                onClick={clearSelection}
                disabled={selectedCount === 0 || addingSelected}
              >
                <ListX size={18} strokeWidth={2.2} />
              </button>
            </span>
          </Tooltip>

          <Tooltip title="Agregar seleccionados">
            <span>
              <button
                type="button"
                className="productPCGList__iconBtn productPCGList__iconBtn--add"
                onClick={addSelectedProducts}
                disabled={selectedCount === 0 || addingSelected || cartLoading}
              >
                {addingSelected ? (
                  <AiOutlineLoading3Quarters fontSize={14} />
                ) : (
                  <FaShoppingCart fontSize={14} />
                )}
              </button>
            </span>
          </Tooltip>
        </div>
      </div>

      <div className="productPCGList__items">
        {products.map((prod) => {
          const selected = getSelectedProduct(prod)

          return (
            <ProductPCGTab
              key={String(prod.codProducto)}
              prod={prod}
              conversationId={conversationId}
              onClick={onOpenDetail}
              simpleQuantity={selected?.qty ?? 1}
              handleChangeSimpleQuantity={(e) =>
                changeBatchQuantity(prod, Number(e.target.value))
              }
              cartLoading={cartLoading || addingSelected}
              batchMode
              selectedCount={selectedCount}
              isSelected={!!selected}
              isConfigured={selected?.configured ?? false}
              onToggleSelect={toggleProductSelection}
              onChangeBatchQuantity={changeBatchQuantity}
            />
          )
        })}
      </div>
    </section>
  )
}

export default ProductPCGList