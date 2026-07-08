import Input from "@/Components/Common/Input"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Tooltip from "@mui/material/Tooltip"
import { toast } from "react-toastify"
import { TiArrowBack } from "react-icons/ti"
import { FaShoppingCart } from "react-icons/fa"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { MdClear, MdSelectAll } from "react-icons/md"
import { useSelector } from "react-redux"
import Lottie from "lottie-react"
import { useCategoryPCG } from "@/Hooks/Ecommerce/tabs/useCategoryPCG"
import { useProductPCG } from "@/Hooks/Ecommerce/tabs/useProductPCG"
import { CategoryTab } from "@/Components/ECommerce/Tabs/CategoryTab"
import { ProductPCGTab } from "@/Components/ECommerce/Tabs/ProductPCGTab"
import DetailPCGProduct from "@/Components/ECommerce/Tabs/DetailPCGProduct"
import { SucursalPickerModal } from "@/Components/ECommerce/Tabs/SucursalPickerModal"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import type { RootState } from "@/Context"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import { selectCartLoading } from "@/Context/Slices/Ecommerce/cartSlice"
import { KEY_SCROLL } from "@/Utils/ECommerce/keys"
import { clampQty } from "@/Utils/ECommerce/formatters"
import EmptyPlayer from "@/assets/lottie/Empty.json"
import EmptyCartPlayer from '@/assets/lottie/Empty.json'

import "@/Styles/Ecommerce/ProductTab.css"
import "@/Styles/Ecommerce/ProductPCGList.css"
import type { AddProductParams, SelectedModifierOption } from "@/Interfaces/Crm/CartPCGInterface"
import { IoMdSend } from "react-icons/io"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/tabs/useProductMessageComposer"

interface Props {
  conversationId: number
  contactId: number
}

export interface SelectedInterface {
  codGrupo?: string | null
  grupo?: string | null
}

