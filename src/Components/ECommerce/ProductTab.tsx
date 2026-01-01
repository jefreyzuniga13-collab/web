import "@/Styles/Ecommerce/ProductTab.css"
import Input from "@/Components/Common/Input"
import { useEffect, useMemo, useState } from "react"
import { useCategoryPCG } from "@/Hooks/Crm/useCategoryPCG"
import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG"
import { CategoryTab } from "@/Components/ECommerce/CategoryTab"
import { ProductPCGTab } from "@/Components/ECommerce/ProductPCGTab"
import DetailPCGProduct from "@/Components/ECommerce/DetailPCGProduct"
import { IoArrowBackCircleSharp } from "react-icons/io5"
import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import { FaShoppingCart } from "react-icons/fa"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import type { LogCartRequestDto } from "@/Interfaces/Crm/LogCartInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import { useDispatch, useSelector } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import { addProductToCarAsync, selectCartLoading } from "@/Context/Slices/Ecommerce/cartSlice"
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";

interface Props {
  conversationId: number
  contactId: number
}

export const ProductTab = ({ conversationId, contactId }: Props) => {
  const [search, setSearch] = useState<string>("")
  const [selectedCategory, setselectedCategory] = useState<string | null>(null)
  const [detailProduct, setDetailProduct] = useState<ProductoPCGInterface | null>(null)
  const [simpleQuantity, setSimpleQuantity] = useState<number>(1)

  const { GetAll, categoryPcg, error, loading } = useCategoryPCG()
  const {
    productPcg,
    GetByCategory,
    GetAll: GetProductByDescription,
    loadingProductPcg,
    error: errProducts,
  } = useProductPCG()

  const { create: createLogCart, fetchByContactId } = useLogCart()

  const dispatch = useDispatch<AppDispatch>()
  const cartLoading = useSelector((state: RootState) => selectCartLoading(state))

  useEffect(() => {
    GetAll()
  }, [GetAll])

  useEffect(() => {
    if (!selectedCategory) return
    GetByCategory(selectedCategory)
    setDetailProduct(null)
    setSimpleQuantity(1)
  }, [GetByCategory, selectedCategory])

  const normalizedSearch = useMemo(() => search.trim().toLowerCase(), [search])

  const filteredCategories = useMemo(() => {
    if (normalizedSearch === "") return categoryPcg
    return categoryPcg.filter(c => (c.grupo || "").toLowerCase().includes(normalizedSearch))
  }, [categoryPcg, normalizedSearch])

  const filteredProducts = useMemo(() => {
    if (normalizedSearch === "") return productPcg
    return productPcg.filter(p =>
      `${p.codProducto ?? ""} ${p.descripcion ?? ""}`.toLowerCase().includes(normalizedSearch)
    )
  }, [productPcg, normalizedSearch])

  const handleOpenDetail = (prod: ProductoPCGInterface) => {
    if (detailProduct?.id === prod.id) {
      setDetailProduct(null)
      setSimpleQuantity(1)
      return
    }
    setDetailProduct(prod)
    setSimpleQuantity(1)
  }

  const handleBackToList = () => {
    setDetailProduct(null)
    setSimpleQuantity(1)
  }

  const handleChangeSimpleQuantity = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (Number.isNaN(value) || value <= 0) setSimpleQuantity(1)
    else setSimpleQuantity(value)
  }

  const resetToCategories = () => {
    setSearch("")
    setselectedCategory(null)
    setDetailProduct(null)
    setSimpleQuantity(1)
  }

  const handleSearchEnter = async (q: string) => {
    const term = (q || "").trim()
    if (!term) return
    setselectedCategory(null)
    setDetailProduct(null)
    setSimpleQuantity(1)
    await GetProductByDescription(term)
  }

