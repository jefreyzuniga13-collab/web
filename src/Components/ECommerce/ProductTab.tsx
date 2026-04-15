import Input from "@/Components/Common/Input"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useCategoryPCG } from "@/Hooks/Crm/useCategoryPCG"
import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG"
import { CategoryTab } from "@/Components/ECommerce/CategoryTab"
import { ProductPCGTab } from "@/Components/ECommerce/ProductPCGTab"
import DetailPCGProduct from "@/Components/ECommerce/DetailPCGProduct"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import "@/Styles/Ecommerce/ProductTab.css"
import { TiArrowBack } from "react-icons/ti"
import { useSelector } from "react-redux"
import type { RootState } from "@/Context"
import { selectCartLoading } from "@/Context/Slices/Ecommerce/cartSlice"
import { SucursalPickerModal } from "@/Components/ECommerce/SucursalPickerModal"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { KEY_SCROLL } from "@/Utils/ECommerce/keys"
import EmptyPlayer from '@/assets/lottie/Empty.json'
import Lottie from "lottie-react";

interface Props {
  conversationId: number
  contactId: number
}
export interface SelectedInterface {
  codGrupo?: string | null
  grupo?: string | null
}

export const ProductTab = ({ conversationId }: Props) => {
  const [search, setSearch] = useState("")
  const [selectedCategory, setselectedCategory] = useState<SelectedInterface | null>(null)
  const [detailProduct, setDetailProduct] = useState<ProductoPCGInterface | null>(null)
  const [detailIndex, setDetailIndex] = useState<number>(-1)
  const [simpleQuantity, setSimpleQuantity] = useState<number>(1)

  const { pickerProps } = useCartPCGFlowCtx()
  const cartLoading = useSelector((state: RootState) => selectCartLoading(state))

  const { GetAll: GetAllCategories, categoryPcg, error, loading } = useCategoryPCG()
  const {
    productPcg,
    GetByCategory,
    GetAll: GetProductByDescription,
    loadingProductPcg,
    error: errProducts,
    loadNextPage,
    hasMore,
    reset,
  } = useProductPCG({ initialPageSize: 50 })

  const listRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    GetAllCategories()
  }, [GetAllCategories])

  useEffect(() => {
    if (!selectedCategory?.codGrupo) return
    reset()
    GetByCategory(selectedCategory.codGrupo)
    setDetailProduct(null)
    setDetailIndex(-1)
    setSimpleQuantity(1)
  }, [GetByCategory, reset, selectedCategory])

  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search])

  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categoryPcg
    return categoryPcg.filter((c) => (c.grupo || "").toLowerCase().includes(normalizedSearch))
  }, [categoryPcg, normalizedSearch])

  const handleOpenDetail = useCallback(
    (prod: ProductoPCGInterface) => {
      // Guardar scroll actual antes de entrar al detalle
      sessionStorage.setItem(KEY_SCROLL, String(listRef.current?.scrollTop ?? 0))

      const idx = productPcg.findIndex((p) => String(p.codProducto) === String(prod.codProducto))
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

    // Restaurar scroll cuando regresa
    requestAnimationFrame(() => {
      const raw = sessionStorage.getItem(KEY_SCROLL)
      const top = raw ? Number(raw) : 0
      if (listRef.current) listRef.current.scrollTop = top
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

  const handleChangeSimpleQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setSimpleQuantity(!value || value <= 0 ? 1 : value)
  }

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
              if (listRef.current) listRef.current.scrollTop = 0
            })
          },
          [GetProductByDescription, reset]
        )

  const showCategories = !selectedCategory && !normalizedSearch
  const showProducts = !!selectedCategory || !!normalizedSearch

  // Infinite scroll
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
      { root: listRef.current, rootMargin: "200px", threshold: 0.01 }
    )

    observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [showProducts, hasMore, loadNextPage, loadingProductPcg])

  if (loading) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando...</div>
      </div>
    )
  }

  if (error) return <div className="detailPanel-error">Error al cargar categorías</div>
  if (errProducts && selectedCategory) return <div className="detailPanel-error">Error al cargar productos</div>

  // Detalle con carrusel
  if (detailProduct) {
    return (
      <section className="productTab-card">
        <header className="productTab-product__header">
          <h5 onClick={handleBackToList} className="productTab-content-header__titleDetail">
            <TiArrowBack fontSize={18} />
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
          // carrusel
          canPrev={detailIndex > 0}
          canNext={detailIndex >= 0 && detailIndex < productPcg.length - 1}
          onPrev={handlePrevDetail}
          onNext={handleNextDetail}
          // volver (restaura scroll)
          onBack={handleBackToList}
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
            <span className="productTab-content-header__titleCategory" onClick={resetToCategories}>
              <TiArrowBack fontSize={18} />
              {selectedCategory?.grupo ?? "Productos"}
            </span>
          )}
        </h5>
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
            if (e.key === "Enter") await handleSearchEnter(search)
          }}
        />
      </section>

      {showCategories && (
        <div className="productTab-category__container">
          {filteredCategories.map((e) => (
            <CategoryTab key={e.id} cat={e} setselectedCategory={setselectedCategory} />
          ))}
        </div>
      )}

      {showProducts && (
        <div ref={listRef} className="productTab-productPCG__container productTab-productPCG__container--scroll">
          {loadingProductPcg && productPcg.length === 0 ? (
            <span>Cargando...</span>
          ) : (
            <>
              {productPcg == null || productPcg.length === 0 ? (
                <div className="productTab-emptyState">

                  <Lottie   loop={false} autoplay animationData={EmptyPlayer} />

                  No hay productos disponibles.
                </div>
              ) : (
                productPcg.map((e) => (
                  <div key={e.codProducto} className="productTab-productRowWrapper">
                    <ProductPCGTab
                      prod={e}
                      conversationId={conversationId}
                      simpleQuantity={simpleQuantity}
                      handleChangeSimpleQuantity={handleChangeSimpleQuantity}
                      cartLoading={cartLoading}
                      onClick={handleOpenDetail}
                    />
                  </div>
                ))
              )}

              <div ref={sentinelRef} style={{ height: 1 }} />

              {loadingProductPcg && productPcg.length > 0 && (
                <div style={{ padding: "0.8rem", textAlign: "center" }}>Cargando más...</div>
              )}

              {!hasMore && productPcg.length > 0 && (
                <div style={{ padding: "0.8rem", textAlign: "center", opacity: 0.7 }}>
                  No hay más productos
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}