type SelectedBatchProduct = {
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

const getProductKey = (product: ProductoPCGInterface) => {
  return String(product.codProducto ?? "").trim()
}

const getProductName = (product: ProductoPCGInterface) => {
  const code = String(product.codProducto ?? "").trim()
  const desc = String(product.descripcion ?? "").trim()

  return `${code} ${desc}`.trim()
}

export const ProductTab = ({ conversationId }: Props) => {
  const [search, setSearch] = useState("")
  const [selectedCategory, setselectedCategory] =
    useState<SelectedInterface | null>(null)
  const [detailProduct, setDetailProduct] =
    useState<ProductoPCGInterface | null>(null)
  const [detailIndex, setDetailIndex] = useState<number>(-1)
  const [simpleQuantity, setSimpleQuantity] = useState<number>(1)
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, SelectedBatchProduct>
  >({})
  const [addingSelected, setAddingSelected] = useState(false)
  const { sending, sendProductMessage } = useProductMessageComposer()


  const { pickerProps, codPrecioActivo, addProducts } = useCartPCGFlowCtx()
  const cartLoading = useSelector((state: RootState) =>
    selectCartLoading(state)
  )

  const {
    GetAll: GetAllCategories,
    categoryPcg,
    error,
    loading,
  } = useCategoryPCG()

  const {
    productPcg,
    GetByCategory,
    GetAll: GetProductByDescription,
    loadingProductPcg,
    error: errProducts,
    loadNextPage,
    hasMore,
    reset,
    setCodPrecio,
  } = useProductPCG({ initialPageSize: 50 })

  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const normalizedSearch = useMemo(() => {
    return search.trim().toLowerCase()
  }, [search])

  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categoryPcg

    return categoryPcg.filter((c) =>
      (c.grupo || "").toLowerCase().includes(normalizedSearch)
    )
  }, [categoryPcg, normalizedSearch])

  const selectedItems = useMemo(() => {
    return Object.values(selectedProducts)
  }, [selectedProducts])

  const selectedCount = selectedItems.length

  const firstPendingProduct = useMemo(() => {
    return selectedItems.find((item) => !item.configured) ?? null
  }, [selectedItems])

  const showCategories = !selectedCategory && !normalizedSearch
  const showProducts = !!selectedCategory || !!normalizedSearch

  useEffect(() => {
    GetAllCategories()
  }, [GetAllCategories])

  useEffect(() => {
    setCodPrecio(codPrecioActivo)

    if (selectedCategory?.codGrupo) {
      reset()
      GetByCategory(selectedCategory.codGrupo)
      return
    }

    const term = search.trim()

    if (term) {
      reset()
      GetProductByDescription(term)
    }
  }, [
    codPrecioActivo,
    selectedCategory?.codGrupo,
    search,
    setCodPrecio,
    reset,
    GetByCategory,
    GetProductByDescription,
  ])

  useEffect(() => {
    if (!detailProduct) return
    if (!productPcg.length) return

    const idx = productPcg.findIndex(
      (p) => String(p.codProducto) === String(detailProduct.codProducto)
    )

    if (idx < 0) return

    setDetailProduct(productPcg[idx])
    setDetailIndex(idx)
  }, [productPcg, detailProduct?.codProducto])

  const getSelectedProduct = useCallback(
    (product: ProductoPCGInterface) => {
      const key = getProductKey(product)
      return selectedProducts[key] ?? null
    },
    [selectedProducts]
  )

  
  const handleOpenDetail = useCallback(
    (prod: ProductoPCGInterface) => {
      sessionStorage.setItem(KEY_SCROLL, String(listRef.current?.scrollTop ?? 0))

      const idx = productPcg.findIndex(
        (p) => String(p.codProducto) === String(prod.codProducto)
      )

      setDetailIndex(idx)
      setDetailProduct(prod)
      setSimpleQuantity(1)
    },
    [productPcg]
  )

  const handleBackToList = useCallback(() => {
    setDetailProduct(null)
    setDetailIndex(-1)
    setSimpleQuantity(1)

    requestAnimationFrame(() => {
      const raw = sessionStorage.getItem(KEY_SCROLL)
      const top = raw ? Number(raw) : 0

      if (listRef.current) {
        listRef.current.scrollTop = top
      }
    })
  }, [])

  const handlePrevDetail = useCallback(() => {
    if (detailIndex <= 0) return

    const nextIdx = detailIndex - 1

    setDetailIndex(nextIdx)
    setDetailProduct(productPcg[nextIdx])
  }, [detailIndex, productPcg])

  const handleNextDetail = useCallback(() => {
    if (detailIndex < 0 || detailIndex >= productPcg.length - 1) return

    const nextIdx = detailIndex + 1

    setDetailIndex(nextIdx)
    setDetailProduct(productPcg[nextIdx])
  }, [detailIndex, productPcg])

  const handleChangeSimpleQuantity = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value)
      setSimpleQuantity(!value || value <= 0 ? 1 : value)
    },
    []
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
    [buildSelectedProduct]
  )

  const selectVisibleProducts = useCallback(() => {
    if (!productPcg.length) {
      toast.warning("No hay productos para seleccionar.")
      return
    }

    setSelectedProducts((prev) => {
      const next = { ...prev }

      productPcg.forEach((product) => {
        const key = getProductKey(product)

        if (!key) return
        if (next[key]) return

        next[key] = buildSelectedProduct(product)
      })

      return next
    })
  }, [productPcg, buildSelectedProduct])

  const clearSelection = useCallback(() => {
    setSelectedProducts({})
  }, [])

  const changeBatchQuantity = useCallback(
    (product: ProductoPCGInterface, qtyValue: number) => {
      const key = getProductKey(product)
      const qty = clampQty(Number(qtyValue))

      if (!key) return

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
    []
  )

  const saveConfiguredProduct = useCallback(
    (payload: AddProductParams) => {
      const key = getProductKey(payload.product)

      if (!key) return

      setSelectedProducts((prev) => ({
        ...prev,
        [key]: {
          product: payload.product,
          qty: clampQty(payload.qty),
          configured: true,
          observacion: payload.observacion ?? "",
          modifierOptions: payload.modifierOptions ?? [],
          branch: "",
          branchName: "",
          wherehouse: "",
          wherehouseCode: "",
          serie: "",
          codPrecio: "",
        },
      }))

      handleBackToList()
    },
    [handleBackToList]
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
      handleOpenDetail(pending.product)
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

        setSelectedProducts({})
        setSimpleQuantity(1)

    } finally {
      setAddingSelected(false)
    }
  }, [addProducts, addingSelected, selectedProducts, handleOpenDetail])

  const resetToCategories = useCallback(() => {
    setSearch("")
    setselectedCategory(null)
    setDetailProduct(null)
    setDetailIndex(-1)
    setSimpleQuantity(1)
    reset()
  }, [reset])

  const handleSearchEnter = useCallback(
    async (q: string) => {
      const term = q.trim()

      if (!term) return

      setselectedCategory(null)
      setDetailProduct(null)
      setDetailIndex(-1)
      setSimpleQuantity(1)

      reset()

      await GetProductByDescription(term)

      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = 0
        }
      })
    },
    [GetProductByDescription, reset]
  )

  useEffect(() => {
    if (!showProducts) return
    if (!sentinelRef.current) return

    observerRef.current?.disconnect()

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]

        if (!entry?.isIntersecting) return
        if (loadingProductPcg) return
        if (!hasMore) return

        await loadNextPage()
      },
      {
        root: listRef.current,
        rootMargin: "200px",
        threshold: 0.01,
      }
    )

    observerRef.current.observe(sentinelRef.current)

    return () => observerRef.current?.disconnect()
  }, [showProducts, hasMore, loadNextPage, loadingProductPcg])


  const sendSelectedProducts = useCallback(async () => {
  const items = Object.values(selectedProducts)

  if (!items.length) {
    toast.warning("Seleccione al menos un producto.")
    return
  }

  const pending = items.find((item) => !item.configured)

  if (pending) {
    toast.warning(`Falta configurar: ${getProductName(pending.product)}`)
    handleOpenDetail(pending.product)
    return
  }

  for (const item of items) {
    await sendProductMessage({
      product: item.product,
      conversationId,
      observation: item.observacion,
    })
  }

  toast.success(
    `${items.length} producto${items.length === 1 ? "" : "s"} enviado${
      items.length === 1 ? "" : "s"
    }.`
  )
}, [selectedProducts, sendProductMessage, conversationId, handleOpenDetail])

  if (loading) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return <div className="detailPanel-error">
          <Lottie loop={false} autoplay animationData={EmptyCartPlayer} />
          <p className="cardPanel--emptyText">No hay productos en el carrito.</p>
    </div>
  }

  if (errProducts && selectedCategory) {
    return <div className="detailPanel-error">
      <Lottie loop={false} autoplay animationData={EmptyCartPlayer} />
    <p className="cardPanel--emptyText">No hay productos en el carrito.</p>
    </div>
  }

  if (detailProduct) {
    const selectedDetailProduct = getSelectedProduct(detailProduct)

    return (
      <section className="productTab-card">
        <header className="productTab-product__header">
          <h5
            onClick={handleBackToList}
            className="productTab-content-header__titleDetail"
          >
            <TiArrowBack fontSize={20} />

            {selectedCategory?.grupo
              ? `${selectedCategory.grupo}\\${detailProduct.descripcion}\\detalle`
              : `${detailProduct.descripcion}\\detalle`}
          </h5>
        </header>

        <DetailPCGProduct
          detail={detailProduct}
          setDetailProduct={setDetailProduct}
          setselectedCategory={setselectedCategory}
          currentIndex={detailIndex + 1}
          totalCount={productPcg.length}
          canPrev={detailIndex > 0}
          canNext={detailIndex >= 0 && detailIndex < productPcg.length - 1}
          onPrev={handlePrevDetail}
          onNext={handleNextDetail}
          onBack={handleBackToList}
          batchMode
          onSaveBatchConfig={saveConfiguredProduct}
          isSelected={!!selectedDetailProduct}
          onToggleSelect={toggleProductSelection}
        />
      </section>
    )
  }

  return (
    <section className="productTab-card">
      <SucursalPickerModal {...pickerProps} />

      <header className="productTab-product__header">
        <h5 className="productTab-content-header__title">
          {showCategories ? (
            "Categorias"
          ) : (
            <span
              className="productTab-content-header__titleCategory"
              onClick={resetToCategories}
            >
              <TiArrowBack fontSize={20} />
              {selectedCategory?.grupo ?? "Productos"}
            </span>
          )}
        </h5>

        {showProducts && (
          <div className="productPCGList__actions productPCGList__actions--header">
            <Tooltip title={`${selectedCount} seleccionados`}>
              <div className="productPCGList__summaryIcon">
                <FaShoppingCart fontSize={20} />
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
                    disabled={productPcg.length === 0 || addingSelected}
                  >
                    <MdSelectAll fontSize={20} />
                  </button>
                </span>
              </Tooltip>

              <Tooltip title="Limpiar selección">
                <span>
                  <button
                    type="button"
                    className="productPCGList__iconBtn productPCGList__iconBtn--clear"
                    onClick={clearSelection}
                    disabled={selectedCount === 0 || addingSelected}
                  >
                    <MdClear fontSize={20} />
                  </button>
                </span>
              </Tooltip>

              <Tooltip title="Enviar seleccionados">
          <span>
            <button
              type="button"
              className="productPCGList__iconBtn productPCGList__iconBtn--send"
              onClick={sendSelectedProducts}
              disabled={selectedCount === 0 || sending || addingSelected}
            >
              {sending ? (
                <AiOutlineLoading3Quarters fontSize={20} />
              ) : (
                <IoMdSend fontSize={20} />
              )}
            </button>
          </span>
        </Tooltip>

              <Tooltip title="Agregar seleccionados">
                <span>
                  <button
                    type="button"
                    className="productPCGList__iconBtn productPCGList__iconBtn--add"
                    onClick={addSelectedProducts}
                    disabled={
                      selectedCount === 0 || addingSelected || cartLoading
                    }
                  >
                    {addingSelected ? (
                      <AiOutlineLoading3Quarters fontSize={20} />
                    ) : (
                      <FaShoppingCart fontSize={20} />
                    )}
                  </button>
                </span>
              </Tooltip>
            </div>
          </div>
        )}
      </header>

      <section className="productTab-clientHeaderActions">
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          max={500}
          placeholder="Buscar categoría o producto"
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              await handleSearchEnter(search)
            }
          }}
        />
      </section>

      {showCategories && (
        <div className="productTab-category__container">
          {filteredCategories.map((e) => (
            <CategoryTab
              key={e.id}
              cat={e}
              setselectedCategory={setselectedCategory}
            />
          ))}
        </div>
      )}

      {showProducts && (
        <div
          ref={listRef}
          className="productTab-productPCG__container productTab-productPCG__container--scroll"
        >
          {loadingProductPcg && productPcg.length === 0 ? (
            <span>Cargando...</span>
          ) : (
            <>
              {productPcg == null || productPcg.length === 0 ? (
                <div className="productTab-emptyState">
                  <Lottie loop={false} autoplay animationData={EmptyPlayer} />
                  No hay productos disponibles.
                </div>
              ) : (
                productPcg.map((e) => {
                  const selected = getSelectedProduct(e)

                  return (
                    <div
                      key={e.codProducto}
                      className="productTab-productRowWrapper"
                    >
                      <ProductPCGTab
                        prod={e}
                        conversationId={conversationId}
                        simpleQuantity={selected?.qty ?? simpleQuantity}
                        handleChangeSimpleQuantity={handleChangeSimpleQuantity}
                        cartLoading={cartLoading || addingSelected}
                        onClick={handleOpenDetail}
                        batchMode
                        selectedCount={selected ? 1 : 0}
                        isSelected={!!selected}
                        isConfigured={selected?.configured ?? false}
                        onToggleSelect={toggleProductSelection}
                        onChangeBatchQuantity={changeBatchQuantity}
                      />
                    </div>
                  )
                })
              )}

              <div ref={sentinelRef} style={{ height: 1 }} />

              {loadingProductPcg && productPcg.length > 0 && (
                <div style={{ padding: "0.8rem", textAlign: "center" }}>
                  Cargando más...
                </div>
              )}

              {!hasMore && productPcg.length > 0 && (
                <div
                  style={{
                    padding: "0.8rem",
                    textAlign: "center",
                    opacity: 0.7,
                  }}
                >
                   <div className="productTab-emptyState">
                  No hay productos disponibles.
                  <Lottie loop={false} autoplay animationData={EmptyPlayer} />
                </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}