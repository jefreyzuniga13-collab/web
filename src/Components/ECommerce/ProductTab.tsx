import Input from "@/Components/Common/Input"
import React, { useEffect, useMemo, useState } from "react"
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
  const [simpleQuantity, setSimpleQuantity] = useState<number>(1)

  const { pickerProps } = useCartPCGFlowCtx()

  const { GetAll, categoryPcg, error, loading } = useCategoryPCG()
  const {
    productPcg,
    GetByCategory,
    GetAll: GetProductByDescription,
    loadingProductPcg,
    error: errProducts,
  } = useProductPCG()

  const cartLoading = useSelector((state: RootState) => selectCartLoading(state))

  useEffect(() => {
    GetAll()
  }, [GetAll])

  useEffect(() => {
    if (!selectedCategory) return
    GetByCategory(selectedCategory.codGrupo!)
    setDetailProduct(null)
    setSimpleQuantity(1)
  }, [GetByCategory, selectedCategory])

  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search])

  const filteredCategories = useMemo(() => {
    if (!normalizedSearch) return categoryPcg
    return categoryPcg.filter((c) => (c.grupo || "").toLowerCase().includes(normalizedSearch))
  }, [categoryPcg, normalizedSearch])

  const filteredProducts = useMemo(() => {
    if (!normalizedSearch) return productPcg
    return productPcg.filter((p) =>
      `${p.codProducto ?? ""} ${p.descripcion ?? ""}`.toLowerCase().includes(normalizedSearch)
    )
  }, [productPcg, normalizedSearch])

  const handleOpenDetail = (prod: ProductoPCGInterface) => {
    setDetailProduct(prod)
    setSimpleQuantity(1)
  }

  const handleBackToList = () => {
    setDetailProduct(null)
    setSimpleQuantity(1)
  }

  const handleChangeSimpleQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setSimpleQuantity(!value || value <= 0 ? 1 : value)
  }

  const resetToCategories = () => {
    setSearch("")
    setselectedCategory(null)
    setDetailProduct(null)
    setSimpleQuantity(1)
  }

  const handleSearchEnter = async (q: string) => {
    const term = q.trim()
    if (!term) return
    setselectedCategory(null)
    setDetailProduct(null)
    setSimpleQuantity(1)
    await GetProductByDescription(term)
  }

  const showCategories = !selectedCategory && !normalizedSearch
  const showProducts = !!selectedCategory || !!normalizedSearch

  if (loading) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando...</div>
      </div>
    )
  }

  if (error) return <div className="detailPanel-error">Error al cargar categorías</div>
  if (errProducts && selectedCategory) return <div className="detailPanel-error">Error al cargar productos</div>

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
        <div className="productTab-productPCG__container">
          {loadingProductPcg ? (
            <span>Cargando...</span>
          ) : (
            filteredProducts.map((e) => (
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
        </div>
      )}
    </section>
  )
}