const handleSimpleAdd = async (productDetail: ProductoPCGInterface) => {
  if (simpleQuantity <= 0) return

  const precioV = productDetail.precio
  const totalMenu = precioV * simpleQuantity

  const detalle: ListDetalleCarrito = {
    tipoComponente: "P",
    indice: 1,
    codTipoModificador: "0000",
    codModificador: "00000",
    codGrupo: productDetail.codCategoria,
    codProducto: productDetail.codProducto,
    codOpcion: "00000",
    descripcion: productDetail.descripcion,
    cantidad: simpleQuantity,
    precioV,
    totalMenu,
    codUm: productDetail.codUm,
    observaciones: "",
    unico: "",
    noPedido: 0,
    imagen: productDetail.imagen,
    listOpciones: [],
  }

  const existingLog = await fetchByContactId(contactId)

  const carritoBase: CarDto = {
    noPedido: existingLog?.orderId ?? 0,
    tipoServicio: 8,
    fecha: new Date().toISOString(),
    total: totalMenu,
    listDetalle: [detalle],
  }

  // Si no existía log/orderId, creas el log después, pero igual el addProduct te devuelve el carrito creado
  const cartUpdated = await dispatch(addProductToCarAsync(carritoBase)).unwrap()

  // Si acabas de crear el carrito (no había log), crea el log con el orderId retornado
  if (!existingLog?.orderId) {
  const first = Array.isArray(cartUpdated) ? cartUpdated[0] : null
  const orderId = Number(first?.noPedido ?? 0)

  if (!orderId || Number.isNaN(orderId) || orderId <= 0) {
    throw new Error("No se pudo obtener el noPedido para crear el LogCart.")
  }

  const logOrderRequest: LogCartRequestDto = {
    orderId,          // <- ahora es number seguro
    contactId,
    conversationId,
    statusId: 1,
  }

  await createLogCart(logOrderRequest)
}


  // Calcular count real desde el carrito retornado
  const cartsArr = Array.isArray(cartUpdated) ? cartUpdated : []
  const firstCart = cartsArr[0]
  const count =
    firstCart?.listDetalle?.reduce((sum, d) => sum + Number(d.cantidad ?? 0), 0) ?? 0

  dispatch(
    setContactCartBadge({
      contactId,
      hasCart: count > 0,
      count,
    })
  )

  setSimpleQuantity(1)
  setselectedCategory(null)
  setDetailProduct(null)
}

  const showCategories = !selectedCategory && normalizedSearch === ""
  const showProducts = !!selectedCategory || normalizedSearch !== ""

  if (loading) {
    return (
      <div className="detailPanel-loaderContainer">
        <div className="detailPanel-loader">Cargando...</div>
      </div>
    )
  }

  if (error) {
    return <div className="detailPanel-error">Error al cargar categorias</div>
  }

  if (errProducts && selectedCategory) {
    return <div className="detailPanel-error">Error al cargar productos</div>
  }

  if (detailProduct && detailProduct.tieneOpcion) {
    return (
      <section className="productTab-card">
        <header className="productTab-product__header">
          <h5>Detalle de producto</h5>
          <div className="productTab-icon__container">
            <IoArrowBackCircleSharp fontSize={24} className="productTab-icon" onClick={handleBackToList} />
          </div>
        </header>

        <DetailPCGProduct
          detail={detailProduct}
          contactId={contactId}
          conversationId={conversationId}
          setDetailProduct={setDetailProduct}
          setselectedCategory={setselectedCategory}
        />
      </section>
    )
  }

  return (
    <section className="productTab-card">
      <header className="productTab-product__header">
        <h5 className="productTab-content-header__title">{selectedCategory === null ? "Categorias" : "Productos"}</h5>
        <div className="productTab-icon__container">
          <IoArrowBackCircleSharp fontSize={24} className="productTab-icon" onClick={resetToCategories} />
        </div>
      </header>

      <section className="productTab-clientHeaderActions">
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          max={500}
          placeholder="Buscar categoria o producto"
          onChange={e => setSearch(e.target.value)}
          onKeyDown={async e => {
            if (e.key === "Enter") await handleSearchEnter(search)
          }}
        />
      </section>

      {showCategories && (
        <div className="productTab-category__container">
          {filteredCategories.map(e => (
            <CategoryTab cat={e} key={e.id} setselectedCategory={setselectedCategory} />
          ))}
        </div>
      )}

      {showProducts && (
        <div className="productTab-productPCG__container">
          {loadingProductPcg ? (
            <span>Cargando...</span>
          ) : (
            filteredProducts.map(e => (
              <div key={e.codProducto} className="productTab-productRowWrapper">
                {detailProduct &&
                  !detailProduct.tieneOpcion &&
                  detailProduct.codProducto === e.codProducto && (
                    <div className="productTab-simpleAddBar productTab-simpleAddBar--absolute">
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
                        onClick={() => handleSimpleAdd(e)}
                        disabled={simpleQuantity <= 0 || cartLoading}
                      >
                        <FaShoppingCart fontSize={12} />
                      </button>
                    </div>
                  )}

                <ProductPCGTab prod={e} conversationId={conversationId} onClick={handleOpenDetail} />
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}